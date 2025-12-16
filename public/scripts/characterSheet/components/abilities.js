import { formatBonus } from '../utils.js';
import { 
    getCharacterResourceTracking,
    getAbilityIncreaseCostInfo,
    getAbilityDecreaseInfo,
    ABILITY_CONSTRAINTS
} from '../validation.js';
import { calculateAbilityPoints, calculateAbilityPointsSpent } from '../level-progression.js';

const abilityNames = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
const defenseNames = ['might', 'fortitude', 'reflex', 'discernment', 'mentalFortitude', 'resolve'];
const defenseDisplayNames = ['Might', 'Fortitude', 'Reflex', 'Discernment', 'Mental Fort.', 'Resolve'];

/**
 * Renders the resource tracker bar showing remaining ability points only
 * Health-Energy points are now shown in the header section
 * @param {object} charData - Character data
 * @returns {string} HTML string for resource tracker
 */
function renderResourceTracker(charData) {
    const resources = getCharacterResourceTracking(charData);
    
    return `
        <div class="resource-tracker">
            <div class="resource-item ability-resource">
                <span class="resource-label">Ability Points:</span>
                <span class="resource-value ${resources.abilityPoints.remaining < 0 ? 'over-budget' : ''}">
                    ${resources.abilityPoints.remaining} / ${resources.abilityPoints.total}
                </span>
                <span class="resource-constraint">(Max: ${resources.abilityPoints.maxAbility}, Neg Sum: ${resources.abilityPoints.negativeSum}/${ABILITY_CONSTRAINTS.MAX_NEGATIVE_SUM})</span>
            </div>
        </div>
    `;
}

/**
 * Renders a single ability in edit mode with increment/decrement buttons
 * @param {object} charData - Character data
 * @param {object} entry - Ability entry with name and defense info
 * @returns {string} HTML string for editable ability
 */
function renderEditableAbility(charData, entry) {
    const abilVal = charData.abilities?.[entry.abil] || 0;
    const defVal = charData.defenseVals?.[entry.defKey] || 0;
    const defenseBonus = abilVal + defVal;
    const defenseScore = defenseBonus + 10;
    
    const editInfo = window.getAbilityEditInfo ? window.getAbilityEditInfo(entry.abil) : {
        canIncrease: true,
        canDecrease: true,
        increaseCost: 1,
        decreaseRefund: 1
    };
    
    const costLabel = editInfo.increaseCost > 1 ? `(${editInfo.increaseCost}pts)` : '';
    
    return `
        <div class="ability edit-mode-ability">
            <div class="ability-name">${entry.abil}</div>
            <div class="ability-edit-controls">
                <button class="ability-dec" 
                    onclick="window.decreaseAbility('${entry.abil}')" 
                    ${!editInfo.canDecrease ? 'disabled' : ''}
                    title="${editInfo.decreaseReason || 'Decrease ability'}">−</button>
                <span class="ability-mod-display">${formatBonus(abilVal)}</span>
                <button class="ability-inc" 
                    onclick="window.increaseAbility('${entry.abil}')" 
                    ${!editInfo.canIncrease ? 'disabled' : ''}
                    title="${editInfo.increaseReason || 'Increase ability'} ${costLabel}">+</button>
            </div>
            ${editInfo.increaseCost > 1 ? `<div class="ability-cost-hint">${costLabel}</div>` : ''}
            <div class="sub-ability">
                <div class="sub-ability-title">${entry.label}</div>
                <div class="sub-ability-label">SCORE</div>
                <div class="sub-ability-score">${defenseScore}</div>
                <div class="sub-ability-label">BONUS</div>
                <span class="sub-ability-bonus-display">${formatBonus(defenseBonus)}</span>
            </div>
        </div>
    `;
}

/**
 * Renders a single ability in view mode (original button style)
 * @param {object} charData - Character data
 * @param {object} entry - Ability entry with name and defense info
 * @returns {string} HTML string for view-mode ability
 */
function renderViewAbility(charData, entry) {
    const abilVal = charData.abilities?.[entry.abil] || 0;
    const defVal = charData.defenseVals?.[entry.defKey] || 0;
    const defenseBonus = abilVal + defVal;
    const defenseScore = defenseBonus + 10;
    
    return `
        <div class="ability">
            <div class="ability-name">${entry.abil}</div>
            <button class="ability-mod" onclick="rollAbility('${entry.abil}', ${abilVal})">${formatBonus(abilVal)}</button>
            <div class="sub-ability">
                <div class="sub-ability-title">${entry.label}</div>
                <div class="sub-ability-label">SCORE</div>
                <div class="sub-ability-score">${defenseScore}</div>
                <div class="sub-ability-label">BONUS</div>
                <button class="sub-ability-bonus" onclick="rollDefense('${entry.label}', ${defenseBonus})">${formatBonus(defenseBonus)}</button>
            </div>
        </div>
    `;
}

export function renderAbilities(charData, calculatedData) {
    const container = document.getElementById('abilities-section');
    container.innerHTML = '';
    
    const isEditMode = window.isEditMode || false;
    const isEditingAbilities = window.isEditingAbilities || false;

    const abilityOrder = [
        { abil: 'strength', defKey: 'might', label: 'Might' },
        { abil: 'vitality', defKey: 'fortitude', label: 'Fortitude' },
        { abil: 'agility', defKey: 'reflex', label: 'Reflex' },
        { abil: 'acuity', defKey: 'discernment', label: 'Discernment' },
        { abil: 'intelligence', defKey: 'mentalFortitude', label: 'Mental Fort.' },
        { abil: 'charisma', defKey: 'resolve', label: 'Resolve' }
    ];

    // Add pencil icon in top-right when in edit mode (always visible)
    if (isEditMode) {
        const resources = getCharacterResourceTracking(charData);
        const hasPoints = resources.abilityPoints.remaining > 0;
        const penClass = hasPoints ? 'has-points' : 'no-points';
        const penIcon = `
            <div class="abilities-edit-toggle">
                <span class="edit-section-toggle ${penClass}" onclick="window.toggleAbilitiesEditor()" title="Edit abilities">🖉</span>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', penIcon);
    }

    // Add resource tracker if actively editing abilities
    if (isEditMode && isEditingAbilities) {
        const trackerHtml = renderResourceTracker(charData);
        container.insertAdjacentHTML('beforeend', trackerHtml);
    }

    const abilitiesWrapper = document.createElement('div');
    abilitiesWrapper.className = 'abilities';

    abilityOrder.forEach(entry => {
        // Show editable version only if actively editing abilities
        if (isEditMode && isEditingAbilities) {
            abilitiesWrapper.insertAdjacentHTML('beforeend', renderEditableAbility(charData, entry));
        } else {
            abilitiesWrapper.insertAdjacentHTML('beforeend', renderViewAbility(charData, entry));
        }
    });

    container.appendChild(abilitiesWrapper);
}
