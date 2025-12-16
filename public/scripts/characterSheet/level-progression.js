/**
 * Character Level Progression Data & Logic
 * 
 * This module defines all the progression formulas and constraints for character leveling.
 * Use these functions to determine what resources a character should have at any given level.
 */

/**
 * Calculate Health-Energy points based on level
 * Formula: 18 + 12 * (level - 1)
 * Level 1 = 18, Level 2 = 30, Level 3 = 42, etc.
 * @param {number} level - Character level
 * @returns {number} Total health-energy points
 */
export function calculateHealthEnergyPoints(level) {
    return 18 + (12 * (level - 1));
}

/**
 * Calculate ability points based on level
 * Formula: 7 at level 1, +1 every 3 levels starting at level 3
 * @param {number} level - Character level
 * @returns {number} Total ability points
 */
export function calculateAbilityPoints(level) {
    if (level < 1) return 0;
    if (level < 3) return 7;
    // At level 3, 6, 9, 12, etc. gain +1
    const bonusPoints = Math.floor((level - 1) / 3);
    return 7 + bonusPoints;
}

/**
 * Calculate skill points based on level
 * Formula: 2 + level * 3
 * @param {number} level - Character level
 * @returns {number} Total skill points
 */
export function calculateSkillPoints(level) {
    return 2 + (level * 3);
}

/**
 * Calculate training points based on level and highest archetype ability
 * Formula: 22 + highest archetype ability + ((2 + highest archetype ability) * (level - 1))
 * @param {number} level - Character level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @returns {number} Total training points
 */
export function calculateTrainingPoints(level, highestArchetypeAbility) {
    const ability = highestArchetypeAbility || 0;
    return 22 + ability + ((2 + ability) * (level - 1));
}

/**
 * Calculate proficiency points based on level
 * Formula: 2 + 1 every 5 levels starting at level 5
 * These can be allocated to power or martial proficiency
 * @param {number} level - Character level
 * @returns {number} Total proficiency points
 */
export function calculateProficiencyPoints(level) {
    if (level < 1) return 0;
    if (level < 5) return 2;
    // At level 5, 10, 15, 20, etc. gain +1
    const bonusPoints = Math.floor(level / 5);
    return 2 + bonusPoints;
}

/**
 * Calculate maximum archetype feats allowed based on level
 * Formula: equals level
 * @param {number} level - Character level
 * @returns {number} Maximum archetype feats
 */
export function calculateMaxArchetypeFeats(level) {
    return level;
}

/**
 * Calculate maximum character feats allowed based on level
 * Formula: equals level
 * @param {number} level - Character level
 * @returns {number} Maximum character feats
 */
export function calculateMaxCharacterFeats(level) {
    return level;
}

/**
 * Get all progression data for a given level
 * @param {number} level - Character level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @returns {object} Object containing all calculated progression values
 */
export function getLevelProgression(level, highestArchetypeAbility = 0) {
    return {
        level,
        healthEnergyPoints: calculateHealthEnergyPoints(level),
        abilityPoints: calculateAbilityPoints(level),
        skillPoints: calculateSkillPoints(level),
        trainingPoints: calculateTrainingPoints(level, highestArchetypeAbility),
        proficiencyPoints: calculateProficiencyPoints(level),
        maxArchetypeFeats: calculateMaxArchetypeFeats(level),
        maxCharacterFeats: calculateMaxCharacterFeats(level)
    };
}

/**
 * Get the difference in progression between two levels
 * Useful for showing what a character gains when leveling up
 * @param {number} currentLevel - Current level
 * @param {number} newLevel - New level
 * @param {number} highestArchetypeAbility - The higher of the two archetype ability scores
 * @returns {object} Object containing the deltas for each progression value
 */
