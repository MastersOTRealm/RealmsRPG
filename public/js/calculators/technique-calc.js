/**
 * Centralized Technique Calculation & Display Utilities
 * Mirrors item_calc.js structure for techniques.
 *
 * Part payload shape expected by calculators:
 * { name: string, op_1_lvl: number, op_2_lvl?: number, op_3_lvl?: number }
 *
 * partsDb element shape (from Realtime DB):
 * {
 *   name, description, base_en, base_tp,
 *   op_1_en, op_1_tp, op_2_en, op_2_tp, op_3_en, op_3_tp,
 *   percentage (boolean), mechanic (boolean)
 * }
 */

/* ------------ Damage Helpers ------------ */

export function computeSplits(diceAmt, dieSize) {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}

export function computeAdditionalDamageLevel(diceAmt, dieSize) {
  const total = diceAmt * dieSize;
  if (total <= 0) return 0;
  // Original heuristic: level = floor((totalDamage - 4) / 2) clamped >= 0
  return Math.max(0, Math.floor((total - 4) / 2));
}

export function formatTechniqueDamage(dmgObj) {
  if (!dmgObj || !dmgObj.amount || !dmgObj.size) return '';
  if (dmgObj.amount === '0' || dmgObj.size === '0') return '';
  return `+${dmgObj.amount}d${dmgObj.size}`;
}

/* ------------ Action Type ------------ */

export function computeActionType(partsPayload = []) {
  // Backwards compatibility: inspect mechanic parts by name
  let actionType = 'Basic';
  let isReaction = false;
  partsPayload.forEach(p => {
    if (p.name === 'Reaction') isReaction = true;
    else if (p.name === 'Quick or Free Action') {
      if ((p.op_1_lvl || 0) === 0) actionType = 'Quick';
      else if ((p.op_1_lvl || 0) === 1) actionType = 'Free';
    } else if (p.name === 'Long Action') {
      if ((p.op_1_lvl || 0) === 0) actionType = 'Long (3)';
      else if ((p.op_1_lvl || 0) === 1) actionType = 'Long (4)';
    }
  });
  return isReaction ? `${actionType} Reaction` : `${actionType} Action`;
}

/**
 * Helper when UI still stores a selector value like: quick|free|long3|long4|basic
 */
export function computeActionTypeFromSelection(selection, reactionFlag) {
  let base = 'Basic';
  if (selection === 'quick') base = 'Quick';
  else if (selection === 'free') base = 'Free';
  else if (selection === 'long3') base = 'Long (3)';
  else if (selection === 'long4') base = 'Long (4)';
  return reactionFlag ? `${base} Reaction` : `${base} Action`;
}

/* ------------ Mechanic Part Assembly ------------ */

/**
 * Build mechanic part payloads based on current UI selections.
 * @param {Object} ctx { actionTypeSelection, reaction, weaponTP, diceAmt, dieSize, partsDb }
 * @returns {Array<{name, op_1_lvl, op_2_lvl, op_3_lvl}>}
 */
export function buildMechanicPartPayload(ctx) {
  const {
    actionTypeSelection,
    reaction = false,
    weaponTP = 0,
    diceAmt = 0,
    dieSize = 0,
    partsDb = []
  } = ctx || {};

  const payload = [];

  function pushIf(partName, op1 = 0) {
    const def = partsDb.find(p => p.name === partName && p.mechanic);
    if (def) payload.push({ name: def.name, op_1_lvl: op1, op_2_lvl: 0, op_3_lvl: 0 });
  }

  // Action / Reaction
  if (reaction) pushIf('Reaction', 0);
  if (actionTypeSelection === 'quick') pushIf('Quick or Free Action', 0);
  else if (actionTypeSelection === 'free') pushIf('Quick or Free Action', 1);
  else if (actionTypeSelection === 'long3') pushIf('Long Action', 0);
  else if (actionTypeSelection === 'long4') pushIf('Long Action', 1);

  // Additional Damage
  if (diceAmt > 0 && dieSize >= 4) {
    const level = computeAdditionalDamageLevel(diceAmt, dieSize);
    pushIf('Additional Damage', level);
    // Split Damage Dice
    const splits = computeSplits(diceAmt, dieSize);
    if (splits > 0) pushIf('Split Damage Dice', splits - 1); // base covers first split
  }

  // Weapon Attack scaling
  if (weaponTP >= 1) {
    pushIf('Add Weapon Attack', weaponTP - 1);
  }

  return payload;
}

/* ------------ Core Cost Calculator ------------ */

