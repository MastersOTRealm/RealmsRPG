import { formatPowerDamage, derivePowerDisplay } from '../../power_calc.js';
import { deriveTechniqueDisplay } from '../../technique_calc.js';
import { deriveItemDisplay } from '../../item_calc.js';
import { createFeatsContent } from './library/feats.js';
import { createTechniquesContent } from './library/techniques.js';
import { createPowersContent } from './library/powers.js';
import { createInventoryContent } from './library/inventory.js';
import { createProficienciesContent } from './library/proficiencies.js';
import { createNotesContent } from './library/notes.js';

// Helper to fetch full objects from user's library (Firestore) and RTDB
async function enrichCharacterLibraryData(charData) {
    const user = window.firebase?.auth?.()?.currentUser;
    const db = window.firebase?.firestore?.();
    if (!user || !db) return charData;

    // --- Powers ---
    let powers = [];
    try {
        const powerPartsDb = await fetchPowerPartsRTDB();
        const powersSnap = await db.collection('users').doc(user.uid).collection('library').get();
        const allPowers = [];
        powersSnap.forEach(docSnap => {
            const p = docSnap.data();
            allPowers.push({ ...p, id: docSnap.id });
        });
        powers = (charData.powers || []).map(entry => {
            const name = typeof entry === 'string' ? entry : (entry.name || '');
            const found = allPowers.find(p => p.name === name);
            if (!found) return null;
            const display = derivePowerDisplay(found, powerPartsDb);
            return { ...found, ...display, partsDb: powerPartsDb };
        }).filter(Boolean);
    } catch { powers = []; }

    // --- Techniques ---
    let techniques = [];
    try {
        const techniquePartsDb = await fetchTechniquePartsRTDB();
        const techSnap = await db.collection('users').doc(user.uid).collection('techniqueLibrary').get();
        const allTechniques = [];
        techSnap.forEach(docSnap => {
            const t = docSnap.data();
            allTechniques.push({ ...t, id: docSnap.id });
        });
        techniques = (charData.techniques || []).map(entry => {
            const name = typeof entry === 'string' ? entry : (entry.name || '');
            const found = allTechniques.find(t => t.name === name);
            if (!found) return null;
            const display = deriveTechniqueDisplay(found, techniquePartsDb);
            return { ...found, ...display, partsDb: techniquePartsDb };
        }).filter(Boolean);
    } catch { techniques = []; }

    // --- Weapons & Armor & Equipment ---
    let weapons = [], armor = [], equipment = [];
    try {
        const itemPropsDb = await fetchItemPropertiesRTDB();
        const itemSnap = await db.collection('users').doc(user.uid).collection('itemLibrary').get();
        const allItems = [];
        itemSnap.forEach(docSnap => {
            const i = docSnap.data();
            allItems.push({ ...i, id: docSnap.id });
        });

        // Weapons
        weapons = (charData.weapons || []).map(entry => {
            const name = typeof entry === 'string' ? entry : (entry.name || '');
            const equipped = typeof entry === 'object' ? !!entry.equipped : false;
            const found = allItems.find(i => i.name === name && (i.armamentType === 'Weapon' || i.armamentType === 'Shield'));
            if (!found) return null;
            const display = deriveItemDisplay(found, itemPropsDb);
            return { ...found, ...display, equipped };
        }).filter(Boolean);

        // Armor
        armor = (charData.armor || []).map(entry => {
            const name = typeof entry === 'string' ? entry : (entry.name || '');
            const equipped = typeof entry === 'object' ? !!entry.equipped : false;
            const found = allItems.find(i => i.name === name && i.armamentType === 'Armor');
            if (!found) return null;
            const display = deriveItemDisplay(found, itemPropsDb);
            return { ...found, ...display, equipped };
        }).filter(Boolean);

        // Equipment (general items) - fetch from RTDB 'items' node
        let rtdbEquipment = [];
        if (window.firebase?.database) {
            const snap = await window.firebase.database().ref('items').once('value');
            const data = snap.val();
            if (data) {
                rtdbEquipment = Object.values(data);
            }
        }
        equipment = (charData.equipment || []).map(entry => {
            const name = typeof entry === 'string' ? entry : (entry.name || '');
            const quantity = typeof entry === 'object' ? (entry.quantity || 1) : 1;
            // Prefer RTDB 'items' node for general equipment
            const found = rtdbEquipment.find(i => i.name === name);
            if (found) {
                // Enrich with display fields
                const display = deriveItemDisplay(found, itemPropsDb);
                return {
                    ...found,
                    quantity,
                    ...display
                };
            }
            // Fallback: try user itemLibrary for general items (no armamentType)
            const foundLib = allItems.find(i => i.name === name && (!i.armamentType || i.armamentType === 'General'));
            if (foundLib) {
                const display = deriveItemDisplay(foundLib, itemPropsDb);
                return {
                    ...foundLib,
                    quantity,
                    ...display
                };
            }
            // Fallback: use entry as-is
            return {
                name,
                description: entry.description || '',
                category: entry.category || 'General',
                currency: entry.currency || 0,
                rarity: entry.rarity || 'Common',
                quantity
            };
        }).filter(Boolean);

    } catch { weapons = []; armor = []; equipment = []; }

    return { ...charData, _powers: powers, _techniques: techniques, _weapons: weapons, _armor: armor, _inventory: { weapons, armor, equipment } };
}

