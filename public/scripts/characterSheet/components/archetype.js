import { formatBonus } from '../utils.js';
import { getCharacterResourceTracking } from '../validation.js';

/**
 * Renders the proficiency editing controls
 * @param {object} charData - Character data
 * @returns {string} HTML string for proficiency editor
 */
function renderProficiencyEditor(charData) {
    const resources = getCharacterResourceTracking(charData);
    const profPoints = resources.proficiencyPoints;
    
    // Three states: over-budget (red), has-points (green), no-points (blue)
    let statusClass;
    if (profPoints.remaining < 0) {
        statusClass = 'over-budget';
    } else if (profPoints.remaining > 0) {
        statusClass = 'has-points';
    } else {
        statusClass = 'no-points';
    }
    
    return `
        <div class="proficiency-editor">
            <div class="prof-header">
                <span class="prof-points-label">Proficiency Points:</span>
                <span class="prof-points-value ${statusClass}">${profPoints.remaining} / ${profPoints.total}</span>
            </div>
            <div class="prof-controls-row">
                <div class="prof-control-box">
                    <button class="prof-btn dec" onclick="window.decreaseMartialProf()" ${profPoints.martial <= 0 ? 'disabled' : ''}>−</button>
                    <div class="prof-box-content">
                        <span class="prof-box-label">MARTIAL</span>
                        <span class="prof-box-value">${profPoints.martial}</span>
                    </div>
                    <button class="prof-btn inc" onclick="window.increaseMartialProf()">+</button>
                </div>
                <div class="prof-control-box">
                    <button class="prof-btn dec" onclick="window.decreasePowerProf()" ${profPoints.power <= 0 ? 'disabled' : ''}>−</button>
                    <div class="prof-box-content">
                        <span class="prof-box-label">POWER</span>
                        <span class="prof-box-value">${profPoints.power}</span>
                    </div>
                    <button class="prof-btn inc" onclick="window.increasePowerProf()">+</button>
                </div>
            </div>
        </div>
    `;
}

