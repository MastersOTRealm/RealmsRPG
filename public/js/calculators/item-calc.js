// Centralized item calculation & display utilities

// Currency + rarity brackets
const RARITY_BRACKETS = [
  { name: 'Common',     low: 25,     ipLow: 0,     ipHigh: 4 },
  { name: 'Uncommon',   low: 100,    ipLow: 4.01,  ipHigh: 6 },
  { name: 'Rare',       low: 500,    ipLow: 6.01,  ipHigh: 8 },
  { name: 'Epic',       low: 2500,   ipLow: 8.01,  ipHigh: 11 },
  { name: 'Legendary',  low: 10000,  ipLow: 11.01, ipHigh: 14 },
  { name: 'Mythic',     low: 50000,  ipLow: 14.01, ipHigh: 16 },
  { name: 'Ascended',   low: 100000, ipLow: 16.01, ipHigh: Infinity }
];

// General property names excluded from selectable property iterations
const GENERAL_NAMES = new Set([
  'Shield Base','Armor Base','Range','Two-Handed',
  'Split Damage Dice','Damage Reduction','Weapon Damage',
  'Agility Reduction',
  'Weapon Strength Requirement','Weapon Agility Requirement','Weapon Vitality Requirement',
  'Weapon Acuity Requirement','Weapon Intelligence Requirement','Weapon Charisma Requirement',
  'Armor Strength Requirement','Armor Agility Requirement','Armor Vitality Requirement'
]);

// --- Core computations ---

export function calculateCurrencyCostAndRarity(totalCurrency, totalIP) {
  const ip = Math.max(0, totalIP);
  const c  = Math.max(0, totalCurrency);
  let rarity = 'Common';
  let currencyCost = 0;
  for (const br of RARITY_BRACKETS) {
    if (ip >= br.ipLow && ip <= br.ipHigh) {
      rarity = br.name;
      currencyCost = br.low * (1 + 0.125 * c);
      break;
    }
  }
  const bracket = RARITY_BRACKETS.find(b => b.name === rarity);
  if (bracket) currencyCost = Math.max(currencyCost, bracket.low);
  return { currencyCost, rarity };
}

// Legacy alias (optional)
export const calculateGoldCostAndRarity = calculateCurrencyCostAndRarity;

export function formatDamage(damageArr) {
  if (!Array.isArray(damageArr)) return '';
  return damageArr
    .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
    .map(d => `${d.amount}d${d.size} ${d.type}`)
    .join(', ');
}

/**
 * Compute number of damage dice splits needed
 */
export function computeSplits(diceAmt, dieSize) {
  const valid = [4, 6, 8, 10, 12];
  if (!valid.includes(dieSize) || diceAmt <= 1) return 0;
  const total = diceAmt * dieSize;
  const minDiceUsingD12 = Math.ceil(total / 12);
  return Math.max(0, diceAmt - minDiceUsingD12);
}

export function formatRange(properties) {
  const prop = (properties || []).find(p => p.name === 'Range');
  if (!prop) return 'Melee';
  const lvl = prop.op_1_lvl || 0;
  return `${8 + (lvl * 8)} Spaces`;
}

// Derive Damage Reduction (saved as property with base = 1 + option levels)
export function deriveDamageReductionFromProperties(properties) {
  const drProp = (properties || []).find(p => p.name === 'Damage Reduction');
  if (!drProp) return 0;
  return 1 + (drProp.op_1_lvl || 0);
}

// Extract proficiencies (TP sources) from properties
export function extractProficiencies(properties, propertiesData) {
  const profs = [];
  (properties || []).forEach(ref => {
    const data = propertiesData.find(p => p.id === ref.id || p.name === ref.name);
    if (!data) return;
    const lvl = ref.op_1_lvl || 0;
    const baseTP = data.base_tp || 0;
    const optTP  = lvl > 0 ? (data.op_1_tp || 0) * lvl : 0;
    const totalTP = baseTP + optTP;
    if (totalTP > 0) {
      profs.push({
        name: data.name,
        level: lvl,
        baseTP,
        optionTP: optTP,
        totalTP,
        description: data.description || ''
      });
    }
  });
  return profs;
}

// Unified item cost calculation (IP / TP / Currency)
// Assumes each property document has base_* and op_1_* fields.
export function calculateItemCosts(properties, propertiesData) {
  let totalIP = 0;
  let totalTP = 0;
  let totalCurrency = 0;

  (properties || []).forEach(ref => {
    const data = propertiesData.find(p => p.id === ref.id || p.name === ref.name);
    if (!data) return;
    const lvl = ref.op_1_lvl || 0;

    // Include all properties (general & requirements) for raw totals;
    // caller can choose to exclude if desired for special displays.
    const ip = (data.base_ip || 0) + (data.op_1_ip || 0) * lvl;
    const tp = (data.base_tp || 0) + (data.op_1_tp || 0) * lvl;
    const c  = (data.base_c  || 0) + (data.op_1_c  || 0) * lvl;

    totalIP += ip;
    totalTP += tp;
    totalCurrency += c;
  });

  return { totalIP, totalTP, totalCurrency };
}

// Build full display data from a saved item document
export function deriveItemDisplay(item, propertiesData) {
  const properties = item.properties || [];
  const costs = calculateItemCosts(properties, propertiesData);
  const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
  const damageStr = formatDamage(item.damage);
  const rangeStr = formatRange(properties);
  const dr = deriveDamageReductionFromProperties(properties);
  const profs = extractProficiencies(properties, propertiesData);
  return {
    name: item.name || '',
    armamentType: item.armamentType || 'Weapon',
    description: item.description || '',
    rarity,
    currencyCost,
    // legacy field for older code:
    goldCost: currencyCost,
    totalIP: costs.totalIP,
    totalTP: costs.totalTP,
    totalCurrency: costs.totalCurrency,
    range: rangeStr,
    damage: damageStr,
    damageReduction: dr,
    proficiencies: profs
  };
}

// Convenience to build proficiency chip text
export function formatProficiencyChip(p) {
  let txt = p.name;
  if (p.level > 0) txt += ` (Level ${p.level})`;
  if (p.totalTP > 0) {
    txt += ` | TP: ${p.baseTP}`;
    if (p.optionTP > 0) txt += ` + ${p.optionTP}`;
  }
  return txt;
}