// Helper: fetch power parts from RTDB
async function fetchPowerPartsRTDB() {
    if (!window.firebase?.database) return [];
    const snap = await window.firebase.database().ref('parts').once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'power')
        .map(([id, part]) => ({
            id, name: part.name || '', description: part.description || '',
            base_en: parseFloat(part.base_en) || 0, base_tp: parseFloat(part.base_tp) || 0,
            op_1_en: parseFloat(part.op_1_en) || 0, op_1_tp: parseFloat(part.op_1_tp) || 0,
            op_2_en: parseFloat(part.op_2_en) || 0, op_2_tp: parseFloat(part.op_2_tp) || 0,
            op_3_en: parseFloat(part.op_3_en) || 0, op_3_tp: parseFloat(part.op_3_tp) || 0,
            mechanic: part.mechanic === 'true' || part.mechanic === true,
            percentage: part.percentage === 'true' || part.percentage === true,
            duration: part.duration === 'true' || part.duration === true
        }));
}

// Helper: fetch technique parts from RTDB
async function fetchTechniquePartsRTDB() {
    if (!window.firebase?.database) return [];
    const snap = await window.firebase.database().ref('parts').once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
        .map(([id, part]) => ({
            id, name: part.name || '', description: part.description || '',
            base_en: parseFloat(part.base_en) || 0, base_tp: parseFloat(part.base_tp) || 0,
            op_1_en: parseFloat(part.op_1_en) || 0, op_1_tp: parseFloat(part.op_1_tp) || 0,
            op_2_en: parseFloat(part.op_2_en) || 0, op_2_tp: parseFloat(part.op_2_tp) || 0,
            op_3_en: parseFloat(part.op_3_en) || 0, op_3_tp: parseFloat(part.op_3_tp) || 0,
            mechanic: part.mechanic === 'true' || part.mechanic === true,
            percentage: part.percentage === 'true' || part.percentage === true
        }));
}

// Helper: fetch item properties from RTDB
async function fetchItemPropertiesRTDB() {
    if (!window.firebase?.database) return [];
    const snap = await window.firebase.database().ref('properties').once('value');
    const data = snap.val();
    if (!data) return [];
    return Object.entries(data).map(([id, prop]) => ({
        id, name: prop.name || '', description: prop.description || '',
        base_ip: parseFloat(prop.base_ip) || 0, base_tp: parseFloat(prop.base_tp) || 0, base_c: parseFloat(prop.base_c) || 0,
        op_1_ip: parseFloat(prop.op_1_ip) || 0, op_1_tp: parseFloat(prop.op_1_tp) || 0, op_1_c: parseFloat(prop.op_1_c) || 0,
        type: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Weapon'
    }));
}

export async function renderLibrary(charData) {
    const container = document.getElementById('library-section');
    container.innerHTML = '';

    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabs.innerHTML = `
        <button class="tab active" data-tab="feats">FEATS</button>
        <button class="tab" data-tab="techniques">TECHNIQUES</button>
        <button class="tab" data-tab="powers">POWERS</button>
        <button class="tab" data-tab="inventory">INVENTORY</button>
        <button class="tab" data-tab="proficiencies">PROFICIENCIES</button>
        <button class="tab" data-tab="notes">NOTES</button>
    `;
    container.appendChild(tabs);

    // --- Enrich character data for all tabs ---
    const enriched = await enrichCharacterLibraryData(charData);

    // Use _displayFeats if present, otherwise fallback to feats
    const featsContent = createFeatsContent(enriched._displayFeats || enriched.feats || [], enriched);
    const techniquesContent = createTechniquesContent(enriched._techniques || []);
    const powersContent = createPowersContent(enriched._powers || []);
    // Pass enriched inventory object with weapons, armor, equipment arrays
    const inventoryContent = createInventoryContent(enriched._inventory || {});
    const proficienciesContent = await createProficienciesContent(enriched);
    const notesContent = createNotesContent(enriched.notes || '');

    container.appendChild(featsContent);
    container.appendChild(techniquesContent);
    container.appendChild(powersContent);
    container.appendChild(inventoryContent);
    container.appendChild(proficienciesContent);
    container.appendChild(notesContent);

    // --- Insert currency box above weapons section when inventory tab is active ---
    function showCurrencyBoxIfNeeded() {
        document.querySelectorAll('.inventory-currency-box').forEach(el => el.remove());
        if (inventoryContent.classList.contains('active') && inventoryContent._currencyBox) {
            inventoryContent.insertBefore(inventoryContent._currencyBox, inventoryContent.firstChild);
        }
    }

    // Tab switching
    const tabButtons = tabs.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetTab = button.dataset.tab;
            container.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-content`) {
                    content.classList.add('active');
                }
            });
            showCurrencyBoxIfNeeded();
        });
    });

    showCurrencyBoxIfNeeded();
}

// Shared helper (if needed elsewhere)
export function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}