export function renderArchetype(charData, calculatedData) {
    const container = document.getElementById('archetype-column');
    container.innerHTML = '';
    
    const isEditMode = window.isEditMode || false;
    const isEditingProficiency = window.isEditingProficiency || false;
    
    // Archetype Proficiency
    const archetypeSection = document.createElement('div');
    archetypeSection.className = 'archetype-section';
    
    // Determine pencil icon color
    const resources = isEditMode ? getCharacterResourceTracking(charData) : null;
    // Three states: over-budget (red), has-points (green), no-points (blue)
    let penClass = 'no-points';
    if (resources) {
        const remaining = resources.proficiencyPoints.remaining;
        if (remaining < 0) {
            penClass = 'over-budget';
        } else if (remaining > 0) {
            penClass = 'has-points';
        } else {
            penClass = 'no-points';
        }
    }
    const proficiencyToggle = isEditMode ? `<span class="edit-section-toggle proficiency-edit-toggle ${penClass}" onclick="window.toggleProficiencyEditor()" title="Edit proficiency allocation">🖉</span>` : '';
    
    // Show editor if editing, otherwise show normal view
    let proficiencyContent = '';
    if (isEditMode && isEditingProficiency) {
        proficiencyContent = renderProficiencyEditor(charData);
    } else {
        proficiencyContent = `
            <div class="archetype-prof">
                <div class="archetype-box">MARTIAL ${charData.mart_prof || 0}</div>
                <div class="archetype-box">POWER ${charData.pow_prof || 0}</div>
            </div>
        `;
    }
    
    archetypeSection.innerHTML = `
        <div class="section-title">ARCHETYPE PROFICIENCY${proficiencyToggle}</div>
        ${proficiencyContent}
    `;
    container.appendChild(archetypeSection);
    
    // Bonuses
    const bonusesSection = document.createElement('div');
    bonusesSection.className = 'bonuses-section';
    bonusesSection.innerHTML = `
        <div class="section-title">BONUSES</div>
        <!-- Removed the bonuses-subtitle line -->
    `;
    
    const bonusesTable = document.createElement('table');
    bonusesTable.innerHTML = `
        <thead>
            <tr>
                <th></th>
                <th>PROF.</th>
                <th>UNPROF.</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="bonus-label">STRENGTH</td>
                <td><button class="bonus-button" onclick="rollAttackBonus('Strength (Prof.)', ${calculatedData.bonuses.strength.prof})">${formatBonus(calculatedData.bonuses.strength.prof)}</button></td>
                <td><button class="bonus-button unprof" onclick="rollAttackBonus('Strength (Unprof.)', ${calculatedData.bonuses.strength.unprof})">${formatBonus(calculatedData.bonuses.strength.unprof)}</button></td>
            </tr>
            <tr>
                <td class="bonus-label">AGILITY</td>
                <td><button class="bonus-button" onclick="rollAttackBonus('Agility (Prof.)', ${calculatedData.bonuses.agility.prof})">${formatBonus(calculatedData.bonuses.agility.prof)}</button></td>
                <td><button class="bonus-button unprof" onclick="rollAttackBonus('Agility (Unprof.)', ${calculatedData.bonuses.agility.unprof})">${formatBonus(calculatedData.bonuses.agility.unprof)}</button></td>
            </tr>
            <tr>
                <td class="bonus-label">ACUITY</td>
                <td><button class="bonus-button" onclick="rollAttackBonus('Acuity (Prof.)', ${calculatedData.bonuses.acuity.prof})">${formatBonus(calculatedData.bonuses.acuity.prof)}</button></td>
                <td><button class="bonus-button unprof" onclick="rollAttackBonus('Acuity (Unprof.)', ${calculatedData.bonuses.acuity.unprof})">${formatBonus(calculatedData.bonuses.acuity.unprof)}</button></td>
            </tr>
            <tr>
                <td class="bonus-label">POWER</td>
                <td><button class="bonus-button" onclick="rollAttackBonus('Power (Prof.)', ${calculatedData.bonuses.power.prof})">${formatBonus(calculatedData.bonuses.power.prof)}</button></td>
                <td><button class="bonus-button unprof" onclick="rollAttackBonus('Power (Unprof.)', ${calculatedData.bonuses.power.unprof})">${formatBonus(calculatedData.bonuses.power.unprof)}</button></td>
            </tr>
        </tbody>
    `;
    
    bonusesSection.appendChild(bonusesTable);
    container.appendChild(bonusesSection);
    
    // Power Potency: 10 + pow_prof + pow_abil
    const powAbil = charData.pow_abil || 'charisma';
    const powAbilValue = charData.abilities?.[powAbil.toLowerCase()] || 0;
    const powerPotency = 10 + (charData.pow_prof || 0) + powAbilValue;
    const potencyDiv = document.createElement('div');
    potencyDiv.className = 'power-potency';
    potencyDiv.textContent = `POWER POTENCY ${powerPotency}`;
    potencyDiv.title = 'Difficulty Score for enemies to resist your powers';
    container.appendChild(potencyDiv);
    
    // Weapons
    renderWeapons(container, charData, calculatedData);
    
    // Armor
    renderArmor(container, charData);
}

