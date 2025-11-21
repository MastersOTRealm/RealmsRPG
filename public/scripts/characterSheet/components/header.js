import { formatBonus } from '../utils.js';

export function renderHeader(charData, calculatedData) {
    const container = document.getElementById('header-section');
    container.innerHTML = '';
    
    const currentHealth = charData.currentHealth ?? calculatedData.healthEnergy.maxHealth;
    const currentEnergy = charData.currentEnergy ?? calculatedData.healthEnergy.maxEnergy;
    const terminal = Math.floor(calculatedData.healthEnergy.maxHealth / 3);
    
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
                <div class="race-class">${formatArchetype(charData.archetype)}</div>
                <div class="xp-level">XP: ${charData.xp || 0}</div>
                <div class="xp-level">LEVEL ${charData.level || 1}</div>
            </div>
        </div>
        <div class="stats">
            <div class="stat-row top-row">
                <div class="speed" title="Movement speed in spaces per turn">
                    <span class="icon">→</span> SPEED ${charData.speed || 6}
                </div>
                <div class="evasion" title="Difficulty to hit with attacks">
                    <span class="icon">👣</span> EVASION ${calculatedData.defenses.reflex}
                </div>
            </div>
            <div class="stat-row bars-row">
                <div class="bar health-bar">
                    <span class="bar-label">HEALTH</span>
                    <button onclick="changeHealth(1)" title="Increase health">▲</button>
                    <input type="number" id="currentHealth" value="${currentHealth}" min="0" max="${calculatedData.healthEnergy.maxHealth}" readonly>
                    <span class="bar-separator">/</span>
                    <span class="bar-max">${calculatedData.healthEnergy.maxHealth}</span>
                    <button onclick="changeHealth(-1)" title="Decrease health">▼</button>
                </div>
                <div class="bar energy-bar">
                    <span class="bar-label">ENERGY</span>
                    <button onclick="changeEnergy(1)" title="Increase energy">▲</button>
                    <input type="number" id="currentEnergy" value="${currentEnergy}" min="0" max="${calculatedData.healthEnergy.maxEnergy}" readonly>
                    <span class="bar-separator">/</span>
                    <span class="bar-max">${calculatedData.healthEnergy.maxEnergy}</span>
                    <button onclick="changeEnergy(-1)" title="Decrease energy">▼</button>
                </div>
            </div>
            <div class="terminal-innate">
                <div title="Health threshold for dying condition">TERMINAL ${terminal}</div>
                <div title="Energy from innate powers">INNATE ENERGY ${charData.innateEnergy || 0}</div>
            </div>
        </div>
    `;
    
    container.appendChild(header);
}

function formatArchetype(archetype) {
    if (!archetype) return 'No Archetype';
    if (typeof archetype === 'string') return archetype;
    if (archetype.type === 'powered-martial') {
        return `Powered-Martial (${archetype.powerAbility}/${archetype.martialAbility})`;
    }
    return `${archetype.type || 'Unknown'} (${archetype.ability || 'N/A'})`;
}
