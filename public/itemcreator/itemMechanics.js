/**
 * Extract proficiency information with TP costs from item properties
 * @param {Array} itemProperties - Array of property objects
 * @param {Array} propertiesData - Full properties database
 * @returns {Array} Array of proficiency objects with { name, baseTP, optionTP, optionLevel }
 */
export function extractProficiencies(itemProperties, propertiesData) {
    const proficiencies = [];
    
    itemProperties.forEach(itemProp => {
        const property = propertiesData.find(p => p.id === itemProp.id || p.name === itemProp.name);
        if (property) {
            const baseTP = property.base_tp || 0;
            const optionLevel = itemProp.op_1_lvl || 0;
            const optionTP = optionLevel > 0 ? (property.op_1_tp || 0) * optionLevel : 0;
            
            // Only include if there's a TP cost
            if (baseTP > 0 || optionTP > 0) {
                proficiencies.push({
                    name: property.name,
                    baseTP: baseTP,
                    optionTP: optionTP,
                    optionLevel: optionLevel,
                    totalTP: baseTP + optionTP
                });
            }
        }
    });
    
    return proficiencies;
}

/**
 * Format range value for display
 * Base Range property = 8 spaces (level 0)
 * Each additional level adds 8 spaces
 * @param {Array} itemProperties - Array of property objects
 * @returns {string} Formatted range string
 */
export function formatRange(itemProperties) {
    const rangeProp = (itemProperties || []).find(p => p.name === "Range");
    if (rangeProp) {
        // Base property (level 0) = 8 spaces
        // Level 1 = 16 spaces (8 + 8*1)
        // Level 2 = 24 spaces (8 + 8*2), etc.
        const level = rangeProp.op_1_lvl || 0;
        const totalSpaces = 8 + (level * 8);
        return `${totalSpaces} Spaces`;
    }
    return "Melee";
}

/**
 * Calculate total costs (IP, TP, GP) from item properties
 * @param {Array} itemProperties - Array of property objects
 * @param {Array} propertiesData - Full properties database
 * @returns {Object} { totalIP, totalTP, totalGP }
 */