function renderWeapons(container, charData, calculatedData) {
    const weaponsSection = document.createElement('div');
    weaponsSection.className = 'weapons-section';
    weaponsSection.innerHTML = '<div class="section-title">WEAPONS</div>';

    const weaponsTable = document.createElement('table');
    weaponsTable.className = 'weapons-table';
    weaponsTable.innerHTML = `
        <thead>
            <tr>
                <th>NAME</th>
                <th>ATTACK</th>
                <th>DAMAGE</th>
                <th>RANGE</th>
            </tr>
        </thead>
        <tbody id="weapons-tbody"></tbody>
    `;

    const tbody = weaponsTable.querySelector('#weapons-tbody');

    // Only show equipped weapons (charData.weapons is [{name, equipped}])
    const equippedWeapons = (charData.weapons || []).filter(w => w.equipped);

    // List of property names to exclude from display
    const EXCLUDED_PROP_NAMES = [
        "Damage Reduction",
        "Split Damage Dice",
        "Range",
        "Shield Base",
        "Armor Base",
        "Weapon Damage"
    ];

    if (equippedWeapons.length > 0) {
        equippedWeapons.forEach(weaponRef => {
            // Get full weapon object from item library
            const weapon = window.getItemFromLibraryByName?.(weaponRef.name);
            if (!weapon) return; // skip if not found

            const properties = weapon.properties || [];
            const propNames = properties.map(p => typeof p === 'string' ? p : (p.name || ''));

            // Determine attack bonus:
            let attackBonus = calculatedData.bonuses.strength.prof;
            if (propNames.includes("Finesse")) {
                attackBonus = calculatedData.bonuses.agility.prof;
            } else if (propNames.includes("Range")) {
                attackBonus = calculatedData.bonuses.acuity.prof;
            }

            // --- Build damage string with bonus and type ---
            let damageStr = '-';
            if (Array.isArray(weapon.damage)) {
                const usable = weapon.damage.filter(d => d && d.amount && d.size && d.type && d.type !== 'none');
                if (usable.length) {
                    damageStr = usable.map(d =>
                        `${d.amount}d${d.size} ${capitalizeDamageType(d.type)}`
                    ).join(', ');
                }
            } else if (typeof weapon.damage === 'string' && weapon.damage.trim() !== '') {
                damageStr = weapon.damage;
            }

            // Try to append bonus (if not already present)
            let displayDamageStr = damageStr;
            if (damageStr !== '-' && damageStr.trim() !== '') {
                if (!/[+-]\d+/.test(damageStr)) {
                    const dmgTypeMatch = damageStr.match(/([a-zA-Z]+)$/);
                    const typeStr = dmgTypeMatch ? ` ${capitalizeDamageType(dmgTypeMatch[1])}` : '';
                    const dicePart = damageStr.replace(/([a-zA-Z]+)$/, '').trim();
                    displayDamageStr = `${dicePart} ${formatBonus(attackBonus)}${typeStr}`.replace(/\s+/, ' ').trim();
                } else {
                    displayDamageStr = damageStr;
                }
            }

            const weaponRow = document.createElement('tr');
            weaponRow.className = 'weapon-row';
            weaponRow.innerHTML = `
                <td class="weapon-name">${weapon.name}</td>
                <td>
                    <button class="bonus-button" onclick="rollAttack('${weapon.name}', ${attackBonus})">${formatBonus(attackBonus)}</button>
                </td>
                <td>
                    <button class="damage-button" onclick="rollDamage('${displayDamageStr}', ${attackBonus})">${displayDamageStr}</button>
                </td>
                <td>${weapon.range || 'Melee'}</td>
            `;
            tbody.appendChild(weaponRow);

            // Show property names below weapon, excluding certain names
            const displayPropNames = propNames.filter(n => n && !EXCLUDED_PROP_NAMES.includes(n));
            if (displayPropNames.length > 0) {
                const propsRow = document.createElement('tr');
                propsRow.className = 'properties-row';
                propsRow.innerHTML = `
                    <td colspan="4">Properties: ${displayPropNames.map(n => `• ${n}`).join(' ')}</td>
                `;
                tbody.appendChild(propsRow);
            }
        });
    }

    // Always show Unarmed Prowess as default
    const unarmedRow = document.createElement('tr');
    unarmedRow.className = 'weapon-row unarmed-row';
    // Use unproficient Strength bonus
    const str = charData.abilities?.strength || 0;
    const martProf = charData.mart_prof || 0;
    // Unproficient bonus: if negative, double it; else ceil(str/2)
    const unprofBonus = str < 0 ? str * 2 : Math.ceil(str / 2);
    // Damage: half strength, rounded up, no dice
    const unarmedDamage = Math.ceil(str / 2);
    unarmedRow.innerHTML = `
        <td class="weapon-name">Unarmed Prowess</td>
        <td><button class="bonus-button" onclick="rollAttack('Unarmed Prowess', ${unprofBonus})">${formatBonus(unprofBonus)}</button></td>
        <td><button class="damage-button" onclick="rollDamage('${unarmedDamage > 0 ? unarmedDamage : 1} Bludgeoning', ${unprofBonus})">${unarmedDamage > 0 ? unarmedDamage : 1} Bludgeoning</button></td>
        <td>Melee</td>
    `;
    tbody.appendChild(unarmedRow);

    weaponsSection.appendChild(weaponsTable);
    container.appendChild(weaponsSection);
}

