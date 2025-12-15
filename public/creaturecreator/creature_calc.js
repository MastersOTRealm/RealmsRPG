// All constants and calculation formulas for creature creator

export const BASE_ABILITY_POINTS = 7;
export const ABILITY_POINTS_PER_3_LEVELS = 1;
export const BASE_FEAT_POINTS = 4;
export const FEAT_POINTS_PER_LEVEL = 1;
export const MARTIAL_BONUS_FEAT_POINTS = 1;
export const MARTIAL_BONUS_FEAT_POINTS_LEVEL_4 = 1; // per 3 levels after 4
export const BASE_SKILL_POINTS = 2;
export const SKILL_POINTS_PER_LEVEL = 3;
export const BASE_HIT_ENERGY = 26;
export const HIT_ENERGY_PER_LEVEL = 12;
export const BASE_CURRENCY = 200;
export const CURRENCY_GROWTH = 1.45;
export const BASE_TP = 9;
export const TP_PER_LEVEL = 1;
export const BASE_PROFICIENCY = 2;
export const PROFICIENCY_PER_5_LEVELS = 1;

// NOTE: Martial/Power proficiency logic is now handled in creatureUtils.js.
// calcBaseFeatPoints is not used for proficiency-based feat point calculation anymore.

export function calcAbilityPointTotal(level) {
    level = parseFloat(level) || 1;
    return BASE_ABILITY_POINTS + Math.floor((level - 1) / 3) * ABILITY_POINTS_PER_3_LEVELS;
}

export function calcSkillPointTotal(level) {
    level = parseFloat(level) || 1;
    return BASE_SKILL_POINTS + SKILL_POINTS_PER_LEVEL * level;
}

export function calcHitEnergyTotal(level) {
    level = parseFloat(level) || 1;
    return BASE_HIT_ENERGY + HIT_ENERGY_PER_LEVEL * (level - 1);
}

export function calcCreatureCurrency(level) {
    level = parseFloat(level) || 1;
    return Math.round(BASE_CURRENCY * Math.pow(CURRENCY_GROWTH, level - 1));
}

export function calcTP(level, highestNonVit) {
    level = parseFloat(level) || 1;
    if (level <= 1) return BASE_TP + highestNonVit;
    return BASE_TP + highestNonVit + (level - 1) * (TP_PER_LEVEL + highestNonVit);
}

export function calcProficiency(level) {
    level = parseFloat(level) || 1;
    return BASE_PROFICIENCY + Math.floor(level / 5) * PROFICIENCY_PER_5_LEVELS;
}

// Innate Energy/Power proficiency logic is handled in creatureUtils.js.