export function getLevelUpDelta(currentLevel, newLevel, highestArchetypeAbility = 0) {
    const current = getLevelProgression(currentLevel, highestArchetypeAbility);
    const next = getLevelProgression(newLevel, highestArchetypeAbility);
    
    return {
        healthEnergyPoints: next.healthEnergyPoints - current.healthEnergyPoints,
        abilityPoints: next.abilityPoints - current.abilityPoints,
        skillPoints: next.skillPoints - current.skillPoints,
        trainingPoints: next.trainingPoints - current.trainingPoints,
        proficiencyPoints: next.proficiencyPoints - current.proficiencyPoints,
        maxArchetypeFeats: next.maxArchetypeFeats - current.maxArchetypeFeats,
        maxCharacterFeats: next.maxCharacterFeats - current.maxCharacterFeats
    };
}

/**
 * Check if a level is a milestone level (where bonuses are gained)
 * @param {number} level - Level to check
 * @returns {object} Object indicating which milestones are reached
 */
export function getLevelMilestones(level) {
    return {
        isAbilityPointLevel: level >= 3 && ((level - 1) % 3 === 0),
        isProficiencyPointLevel: level >= 5 && (level % 5 === 0),
        levelUpGains: {
            abilityPoints: level >= 3 && ((level - 1) % 3 === 0) ? 1 : 0,
            proficiencyPoints: level >= 5 && (level % 5 === 0) ? 1 : 0,
            healthEnergyPoints: 12,
            skillPoints: 3,
            archetypeFeat: 1,
            characterFeat: 1
        }
    };
}

// =====================================================
// ABILITY SCORE CONSTRAINTS & COSTS
// =====================================================

/**
 * Ability score constraints based on character level
 */
export const ABILITY_CONSTRAINTS = {
    MIN_ABILITY: -2,           // No ability can go below -2
    MAX_NEGATIVE_SUM: -3,      // Sum of negative abilities cannot be less than -3
    LEVEL_1_MAX: 3,            // At level 1, no ability can exceed 3
    getMaxAbility: (level) => {
        // Maximum ability score increases with level
        // Level 1: max 3, then increases
        if (level <= 1) return 3;
        if (level <= 3) return 4;
        if (level <= 6) return 5;
        if (level <= 9) return 6;
        if (level <= 12) return 7;
        if (level <= 15) return 8;
        return 9; // Level 16+
    }
};

/**
 * Calculate the cost to increase an ability score by 1 point
 * - Normal cost is 1 point per increase
 * - Going from 4 to 5 costs 2 points
 * - Going from 5 to 6 and beyond costs 2 points each
 * @param {number} currentValue - Current ability score
 * @returns {number} Cost in ability points to increase by 1
 */
export function getAbilityIncreaseCost(currentValue) {
    if (currentValue >= 4) {
        return 2; // Costs 2 points to go from 4->5, 5->6, etc.
    }
    return 1; // Normal cost
}

/**
 * Calculate the refund when decreasing an ability score by 1 point
 * @param {number} currentValue - Current ability score
 * @returns {number} Points refunded when decreasing by 1
 */
export function getAbilityDecreaseRefund(currentValue) {
    if (currentValue > 5) {
        return 2; // Refund 2 points when going from 6->5, 7->6, etc.
    }
    if (currentValue === 5) {
        return 2; // Refund 2 points when going from 5->4
    }
    return 1; // Normal refund
}

/**
 * Calculate total ability points spent based on ability values
 * The sum of all ability scores equals the points spent.
 * Negative abilities reduce the total spent (giving you more points to allocate elsewhere).
 * High ability scores (4+) cost extra points to reach.
 * @param {object} abilities - Object mapping ability names to values
 * @param {object} baseAbilities - Base/ancestry abilities (default 0 for each)
 * @returns {number} Total ability points spent
 */
