import { 
    resistances, weaknesses, immunities, senses, movement, feats, creatureSkills, creatureSkillValues, 
    conditionImmunities, defenseSkillState 
} from './creatureState.js';
import {
    calcAbilityPointTotal,
    calcSkillPointTotal,
    calcHitEnergyTotal,
    calcCreatureCurrency
} from './creature_calc.js';

// Descriptions and points for senses and movement
export const SENSES_DESCRIPTIONS = {
    "Darkvision": "Can see in darkness up to 6 spaces as shades of grey.",
    "Darkvision II": "Can see in darkness up to 12 spaces as shades of grey.",
    "Darkvision III": "Can see in darkness up to 24 spaces as shades of grey.",
    "Blindsense": "Has Blindsense out to 3 spaces.",
    "Blindsense II": "Has Blindsense out to 6 spaces.",
    "Blindsense III": "Has Blindsense out to 12 spaces.",
    "Blindsense IV": "Has Blindsense out to 24 spaces.",
    "Amphibious": "Can breathe air and water.",
    "All-Surface Climber": "Can climb on difficult vertical and horizontal surfaces, even upside down, without needing to make a Climb Roll.",
    "Telepathy": "This creature can communicate telepathically with creatures it is aware of within 12 spaces.",
    "Telepathy II": "This creature can communicate telepathically with creatures it is aware of within 48 spaces.",
    "Telepathically Intune": "Can perceive content of all telepathic communication within 12 spaces.",
    "Waterbreathing": "This creature can only breathe underwater.",
    "Unrestrained Movement": "Ignores difficult terrain, the slowed condition, and any other effect that would slow its movement due to environmental effects."
};

export const MOVEMENT_DESCRIPTIONS = {
    "Ground": "Standard ground movement.",
    "Fly Half": "You can fly with a speed equal to half of your regular speed.",
    "Fly": "You can fly with a speed equal to your regular speed.",
    "Burrow": "You can burrow with a speed equal to half of your regular speed.",
    "Burrow II": "You can burrow with a speed equal to your regular speed.",
    "Jump": "Can long jump 3 spaces and high jump 2.",
    "Jump II": "Can long jump 4 spaces and high jump 3.",
    "Jump III": "Can long jump 5 spaces and high jump 4.",
    "Speedy": "Movement speed is increased by 2.",
    "Speedy II": "Movement speed is increased by 4.",
    "Speedy III": "Movement speed is increased by 6.",
    "Slow": "Movement speed is decreased by 2.",
    "Slow II": "Movement speed is decreased by 4.",
    "Slow III": "Movement speed is decreased by 6.",
    "Slow Walker": "Ground Speed is 1/4 of your normal speed.",
    "Hover": "Must end turn within 1 space of the ground, but need not touch it. Only applicable if the creature has a flying speed."
};

export const SENSES_DISPLAY = {
    "Darkvision": "Darkvision (6 spaces)",
    "Darkvision II": "Darkvision II (12 spaces)",
    "Darkvision III": "Darkvision III (24 spaces)",
    "Blindsense": "Blindsense (3 spaces)",
    "Blindsense II": "Blindsense II (6 spaces)",
    "Blindsense III": "Blindsense III (12 spaces)",
    "Blindsense IV": "Blindsense IV (24 spaces)",
    "Amphibious": "Amphibious",
    "All-Surface Climber": "All-Surface Climber",
    "Telepathy": "Telepathy (12 spaces)",
    "Telepathy II": "Telepathy II (48 spaces)",
    "Telepathically Intune": "Telepathically Intune (12 spaces)",
    "Waterbreathing": "Waterbreathing",
    "Unrestrained Movement": "Unrestrained Movement"
};

