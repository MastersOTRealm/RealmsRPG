import { initializeFirebase } from './firebase-config.js';
import { getCharacterData, saveCharacterData } from './data.js';
import { calculateDefenses, calculateSpeed, calculateEvasion, calculateMaxHealth, calculateMaxEnergy, calculateBonuses } from './calculations.js';
import { renderHeader } from './components/header.js';
import { renderAbilities } from './components/abilities.js';
import { renderSkills } from './components/skills.js';
import { renderArchetype } from './components/archetype.js';
import { renderLibrary } from './components/library.js';
import { getPlaceholderCharacter } from './placeholder-character.js';
import './interactions.js';

let currentCharacterId = null;
let currentCharacterData = null;
let autoSaveTimeout = null;

// Auto-save functionality
function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    
    // Don't auto-save in placeholder mode
    if (currentCharacterId === 'placeholder') return;
    
    autoSaveTimeout = setTimeout(async () => {
        if (currentCharacterId && currentCharacterData) {
            await saveCharacterData(currentCharacterId, currentCharacterData);
            showNotification('Character auto-saved', 'success');
        }
    }, 2000); // Auto-save 2 seconds after last change
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Long rest functionality
function longRest() {
    if (!currentCharacterData) return;
    
    if (confirm('Take a long rest? This will restore all health and energy to maximum.')) {
        // Restore health and energy
        const healthInput = document.getElementById('currentHealth');
        const energyInput = document.getElementById('currentEnergy');
        
        const maxHealth = parseInt(healthInput?.dataset.max || 0);
        const maxEnergy = parseInt(energyInput?.dataset.max || 0);
        
        if (healthInput) {
            healthInput.value = maxHealth;
            currentCharacterData.currentHealth = maxHealth;
        }
        if (energyInput) {
            energyInput.value = maxEnergy;
            currentCharacterData.currentEnergy = maxEnergy;
        }
        window.updateResourceColors?.();
        scheduleAutoSave();
        showNotification('Long rest completed - all resources restored!', 'success');
    }
}

function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

// Make functions globally accessible
window.scheduleAutoSave = scheduleAutoSave;
window.currentCharacterData = () => currentCharacterData;
window.updateCharacterData = (updates) => {
    Object.assign(currentCharacterData, updates);
    scheduleAutoSave();
};

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const characterSheet = document.getElementById('character-sheet');
    
    try {
        // Get character ID from URL query parameter
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');
        
        let charData;
        
        // Check if using placeholder for testing
        if (characterId === 'placeholder' || !characterId) {
            console.log('Using placeholder character for testing');
            charData = getPlaceholderCharacter();
            currentCharacterId = 'placeholder';
        } else {
            await initializeFirebase();
            currentCharacterId = characterId;
            charData = await getCharacterData(characterId);
        }
        
        currentCharacterData = charData;
        
        // Determine archetype ability for energy calculation
        let archetypeAbility = null;
        if (charData.pow_prof > 0) {
            archetypeAbility = charData.pow_abil;
        } else if (charData.mart_prof > 0) {
            archetypeAbility = charData.mart_abil;
        }
        
        // Calculate derived values
        const defensesCalc = calculateDefenses(charData.abilities, charData.defenseVals);
        const speed = calculateSpeed(charData.abilities?.agility || 0);
        const evasion = calculateEvasion(charData.abilities?.agility || 0);
        const maxHealth = calculateMaxHealth(
            charData.health_energy_points?.health || 0,
            charData.abilities?.vitality || 0,
            charData.level || 1,
            archetypeAbility,
            charData.abilities
        );
        const maxEnergy = calculateMaxEnergy(
            charData.health_energy_points?.energy || 0,
            archetypeAbility,
            charData.abilities,
            charData.level || 1
        );
        
        // Attach to character (optional)
        charData.defenses = defensesCalc.defenseScores;
        charData.defenseBonuses = defensesCalc.defenseBonuses;

        const calculatedData = {
            defenseScores: defensesCalc.defenseScores,
            defenseBonuses: defensesCalc.defenseBonuses,
            healthEnergy: {
                maxHealth,
                maxEnergy
            },
            bonuses: calculateBonuses(charData.mart_prof, charData.pow_prof, charData.abilities, charData.pow_abil || 'charisma'), // Pass power ability
            speed,
            evasion
        };
        
        // Set current health/energy if not already set
        if (charData.currentHealth === undefined) {
            charData.currentHealth = maxHealth;
        }
        if (charData.currentEnergy === undefined) {
            charData.currentEnergy = maxEnergy;
        }
        
        // Render all sections
        renderHeader(charData, calculatedData);
        renderAbilities(charData, calculatedData);
        renderSkills(charData);
        renderArchetype(charData, calculatedData);
        renderLibrary(charData);
        
        // Hide loading, show sheet
        loadingOverlay.style.display = 'none';
        characterSheet.style.display = 'block';
        
        // Setup action buttons
        document.getElementById('save-character')?.addEventListener('click', async () => {
            if (currentCharacterId === 'placeholder') {
                showNotification('Cannot save placeholder character', 'error');
                return;
            }
            try {
                await saveCharacterData(currentCharacterId, currentCharacterData);
                showNotification('Character saved successfully!', 'success');
            } catch (error) {
                showNotification('Error saving character', 'error');
                console.error(error);
            }
        });
        
        document.getElementById('long-rest')?.addEventListener('click', longRest);
        
    } catch (error) {
        console.error('Error loading character:', error);
        loadingOverlay.innerHTML = `
            <div style="text-align:center;padding:40px;background:white;border-radius:12px;max-width:500px;">
                <h2 style="color:#dc3545;">Error Loading Character</h2>
                <p style="margin:20px 0;color:#6c757d;">${error.message}</p>
                <a href="/characters.html" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Return to Characters</a>
            </div>
        `;
    }
});
