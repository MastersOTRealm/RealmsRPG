import { formatBonus } from '../utils.js';
import { getCharacterResourceTracking } from '../validation.js';

/**
 * Renders the health-energy allocation controls for edit mode
 * @param {object} charData - Character data
 * @param {object} calculatedData - Calculated data including max health/energy
 * @returns {string} HTML string for health-energy editor
 */
function renderHealthEnergyEditor(charData, calculatedData) {
    try {
        const resources = getCharacterResourceTracking(charData);
        
        if (!resources || !resources.healthEnergyPoints) {
            console.error('[Health-Energy Editor] Missing resource tracking data:', resources);
            return '';
        }
        
        const healthAlloc = resources.healthEnergyPoints.health || 0;
        const energyAlloc = resources.healthEnergyPoints.energy || 0;
        const remaining = resources.healthEnergyPoints.remaining || 0;
        
        const isExpanded = window.isEditingHealthEnergy || false;
        const expandedClass = isExpanded ? ' expanded' : '';

        return `
            <div id="health-energy-editor" class="health-energy-editor${expandedClass}">
                <div class="he-header">
                    <span class="he-title">Health-Energy Points</span>
                    <span class="he-remaining ${remaining < 0 ? 'over-budget' : ''}">${remaining} remaining</span>
                </div>
                <div class="he-controls">
                    <div class="he-control-group">
                        <span class="he-label">Health (+${healthAlloc})</span>
                        <div class="he-buttons">
                            <button class="he-btn dec" onclick="window.decreaseHealthAllocation()" ${healthAlloc <= 0 ? 'disabled' : ''}>−</button>
                            <span class="he-value">${healthAlloc}</span>
                            <button class="he-btn inc" onclick="window.increaseHealthAllocation()" ${remaining <= 0 ? 'disabled' : ''}>+</button>
                        </div>
                        <span class="he-max">Max HP: ${calculatedData.healthEnergy.maxHealth}</span>
                    </div>
                    <div class="he-control-group">
                        <span class="he-label">Energy (+${energyAlloc})</span>
                        <div class="he-buttons">
                            <button class="he-btn dec" onclick="window.decreaseEnergyAllocation()" ${energyAlloc <= 0 ? 'disabled' : ''}>−</button>
                            <span class="he-value">${energyAlloc}</span>
                            <button class="he-btn inc" onclick="window.increaseEnergyAllocation()" ${remaining <= 0 ? 'disabled' : ''}>+</button>
                        </div>
                        <span class="he-max">Max EP: ${calculatedData.healthEnergy.maxEnergy}</span>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[Health-Energy Editor] Error rendering:', error);
        return '';
    }
}

export function renderHeader(charData, calculatedData) {
    const container = document.getElementById('header-section');
    container.innerHTML = '';
    
    const isEditMode = window.isEditMode || false;
    
    const currentHealth = charData.currentHealth ?? calculatedData.healthEnergy.maxHealth;
    const currentEnergy = charData.currentEnergy ?? calculatedData.healthEnergy.maxEnergy;
    const terminal = Math.ceil(calculatedData.healthEnergy.maxHealth / 4);
    
    // Gender symbol
    const genderSymbol = charData.gender === 'female' ? '♀' : 
                        charData.gender === 'male' ? '♂' : '';
    
    // Build health-energy editor HTML if in edit mode
    const healthEnergyEditorHtml = isEditMode ? renderHealthEnergyEditor(charData, calculatedData) : '';
    
    // Determine pencil icon color based on remaining points
    const resources = isEditMode ? getCharacterResourceTracking(charData) : null;
    const hasPoints = resources && resources.healthEnergyPoints && resources.healthEnergyPoints.remaining > 0;
    const penClass = hasPoints ? 'has-points' : 'no-points';
    const healthEnergyToggle = isEditMode ? `<span class="edit-section-toggle resources-edit-toggle ${penClass}" onclick="window.toggleHealthEnergyEditor()" title="Edit Health/Energy allocation">🖉</span>` : '';
    
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
        <div class="header-left">
            <div class="portrait" style="background-image: url('${charData.portrait || '/assets/placeholder-portrait.jpg'}');">
                ${!charData.portrait ? '<div class="portrait-placeholder">📷</div>' : ''}
            </div>
            <div class="character-details">
                <h1 class="name">${genderSymbol ? genderSymbol + ' ' : ''}${charData.name || 'Unnamed Character'}</h1>
                <div class="race-class">${charData.species || 'Unknown Species'}</div>
                <div class="xp-level">XP: ${charData.xp || 0}</div>
                <div class="xp-level">LEVEL ${charData.level || 1}</div>
            </div>
        </div>
        <div class="header-middle">
            <div class="speed" title="Movement speed in spaces per turn">
                <div class="stat-label">SPEED</div>
                <div class="stat-value">${calculatedData.speed}</div>
            </div>
            <div class="evasion" title="Difficulty to hit with attacks">
                <div class="stat-label">EVASION</div>
                <div class="stat-value">${calculatedData.evasion}</div>
            </div>
        </div>
        <div class="header-right">
            ${healthEnergyEditorHtml}
            <div class="resources-grid">
                ${healthEnergyToggle}
                <div class="resource-section health-section">
                    <div class="bar health-bar">
                        <span class="bar-label">HEALTH</span>
                        <div class="bar-controls">
                            <button onclick="changeHealth(1)" title="Increase health">▲</button>
                            <input type="text" id="currentHealth" value="${currentHealth}" data-max="${calculatedData.healthEnergy.maxHealth}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxHealth}</span>
                            <button onclick="changeHealth(-1)" title="Decrease health">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section energy-section">
                    <div class="bar energy-bar">
                        <span class="bar-label">ENERGY</span>
                        <div class="bar-controls">
                            <button onclick="changeEnergy(1)" title="Increase energy">▲</button>
                            <input type="text" id="currentEnergy" value="${currentEnergy}" data-max="${calculatedData.healthEnergy.maxEnergy}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxEnergy}</span>
                            <button onclick="changeEnergy(-1)" title="Decrease energy">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section terminal-section">
                    <span class="stat-label">TERMINAL</span>
                    <span class="stat-value">${terminal}</span>
                </div>
                <div class="resource-section innate-section">
                    <span class="stat-label">INNATE ENERGY</span>
                    <span class="stat-value">${charData.innateEnergy || 0}</span>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(header);

    const healthInput = document.getElementById('currentHealth');
    const energyInput = document.getElementById('currentEnergy');

    if (healthInput) {
        healthInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = e.target.value.trim();
                const currentVal = parseInt(charData.currentHealth) || 0;
                let newValue;
                if (/^[+]/.test(raw)) newValue = currentVal + (parseInt(raw.substring(1)) || 0);
                else if (/^-/.test(raw)) newValue = currentVal - (parseInt(raw.substring(1)) || 0);
                else newValue = parseInt(raw) || 0;
                e.target.value = newValue;
                charData.currentHealth = newValue;
                window.updateCharacterData?.({ currentHealth: newValue });
                window.updateResourceColors?.();
            }
        });
        healthInput.addEventListener('blur', () => {
            healthInput.value = charData.currentHealth;
            window.updateResourceColors?.();
        });
    }

    if (energyInput) {
        energyInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const raw = e.target.value.trim();
                const currentVal = parseInt(charData.currentEnergy) || 0;
                const maxEnergy = parseInt(e.target.dataset.max) || 0;
                let newValue;
                if (/^[+]/.test(raw)) newValue = currentVal + (parseInt(raw.substring(1)) || 0);
                else if (/^-/.test(raw)) newValue = currentVal - (parseInt(raw.substring(1)) || 0);
                else newValue = parseInt(raw) || 0;
                newValue = Math.max(0, Math.min(maxEnergy, newValue));
                e.target.value = newValue;
                charData.currentEnergy = newValue;
                window.updateCharacterData?.({ currentEnergy: newValue });
                window.updateResourceColors?.();
            }
        });
        energyInput.addEventListener('blur', () => {
            energyInput.value = charData.currentEnergy;
            window.updateResourceColors?.();
        });
    }

    // Initial color state
    window.updateResourceColors?.();

    const isEdit = window.isEditMode;
    // Example for character name:
    let nameHtml = '';
    if (isEdit) {
        nameHtml = `<span class="editable-field" id="name-display">${charData.name}</span>
                    <span class="edit-icon" data-edit="name">🖉</span>`;
    } else {
        nameHtml = `<span>${charData.name}</span>`;
    }

    // Add similar for XP
    let xpHtml = '';
    if (isEdit) {
        xpHtml = `<span class="editable-field" id="xp-display">${charData.xp || 0}</span>
                  <span class="edit-icon" data-edit="xp">🖉</span>`;
    } else {
        xpHtml = `${charData.xp || 0}`;
    }

    // Update the HTML to use nameHtml and xpHtml
    header.innerHTML = `
        <div class="header-left">
            <div class="portrait" style="background-image: url('${charData.portrait || '/assets/placeholder-portrait.jpg'}');">
                ${!charData.portrait ? '<div class="portrait-placeholder">�</div>' : ''}
            </div>
            <div class="character-details">
                <h1 class="name">${genderSymbol ? genderSymbol + ' ' : ''}${nameHtml}</h1>
                <div class="race-class">${charData.species || 'Unknown Species'}</div>
                <div class="xp-level">XP: ${xpHtml}</div>
                <div class="xp-level">LEVEL ${charData.level || 1}</div>
            </div>
        </div>
        <div class="header-middle">
            <div class="speed" title="Movement speed in spaces per turn">
                <div class="stat-label">SPEED</div>
                <div class="stat-value">${calculatedData.speed}</div>
            </div>
            <div class="evasion" title="Difficulty to hit with attacks">
                <div class="stat-label">EVASION</div>
                <div class="stat-value">${calculatedData.evasion}</div>
            </div>
        </div>
        <div class="header-right">
            ${healthEnergyEditorHtml}
            <div class="resources-grid">
                ${healthEnergyToggle}
                <div class="resource-section health-section">
                    <div class="bar health-bar">
                        <span class="bar-label">HEALTH</span>
                        <div class="bar-controls">
                            <button onclick="changeHealth(1)" title="Increase health">▲</button>
                            <input type="text" id="currentHealth" value="${currentHealth}" data-max="${calculatedData.healthEnergy.maxHealth}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxHealth}</span>
                            <button onclick="changeHealth(-1)" title="Decrease health">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section energy-section">
                    <div class="bar energy-bar">
                        <span class="bar-label">ENERGY</span>
                        <div class="bar-controls">
                            <button onclick="changeEnergy(1)" title="Increase energy">▲</button>
                            <input type="text" id="currentEnergy" value="${currentEnergy}" data-max="${calculatedData.healthEnergy.maxEnergy}">
                            <span class="bar-separator">/</span>
                            <span class="bar-max">${calculatedData.healthEnergy.maxEnergy}</span>
                            <button onclick="changeEnergy(-1)" title="Decrease energy">▼</button>
                        </div>
                    </div>
                </div>
                <div class="resource-section terminal-section">
                    <span class="stat-label">TERMINAL</span>
                    <span class="stat-value">${terminal}</span>
                </div>
                <div class="resource-section innate-section">
                    <span class="stat-label">INNATE ENERGY</span>
                    <span class="stat-value">${charData.innateEnergy || 0}</span>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(header);

    // ...existing code for health/energy inputs again (duplicated in original, keeping as is)...

    // Add event listener for edit icon (name):
    if (isEdit) {
        const editIcon = header.querySelector('.edit-icon[data-edit="name"]');
        const displaySpan = header.querySelector('#name-display');
        if (editIcon && displaySpan) {
            editIcon.addEventListener('click', () => {
                // Replace span with input
                const input = document.createElement('input');
                input.type = 'text';
                input.value = charData.name;
                input.className = 'editable-input';
                input.style.border = '1px solid #1a73e8';
                input.style.padding = '2px 4px';
                input.style.borderRadius = '3px';
                input.style.background = '#f0f8ff';

                // Replace display with input
                displaySpan.replaceWith(input);
                input.focus();
                input.select();

                // Handle saving on blur or Enter
                const saveChange = () => {
                    const newValue = input.value.trim();
                    if (newValue && newValue !== charData.name) {
                        charData.name = newValue;
                        window.scheduleAutoSave(); // Trigger save
                    }
                    // Replace input back with span and re-render
                    input.replaceWith(displaySpan);
                    displaySpan.textContent = charData.name;
                };

                input.addEventListener('blur', saveChange);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChange();
                    } else if (e.key === 'Escape') {
                        // Cancel: revert without saving
                        input.replaceWith(displaySpan);
                    }
                });
            });
        }
    }

    // Add event listener for XP edit icon:
    if (isEdit) {
        const xpEditIcon = header.querySelector('.edit-icon[data-edit="xp"]');
        const xpDisplaySpan = header.querySelector('#xp-display');
        if (xpEditIcon && xpDisplaySpan) {
            xpEditIcon.addEventListener('click', () => {
                // Replace span with input
                const input = document.createElement('input');
                input.type = 'number';
                input.value = charData.xp || 0;
                input.className = 'editable-input';
                input.style.border = '1px solid #1a73e8';
                input.style.padding = '2px 4px';
                input.style.borderRadius = '3px';
                input.style.background = '#f0f8ff';
                input.min = 0; // Prevent negative XP

                // Replace display with input
                xpDisplaySpan.replaceWith(input);
                input.focus();
                input.select();

                // Handle saving on blur or Enter
                const saveChange = () => {
                    const newValue = parseInt(input.value) || 0;
                    if (newValue !== (charData.xp || 0)) {
                        charData.xp = newValue;
                        window.scheduleAutoSave(); // Trigger save
                    }
                    // Replace input back with span and re-render
                    input.replaceWith(xpDisplaySpan);
                    xpDisplaySpan.textContent = charData.xp || 0;
                };

                input.addEventListener('blur', saveChange);
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        saveChange();
                    } else if (e.key === 'Escape') {
                        // Cancel: revert without saving
                        input.replaceWith(xpDisplaySpan);
                    }
                });
            });
        }
    }

    // ...existing code...
}

function formatArchetype(archetype) {
    if (!archetype) return 'No Archetype';
    if (typeof archetype === 'string') return archetype;
    if (archetype.type === 'powered-martial') {
        return `Powered-Martial (${archetype.powerAbility}/${archetype.martialAbility})`;
    }
    return `${archetype.type || 'Unknown'} (${archetype.ability || 'N/A'})`;
}