export const MOVEMENT_DISPLAY = {
    "Ground": "Ground",
    "Fly Half": "Flying (Half Speed)",
    "Fly": "Flying II (Full Speed)",
    "Burrow": "Burrow (Half Speed)",
    "Burrow II": "Burrow II (Full Speed)",
    "Jump": "Jump (Long 3, High 2 spaces)",
    "Jump II": "Jump II (Long 4, High 3 spaces)",
    "Jump III": "Jump III (Long 5, High 4 spaces)",
    "Speedy": "Speedy (+2 spaces)",
    "Speedy II": "Speedy II (+4 spaces)",
    "Speedy III": "Speedy III (+6 spaces)",
    "Slow": "Slow (-2 spaces)",
    "Slow II": "Slow II (-4 spaces)",
    "Slow III": "Slow III (-6 spaces)",
    "Slow Walker": "Slow Walker",
    "Hover": "Hover"
};

export const SENSES_POINTS = {
    "Darkvision": 1,
    "Darkvision II": 2,
    "Darkvision III": 4,
    "Blindsense": 0.5,
    "Blindsense II": 1,
    "Blindsense III": 2,
    "Blindsense IV": 4,
    "Amphibious": 1,
    "All-Surface Climber": 2,
    "Telepathy": 1,
    "Telepathy II": 2,
    "Telepathically Intune": 1,
    "Waterbreathing": 0,
    "Unrestrained Movement": 1.5
};

export const MOVEMENT_POINTS = {
    "Fly Half": 2,
    "Fly": 3,
    "Burrow": 1,
    "Burrow II": 2,
    "Jump": 1,
    "Jump II": 2,
    "Jump III": 3,
    "Speedy": 1,
    "Speedy II": 2,
    "Speedy III": 3,
    "Slow": -0.5,
    "Slow II": -1.5,
    "Slow III": -3,
    "Slow Walker": -0.5,
    "Hover": 0
};

// --- Archetype Proficiency Logic ---
export function getMaxArchetypeProficiency(level) {
    level = parseInt(level) || 1;
    return 2 + Math.floor(level / 5);
}

export function getPowerProficiency() {
    const el = document.getElementById('powerProficiencyInput');
    return el ? parseInt(el.value) || 0 : 0;
}

export function getMartialProficiency() {
    const el = document.getElementById('martialProficiencyInput');
    return el ? parseInt(el.value) || 0 : 0;
}

export function validateArchetypeProficiency() {
    const level = getLevelValue();
    const max = getMaxArchetypeProficiency(level);
    const power = getPowerProficiency();
    const martial = getMartialProficiency();
    return (power >= 0 && martial >= 0 && (power + martial) <= max);
}

// Utility functions
export function updateList(listId, arr, removeHandler, descMap, displayMap) {
    const ul = document.getElementById(listId);
    ul.innerHTML = "";
    arr.slice().sort().forEach((val, idx) => {
        const li = document.createElement("li");
        li.textContent = displayMap && displayMap[val] ? displayMap[val] : val;
        if (descMap && descMap[val]) {
            li.title = descMap[val];
        }
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => { removeHandler(idx); };
        li.appendChild(btn);
        ul.appendChild(li);
    });
}

export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDamage(damageArr) {
    if (!Array.isArray(damageArr)) return '';
    return damageArr.map(d => {
        if (d.amount && d.size && d.type && d.type !== 'none') {
            return `${d.amount}d${d.size} ${d.type}`;
        }
        return '';
    }).filter(Boolean).join(', ');
}

export function formatTechniqueAction(item) {
    let action = item.actionType ? capitalize(item.actionType) : '-';
    if (item.reactionChecked) action += " Reaction";
    else if (action !== '-') action += " Action";
    return action;
}

export function formatTechniqueDamage(damageArr) {
    if (!Array.isArray(damageArr)) return '';
    return damageArr
        .filter(d => d && d.amount && d.size && d.amount !== '0' && d.size !== '0')
        .map(d => `Increased Damage: ${d.amount}d${d.size}`)
        .join(', ');
}

