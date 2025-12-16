import { initializeFirebase, waitForAuth } from './firebase-config.js';
import { getCharacterData, saveCharacterData } from './data.js';
import { calculateDefenses, calculateSpeed, calculateEvasion, calculateMaxHealth, calculateMaxEnergy, calculateBonuses } from './calculations.js';
import { renderHeader } from './components/header.js';
import { renderAbilities } from './components/abilities.js';
import { renderSkills } from './components/skills.js';
import { renderArchetype } from './components/archetype.js';
import { renderLibrary } from './components/library.js';
import './interactions.js';
import { showEquipmentModal } from './components/modal.js';
import { enrichCharacterData, normalizeCharacter } from './utils/data-enrichment.js';

// Promise-based initialization guard for async data loading
let _userItemLibraryPromise = null;
window.userItemLibrary = []; // Array of all user's items (full objects)

// Safe getter that returns item from library (synchronous)
// Library should be loaded during enrichCharacterData before any rendering
window.getItemFromLibraryByName = function(name) {
    if (!window.userItemLibrary || !Array.isArray(window.userItemLibrary)) {
        console.warn('[Library] userItemLibrary not yet loaded, returning null for:', name);
        return null;
    }
    return window.userItemLibrary.find(item => item.name === name) || null;
};

// Async version that waits for library to be loaded if necessary
window.waitForItemLibrary = async function() {
    if (_userItemLibraryPromise) {
        try {
            await _userItemLibraryPromise;
        } catch (e) {
            console.warn('[Library] Failed to wait for library init:', e);
        }
    }
    return window.userItemLibrary;
};

// Set the promise when library starts loading
window._setUserItemLibraryPromise = function(promise) {
    _userItemLibraryPromise = promise;
};

let currentCharacterId = null;
let currentCharacterData = null;
let autoSaveTimeout = null;

/**
 * Schedules an auto-save operation after a debounce delay.
 * Includes error handling and user notifications.
 */
function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    if (currentCharacterId === 'placeholder') return;
    
    autoSaveTimeout = setTimeout(async () => {
        if (!currentCharacterId || !currentCharacterData) return;
        
        try {
            // Strip temporary/computed fields before saving
            const dataToSave = cleanForSave(currentCharacterData);
            await saveCharacterData(currentCharacterId, dataToSave);
            showNotification('Character auto-saved', 'success');
        } catch (error) {
            console.error('[Auto-save] Failed:', error);
            showNotification('Auto-save failed - changes not saved', 'error');
            // Retry once after 3 seconds
            setTimeout(async () => {
                try {
                    const dataToSave = cleanForSave(currentCharacterData);
                    await saveCharacterData(currentCharacterId, dataToSave);
                    showNotification('Auto-save retry successful', 'success');
                } catch (retryError) {
                    console.error('[Auto-save] Retry failed:', retryError);
                    showNotification('Auto-save retry failed - please save manually', 'error');
                }
            }, 3000);
        }
    }, 2000); // Auto-save 2 seconds after last change
}

/**
 * Removes temporary and computed fields from character data before saving.
 * @param {object} data - Character data object
 * @returns {object} Cleaned data safe for persistence
 */