function renderArmor(container, charData) {
    const armorSection = document.createElement('div');
    armorSection.className = 'armor-section';
    armorSection.innerHTML = '<div class="section-title">ARMOR</div>';
    
    const armorTable = document.createElement('table');
    armorTable.className = 'armor-table';
    armorTable.innerHTML = `
        <thead>
            <tr>
                <th>NAME</th>
                <th>DMG RED.</th>
                <th>CRIT RNG</th>
                <th>ABL REQ.</th>
            </tr>
        </thead>
        <tbody id="armor-tbody"></tbody>
    `;
    
    const tbody = armorTable.querySelector('#armor-tbody');

    // Only show equipped armor (charData.armor is [{name, equipped}])
    // If multiple equipped, show all equipped; if none, show "No armor equipped"
    const equippedArmor = (charData.armor || []).filter(a => a.equipped);

    if (equippedArmor.length > 0) {
        equippedArmor.forEach(armorRef => {
            // Get full armor object from item library
            const armor = window.getItemFromLibraryByName?.(armorRef.name);
            if (!armor) return; // skip if not found

            // Damage Reduction: try to extract from properties, fallback to 0
            let damageReduction = 0;
            if (Array.isArray(armor.properties)) {
                const drProp = armor.properties.find(p => (p && (p.name === 'Damage Reduction')));
                if (drProp) damageReduction = 1 + (drProp.op_1_lvl || 0);
            }
            // Crit Range: look for property or field, fallback to 'N/A'
            let critRange = armor.critRange || 'N/A';
            // Ability Requirement: look for property or field, fallback to 'None'
            let abilityReq = armor.abilityReq || null;

            const armorRow = document.createElement('tr');
            armorRow.className = 'armor-row';
            armorRow.innerHTML = `
                <td class="armor-name">${armor.name}</td>
                <td>${damageReduction}</td>
                <td>${critRange}</td>
                <td>${formatAbilityReq(abilityReq)}</td>
            `;
            tbody.appendChild(armorRow);

            // Show property names below armor, excluding certain names
            if (armor.properties && armor.properties.length > 0) {
                const EXCLUDED_PROP_NAMES = [
                    "Damage Reduction",
                    "Split Damage Dice",
                    "Range",
                    "Shield Base",
                    "Armor Base",
                    "Weapon Damage"
                ];
                const propNames = armor.properties.map(p => typeof p === 'string' ? p : (p.name || ''));
                const displayPropNames = propNames.filter(n => n && !EXCLUDED_PROP_NAMES.includes(n));
                if (displayPropNames.length > 0) {
                    const propsRow = document.createElement('tr');
                    propsRow.className = 'properties-row';
                    propsRow.innerHTML = `
                        <td colspan="4">Properties: ${displayPropNames.map(n => `• ${n}`).join(' ')}</td>
                    `;
                    tbody.appendChild(propsRow);
                }
            }
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:12px;">No armor equipped</td></tr>';
    }
    
    armorSection.appendChild(armorTable);
    container.appendChild(armorSection);
}

function formatAbilityReq(req) {
    if (!req || typeof req !== 'object') return 'None';
    const entries = Object.entries(req);
    if (entries.length === 0) return 'None';
    return entries.map(([ability, value]) => `${value} ${ability.substring(0, 3).toUpperCase()}`).join(', ');
}

// Helper for capitalizing damage type (reuse from inventory.js if needed)
function capitalizeDamageType(type) {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}