export function calculateItemCosts(itemProperties, propertiesData) {
    let sumBaseIP = 0;
    let totalTP = 0;
    let totalGP = 0;
    let hasArmorProperty = false;
    let hasWeaponProperty = false;

    // Find general properties we need
    const propShieldBase = propertiesData.find(p => p.name === "Shield Base");
    const propArmorBase = propertiesData.find(p => p.name === "Armor Base");
    const propRange = propertiesData.find(p => p.name === "Range");
    const propTwoHanded = propertiesData.find(p => p.name === "Two-Handed");
    const propSplitDice = propertiesData.find(p => p.name === "Split Damage Dice");
    const propDamageReduction = propertiesData.find(p => p.name === "Damage Reduction");
    const propWeaponDamage = propertiesData.find(p => p.name === "Weapon Damage");

    // --- Damage Reduction for Armor ---
    // Note: This assumes damageReduction is passed or handled externally; adjust if needed
    // For library display, we skip dynamic UI state and rely on saved properties

    // --- Shield base (from DB) ---
    // Assumes armamentType is checked externally; for library, use properties
    if (itemProperties.some(p => p.name === "Shield Base")) {
        if (propShieldBase) {
            sumBaseIP += propShieldBase.base_ip;
            totalTP += propShieldBase.base_tp;
            totalGP += propShieldBase.base_gp;
        }
    }
    // --- Armor base (from DB) ---
    if (itemProperties.some(p => p.name === "Armor Base")) {
        if (propArmorBase) {
            sumBaseIP += propArmorBase.base_ip;
            totalTP += propArmorBase.base_tp;
            totalGP += propArmorBase.base_gp;
        }
    }

    // Apply selected item properties (excluding general properties)
    itemProperties.forEach((itemProp) => {
        const property = propertiesData.find(p => p.id === itemProp.id || p.name === itemProp.name);
        if (property && !["Shield Base", "Armor Base", "Range", "Two-Handed", "Split Damage Dice", "Damage Reduction", "Weapon Damage"].includes(property.name)) {
            let propertyIP = property.base_ip;
            let propertyTP = property.base_tp;
            let propertyGP = property.base_gp;
            const optionLevel = itemProp.op_1_lvl || 0;
            propertyIP += (property.op_1_ip || 0) * optionLevel;
            propertyTP += (property.op_1_tp || 0) * optionLevel;
            propertyGP += (property.op_1_gp || 0) * optionLevel;

            sumBaseIP += propertyIP;
            totalTP += propertyTP;
            totalGP += propertyGP;

            if (property.type === 'Armor') hasArmorProperty = true;
            if (property.type === 'Weapon') hasWeaponProperty = true;
        }
    });

    // --- Ability Requirements (handled via properties) ---
    // Assumes requirements are saved as properties; logic simplified for library

    // --- Agility Reduction (handled via properties) ---

    // --- Range cost from DB (levels = range steps) ---
    const rangeProp = itemProperties.find(p => p.name === "Range");
    if (rangeProp && propRange) {
        const level = rangeProp.op_1_lvl || 0;
        const ip = propRange.base_ip + level * (propRange.op_1_ip || 0);
        const tp = propRange.base_tp + level * (propRange.op_1_tp || 0);
        const gp = propRange.base_gp + level * (propRange.op_1_gp || 0);
        sumBaseIP += ip;
        totalTP += tp;
        totalGP += gp;
    }

    // --- Two-Handed cost from DB ---
    if (itemProperties.some(p => p.name === "Two-Handed") && propTwoHanded) {
        sumBaseIP += propTwoHanded.base_ip;
        totalTP += propTwoHanded.base_tp;
        totalGP += propTwoHanded.base_gp;
    }

    // --- Weapon Damage (base dice only; splits priced separately) ---
    // Simplified for library; assumes damage is handled separately
    const weaponDamageProp = itemProperties.find(p => p.name === "Weapon Damage");
    if (weaponDamageProp && propWeaponDamage) {
        const level = weaponDamageProp.op_1_lvl || 0;
        const ip = propWeaponDamage.base_ip + level * (propWeaponDamage.op_1_ip || 0);
        const tp = propWeaponDamage.base_tp + level * (propWeaponDamage.op_1_tp || 0);
        const gp = propWeaponDamage.base_gp + level * (propWeaponDamage.op_1_gp || 0);
        sumBaseIP += ip;
        totalTP += tp;
        totalGP += gp;
    }

    // --- Split Damage Dice priced by DB property with levels = totalSplits ---
    const splitProp = itemProperties.find(p => p.name === "Split Damage Dice");
    if (splitProp && propSplitDice) {
        const level = splitProp.op_1_lvl || 0;
        const ip = propSplitDice.base_ip + level * (propSplitDice.op_1_ip || 0);
        const tp = propSplitDice.base_tp + level * (propSplitDice.op_1_tp || 0);
        const gp = propSplitDice.base_gp + level * (propSplitDice.op_1_gp || 0);
        sumBaseIP += ip;
        totalTP += tp;
        totalGP += gp;
    }

    return { totalIP: sumBaseIP, totalTP, totalGP };
}

/**
 * Calculate gold cost and rarity based on totalGP and totalIP
 * @param {number} totalGP - Total gold points
 * @param {number} totalIP - Total item points
 * @returns {Object} { goldCost, rarity }
 */
export function calculateGoldCostAndRarity(totalGP, totalIP) {
    let goldCost = 0;
    let rarity = 'Common';

    // Clamp totalIP and totalGP to at least 0
    const clampedIP = Math.max(0, totalIP);
    const clampedGP = Math.max(0, totalGP);

    const rarityBrackets = [
        { name: 'Common', low: 25, ipLow: 0, ipHigh: 4 },
        { name: 'Uncommon', low: 100, ipLow: 4.01, ipHigh: 6 },
        { name: 'Rare', low: 500, ipLow: 6.01, ipHigh: 8 },
        { name: 'Epic', low: 2500, ipLow: 8.01, ipHigh: 11 },
        { name: 'Legendary', low: 10000, ipLow: 11.01, ipHigh: 14 },
        { name: 'Mythic', low: 50000, ipLow: 14.01, ipHigh: 16 },
        { name: 'Ascended', low: 100000, ipLow: 16.01, ipHigh: Infinity }
    ];

    for (let i = 0; i < rarityBrackets.length; i++) {
        const bracket = rarityBrackets[i];
        if (clampedIP >= bracket.ipLow && clampedIP <= bracket.ipHigh) {
            rarity = bracket.name;
            goldCost = bracket.low * (1 + 0.125 * clampedGP);
            break;
        }
    }

    // Ensure goldCost is never less than the bracket minimum
    goldCost = Math.max(goldCost, rarityBrackets.find(b => b.name === rarity).low);

    return { goldCost, rarity };
}

/**
 * Format damage array for display
 * @param {Array} damageArr - Array of damage objects { amount, size, type }
 * @returns {string} Formatted damage string
 */
export function formatDamage(damageArr) {
    if (!Array.isArray(damageArr)) return '';
    return damageArr
        .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
        .map(d => `${d.amount}d${d.size} ${d.type}`)
        .join(', ');
}