export function calculateAbilityPointsSpent(abilities, baseAbilities = {}) {
    let totalSpent = 0;
    
    for (const [abilityName, value] of Object.entries(abilities || {})) {
        const baseValue = baseAbilities[abilityName] || 0;
        
        if (value > baseValue) {
            // Calculate cost from base to current value (with scaling for high values)
            for (let i = baseValue; i < value; i++) {
                totalSpent += getAbilityIncreaseCost(i);
            }
        } else if (value < baseValue) {
            // Decreasing below base gives points back
            for (let i = baseValue; i > value; i--) {
                totalSpent -= getAbilityDecreaseRefund(i);
            }
        }
    }
    
    return totalSpent;
}

/**
 * Validate if an ability can be increased
 * @param {object} abilities - Current abilities object
 * @param {string} abilityName - Name of ability to increase
 * @param {number} level - Character level
 * @param {number} availablePoints - Available ability points
 * @param {object} baseAbilities - Base/ancestry abilities
 * @returns {object} { canIncrease: boolean, cost: number, reason: string }
 */
export function canIncreaseAbility(abilities, abilityName, level, availablePoints, baseAbilities = {}) {
    const currentValue = abilities[abilityName] || 0;
    const maxAbility = ABILITY_CONSTRAINTS.getMaxAbility(level);
    const cost = getAbilityIncreaseCost(currentValue);
    
    if (currentValue >= maxAbility) {
        return {
            canIncrease: false,
            cost,
            reason: `Maximum ability score at level ${level} is ${maxAbility}`
        };
    }
    
    if (cost > availablePoints) {
        return {
            canIncrease: false,
            cost,
            reason: `Need ${cost} point(s) but only have ${availablePoints}`
        };
    }
    
    return {
        canIncrease: true,
        cost,
        reason: null
    };
}

/**
 * Validate if an ability can be decreased
 * @param {object} abilities - Current abilities object
 * @param {string} abilityName - Name of ability to decrease
 * @param {object} baseAbilities - Base/ancestry abilities
 * @returns {object} { canDecrease: boolean, refund: number, reason: string }
 */
export function canDecreaseAbility(abilities, abilityName, baseAbilities = {}) {
    const currentValue = abilities[abilityName] || 0;
    const baseValue = baseAbilities[abilityName] || 0;
    const refund = getAbilityDecreaseRefund(currentValue);
    const newValue = currentValue - 1;
    
    // Cannot go below minimum (-2)
    if (newValue < ABILITY_CONSTRAINTS.MIN_ABILITY) {
        return {
            canDecrease: false,
            refund: 0,
            reason: `Cannot reduce below ${ABILITY_CONSTRAINTS.MIN_ABILITY}`
        };
    }
    
    // Check negative sum constraint (only applies when new value would be negative)
    if (newValue < 0) {
        // Calculate current sum of all negative abilities
        const currentNegSum = Object.values(abilities)
            .filter(v => v < 0)
            .reduce((sum, v) => sum + v, 0);
        
        // Calculate what the new sum would be after this decrease
        let newNegSum;
        if (currentValue < 0) {
            // Already negative, will become more negative
            newNegSum = currentNegSum - 1;
        } else {
            // Going from 0 to -1, add -1 to the sum
            newNegSum = currentNegSum + newValue;
        }
        
        if (newNegSum < ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM) {
            return {
                canDecrease: false,
                refund: 0,
                reason: `Sum of negative abilities cannot be less than ${ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM}`
            };
        }
    }
    
    // Cannot go below base ability (but base is usually 0, so this rarely applies)
    // Only enforced if base is positive (racial bonus)
    if (baseValue > 0 && newValue < baseValue) {
        return {
            canDecrease: false,
            refund: 0,
            reason: `Cannot reduce below base value of ${baseValue}`
        };
    }
    
    return {
        canDecrease: true,
        refund,
        reason: null
    };
}

/**
 * Get the sum of all negative ability values
 * @param {object} abilities - Abilities object
 * @returns {number} Sum of negative values (will be 0 or negative)
 */
export function getNegativeAbilitySum(abilities) {
    return Object.values(abilities || {})
        .filter(v => v < 0)
        .reduce((sum, v) => sum + v, 0);
}