export function formatTechniqueParts(partsArr) {
    if (!Array.isArray(partsArr) || !partsArr.length) return '-';
    return partsArr.map(part => {
        let txt = part.part || '';
        if (part.opt1Level) txt += ` Opt 1: (${part.opt1Level})`;
        if (part.opt2Level) txt += ` Opt 2: (${part.opt2Level})`;
        if (part.opt3Level) txt += ` Opt 3: (${part.opt3Level})`;
        return txt;
    }).join(', ');
}

// Calculations
export function getBaseFeatPoints(level) {
    level = parseInt(level) || 1;
    // Martial bonus feat points: 1 per martial proficiency, max 2
    const martialProf = getMartialProficiency();
    let martialBonus = Math.min(martialProf, 2) * 1; // MARTIAL_BONUS_FEAT_POINTS = 1
    // If martial proficiency >= 2, get +1 per 3 levels after 4
    if (martialProf >= 2 && level >= 4) {
        martialBonus += Math.floor((level - 1) / 3) * 1; // MARTIAL_BONUS_FEAT_POINTS_LEVEL_4 = 1
    }
    let base = 4 + 1 * (level - 1); // BASE_FEAT_POINTS + FEAT_POINTS_PER_LEVEL * (level - 1)
    return base + martialBonus;
}

export function getSpecialFeatPoints() {
    let points = 0;
    points += immunities.length * 2;
    points += resistances.length * 1;
    points += weaknesses.length * -0.5;
    senses.forEach(sense => {
        if (SENSES_POINTS.hasOwnProperty(sense)) points += SENSES_POINTS[sense];
    });
    movement.forEach(move => {
        if (move.type === "Ground") return;
        if (MOVEMENT_POINTS.hasOwnProperty(move.type)) points += MOVEMENT_POINTS[move.type];
    });
    if (movement.some(m => m.type === "Hover")) {
        let flyingLevel = 0;
        if (movement.some(m => m.type === "Fly")) flyingLevel = 2;
        else if (movement.some(m => m.type === "Fly Half")) flyingLevel = 1;
        points += -1 * flyingLevel;
    }
    points += conditionImmunities.length * 1.5;
    return points;
}

export function getSpentFeatPoints() {
    let points = feats.reduce((sum, f) => sum + (parseFloat(f.points) || 0), 0);
    points += getSpecialFeatPoints();
    return points;
}

export function getRemainingFeatPoints() {
    const level = document.getElementById("creatureLevel").value || 1;
    return getBaseFeatPoints(level) - getSpentFeatPoints();
}

export function getProficiency(level) {
    // Not used anymore for summary, use getPowerProficiency/getMartialProficiency directly
    return getMaxArchetypeProficiency(level);
}

export function getCreatureCurrency(level) {
    level = parseInt(level) || 1;
    return calcCreatureCurrency(level);
}

export function getAbilityPointCost(val) {
    val = parseInt(val);
    if (isNaN(val)) return 0;
    if (val <= 4) return val;
    return 4 + (val - 4) * 2;
}

export function getAbilityPointTotal(level) {
    level = parseInt(level) || 1;
    return calcAbilityPointTotal(level);
}

export function getSkillPointTotal() {
    const level = parseInt(document.getElementById('creatureLevel')?.value) || 1;
    return calcSkillPointTotal(level);
}

export function getSkillPointsSpent() {
    let skillValuePoints = 0;
    for (const skill of creatureSkills) {
        skillValuePoints += creatureSkillValues[skill] || 0;
    }
    return Object.values(defenseSkillState).reduce((sum, v) => sum + v * 2, 0) + creatureSkills.length + skillValuePoints;
}

export function getSkillPointsRemaining() {
    return Math.max(0, getSkillPointTotal() - getSkillPointsSpent());
}

export function getAbilityValue(id) {
    const el = document.getElementById(id);
    return el ? parseInt(el.value) || 0 : 0;
}

