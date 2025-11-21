import { initializeFirebase, waitForAuth } from './firebase-config.js';
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

function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
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

function longRest() {
    if (!currentCharacterData) return;
    
    if (confirm('Take a long rest? This will restore all health and energy to maximum.')) {
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

// NEW: Normalize loaded character (placeholder or Firestore) to expected shape
function normalizeCharacter(raw) {
    const c = raw || {};
    c.feats = Array.isArray(c.feats) ? c.feats : (c.feats || []); // Firestore may store arrays
    c.techniques = Array.isArray(c.techniques) ? c.techniques : (c.techniques || []);
    c.powers = Array.isArray(c.powers) ? c.powers : (c.powers || []);
    c.equipment = Array.isArray(c.equipment) ? c.equipment : (c.equipment || []);
    c.weapons = Array.isArray(c.weapons) ? c.weapons : (c.weapons || []);
    c.armor = Array.isArray(c.armor) ? c.armor : (c.armor || []);
    c.traits = Array.isArray(c.traits) ? c.traits : (c.traits || []);
    c.skills = Array.isArray(c.skills) ? c.skills : (c.skills || []);
    c.subSkills = Array.isArray(c.subSkills) ? c.subSkills : (c.subSkills || []);
    c.defenseVals = c.defenseVals || { might:0, fortitude:0, reflex:0, discernment:0, mentalFortitude:0, resolve:0 };
    c.abilities = c.abilities || { strength:0, vitality:0, agility:0, acuity:0, intelligence:0, charisma:0 };
    c.health_energy_points = c.health_energy_points || { health:0, energy:0 };
    return c;
}

// NEW: Unified loader
async function loadCharacterById(id) {
    if (!id || id === 'placeholder') {
        currentCharacterId = 'placeholder';
        return normalizeCharacter(getPlaceholderCharacter());
    }
    await initializeFirebase();
    const user = await waitForAuth();
    if (!user) throw new Error('Not authenticated – please log in to load your character.');
    currentCharacterId = id.trim();
    console.log('[CharacterSheet] Attempting load: uid=', user.uid, ' docId=', currentCharacterId);
    let attempt = 0;
    while (attempt < 2) {
        try {
            const data = await getCharacterData(currentCharacterId);
            console.log('[CharacterSheet] Loaded character document:', data.id);
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
        const urlParams = new URLSearchParams(window.location.search);
        const characterId = urlParams.get('id');

        // NEW: Use unified loader
        let charData = await loadCharacterById(characterId);
        currentCharacterData = charData;

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

        renderHeader(charData, calculatedData);
        renderAbilities(charData, calculatedData);
        renderSkills(charData);
        renderArchetype(charData, calculatedData);
        renderLibrary(charData);

        loadingOverlay.style.display = 'none';
        characterSheet.style.display = 'block';

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
