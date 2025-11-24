// Global interaction functions (called from HTML onclick attributes)

function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

window.updateResourceColors = function() {
    const h = document.getElementById('currentHealth');
    const e = document.getElementById('currentEnergy');
    if (h) {
        const hv = parseInt(h.value) || 0;
        h.style.color = hv <= 0 ? 'red' : 'black';
    }
    if (e) {
        const ev = parseInt(e.value) || 0;
        e.style.color = ev <= 0 ? 'red' : 'black';
    }
};

window.changeHealth = function(delta) {
    const input = document.getElementById('currentHealth');
    if (!input) return;
    const current = parseInt(input.value) || 0;
    // Health allowed to exceed max and go below 0
    const newValue = current + delta;
    input.value = newValue;
    const charData = window.currentCharacterData?.();
    if (charData) {
        charData.currentHealth = newValue;
        window.scheduleAutoSave?.();
    }
    window.updateResourceColors();
};

window.changeEnergy = function(delta) {
    const input = document.getElementById('currentEnergy');
    if (!input) return;
    const current = parseInt(input.value) || 0;
    const max = parseInt(input.dataset.max) || 0; // use data-max
    let newValue = current + delta;
    newValue = Math.max(0, Math.min(max, newValue)); // clamp energy
    input.value = newValue;
    const charData = window.currentCharacterData?.();
    if (charData) {
        charData.currentEnergy = newValue;
        window.scheduleAutoSave?.();
    }
    window.updateResourceColors();
};

window.rollSkill = function(skillName, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + bonus;
    
    // Create roll result popup
    const popup = document.createElement('div');
    popup.className = 'roll-popup';
    popup.innerHTML = `
        <div class="roll-content">
            <h3>${skillName}</h3>
            <div class="roll-details">
                <div class="die-result ${roll === 20 ? 'crit-success' : roll === 1 ? 'crit-fail' : ''}">
                    🎲 ${roll}
                </div>
                <div class="bonus-result">${bonus >= 0 ? '+' : ''}${bonus}</div>
                <div class="total-result">= ${total}</div>
            </div>
            ${roll === 20 ? '<p class="crit-message">Critical Success!</p>' : ''}
            ${roll === 1 ? '<p class="crit-message fail">Critical Fail!</p>' : ''}
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
};

window.rollAttack = function(weaponName, attackBonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + attackBonus;
    
    const popup = document.createElement('div');
    popup.className = 'roll-popup';
    popup.innerHTML = `
        <div class="roll-content">
            <h3>${weaponName} Attack</h3>
            <div class="roll-details">
                <div class="die-result ${roll === 20 ? 'crit-success' : roll === 1 ? 'crit-fail' : ''}">
                    🎲 ${roll}
                </div>
                <div class="bonus-result">${attackBonus >= 0 ? '+' : ''}${attackBonus}</div>
                <div class="total-result">= ${total}</div>
            </div>
            ${roll === 20 ? '<p class="crit-message">Critical Hit! Roll damage twice!</p>' : ''}
            ${roll === 1 ? '<p class="crit-message fail">Critical Miss!</p>' : ''}
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
};

window.rollAttackBonus = function(name, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + bonus;
    
    const popup = document.createElement('div');
    popup.className = 'roll-popup';
    popup.innerHTML = `
        <div class="roll-content">
            <h3>${name} Attack Roll</h3>
            <div class="roll-details">
                <div class="die-result ${roll === 20 ? 'crit-success' : roll === 1 ? 'crit-fail' : ''}">
                    🎲 ${roll}
                </div>
                <div class="bonus-result">${bonus >= 0 ? '+' : ''}${bonus}</div>
                <div class="total-result">= ${total}</div>
            </div>
            ${roll === 20 ? '<p class="crit-message">Critical Hit! Double damage!</p>' : ''}
            ${roll === 1 ? '<p class="crit-message fail">Critical Miss!</p>' : ''}
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
};

window.rollDamage = function(damageStr, bonus = 0) {
    // Parse damage string like "2d6", "1d8+2", "1d6 Slashing", "1d6+3 Slashing"
    // Accepts optional bonus as second argument
    let match = damageStr.match(/(\d+)d(\d+)([+-]\d+)?(?:\s+([a-zA-Z]+))?/);
    if (!match) return;

    const [, numDice, dieSize, modifier, dmgType] = match;
    const num = parseInt(numDice);
    const size = parseInt(dieSize);
    const mod = modifier ? parseInt(modifier) : 0;
    const totalBonus = mod + (typeof bonus === 'number' ? bonus : 0);

    let total = totalBonus;
    let rolls = [];
    for (let i = 0; i < num; i++) {
        const roll = Math.floor(Math.random() * size) + 1;
        rolls.push(roll);
        total += roll;
    }

    // Compose the dice roll string
    const diceStr = rolls.map(r => `<span class="die-roll">🎲 ${r}</span>`).join(' + ');
    const bonusStr = totalBonus !== 0
        ? `<span class="modifier bonus-result" style="background:none;padding:0;margin:0 4px;">${totalBonus >= 0 ? '+' : ''}${totalBonus}</span>`
        : '';
    // Modal content styled like d20 rolls
    const popup = document.createElement('div');
    popup.className = 'roll-popup';
    popup.innerHTML = `
        <div class="roll-content">
            <h3>Damage Roll${dmgType ? ` (${dmgType})` : ''}</h3>
            <div class="roll-details">
                ${diceStr}
                ${bonusStr}
                <div class="total-result">= ${total}</div>
            </div>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
};

