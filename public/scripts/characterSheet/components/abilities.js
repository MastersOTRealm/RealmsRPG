import { formatBonus } from '../utils.js';

const abilityNames = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
const defenseNames = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
const defenseDisplayNames = ['Might', 'Fortitude', 'Reflex', 'Discernment', 'Mental Fort.', 'Resolve'];

export function renderAbilities(charData, calculatedData) {
    const container = document.getElementById('abilities-section');
    container.innerHTML = '';

    const abilitiesWrapper = document.createElement('div');
    abilitiesWrapper.className = 'abilities';

    const abilityOrder = [
        { abil: 'strength', defKey: 'might', label: 'Might' },
        { abil: 'vitality', defKey: 'fortitude', label: 'Fortitude' },
        { abil: 'agility', defKey: 'reflex', label: 'Reflex' },
        { abil: 'acuity', defKey: 'discernment', label: 'Discernment' },
        { abil: 'intelligence', defKey: 'mentalFortitude', label: 'Mental Fort.' },
        { abil: 'charisma', defKey: 'resolve', label: 'Resolve' }
    ];

    abilityOrder.forEach(entry => {
        const abilVal = charData.abilities?.[entry.abil] || 0;
        const defVal = charData.defenseVals?.[entry.defKey] || 0;
        const defenseBonus = abilVal + defVal;
        const defenseScore = defenseBonus + 10;

        const div = document.createElement('div');
        div.className = 'ability';
        div.innerHTML = `
            <div class="ability-name">${entry.abil}</div>
            <button class="ability-mod" onclick="rollAbility('${entry.abil}', ${abilVal})">${formatBonus(abilVal)}</button>
            <div class="sub-ability">
                <div class="sub-ability-title">${entry.label}</div>
                <div class="sub-ability-label">SCORE</div>
                <div class="sub-ability-score">${defenseScore}</div>
                <div class="sub-ability-label">BONUS</div>
                <button class="sub-ability-bonus" onclick="rollDefense('${entry.label}', ${defenseBonus})">${formatBonus(defenseBonus)}</button>
            </div>
        `;
        abilitiesWrapper.appendChild(div);
    });

    container.appendChild(abilitiesWrapper);
}
