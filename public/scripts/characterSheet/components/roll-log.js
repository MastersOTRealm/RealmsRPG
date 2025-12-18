/**
 * Roll Log Component
 * A sticky panel that displays all dice rolls in a DND Beyond-like style
 * Opens from bottom-right corner, tracks up to 20 rolls
 */

const MAX_ROLLS = 20;
let rollLog = [];
let isRollLogOpen = false;
let rollLogElement = null;

/**
 * Initialize the roll log component
 * Creates the toggle button and log container in the DOM
 */
export function initRollLog() {
    if (document.getElementById('roll-log-container')) return;
    
    // Create container that holds button and log panel
    const container = document.createElement('div');
    container.id = 'roll-log-container';
    container.className = 'roll-log-container';
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'roll-log-toggle';
    toggleBtn.className = 'roll-log-toggle';
    toggleBtn.innerHTML = '🎲';
    toggleBtn.title = 'Toggle Roll Log';
    toggleBtn.onclick = toggleRollLog;
    
    // Create log panel
    const logPanel = document.createElement('div');
    logPanel.id = 'roll-log-panel';
    logPanel.className = 'roll-log-panel';
    
    // Header with title and clear button
    const header = document.createElement('div');
    header.className = 'roll-log-header';
    header.innerHTML = `
        <h3>Roll Log</h3>
        <button class="roll-log-clear" title="Clear all rolls" onclick="window.clearRollLog()">🗑️ Clear</button>
    `;
    
    // Scrollable roll list
    const rollList = document.createElement('div');
    rollList.id = 'roll-log-list';
    rollList.className = 'roll-log-list';
    rollList.innerHTML = '<div class="roll-log-empty">No rolls yet. Roll some dice!</div>';
    
    logPanel.appendChild(header);
    logPanel.appendChild(rollList);
    
    container.appendChild(logPanel);
    container.appendChild(toggleBtn);
    
    document.body.appendChild(container);
    rollLogElement = logPanel;
    
    // Expose functions globally
    window.clearRollLog = clearRollLog;
    window.addRoll = addRoll;
    window.toggleRollLog = toggleRollLog;
    window.openRollLog = openRollLog;
}

/**
 * Toggle the roll log panel open/closed
 */
function toggleRollLog() {
    isRollLogOpen = !isRollLogOpen;
    const panel = document.getElementById('roll-log-panel');
    const btn = document.getElementById('roll-log-toggle');
    
    if (isRollLogOpen) {
        panel?.classList.add('open');
        btn?.classList.add('active');
        // Scroll to bottom to show latest roll
        const list = document.getElementById('roll-log-list');
        if (list) list.scrollTop = list.scrollHeight;
    } else {
        panel?.classList.remove('open');
        btn?.classList.remove('active');
    }
}

/**
 * Open the roll log (if not already open)
 */
function openRollLog() {
    if (!isRollLogOpen) {
        toggleRollLog();
    } else {
        // Just scroll to bottom
        const list = document.getElementById('roll-log-list');
        if (list) list.scrollTop = list.scrollHeight;
    }
}

/**
 * Clear all rolls from the log
 */
function clearRollLog() {
    rollLog = [];
    renderRollLog();
}

/**
 * Add a new roll to the log
 * @param {Object} roll - Roll data
 * @param {string} roll.type - Type of roll (skill, attack, damage, ability, defense)
 * @param {string} roll.title - Display title for the roll
 * @param {number} roll.dieResult - The raw die result (for d20 rolls)
 * @param {number} roll.modifier - The modifier added to the roll
 * @param {number} roll.total - The total result
 * @param {boolean} roll.isCritSuccess - Whether it's a natural 20
 * @param {boolean} roll.isCritFail - Whether it's a natural 1
 * @param {Array} roll.diceRolls - Array of individual die results (for damage)
 * @param {string} roll.damageType - Type of damage (for damage rolls)
 * @param {string} roll.critMessage - Custom crit message
 */