window.rollAbility = function(abilityName, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + bonus;
    
    const popup = document.createElement('div');
    popup.className = 'roll-popup';
    popup.innerHTML = `
        <div class="roll-content">
            <h3>${abilityName.charAt(0).toUpperCase() + abilityName.slice(1)} Check</h3>
            <div class="roll-details">
                <div class="die-result ${roll === 20 ? 'crit-success' : roll === 1 ? 'crit-fail' : ''}">
                    🎲 ${roll}
                </div>
                <div class="bonus-result">${bonus >= 0 ? '+' : ''}${bonus}</div>
                <div class="total-result">= ${total}</div>
            </div>
            ${roll === 20 ? '<p class="crit-message">Critical Success!</p>' : ''}
            ${roll === 1 ? '<p class="crit-message fail">Critical Fail!</p>' : ''}
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
};

window.rollDefense = function(defenseName, bonus) {
    const roll = Math.floor(Math.random() * 20) + 1;
    const total = roll + bonus;
    
    const popup = document.createElement('div');
    popup.className = 'roll-popup';
    popup.innerHTML = `
        <div class="roll-content">
            <h3>${defenseName} Save</h3>
            <div class="roll-details">
                <div class="die-result ${roll === 20 ? 'crit-success' : roll === 1 ? 'crit-fail' : ''}">
                    🎲 ${roll}
                </div>
                <div class="bonus-result">${bonus >= 0 ? '+' : ''}${bonus}</div>
                <div class="total-result">= ${total}</div>
            </div>
            ${roll === 20 ? '<p class="crit-message">Critical Success!</p>' : ''}
            ${roll === 1 ? '<p class="crit-message fail">Critical Fail!</p>' : ''}
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
};

window.toggleFeat = function(featName) {
    const toggle = event.target;
    toggle.classList.toggle('active');
    
    const charData = window.currentCharacterData();
    if (charData && charData.feats) {
        const feat = charData.feats.find(f => f.name === featName);
        if (feat) {
            feat.active = toggle.classList.contains('active');
            window.scheduleAutoSave();
        }
    }
};

// Handle feat uses
window.changeFeatUses = function(featName, delta) {
    const charData = window.currentCharacterData();
    if (!charData || !charData.feats) return;
    
    // Find the feat in the array
    const feat = charData.feats.find(f => 
        (typeof f === 'string' && f === featName) || 
        (typeof f === 'object' && f.name === featName)
    );
    
    if (!feat) return;
    
    // If feat is a string, convert to object
    if (typeof feat === 'string') {
        const index = charData.feats.indexOf(feat);
        charData.feats[index] = { 
            name: feat, 
            currentUses: (feat.uses || 0) + delta 
        };
    } else {
        // Update uses
        if (feat.currentUses === undefined) {
            feat.currentUses = feat.uses || 0;
        }
        feat.currentUses = Math.max(0, Math.min(feat.uses || 0, feat.currentUses + delta));
    }
    
    // Update display
    const usesSpan = document.getElementById(`uses-${sanitizeId(featName)}`);
    if (usesSpan) {
        const featObj = charData.feats.find(f => 
            (typeof f === 'object' && f.name === featName)
        );
        usesSpan.textContent = featObj?.currentUses ?? 0;
    }
    
    // Trigger auto-save
    window.scheduleAutoSave();
};

// Handle technique usage
window.useTechnique = function(name, energy) {
    const energyInput = document.getElementById('currentEnergy');
    if (!energyInput) return;
    
    const current = parseInt(energyInput.value) || 0;
    if (current < energy) {
        alert(`Not enough energy! Need ${energy}, have ${current}`);
        return;
    }
    
    energyInput.value = current - energy;
    const charData = window.currentCharacterData();
    if (charData) {
        charData.currentEnergy = current - energy;
        window.scheduleAutoSave();
    }
    window.updateResourceColors?.();
};

window.usePower = function(name, energy) {
    window.useTechnique(name, energy); // Same logic
};

// Handle notes save
window.saveNotes = function() {
    const notesTextarea = document.getElementById('character-notes');
    if (!notesTextarea) return;
    
    const charData = window.currentCharacterData();
    if (charData) {
        charData.notes = notesTextarea.value;
        window.scheduleAutoSave();
        
        // Show feedback
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    }
};

// Add CSS for roll popup
const style = document.createElement('style');
style.textContent = `
.roll-popup {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s;
}

.roll-popup.show {
    opacity: 1;
}

.roll-content {
    background: white;
    padding: 32px;
    border-radius: 16px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.roll-content h3 {
    margin: 0 0 20px 0;
    color: var(--primary-dark);
    font-size: 24px;
}

.roll-details {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin: 24px 0;
    font-size: 32px;
    font-weight: 700;
    flex-wrap: wrap;
}

.die-result {
    color: var(--primary-blue);
}

.die-result.crit-success {
    color: var(--success-green);
    animation: pulse 0.5s ease-in-out;
}

.die-result.crit-fail {
    color: var(--danger-red);
    animation: shake 0.5s ease-in-out;
}

.total-result {
    color: var(--primary-dark);
}

.crit-message {
    font-size: 18px;
    font-weight: 700;
    color: var(--success-green);
    margin: 16px 0;
}

.crit-message.fail {
    color: var(--danger-red);
}

.damage-rolls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin: 20px 0;
}

.die-roll {
    font-size: 24px;
    font-weight: 600;
    color: var(--primary-blue);
}

.modifier.bonus-result {
    font-size: 28px;
    font-weight: 700;
    color: var(--primary-dark);
    /* No background, no border, just value */
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 4px;
    display: inline-block;
    vertical-align: middle;
}

.roll-content button {
    background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-dark) 100%);
    color: white;
    border: none;
    padding: 12px 32px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 16px;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
`;
document.head.appendChild(style);
