import { formatBonus } from '../utils.js';

export function renderArchetype(charData, calculatedData) {
    const container = document.getElementById('archetype-column');
    container.innerHTML = '';
    
    // Archetype Proficiency
    const archetypeSection = document.createElement('div');
    archetypeSection.className = 'archetype-section';
    archetypeSection.innerHTML = `
        <div class="section-title">ARCHETYPE PROFICIENCY</div>
        <div class="archetype-prof">
            <div class="archetype-box">MARTIAL ${charData.mart_prof || 0}</div>
            <div class="archetype-box">POWER ${charData.pow_prof || 0}</div>
        </div>
    `;
    container.appendChild(archetypeSection);
    
    // Bonuses
    const bonusesSection = document.createElement('div');
    bonusesSection.className = 'bonuses-section';
    bonusesSection.innerHTML = `
        <div class="section-title">BONUSES</div>
        <div class="bonuses-subtitle">ATTACK BONUSES</div>
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
    
    // Only show equipped weapons
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
        equippedWeapons.forEach(weapon => {
            const properties = weapon.properties || [];
            // Normalize property names for checks
            const propNames = properties.map(p => typeof p === 'string' ? p : (p.name || ''));

            // Determine attack bonus:
            // 1. Finesse property → Agility (prof)
            // 2. Range property → Acuity (prof)
            // 3. Default → Strength (prof)
            let attackBonus = calculatedData.bonuses.strength.prof;
            if (propNames.includes("Finesse")) {
                attackBonus = calculatedData.bonuses.agility.prof;
            } else if (propNames.includes("Range")) {
                attackBonus = calculatedData.bonuses.acuity.prof;
            }

            const damageStr = weapon.damage || 'N/A';
            
            const weaponRow = document.createElement('tr');
            weaponRow.className = 'weapon-row';
            weaponRow.innerHTML = `
                <td class="weapon-name">${weapon.name}</td>
                <td><button class="bonus-button" onclick="rollAttack('${weapon.name}', ${attackBonus})">${formatBonus(attackBonus)}</button></td>
                <td><button class="damage-button" onclick="rollDamage('${damageStr}')">${damageStr}</button></td>
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
        <td class="weapon-name">UNARMED PROWESS</td>
        <td><button class="bonus-button" onclick="rollAttack('Unarmed Prowess', ${unprofBonus})">${formatBonus(unprofBonus)}</button></td>
        <td><button class="damage-button" onclick="rollDamage('${unarmedDamage > 0 ? unarmedDamage : 1}')">${unarmedDamage > 0 ? unarmedDamage : 1} BLUNT</button></td>
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
    
    if (charData.armor && charData.armor.length > 0) {
        charData.armor.forEach(armor => {
            const armorRow = document.createElement('tr');
            armorRow.className = 'armor-row';
            armorRow.innerHTML = `
                <td class="armor-name">${armor.name}</td>
                <td>${armor.damageReduction || 0}</td>
                <td>${armor.critRange || 'N/A'}</td>
                <td>${formatAbilityReq(armor.abilityReq)}</td>
            `;
            tbody.appendChild(armorRow);
            
            if (armor.properties && armor.properties.length > 0) {
                const propsRow = document.createElement('tr');
                propsRow.className = 'properties-row';
                propsRow.innerHTML = `
                    <td colspan="4">Properties: ${armor.properties.map(p => `• ${p}`).join(' ')}</td>
                `;
                tbody.appendChild(propsRow);
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
