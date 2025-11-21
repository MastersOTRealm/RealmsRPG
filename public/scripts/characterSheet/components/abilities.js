import { formatBonus } from '../utils.js';

const abilityNames = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
const defenseNames = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
const defenseDisplayNames = ['Might', 'Fortitude', 'Reflex', 'Discernment', 'Mental Fort.', 'Resolve'];

export function renderAbilities(charData, calculatedData) {
    const container = document.getElementById('abilities-section');
    container.innerHTML = '';
    
    const abilities = document.createElement('div');
    abilities.className = 'abilities';
    
    abilityNames.forEach((ability, index) => {
        const value = charData.abilities[ability] || 0;
        const defense = defenseNames[index];
        const defenseName = defenseDisplayNames[index];
        const defenseValue = calculatedData.defenses[defense];
        
        const abilityDiv = document.createElement('div');
        abilityDiv.className = 'ability';
        abilityDiv.innerHTML = `
            <div class="ability-name">${ability}</div>
            <button class="ability-mod" onclick="rollAbility('${ability}', ${value})">${formatBonus(value)}</button>
            <div class="sub-ability">
                <div class="sub-ability-title">${defenseName}</div>
                <div class="sub-ability-label">SCORE</div>
                <div class="sub-ability-score">${defenseValue}</div>
                <div class="sub-ability-label">BONUS</div>
                <button class="sub-ability-bonus" onclick="rollDefense('${defenseName}', ${value})">${formatBonus(value)}</button>
            </div>
        `;
        
        abilities.appendChild(abilityDiv);
    });
    
    container.appendChild(abilities);
}
