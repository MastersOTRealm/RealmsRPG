import { initializeFirebase, waitForAuth, loadFeatsFromDatabase, loadTechniquePartsFromDatabase, loadPowerPartsFromDatabase, loadEquipmentFromDatabase } from './firebase-config.js';
import { getCharacterData, saveCharacterData } from './data.js';
import { calculateDefenses, calculateSpeed, calculateEvasion, calculateMaxHealth, calculateMaxEnergy, calculateBonuses } from './calculations.js';
import { renderHeader } from './components/header.js';
import { renderAbilities } from './components/abilities.js';
import { renderSkills } from './components/skills.js';
import { renderArchetype } from './components/archetype.js';
import { renderLibrary } from './components/library.js';
import './interactions.js';
import { showEquipmentModal } from './components/modal.js';

window.userItemLibrary = []; // Array of all user's items (full objects)
window.getItemFromLibraryByName = function(name) {
    if (!window.userItemLibrary) return null;
    return window.userItemLibrary.find(item => item.name === name) || null;
};

let currentCharacterId = null;
let currentCharacterData = null;
let autoSaveTimeout = null;

function scheduleAutoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    if (currentCharacterId === 'placeholder') return;
    autoSaveTimeout = setTimeout(async () => {
        if (currentCharacterId && currentCharacterData) {
            // --- STRIP Unarmed Prowess before saving ---
            const dataToSave = { ...currentCharacterData };
            if (Array.isArray(dataToSave.weapons)) {
                dataToSave.weapons = stripUnarmedProwessFromWeapons(dataToSave.weapons);
            }
            await saveCharacterData(currentCharacterId, dataToSave);
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
            const data = await getCharacterData(currentCharacterId);
            console.log('[CharacterSheet] Loaded character document:', data.id);
            
            // Load feats from database and pair with character's feat names
            const allFeats = await loadFeatsFromDatabase();
            const characterFeatNames = Array.isArray(data.feats) ? data.feats : [];
            
            // Pair feat names with full feat data
            const pairedFeats = characterFeatNames.map(featEntry => {
                // Only keep name and currentUses (if present) in the character data
                const featName = typeof featEntry === 'string' ? featEntry : (featEntry.name || '');
                const currentUses = typeof featEntry === 'object' && typeof featEntry.currentUses === 'number'
                    ? featEntry.currentUses
                    : undefined;
                if (!featName) {
                    console.warn('Invalid feat entry:', featEntry);
                    return null;
                }
                const featData = allFeats.find(f => f.name === featName);
                if (featData) {
                    // Only pair for display, do not persist full object
                    return {
                        name: featName,
                        description: featData.description || 'No description',
                        category: featData.char_feat ? 'Character' : 'Archetype',
                        uses: featData.uses_per_rec || 0,
                        recovery: featData.rec_period || 'Full Recovery',
                        currentUses: typeof currentUses === 'number' ? currentUses : featData.uses_per_rec || 0,
                        // --- FIX: include char_feat and state_feat for correct section sorting ---
                        char_feat: !!featData.char_feat,
                        state_feat: !!featData.state_feat
                    };
                }
                // If not found, fallback
                return {
                    name: featName,
                    description: 'No description available',
                    category: 'Character',
                    uses: 0,
                    recovery: 'Full Recovery',
                    currentUses: typeof currentUses === 'number' ? currentUses : 0,
                    char_feat: false,
                    state_feat: false
                };
            }).filter(Boolean);

            // Only keep feat names (and currentUses if needed) in the character data for saving
            data.feats = characterFeatNames.map(featEntry => {
                if (typeof featEntry === 'string') return featEntry;
                if (featEntry && typeof featEntry === 'object' && featEntry.name) {
                    const obj = { name: featEntry.name };
                    if (typeof featEntry.currentUses === 'number') obj.currentUses = featEntry.currentUses;
                    return obj;
                }
                return null;
            }).filter(Boolean);

            // For display, attach the paired feats as a non-persistent property
            // _displayFeats should ONLY contain feats for display, never traits!
            data._displayFeats = pairedFeats;

            // DEV SAFEGUARD: Warn if _displayFeats contains traits (should never happen)
            if (Array.isArray(data._displayFeats)) {
                const traitLike = data._displayFeats.find(f => f && (f.flaw || f.characteristic || f.traitType || f.trait_category));
                if (traitLike) {
                    console.warn('[BUG] _displayFeats contains trait-like object:', traitLike);
                }
            }
            
            // NEW: Load techniques from user's library and pair with character's technique names
            const techniquePartsDb = await loadTechniquePartsFromDatabase();
            const characterTechniqueNames = Array.isArray(data.techniques) ? data.techniques : [];
            
            // Fetch user's technique library from Firestore
            const db = window.firebase.firestore();
            const techniquesRef = db.collection('users').doc(user.uid).collection('techniqueLibrary');
            const techniquesSnapshot = await techniquesRef.get();
            
            const allTechniques = [];
            techniquesSnapshot.forEach(docSnap => {
                const techData = docSnap.data();
                allTechniques.push({
                    id: docSnap.id,
                    name: techData.name,
                    description: techData.description || '',
                    parts: techData.parts || [],
                    weapon: techData.weapon,
                    damage: techData.damage
                });
            });
            
            // Pair technique names with full technique data for display only
            const pairedTechniques = characterTechniqueNames.map(techEntry => {
                const techName = typeof techEntry === 'string' ? techEntry : (techEntry.name || '');
                
                if (!techName) {
                    console.warn('Invalid technique entry:', techEntry);
                    return null;
                }
                
                const techData = allTechniques.find(t => t.name === techName);
                if (techData) {
                    const partsArr = Array.isArray(techData.parts) ? techData.parts.map(p => ({
                        name: p.name,
                        op_1_lvl: p.op_1_lvl || 0,
                        op_2_lvl: p.op_2_lvl || 0,
                        op_3_lvl: p.op_3_lvl || 0
                    })) : [];
                    return import('../technique_calc.js').then(mod => {
                        const display = mod.deriveTechniqueDisplay({ ...techData, parts: partsArr }, techniquePartsDb);
                        return {
                            name: techName,
                            description: display.description,
                            energy: display.energy,
                            actionType: display.actionType,
                            weaponName: display.weaponName,
                            damageStr: display.damageStr,
                            parts: partsArr,
                            partChipsHTML: display.partChipsHTML
                        };
                    });
                }
                
                return {
                    name: techName,
                    description: 'No description available',
                    energy: 0,
                    actionType: 'Basic Action',
                    weaponName: 'Unarmed',
                    damageStr: '',
                    parts: [],
                    partChipsHTML: ''
                };
            }).filter(Boolean);
            data.techniques = await Promise.all(pairedTechniques);
            // Only keep technique names (and minimal state) in character data
            data.techniques = characterTechniqueNames.map(t => typeof t === 'string' ? t : (t.name || '')).filter(Boolean);

            // --- POWERS: Pair names with user's power library and DB parts ---
            const powerPartsDb = await loadPowerPartsFromDatabase();
            const characterPowerNames = Array.isArray(data.powers) ? data.powers : [];
            const dbRef = window.firebase.firestore();
            const userPowersSnap = await dbRef.collection('users').doc(user.uid).collection('library').get();
            const allPowers = [];
            userPowersSnap.forEach(docSnap => {
                const p = docSnap.data();
                allPowers.push({
                    id: docSnap.id,
                    name: p.name,
                    description: p.description || '',
                    parts: Array.isArray(p.parts) ? p.parts : [],
                    damage: p.damage || [],
                    range: p.range,
                    area: p.areaEffect || p.area || '',
                    duration: p.duration || '',
                    actionType: p.actionType
                });
            });
            const pairedPowersPromises = characterPowerNames.map(entry => {
                const powerName = typeof entry === 'string' ? entry : (entry.name || '');
                if (!powerName) return null;
                const found = allPowers.find(p => p.name === powerName);
                if (!found) {
                    return Promise.resolve({
                        name: powerName,
                        description: 'No description available',
                        energy: 0,
                        actionType: 'Basic Action',
                        damageStr: '',
                        area: '',
                        duration: '',
                        partChipsHTML: ''
                    });
                }
                return import('../power_calc.js').then(mod => {
                    const display = mod.derivePowerDisplay(found, powerPartsDb);
                    return {
                        name: display.name,
                        description: display.description,
                        energy: display.energy,
                        actionType: display.actionType,
                        damageStr: display.damage,
                        area: display.area,
                        duration: display.duration,
                        partChipsHTML: display.partChipsHTML
                    };
                });
            }).filter(Boolean);
            data.powers = await Promise.all(pairedPowersPromises);
            // Only keep power names (and minimal state) in character data
            data.powers = characterPowerNames.map(p => typeof p === 'string' ? p : (p.name || '')).filter(Boolean);

            // --- WEAPONS: Pair names with user's item library ---
            const characterWeaponNames = Array.isArray(data.weapons) ? data.weapons : [];
            const weaponsSnap = await dbRef.collection('users').doc(user.uid).collection('itemLibrary').get();
            const allItems = [];
            weaponsSnap.forEach(docSnap => {
                const w = docSnap.data();
                allItems.push({
                    ...w,
                    id: docSnap.id
                });
            });
            // Cache all items globally for this session
            window.userItemLibrary = allItems;
            const pairedWeapons = characterWeaponNames.map(entry => {
                const weaponName = typeof entry === 'string' ? entry : (entry.name || '');
                const equipped = typeof entry === 'object' ? (entry.equipped || false) : false;
                if (!weaponName) return null;
                const found = allItems.find(w => w.name === weaponName && (w.armamentType === 'Weapon' || w.armamentType === 'Shield'));
                if (!found) {
                    return {
                        name: weaponName,
                        damage: '-',
                        damageType: '',
                        range: 'Melee',
                        properties: [],
                        totalBP: 0,
                        currencyCost: 0,
                        rarity: 'Common',
                        equipped: equipped
                    };
                }
                return {
                    ...found,
                    equipped
                };
            }).filter(Boolean);
            data.weapons = pairedWeapons;
            // Only keep weapon names (and equipped state) in character data
            data.weapons = characterWeaponNames.map(w => {
                if (typeof w === 'string') return w;
                if (w && typeof w === 'object' && w.name) {
                    return { name: w.name, equipped: !!w.equipped };
                }
                return null;
            }).filter(Boolean);

            // --- ARMOR: Pair names with user's item library ---
            const characterArmorNames = Array.isArray(data.armor) ? data.armor : [];
            const allArmor = [];
            weaponsSnap.forEach(docSnap => {
                const a = docSnap.data();
                if (a.armamentType === 'Armor') {
                    const drProp = (a.properties || []).find(p => p.name === 'Damage Reduction');
                    const damageReduction = drProp ? (1 + (drProp.op_1_lvl || 0)) : 0;
                    allArmor.push({
                        id: docSnap.id,
                        name: a.name,
                        damageReduction: damageReduction,
                        properties: a.properties || [],
                        totalBP: a.totalBP || a.bp || 0,
                        currencyCost: a.currencyCost || a.goldCost || a.currency || 0,
                        rarity: a.rarity || 'Common',
                        equipped: false
                    });
                }
            });
            const pairedArmor = characterArmorNames.map(entry => {
                const armorName = typeof entry === 'string' ? entry : (entry.name || '');
                const equipped = typeof entry === 'object' ? (entry.equipped || false) : false;
                if (!armorName) return null;
                const found = allArmor.find(a => a.name === armorName);
                if (!found) {
                    return {
                        name: armorName,
                        damageReduction: 0,
                        properties: [],
                        totalBP: 0,
                        currencyCost: 0,
                        rarity: 'Common',
                        equipped: equipped
                    };
                }
                return {
                    ...found,
                    equipped
                };
            }).filter(Boolean);
            data.armor = pairedArmor;
            // Only keep armor names (and equipped state) in character data
            data.armor = characterArmorNames.map(a => {
                if (typeof a === 'string') return a;
                if (a && typeof a === 'object' && a.name) {
                    return { name: a.name, equipped: !!a.equipped };
                }
                return null;
            }).filter(Boolean);

            // --- EQUIPMENT: Pair names with user's equipment library ---
            const allEquipment = await loadEquipmentFromDatabase();
            const characterEquipmentNames = Array.isArray(data.equipment) ? data.equipment : [];
            const pairedEquipment = characterEquipmentNames.map(equipEntry => {
                const equipName = typeof equipEntry === 'string' ? equipEntry : (equipEntry.name || '');
                const quantity = typeof equipEntry === 'object' ? (equipEntry.quantity || 1) : 1;
                if (!equipName) return null;
                const equipData = allEquipment.find(e => e.name === equipName);
                if (equipData) {
                    return {
                        name: equipName,
                        description: equipData.description || 'No description',
                        category: equipData.category || 'General',
                        currency: equipData.currency || 0,
                        rarity: equipData.rarity || 'Common',
                        quantity: quantity
                    };
                }
                return {
                    name: equipName,
                    description: 'No description available',
                    category: 'General',
                    currency: 0,
                    rarity: 'Common',
                    quantity: quantity
                };
            }).filter(Boolean);
            data.equipment = pairedEquipment;
            // Only keep equipment names (and quantity) in character data
            data.equipment = characterEquipmentNames.map(e => {
                if (typeof e === 'string') return e;
                if (e && typeof e === 'object' && e.name) {
                    return { name: e.name, quantity: e.quantity || 1 };
                }
                return null;
            }).filter(Boolean);

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

// --- Load traits from RTDB for use in feats tab ---
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

// Helper to ensure Unarmed Prowess is always present and correct in weapons list (for display only)
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

// Remove Unarmed Prowess from weapons before saving
function stripUnarmedProwessFromWeapons(weapons) {
    return (weapons || []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
}

// Helper to re-render archetype column (e.g., after equipping/unequipping weapons)
window.refreshArchetypeColumn = function() {
    if (!currentCharacterData) return;
    // Recalculate derived data
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
                await saveCharacterData(currentCharacterId, currentCharacterData);
                showNotification('Character saved successfully!', 'success');
            } catch (error) {
                showNotification('Error saving character', 'error');
                console.error(error);
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