import { formatBonus } from '../utils.js';

export function renderHeader(charData, calculatedData) {
    const container = document.getElementById('header-section');
    container.innerHTML = '';
    
    const currentHealth = charData.currentHealth ?? calculatedData.healthEnergy.maxHealth;
    const currentEnergy = charData.currentEnergy ?? calculatedData.healthEnergy.maxEnergy;
    const terminal = Math.ceil(calculatedData.healthEnergy.maxHealth / 4);
    
    // Gender symbol
    const genderSymbol = charData.gender === 'female' ? '♀' : 
                        charData.gender === 'male' ? '♂' : '';
    
    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
        <div class="header-left">
            <div class="portrait" style="background-image: url('${charData.portrait || '/assets/placeholder-portrait.jpg'}');">
                ${!charData.portrait ? '<div class="portrait-placeholder">👤</div>' : ''}
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
            <div class="resources-grid">
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
}

function formatArchetype(archetype) {
    if (!archetype) return 'No Archetype';
    if (typeof archetype === 'string') return archetype;
    if (archetype.type === 'powered-martial') {
        return `Powered-Martial (${archetype.powerAbility}/${archetype.martialAbility})`;
    }
    return `${archetype.type || 'Unknown'} (${archetype.ability || 'N/A'})`;
}