export function getSkillBonus(skillObj) {
    if (!skillObj) return 0;
    // Support both 'ability' (from DB) and 'abilities' (legacy)
    let abilityArr = [];
    if (Array.isArray(skillObj.abilities)) {
        abilityArr = skillObj.abilities;
    } else if (Array.isArray(skillObj.ability)) {
        abilityArr = skillObj.ability;
    } else if (typeof skillObj.ability === "string") {
        abilityArr = [skillObj.ability];
    }
    if (!abilityArr.length) return 0;
    const abilityMap = {
        strength: 'creatureAbilityStrength',
        vitality: 'creatureAbilityVitality',
        agility: 'creatureAbilityAgility',
        acuity: 'creatureAbilityAcuity',
        intelligence: 'creatureAbilityIntelligence',
        charisma: 'creatureAbilityCharisma'
    };
    let max = -Infinity;
    abilityArr.forEach(ability => {
        const id = abilityMap[ability.toLowerCase()];
        if (id) {
            const val = getAbilityValue(id);
            if (val > max) max = val;
        }
    });
    // Always use the skill's name for value lookup
    const skillName = skillObj.name;
    const skillValue = typeof creatureSkillValues[skillName] === "number" ? creatureSkillValues[skillName] : 0;
    return (max === -Infinity ? 0 : max) + skillValue;
}

export function getBaseDefenseValue(defense) {
    switch (defense) {
        case "Might": return 10 + getAbilityValue('creatureAbilityStrength');
        case "Fortitude": return 10 + getAbilityValue('creatureAbilityVitality');
        case "Reflex": return 10 + getAbilityValue('creatureAbilityAgility');
        case "Discernment": return 10 + getAbilityValue('creatureAbilityAcuity');
        case "Mental Fortitude": return 10 + getAbilityValue('creatureAbilityIntelligence');
        case "Resolve": return 10 + getAbilityValue('creatureAbilityCharisma');
        default: return 10;
    }
}

export function getHighestNonVitalityAbility() {
    const ids = [
        'creatureAbilityStrength',
        'creatureAbilityAgility',
        'creatureAbilityAcuity',
        'creatureAbilityIntelligence',
        'creatureAbilityCharisma'
    ];
    let max = -Infinity;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const val = parseInt(el.value) || 0;
            if (val > max) max = val;
        }
    });
    return max === -Infinity ? 0 : max;
}

export function getLevelValue() {
    const l = document.getElementById('creatureLevel');
    return l ? parseInt(l.value) || 1 : 1;
}

export function getVitalityValue() {
    const v = document.getElementById('creatureAbilityVitality');
    return v ? parseInt(v.value) || 0 : 0;
}

export function getBaseHitPoints() {
    return getLevelValue() * getVitalityValue();
}

export function getBaseEnergy() {
    return getLevelValue() * getHighestNonVitalityAbility();
}

export function getHitEnergyTotal(level) {
    level = parseInt(level) || 1;
    return calcHitEnergyTotal(level);
}

export function getInnatePowers(level) {
    // Only grant innate powers if Power Proficiency > 0
    const powerProf = getPowerProficiency();
    if (powerProf <= 0) return 0;
    level = parseInt(level) || 1;
    if (level < 1) return 0;
    return 2 + Math.floor((level - 1) / 3);
}

export function getInnateEnergy(innatePowers) {
    // Only grant innate energy if Power Proficiency > 0
    const powerProf = getPowerProficiency();
    if (powerProf <= 0 || innatePowers === 0) return 0;
    if (powerProf === 1) return 6;
    if (powerProf === 2) {
        // 8 + 1 per 3 levels after 4
        const level = getLevelValue();
        let bonus = 0;
        if (level >= 4) {
            bonus = Math.floor((level - 1) / 3);
        }
        return 8 + bonus;
    }
    if (powerProf > 2) {
        // For powerProf > 2, treat as 2 for this calculation (no extra benefit)
        const level = getLevelValue();
        let bonus = 0;
        if (level >= 4) {
            bonus = Math.floor((level - 1) / 3);
        }
        return 8 + bonus;
    }
    return 0;
}