/**
 * Calculate total energy, TP and list TP sources.
 * @param {Array<{name, op_1_lvl, op_2_lvl, op_3_lvl}>} partsPayload
 * @param {Array} partsDb
 * @returns {{ totalEnergy:number, totalTP:number, tpSources:string[] }}
 */
export function calculateTechniqueCosts(partsPayload = [], partsDb = []) {
  let sumNonPercentage = 0;
  let productPercentage = 1;
  let totalTP = 0;
  const tpSources = [];

  partsPayload.forEach(pl => {
    const def = partsDb.find(p => p.name === pl.name);
    if (!def) return;
    const l1 = pl.op_1_lvl || 0;
    const l2 = pl.op_2_lvl || 0;
    const l3 = pl.op_3_lvl || 0;

    // Energy
    const energyContribution =
      (def.base_en || 0) +
      (def.op_1_en || 0) * l1 +
      (def.op_2_en || 0) * l2 +
      (def.op_3_en || 0) * l3;

    if (def.percentage) productPercentage *= energyContribution;
    else sumNonPercentage += energyContribution;

    // TP (special floor for Additional Damage option1)
    let opt1TPRaw = (def.op_1_tp || 0) * l1;
    if (def.name === 'Additional Damage') opt1TPRaw = Math.floor(opt1TPRaw);

    const rawTP =
      (def.base_tp || 0) +
      opt1TPRaw +
      (def.op_2_tp || 0) * l2 +
      (def.op_3_tp || 0) * l3;

    const partTP = Math.floor(rawTP);
    if (partTP > 0) {
      let src = `${partTP} TP: ${def.name}`;
      if (l1 > 0) src += ` (Opt1 ${l1})`;
      if (l2 > 0) src += ` (Opt2 ${l2})`;
      if (l3 > 0) src += ` (Opt3 ${l3})`;
      tpSources.push(src);
    }
    totalTP += partTP;
  });

  const totalEnergyRaw = sumNonPercentage * productPercentage;
  const totalEnergy = Math.ceil(totalEnergyRaw); // keep rounding up for non-creator displays
  return { totalEnergy, totalTP, tpSources, energyRaw: totalEnergyRaw }; // NEW: expose raw decimal
}

/* ------------ Chip Formatting ------------ */

export function formatTechniquePartChip(def, pl) {
  const l1 = pl.op_1_lvl || 0;
  const l2 = pl.op_2_lvl || 0;
  const l3 = pl.op_3_lvl || 0;

  let opt1TPRaw = (def.op_1_tp || 0) * l1;
  if (def.name === 'Additional Damage') opt1TPRaw = Math.floor(opt1TPRaw);

  const rawTP =
    (def.base_tp || 0) +
    opt1TPRaw +
    (def.op_2_tp || 0) * l2 +
    (def.op_3_tp || 0) * l3;

  const finalTP = Math.floor(rawTP);
  let text = def.name;
  if (l1 > 0) text += ` (Opt1 ${l1})`;
  if (l2 > 0) text += ` (Opt2 ${l2})`;
  if (l3 > 0) text += ` (Opt3 ${l3})`;
  if (finalTP > 0) text += ` | TP: ${finalTP}`;
  return { text, finalTP };
}

/* ------------ High-level Display Builder ------------ */

export function deriveTechniqueDisplay(techniqueDoc, partsDb) {
  const partsPayload = Array.isArray(techniqueDoc.parts)
    ? techniqueDoc.parts.map(p => ({
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0
      }))
    : [];

  const calc = calculateTechniqueCosts(partsPayload, partsDb);
  const actionType = computeActionType(partsPayload);
  const damageStr = formatTechniqueDamage(techniqueDoc.damage);
  const weaponName =
    techniqueDoc.weapon && techniqueDoc.weapon.name
      ? techniqueDoc.weapon.name
      : 'Unarmed';

  const partChips = partsPayload.map(pl => {
    const def = partsDb.find(d => d.name === pl.name);
    if (!def) return '';
    const chip = formatTechniquePartChip(def, pl);
    const cls = chip.finalTP > 0 ? 'part-chip proficiency-chip' : 'part-chip';
    return `<div class="${cls}" title="${def.description || ''}">${chip.text}</div>`;
  });

  return {
    name: techniqueDoc.name || '',
    description: techniqueDoc.description || '',
    weaponName,
    actionType,
    damageStr,
    energy: calc.totalEnergy, // already rounded up
    tp: calc.totalTP,
    tpSources: calc.tpSources,
    partChipsHTML: partChips.join('')
  };
}
