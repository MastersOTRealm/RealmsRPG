import { initializeFirebase } from './firebase-config.js';
import { getCharacterData, saveCharacterData } from './data.js';
import { calculateDefenses, calculateHealthEnergy, calculateBonuses } from './calculations.js';
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
        if (healthInput) healthInput.value = healthInput.max;
        if (energyInput) energyInput.value = energyInput.max;
        
        // Update character data
        if (currentCharacterData.health_energy_points) {
            currentCharacterData.currentHealth = parseInt(healthInput?.max || 0);
            currentCharacterData.currentEnergy = parseInt(energyInput?.max || 0);
        }
        
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
        
        // Calculate derived values
        const calculatedData = {
            defenses: calculateDefenses(charData.abilities, charData.defenseVals),
            healthEnergy: calculateHealthEnergy(charData.health_energy_points, charData.abilities),
            bonuses: calculateBonuses(charData.mart_prof, charData.pow_prof, charData.abilities)
        };
        
        // Set current health/energy if not already set
        if (charData.currentHealth === undefined) {
            charData.currentHealth = calculatedData.healthEnergy.maxHealth;
        }
        if (charData.currentEnergy === undefined) {
            charData.currentEnergy = calculatedData.healthEnergy.maxEnergy;
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