function cleanForSave(data) {
    const cleaned = { ...data };
    
    // Remove computed/temporary fields
    delete cleaned._displayFeats;
    delete cleaned._displayPowers;
    delete cleaned._displayTechniques;
    delete cleaned.allTraits;
    delete cleaned.allFeats;
    delete cleaned.allPowers;
    delete cleaned.allTechniques;
    
    // Strip Unarmed Prowess from weapons (it's computed)
    if (Array.isArray(cleaned.weapons)) {
        cleaned.weapons = stripUnarmedProwessFromWeapons(cleaned.weapons);
    }
    
    return cleaned;
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

/**
 * Triggers a long rest, restoring health and energy to maximum.
 */
function longRest() {
    if (!currentCharacterData) return;
    
    if (confirm('Take a long rest? This will restore all health and energy to maximum.')) {
        const healthInput = document.getElementById('currentHealth');
        const energyInput = document.getElementById('currentEnergy');
        
        if (!healthInput || !energyInput) {
            console.warn('[Long Rest] Could not find health/energy inputs');
            return;
        }
        
        const maxHealth = parseInt(healthInput.dataset.max) || 0;
        const maxEnergy = parseInt(energyInput.dataset.max) || 0;
        
        healthInput.value = maxHealth;
        currentCharacterData.currentHealth = maxHealth;
        
        energyInput.value = maxEnergy;
        currentCharacterData.currentEnergy = maxEnergy;
        
        window.updateResourceColors?.();
        scheduleAutoSave();
        showNotification('Long rest completed - all resources restored!', 'success');
    }
}

/**
 * Sanitizes a string to create a valid HTML/CSS ID.
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized ID string with only alphanumeric and underscores
 */
function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Loads and renders a character by ID from Firestore.
 * Handles data enrichment, normalization, and UI rendering.
 * @param {string} id - Character document ID
 * @throws {Error} If character ID is missing or data cannot be loaded
 */
async function loadCharacterById(id) {
    if (!id) {
        throw new Error('No character id provided.');
    }
    await initializeFirebase();
    const user = await waitForAuth();
    if (!user) throw new Error('Not authenticated – please log in to load your character.');
    currentCharacterId = id.trim();
    console.log('[CharacterSheet] Attempting load: uid=', user.uid, ' docId=', currentCharacterId);
    
    let attempt = 0;
    while (attempt < 2) {
        try {
            const rawData = await getCharacterData(currentCharacterId);
            console.log('[CharacterSheet] Loaded character document:', rawData.id);
            
            // Use centralized data enrichment
            const data = await enrichCharacterData(rawData, user.uid);
            
            // DEV SAFEGUARD: Warn if _displayFeats contains traits (should never happen)
            if (Array.isArray(data._displayFeats)) {
                const traitLike = data._displayFeats.find(f => f && (f.flaw || f.characteristic || f.traitType || f.trait_category));
                if (traitLike) {
                    console.warn('[BUG] _displayFeats contains trait-like object:', traitLike);
                }
            }

            return normalizeCharacter(data);
        } catch (e) {
            if (e.message === 'PERMISSION_DENIED') {
                console.warn('[CharacterSheet] Permission denied for path /users/'+user.uid+'/character/'+currentCharacterId);
                if (attempt === 0) {
                    await new Promise(r => setTimeout(r, 400));
                    attempt++;
                    continue;
                }
                throw new Error('Permission denied accessing character. Confirm Firestore rules AND App Check token (page must load ReCaptcha V3).');
            }
            if (e.message === 'Character not found') {
                throw new Error('Character not found. Confirm the id parameter matches the document ID (case-sensitive).');
            }
            throw e;
        }
    }
}

/**
 * Loads all traits from Firebase Realtime Database.
 * Used for enriching feat data with trait information.
 * @returns {Promise<Object>} Object mapping trait IDs to trait data
 */
async function loadTraitsFromDatabase() {
    // Ensure Firebase is initialized and get rtdb
    const { rtdb } = await initializeFirebase();
    const traitsRef = rtdb.ref('traits');
    const snapshot = await traitsRef.once('value');
    const data = snapshot.val();
    if (!data) {
        console.warn('No traits found in database');
        return {};
    }
    return data;
}

// Make functions globally accessible
window.scheduleAutoSave = scheduleAutoSave;
window.currentCharacterData = () => currentCharacterData;
window.updateCharacterData = (updates) => {
    Object.assign(currentCharacterData, updates);
    scheduleAutoSave();
};
// --- PATCH: Expose renderLibrary globally for modal to trigger inventory refresh ---
window.renderLibrary = renderLibrary;

/**
 * Ensures Unarmed Prowess is always present in weapons list for display.
 * Calculates unarmed damage based on character's Strength score.
 * This is for UI display only - Unarmed Prowess is NOT saved to Firestore.
 * @param {Object} charData - Character data object
 * @returns {Array} Weapons array with Unarmed Prowess prepended
 */
function getWeaponsWithUnarmed(charData) {
    if (!charData || !charData.abilities) return [];
    const str = charData.abilities.strength || 0;
    const unarmedDamage = Math.ceil(str / 2);
    // Filter out any existing "Unarmed Prowess" (shouldn't be present, but just in case)
    const weapons = (charData.weapons || []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
    // Insert Unarmed Prowess at the top for display
    return [
        {
            name: 'Unarmed Prowess',
            damage: `${unarmedDamage} Bludgeoning`,
            damageType: 'Bludgeoning',
            range: 'Melee',
        },
        ...weapons
    ];
}

/**
 * Removes Unarmed Prowess from weapons array before saving to Firestore.
 * Unarmed Prowess is dynamically generated and should never be persisted.
 * @param {Array} weapons - Array of weapon objects or strings
 * @returns {Array} Filtered weapons array without Unarmed Prowess
 */
function stripUnarmedProwessFromWeapons(weapons) {
    return (weapons || []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
}

/**
 * Re-renders the archetype column with updated character data.
 * Recalculates all derived stats (defenses, health, energy, bonuses, etc.)
 * Called after equipping/unequipping items or other stat changes.
 * @param {Object} [options={}] - Reserved for future optimization options
 */
window.refreshArchetypeColumn = function(options = {}) {
    if (!currentCharacterData) return;
    
    // Note: weaponsOnly optimization removed due to ES module limitations
    // Always do full render to ensure consistency
    
    // Full recalculation for complete refresh
    let archetypeAbility = null;
    if (currentCharacterData.pow_prof > 0) archetypeAbility = currentCharacterData.pow_abil;
    else if (currentCharacterData.mart_prof > 0) archetypeAbility = currentCharacterData.mart_abil;
    const defensesCalc = calculateDefenses(currentCharacterData.abilities, currentCharacterData.defenseVals);
    const speed = calculateSpeed(currentCharacterData.abilities.agility || 0);
    const evasion = calculateEvasion(currentCharacterData.abilities.agility || 0);
    const maxHealth = calculateMaxHealth(
        currentCharacterData.health_energy_points.health || 0,
        currentCharacterData.abilities.vitality || 0,
        currentCharacterData.level || 1,
        archetypeAbility,
        currentCharacterData.abilities
    );
    const maxEnergy = calculateMaxEnergy(
        currentCharacterData.health_energy_points.energy || 0,
        archetypeAbility,
        currentCharacterData.abilities,
        currentCharacterData.level || 1
    );
    currentCharacterData.defenses = defensesCalc.defenseScores;
    currentCharacterData.defenseBonuses = defensesCalc.defenseBonuses;
    const calculatedData = {
        defenseScores: defensesCalc.defenseScores,
        defenseBonuses: defensesCalc.defenseBonuses,
        healthEnergy: { maxHealth, maxEnergy },
        bonuses: calculateBonuses(
            currentCharacterData.mart_prof,
            currentCharacterData.pow_prof,
            currentCharacterData.abilities,
            currentCharacterData.pow_abil || 'charisma'
        ),
        speed,
        evasion
    };
    // PATCH: Only inject Unarmed Prowess for display
    renderArchetype(
        { ...currentCharacterData, weapons: getWeaponsWithUnarmed(currentCharacterData) },
        calculatedData
    );
};

// Helper for capitalizing damage type
function capitalizeDamageType(type) {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

document.addEventListener('DOMContentLoaded', async () => {
    const loadingOverlay = document.getElementById('loading-overlay');
    const characterSheet = document.getElementById('character-sheet');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');

        // --- Load traits from RTDB before loading/rendering character ---
        const allTraits = await loadTraitsFromDatabase();

        // NEW: Use unified loader
        let charData = await loadCharacterById(characterId);
        currentCharacterData = charData;

        // Attach traits to charData for library feats tab
        charData.allTraits = allTraits;
        // Also expose globally for convenience (optional)
        window.allTraits = allTraits;

        // Determine archetype primary ability
        let archetypeAbility = null;
        if (charData.pow_prof > 0) archetypeAbility = charData.pow_abil;
        else if (charData.mart_prof > 0) archetypeAbility = charData.mart_abil;

        // Derived calculations
        const defensesCalc = calculateDefenses(charData.abilities, charData.defenseVals);
        const speed = calculateSpeed(charData.abilities.agility || 0);
        const evasion = calculateEvasion(charData.abilities.agility || 0);
        const maxHealth = calculateMaxHealth(
            charData.health_energy_points.health || 0,
            charData.abilities.vitality || 0,
            charData.level || 1,
            archetypeAbility,
            charData.abilities
        );
        const maxEnergy = calculateMaxEnergy(
            charData.health_energy_points.energy || 0,
            archetypeAbility,
            charData.abilities,
            charData.level || 1
        );

        charData.defenses = defensesCalc.defenseScores;
        charData.defenseBonuses = defensesCalc.defenseBonuses;

        const calculatedData = {
            defenseScores: defensesCalc.defenseScores,
            defenseBonuses: defensesCalc.defenseBonuses,
            healthEnergy: { maxHealth, maxEnergy },
            bonuses: calculateBonuses(charData.mart_prof, charData.pow_prof, charData.abilities, charData.pow_abil || 'charisma'),
            speed,
            evasion
        };

        if (charData.currentHealth === undefined) charData.currentHealth = maxHealth;
        if (charData.currentEnergy === undefined) charData.currentEnergy = maxEnergy;

        // --- PATCH: Do NOT inject Unarmed Prowess into charData.weapons, only for display ---
        // Instead, pass getWeaponsWithUnarmed(charData) to renderArchetype and renderLibrary

        renderHeader(charData, calculatedData);
        renderAbilities(charData, calculatedData);
        renderSkills(charData);

        // Pass weapons with Unarmed Prowess for archetype column
        renderArchetype({ ...charData, weapons: getWeaponsWithUnarmed(charData) }, calculatedData);

        // For library, you may want to do the same if it displays weapons
        await renderLibrary({ ...charData, weapons: getWeaponsWithUnarmed(charData) });

        loadingOverlay.style.display = 'none';
        characterSheet.style.display = 'block';

        document.getElementById('save-character')?.addEventListener('click', async () => {
            if (currentCharacterId === 'placeholder') {
                showNotification('Cannot save placeholder character', 'error');
                return;
            }
            try {
                const dataToSave = cleanForSave(currentCharacterData);
                await saveCharacterData(currentCharacterId, dataToSave);
                showNotification('Character saved successfully!', 'success');
            } catch (error) {
                showNotification('Error saving character', 'error');
                console.error('[Manual save] Error:', error);
            }
        });

        document.getElementById('long-rest')?.addEventListener('click', longRest);

        window.isEditMode = false;

        document.getElementById('toggle-edit-mode')?.addEventListener('click', () => {
            window.isEditMode = !window.isEditMode;
            document.getElementById('toggle-edit-mode').innerHTML = window.isEditMode ? '<span>✔️</span> Done' : '<span>🖉</span> Edit';
            // Re-render all editable sections
            renderHeader(charData, calculatedData);
            renderAbilities(charData, calculatedData);
            renderSkills(charData);
            renderArchetype({ ...charData, weapons: getWeaponsWithUnarmed(charData) }, calculatedData);
            renderLibrary({ ...charData, weapons: getWeaponsWithUnarmed(charData) });
        });

    } catch (error) {
        console.error('Error loading character:', error);
        const loadingOverlay = document.getElementById('loading-overlay');
        const msg = /Permission denied/i.test(error.message)
            ? 'Permission denied. Ensure rules include /users/{uid}/character/{docId} and App Check is active.'
            : error.message;
        loadingOverlay.innerHTML = `
            <div style="text-align:center;padding:40px;background:white;border-radius:12px;max-width:520px;">
                <h2 style="color:#dc3545;">Error Loading Character</h2>
                <p style="margin:20px 0;color:#6c757d;">${msg}</p>
                <p style="font-size:0.8em;color:#999;">ID: ${currentCharacterId || '(none)'} </p>
                <a href="/characters.html" style="display:inline-block;padding:12px 24px;background:#1a73e8;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Return to Characters</a>
            </div>
        `;
    }
});

window.showEquipmentModal = showEquipmentModal;
window.enrichCharacterData = enrichCharacterData;
window.renderLibrary = renderLibrary;
window.currentCharacterData = () => currentCharacterData;