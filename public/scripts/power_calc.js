/**
 * Centralized Power Calculation & Display Utilities
 * Mirrors item_calc.js and technique_calc.js structure for powers.
 *
 * Part payload shape expected by calculators:
 * { name: string, op_1_lvl: number, op_2_lvl?: number, op_3_lvl?: number, applyDuration?: boolean }
 *
 * Also supports UI shape:
 * { part: defObj, op_1_lvl?: number, op_2_lvl?: number, op_3_lvl?: number, applyDuration?: boolean }
 * (legacy UI shape: opt1Level/opt2Level/opt3Level)
 */

/* ------------ Core Cost Calculator ------------ */

/**
 * Calculate total energy, TP and list TP sources for a power.
 * Uses the unified equation: (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur)
 * @param {Array<{name, op_1_lvl, op_2_lvl, op_3_lvl, applyDuration}>} partsPayload
 * @param {Array} partsDb
 * @returns {{
 *   totalEnergy:number,        // rounded up
 *   totalTP:number,
 *   tpSources:string[],
 *   energyRaw:number           // NEW: unrounded (decimal) for creators
 * }}
 */
export function calculatePowerCosts(partsPayload = [], partsDb = []) {
  let flat_normal = 0;
  let flat_duration = 0;
  let perc_all = 1;
  let perc_dur = 1;
  let dur_all = 1;
  let hasDurationParts = false;
  let totalTP = 0;
  const tpSources = [];

  partsPayload.forEach(pl => {
    // Normalize to support both saved-format and UI-format
    const isUiShape = pl && pl.part && pl.part.name;
    const name = isUiShape ? pl.part.name : pl.name;
    // Prefer standardized op_#_lvl; fallback to legacy opt#Level for compatibility
    const l1 = isUiShape ? (pl.op_1_lvl ?? pl.opt1Level ?? 0) : (pl.op_1_lvl || 0);
    const l2 = isUiShape ? (pl.op_2_lvl ?? pl.opt2Level ?? 0) : (pl.op_2_lvl || 0);
    const l3 = isUiShape ? (pl.op_3_lvl ?? pl.opt3Level ?? 0) : (pl.op_3_lvl || 0);
    const applyToDuration = pl.applyDuration || false;

    const def = partsDb.find(p => p.name === name);
    if (!def) return;

    // Energy contribution
    const energyContribution =
      (def.base_en || 0) +
      (def.op_1_en || 0) * l1 +
      (def.op_2_en || 0) * l2 +
      (def.op_3_en || 0) * l3;

    // Categorize energy contribution
    if (def.duration) {
      dur_all *= energyContribution;
      hasDurationParts = true;
    } else if (def.percentage) {
      perc_all *= energyContribution;
      if (applyToDuration) perc_dur *= energyContribution;
    } else {
      flat_normal += energyContribution;
      if (applyToDuration) flat_duration += energyContribution;
    }

    // TP calculation (floor entire sum)
    const rawTP =
      (def.base_tp || 0) +
      (def.op_1_tp || 0) * l1 +
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

  // If no duration parts, dur_all = 0
  if (!hasDurationParts) dur_all = 0;

  // Unified power energy equation
  const totalEnergyRaw = (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur);
  const totalEnergy = Math.ceil(totalEnergyRaw); // Round up for non-creator displays

  return { totalEnergy, totalTP, tpSources, energyRaw: totalEnergyRaw };
}

/* ------------ Action Type ------------ */

/**
 * Compute action type from parts payload
 */
export function computeActionType(partsPayload = []) {
  let actionType = 'Basic';
  let isReaction = false;

  partsPayload.forEach(p => {
    const name = p?.part?.name || p?.name;
    // Prefer standardized op_1_lvl with fallback
    const l1 = p?.part ? (p.op_1_lvl ?? p.opt1Level ?? 0) : (p.op_1_lvl || 0);

    if (name === 'Power Reaction') isReaction = true;
    else if (name === 'Power Quick or Free Action') {
      if (l1 === 0) actionType = 'Quick';
      else if (l1 === 1) actionType = 'Free';
    } else if (name === 'Power Long Action') {
      if (l1 === 0) actionType = 'Long (3)';
      else if (l1 === 1) actionType = 'Long (4)';
    }
  });

  return isReaction ? `${actionType} Reaction` : `${actionType} Action`;
}

/**
 * Helper when UI stores selector value (quick|free|long3|long4|basic)
 */
export function computeActionTypeFromSelection(selection, reactionFlag) {
  let base = 'Basic';
  if (selection === 'quick') base = 'Quick';
  else if (selection === 'free') base = 'Free';
  else if (selection === 'long3') base = 'Long (3)';
  else if (selection === 'long4') base = 'Long (4)';
  return reactionFlag ? `${base} Reaction` : `${base} Action`;
}

/* ------------ Range / Area / Duration Derivation ------------ */

/**
 * Derive range string from parts
 */
export function deriveRange(partsPayload = []) {
  const pr = partsPayload.find(p => (p?.part?.name || p?.name) === 'Power Range');
  if (!pr) return '1 space';
  const lvl = pr.part ? (pr.op_1_lvl ?? pr.opt1Level ?? 0) : (pr.op_1_lvl || 0);
  const spaces = 3 + (3 * lvl);
  return `${spaces} ${spaces > 1 ? 'spaces' : 'space'}`;
}

/**
 * Derive area string from parts
 */
export function deriveArea(partsPayload = []) {
  const areaParts = ['Sphere of Effect', 'Cylinder of Effect', 'Cone of Effect', 'Line of Effect', 'Trail of Effect'];
  for (const areaName of areaParts) {
    if (partsPayload.some(p => (p?.part?.name || p?.name) === areaName)) {
      return areaName.split(' ')[0]; // e.g., "Sphere"
    }
  }
  return '1 target';
}

/**
 * Derive duration string from parts
 */
export function deriveDuration(partsPayload = []) {
  const findPart = (n) => partsPayload.find(p => (p?.part?.name || p?.name) === n);
  const getLvl = (p) => p ? (p.part ? (p.opt1Level || 0) : (p.op_1_lvl || 0)) : 0;

  const permanentPart = findPart('Duration (Permanent)');
  if (permanentPart) return 'Permanent';

  const roundPart = findPart('Duration (Round)');
  if (roundPart) {
    const lvl = getLvl(roundPart);
    const rounds = 2 + lvl;
    return `${rounds} ${rounds > 1 ? 'rounds' : 'round'}`;
  }

  const minutePart = findPart('Duration (Minute)');
  if (minutePart) {
    const lvl = getLvl(minutePart);
    const minutes = [1, 10, 30][lvl] || 1;
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  const hourPart = findPart('Duration (Hour)');
  if (hourPart) {
    const lvl = getLvl(hourPart);
    const hours = [1, 6, 12][lvl] || 1;
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  const dayPart = findPart('Duration (Days)');
  if (dayPart) {
    const lvl = getLvl(dayPart);
    const days = [1, 10, 20, 30][lvl] || 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  return '1 round';
}

/* ------------ Chip Formatting ------------ */

/**
 * Format a single power part as a chip
 */
export function formatPowerPartChip(def, pl) {
  const l1 = pl.op_1_lvl || 0;
  const l2 = pl.op_2_lvl || 0;
  const l3 = pl.op_3_lvl || 0;

  const rawTP =
    (def.base_tp || 0) +
    (def.op_1_tp || 0) * l1 +
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

/**
 * Build complete display data from a saved power document
 * @param {Object} powerDoc - saved power document from Firestore
 * @param {Array} partsDb - power parts database
 * @returns {Object} display data
 */
export function derivePowerDisplay(powerDoc, partsDb) {
  const partsPayload = Array.isArray(powerDoc.parts)
    ? powerDoc.parts.map(p => ({
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0,
        applyDuration: p.applyDuration || false
      }))
    : [];

  const calc = calculatePowerCosts(partsPayload, partsDb);
  const actionType = computeActionType(partsPayload);
  const rangeStr = deriveRange(partsPayload);
  const areaStr = deriveArea(partsPayload);
  const durationStr = deriveDuration(partsPayload);

  // Build part chips HTML
  const partChips = partsPayload.map(pl => {
    const def = partsDb.find(d => d.name === pl.name);
    if (!def) return '';
    const chip = formatPowerPartChip(def, pl);
    const cls = chip.finalTP > 0 ? 'part-chip proficiency-chip' : 'part-chip';
    return `<div class="${cls}" title="${def.description || ''}">${chip.text}</div>`;
  });

  return {
    name: powerDoc.name || '',
    description: powerDoc.description || '',
    actionType,
    range: rangeStr,
    area: areaStr,
    duration: durationStr,
    energy: calc.totalEnergy,
    tp: calc.totalTP,
    tpSources: calc.tpSources,
    partChipsHTML: partChips.join('')
  };
}