function addRoll(roll) {
    const timestamp = new Date();
    rollLog.push({
        ...roll,
        id: Date.now(),
        timestamp
    });
    
    // Keep only last MAX_ROLLS
    if (rollLog.length > MAX_ROLLS) {
        rollLog = rollLog.slice(-MAX_ROLLS);
    }
    
    renderRollLog();
    openRollLog();
}

/**
 * Render the roll log to the DOM
 */
function renderRollLog() {
    const list = document.getElementById('roll-log-list');
    if (!list) return;
    
    if (rollLog.length === 0) {
        list.innerHTML = '<div class="roll-log-empty">No rolls yet. Roll some dice!</div>';
        return;
    }
    
    list.innerHTML = rollLog.map(roll => createRollEntry(roll)).join('');
    
    // Scroll to bottom to show latest roll
    list.scrollTop = list.scrollHeight;
}

/**
 * Create HTML for a single roll entry
 * @param {Object} roll - Roll data
 * @returns {string} HTML string
 */
function createRollEntry(roll) {
    const timeStr = roll.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Determine roll type styling
    let typeClass = 'roll-type-default';
    let typeIcon = '🎲';
    
    switch (roll.type) {
        case 'attack':
            typeClass = 'roll-type-attack';
            typeIcon = '⚔️';
            break;
        case 'damage':
            typeClass = 'roll-type-damage';
            typeIcon = '💥';
            break;
        case 'skill':
            typeClass = 'roll-type-skill';
            typeIcon = '🎯';
            break;
        case 'ability':
            typeClass = 'roll-type-ability';
            typeIcon = '💪';
            break;
        case 'defense':
            typeClass = 'roll-type-defense';
            typeIcon = '🛡️';
            break;
    }
    
    // Handle damage rolls differently
    if (roll.type === 'damage') {
        const diceHTML = roll.diceRolls ? roll.diceRolls.map(r => 
            `<span class="roll-die">${r}</span>`
        ).join(' + ') : '';
        
        const modifierHTML = roll.modifier !== 0 
            ? `<span class="roll-modifier">${roll.modifier >= 0 ? '+' : ''}${roll.modifier}</span>` 
            : '';
        
        return `
            <div class="roll-entry ${typeClass}">
                <div class="roll-entry-header">
                    <span class="roll-icon">${typeIcon}</span>
                    <span class="roll-title">${roll.title}</span>
                    <span class="roll-time">${timeStr}</span>
                </div>
                <div class="roll-entry-body">
                    <div class="roll-dice-container">
                        ${diceHTML}
                        ${modifierHTML}
                    </div>
                    <div class="roll-total damage-total">= ${roll.total}${roll.damageType ? ` <span class="damage-type">${roll.damageType}</span>` : ''}</div>
                </div>
            </div>
        `;
    }
    
    // D20 rolls (skill, attack, ability, defense)
    const dieResultClass = roll.isCritSuccess ? 'crit-success' : (roll.isCritFail ? 'crit-fail' : '');
    const critIndicator = roll.isCritSuccess ? '<span class="crit-indicator success">NAT 20!</span>' : 
                          (roll.isCritFail ? '<span class="crit-indicator fail">NAT 1!</span>' : '');
    
    return `
        <div class="roll-entry ${typeClass} ${dieResultClass ? 'is-crit' : ''}">
            <div class="roll-entry-header">
                <span class="roll-icon">${typeIcon}</span>
                <span class="roll-title">${roll.title}</span>
                <span class="roll-time">${timeStr}</span>
            </div>
            <div class="roll-entry-body">
                <div class="roll-dice-container">
                    <span class="roll-d20 ${dieResultClass}">${roll.dieResult}</span>
                    <span class="roll-modifier">${roll.modifier >= 0 ? '+' : ''}${roll.modifier}</span>
                </div>
                <div class="roll-total">= ${roll.total}</div>
                ${critIndicator}
            </div>
            ${roll.critMessage ? `<div class="roll-crit-message">${roll.critMessage}</div>` : ''}
        </div>
    `;
}

// Export for ES modules
export { addRoll, clearRollLog, toggleRollLog, openRollLog };
