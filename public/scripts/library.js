import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import {
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  formatRange,
  formatDamage as formatItemDamage,
  deriveItemDisplay,
  formatProficiencyChip,
  deriveDamageReductionFromProperties
} from './item_calc.js';
import { calculateTechniqueCosts, computeActionType, formatTechniqueDamage, deriveTechniqueDisplay } from './technique_calc.js';
import {
  calculatePowerCosts, derivePowerDisplay, formatPowerDamage,
  deriveRange, deriveArea, deriveDuration
} from './power_calc.js';

// Cache for database data
let creatureFeatsCache = null;
let powerPartsCache = null;
let techniquePartsCache = null;
let itemPropertiesCache = null;

// Load creature feats from database
async function loadCreatureFeats(database) {
    if (creatureFeatsCache) return creatureFeatsCache;
    try {
        const featsRef = ref(database, 'creature_feats');
        const snapshot = await get(featsRef);
        if (snapshot.exists()) {
            const featsData = snapshot.val();
            // Convert to object keyed by feat name for easy lookup
            creatureFeatsCache = {};
            Object.values(featsData).forEach(feat => {
                if (feat.name) {
                    creatureFeatsCache[feat.name] = feat;
                }
            });
            console.log(`Loaded ${Object.keys(creatureFeatsCache).length} creature feats from database`);
        } else {
            creatureFeatsCache = {};
        }
    } catch (error) {
        console.error('Error loading creature feats:', error);
        creatureFeatsCache = {};
    }
    return creatureFeatsCache;
}

// Helper: Fetch techniques from Realtime Database
async function fetchTechniqueParts(database) {
    if (techniquePartsCache) return techniquePartsCache;
    try {
        const partsRef = ref(database, 'technique_parts');
        const snapshot = await get(partsRef);
        if (snapshot.exists()) {
            techniquePartsCache = Object.values(snapshot.val());
        } else {
            techniquePartsCache = [];
        }
    } catch (error) {
        console.error('Error loading technique parts:', error);
        techniquePartsCache = [];
    }
    return techniquePartsCache;
}

// Helper: Fetch user powers by names
async function fetchUserPowersByNames(db, userId, powerNames) {
    if (!powerNames || powerNames.length === 0) return [];
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
        const powers = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (powerNames.includes(data.name)) {
                powers.push({ ...data, docId: docSnap.id });
            }
        });
        return powers;
    } catch (error) {
        console.error('Error fetching user powers:', error);
        return [];
    }
}

// Helper: Fetch user techniques by names
async function fetchUserTechniquesByNames(db, userId, techniqueNames) {
    if (!techniqueNames || techniqueNames.length === 0) return [];
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'techniqueLibrary'));
        const techniques = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (techniqueNames.includes(data.name)) {
                techniques.push({ ...data, docId: docSnap.id });
            }
        });
        return techniques;
    } catch (error) {
        console.error('Error fetching user techniques:', error);
        return [];
    }
}

// Helper: Fetch user armaments by names
async function fetchUserArmamentsByNames(db, userId, armamentNames) {
    if (!armamentNames || armamentNames.length === 0) return [];
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'itemLibrary'));
        const armaments = [];
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            if (armamentNames.includes(data.name)) {
                armaments.push({ ...data, docId: docSnap.id });
            }
        });
        return armaments;
    } catch (error) {
        console.error('Error fetching user armaments:', error);
        return [];
    }
}

// Add sorting state
let sortState = {
    powers: { col: 'name', dir: 1 },
    techniques: { col: 'name', dir: 1 },
    armaments: { col: 'name', dir: 1 },
    creatures: { col: 'name', dir: 1 }
};

function openTab(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => content.classList.remove("active-tab"));

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));

    document.getElementById(tabName).classList.add("active-tab");
    event.currentTarget.classList.add("active");
}

// Expose the function to the global scope
window.openTab = openTab;

// Helper function for capitalizing strings
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Load properties from Realtime Database
async function loadItemProperties(database) {
    if (itemPropertiesCache) return itemPropertiesCache;
    
    try {
        const propertiesRef = ref(database, 'properties');
        const snapshot = await get(propertiesRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            itemPropertiesCache = Object.entries(data).map(([id, prop]) => ({
                id: id,
                name: prop.name || '',
                description: prop.description || '',
                base_ip: parseFloat(prop.base_ip) || 0,
                base_tp: parseFloat(prop.base_tp) || 0,
                base_c: parseFloat(prop.base_c) || 0,
                op_1_desc: prop.op_1_desc || '',
                op_1_ip: parseFloat(prop.op_1_ip) || 0,
                op_1_tp: parseFloat(prop.op_1_tp) || 0,
                op_1_c: parseFloat(prop.op_1_c) || 0,
                type: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Weapon'
            }));
            console.log(`Loaded ${itemPropertiesCache.length} properties from database`);
            return itemPropertiesCache;
        }
    } catch (error) {
        console.error('Error loading properties:', error);
    }
    return [];
}

// NEW: Fetch power parts from Realtime Database (similar to technique parts)
async function fetchPowerParts(database) {
    if (powerPartsCache) return powerPartsCache;
    
    try {
        const partsRef = ref(database, 'parts');
        const snapshot = await get(partsRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            powerPartsCache = Object.entries(data)
                .filter(([id, part]) => part.type && part.type.toLowerCase() === 'power')
                .map(([id, part]) => ({
                    id: id,
                    name: part.name || '',
                    description: part.description || '',
                    category: part.category || '',
                    base_en: parseFloat(part.base_en) || 0,
                    base_tp: parseFloat(part.base_tp) || 0,
                    op_1_desc: part.op_1_desc || '',
                    op_1_en: parseFloat(part.op_1_en) || 0,
                    op_1_tp: parseFloat(part.op_1_tp) || 0,
                    op_2_desc: part.op_2_desc || '',
                    op_2_en: parseFloat(part.op_2_en) || 0,
                    op_2_tp: parseFloat(part.op_2_tp) || 0,
                    op_3_desc: part.op_3_desc || '',
                    op_3_en: parseFloat(part.op_3_en) || 0,
                    op_3_tp: parseFloat(part.op_3_tp) || 0,
                    type: part.type || 'power',
                    mechanic: part.mechanic === 'true' || part.mechanic === true,
                    percentage: part.percentage === 'true' || part.percentage === true,
                    duration: part.duration === 'true' || part.duration === true
                }));
            console.log(`Loaded ${powerPartsCache.length} power parts from database`);
            return powerPartsCache;
        }
    } catch (error) {
        console.error('Error loading power parts:', error);
    }
    return [];
}

async function showSavedPowers(db, userId) {
    const powersList = document.getElementById('powersList');
    powersList.innerHTML = '';

    const database = getDatabase();
    const powerPartsDb = await fetchPowerParts(database);

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
        let powers = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const power = docSnapshot.data();
            powers.push({ ...power, docId: docSnapshot.id });
        });

        // Sort powers
        sortItems(powers, sortState.powers);

        // Render powers with dynamic calculation
        powers.forEach(power => {
            const card = createPowerCard(power, db, userId, powerPartsDb);
            powersList.appendChild(card);
        });

        if (powers.length === 0) {
            powersList.innerHTML = '<div class="no-results">No saved powers found.</div>';
        }
    } catch (e) {
        console.error('Error fetching saved powers: ', e);
        powersList.innerHTML = '<div class="no-results">Error fetching saved powers</div>';
    }
}

function createPowerCard(power, db, userId, powerPartsDb) {
    const display = derivePowerDisplay(power, powerPartsDb);
    const card = document.createElement('div');
    card.className = 'library-card';

    const header = document.createElement('div');
    header.className = 'library-header';
    header.onclick = () => toggleExpand(card);

    // Use imported formatPowerDamage
    header.innerHTML = `
        <div class="col">${display.name}</div>
        <div class="col">${display.energy}</div>
        <div class="col">${display.actionType}</div>
        <div class="col">${display.duration}</div>
        <div class="col">${display.range}</div>
        <div class="col">${display.area}</div>
        <div class="col">${formatPowerDamage(power.damage)}</div>
        <span class="expand-icon">▼</span>
    `;

    const body = document.createElement('div');
    body.className = 'library-body';

    if (display.description) {
        body.innerHTML += `<div class="library-description">${display.description}</div>`;
    }

    const detailsHTML = `
        <div class="library-details">
            <div class="detail-field">
                <label>Training Points:</label>
                <span>${display.tp}</span>
            </div>
        </div>
    `;
    body.innerHTML += detailsHTML;

    if (power.parts && power.parts.length > 0) {
        body.innerHTML += `
          <h4 style="margin:16px 0 8px;color:var(--primary);">Parts & Proficiencies</h4>
          <div class="library-parts">${display.partChipsHTML}</div>
        `;
    }

    if (display.tpSources.length > 0) {
        const profHTML = `
            <div class="power-summary-proficiencies">
                <h4>Proficiencies:</h4>
                <div>${display.tpSources.map(source => `<p>${source}</p>`).join('')}</div>
            </div>
        `;
        body.innerHTML += profHTML;
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'Delete Power';
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${display.name}?`)) {
            try {
                await deleteDoc(doc(db, 'users', userId, 'library', power.docId));
                card.remove();
            } catch (error) {
                console.error('Error deleting power: ', error);
                alert('Error deleting power');
            }
        }
    };
    body.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    return card;
}

async function showSavedItems(db, userId, database) {
    const armamentsList = document.getElementById('armamentsList');
    armamentsList.innerHTML = '<div class="no-results">Loading items...</div>';

    const propertiesData = await loadItemProperties(database);
    if (!propertiesData || propertiesData.length === 0) {
        armamentsList.innerHTML = '<div class="no-results">Error loading item properties.</div>';
        return;
    }

    armamentsList.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'itemLibrary'));
        let items = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const item = docSnapshot.data();
            const costs = calculateItemCosts(item.properties || [], propertiesData);
            const { currencyCost, rarity } = calculateCurrencyCostAndRarity(costs.totalCurrency, costs.totalIP);
            items.push({
                ...item,
                docId: docSnapshot.id,
                costs,
                currencyCost,
                goldCost: currencyCost, // legacy
                rarity
            });
        });

        if (items.length === 0) {
            armamentsList.innerHTML = '<div class="no-results">No saved items found.</div>';
            return;
        }

        // Sort items
        sortItems(items, sortState.armaments);

        // Render items
        items.forEach(item => {
            const card = createItemCard(item, db, userId, propertiesData);
            armamentsList.appendChild(card);
        });
    } catch (e) {
        console.error('Error fetching saved items: ', e);
        armamentsList.innerHTML = '<div class="no-results">Error fetching saved items</div>';
    }
}

function createItemCard(item, db, userId, propertiesData) {
    const card = document.createElement('div');
    card.className = 'library-card';

    const header = document.createElement('div');
    header.className = 'library-header';
    header.onclick = () => toggleExpand(card);

    const rangeStr = formatRange(item.properties);
    const damageStr = formatItemDamage(item.damage);

    header.innerHTML = `
        <div class="col">${item.name}</div>
        <div class="col">${item.armamentType || 'Weapon'}</div>
        <div class="col">${item.rarity}</div>
        <div class="col">${Math.round(item.currencyCost ?? item.goldCost ?? 0)}</div>
        <div class="col">${Math.round(item.costs.totalTP)}</div>
        <div class="col">${rangeStr}</div>
        <div class="col">${damageStr || '-'}</div>
        <span class="expand-icon">▼</span>
    `;

    const body = document.createElement('div');
    body.className = 'library-body';

    if (item.description) {
        body.innerHTML += `<div class="library-description">${item.description}</div>`;
    }

    const detailsHTML = `
        <div class="library-details">
            <div class="detail-field">
                <label>Item Points:</label>
                <span>${item.costs.totalIP.toFixed(2)}</span>
            </div>
            <div class="detail-field">
                <label>Currency Points:</label>
                <span>${item.costs.totalCurrency.toFixed(2)}</span>
            </div>
        </div>
    `;
    body.innerHTML += detailsHTML;

    if (item.properties && item.properties.length > 0) {
        const partsHTML = `
            <h4 style="margin: 16px 0 8px 0; color: var(--primary);">Properties & Proficiencies</h4>
            <div class="library-parts">
                ${item.properties.map(itemProp => {
                    const property = propertiesData.find(p => p.id === itemProp.id || p.name === itemProp.name);
                    if (property) {
                        const baseTP = Math.round(property.base_tp || 0);
                        const optionLevel = itemProp.op_1_lvl || 0;
                        const optionTP = optionLevel > 0 ? Math.round((property.op_1_tp || 0) * optionLevel) : 0;
                        const totalTP = baseTP + optionTP;
                        
                        let text = property.name;
                        
                        // Add level if it exists
                        if (optionLevel > 0) {
                            text += ` (Level ${optionLevel})`;
                        }
                        
                        // Add TP costs if they exist
                        if (totalTP > 0) {
                            let tpText = ` | TP: ${baseTP}`;
                            if (optionTP > 0) {
                                tpText += ` + ${optionTP}`;
                            }
                            text += tpText;
                        }
                        
                        // Add proficiency-chip class if there's a TP cost
                        const chipClass = totalTP > 0 ? 'part-chip proficiency-chip' : 'part-chip';
                        
                        return `<div class="${chipClass}" title="${property.description}">${text}</div>`;
                    }
                    return '';
                }).join('')}
            </div>
        `;
        body.innerHTML += partsHTML;
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'Delete Item';
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${item.name}?`)) {
            try {
                await deleteDoc(doc(db, 'users', userId, 'itemLibrary', item.docId));
                card.remove();
            } catch (error) {
                console.error('Error deleting item: ', error);
                alert('Error deleting item');
            }
        }
    };
    body.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    return card;
}

async function showSavedTechniques(db, userId) {
    const techniquesList = document.getElementById('techniquesList');
    if (!techniquesList) return;
    techniquesList.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'techniqueLibrary'));
        let techniques = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const technique = docSnapshot.data();
            techniques.push({ ...technique, docId: docSnapshot.id });
        });

        if (techniques.length === 0) {
            techniquesList.innerHTML = '<div class="no-results">No saved techniques found.</div>';
            return;
        }

        // Sort techniques
        sortItems(techniques, sortState.techniques);

        // Load technique parts from Realtime Database for cost calculation
        const database = getDatabase();
        const partsRef = ref(database, 'parts');
        const snapshot = await get(partsRef);
        let techniquePartsDb = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            techniquePartsDb = Object.entries(data)
                .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
                .map(([id, part]) => ({
                    id: id,
                    name: part.name || '',
                    description: part.description || '',
                    category: part.category || '',
                    base_en: parseFloat(part.base_en) || 0,
                    base_tp: parseFloat(part.base_tp) || 0,
                    op_1_desc: part.op_1_desc || '',
                    op_1_en: parseFloat(part.op_1_en) || 0,
                    op_1_tp: parseFloat(part.op_1_tp) || 0,
                    op_2_desc: part.op_2_desc || '',
                    op_2_en: parseFloat(part.op_2_en) || 0,
                    op_2_tp: parseFloat(part.op_2_tp) || 0,
                    op_3_desc: part.op_3_desc || '',
                    op_3_en: parseFloat(part.op_3_en) || 0,
                    op_3_tp: parseFloat(part.op_3_tp) || 0,
                    type: part.type || 'technique',
                    mechanic: part.mechanic === 'true' || part.mechanic === true,
                    percentage: part.percentage === 'true' || part.percentage === true,
                    alt_base_en: parseFloat(part.alt_base_en) || 0,
                    alt_tp: parseFloat(part.alt_tp) || 0,
                    alt_desc: part.alt_desc || ''
                }));
        }

        techniques.forEach(technique => {
            // Always pass an array for technique.parts
            const card = createTechniqueCardDynamic(technique, techniquePartsDb, db, userId);
            techniquesList.appendChild(card);
        });
    } catch (e) {
        console.error('Error fetching saved techniques: ', e);
        techniquesList.innerHTML = '<div class="no-results">Error fetching saved techniques</div>';
    }
}

// --- Technique card with centralized display builder ---
function createTechniqueCardDynamic(technique, techniquePartsDb, db, userId) {
  const partsArr = Array.isArray(technique.parts)
    ? technique.parts.map(p => ({
        name: p.name,
        op_1_lvl: p.op_1_lvl || 0,
        op_2_lvl: p.op_2_lvl || 0,
        op_3_lvl: p.op_3_lvl || 0
      }))
    : [];
  const display = deriveTechniqueDisplay({ ...technique, parts: partsArr }, techniquePartsDb);
  const card = document.createElement('div');
  card.className = 'library-card';
  const header = document.createElement('div');
  header.className = 'library-header technique-header';
  header.style.gridTemplateColumns = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr';
  header.onclick = () => toggleExpand(card);
  header.innerHTML = `
      <div class="col">${display.name}</div>
      <div class="col">${display.energy}</div> <!-- CHANGED: was toFixed(2) -->
      <div class="col">${display.tp}</div>
      <div class="col">${display.actionType}</div>
      <div class="col">${display.weaponName}</div>
      <div class="col">${display.damageStr}</div>
      <span class="expand-icon">▼</span>
  `;
  const body = document.createElement('div');
  body.className = 'library-body';
  if (display.description) {
      body.innerHTML += `<div class="library-description">${display.description}</div>`;
  }
  if (partsArr.length > 0) {
      body.innerHTML += `
          <h4 style="margin:16px 0 8px;color:var(--primary);">Technique Parts & Proficiencies</h4>
          <div class="library-parts">${display.partChipsHTML}</div>
      `;
  }
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-button';
  deleteBtn.textContent = 'Delete Technique';
  deleteBtn.onclick = async (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to delete ${display.name}?`)) {
          try {
              await deleteDoc(doc(db, 'users', userId, 'techniqueLibrary', technique.docId));
              card.remove();
          } catch (error) {
              alert('Error deleting technique');
          }
      }
  };
  body.appendChild(deleteBtn);
  card.appendChild(header);
  card.appendChild(body);
  return card;
}

async function showSavedCreatures(db, userId, database) {
    const creaturesList = document.getElementById('creaturesList');
    if (!creaturesList) return;
    creaturesList.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'creatureLibrary'));
        let creatures = [];
        
        querySnapshot.forEach(docSnap => {
            const creature = docSnap.data();
            creatures.push({ ...creature, docId: docSnap.id });
        });

        if (creatures.length === 0) {
            creaturesList.innerHTML = '<div class="no-results">No saved creatures found.</div>';
            return;
        }

        // Sort creatures
        sortItems(creatures, sortState.creatures);

        // Render creatures (async for database lookups)
        for (const creature of creatures) {
            const card = await createCreatureCard(creature, database, db, userId);
            creaturesList.appendChild(card);
        }
    } catch (e) {
        creaturesList.innerHTML = '<div class="no-results">Error loading creatures.</div>';
        console.error('Error fetching saved creatures: ', e);
    }
}

async function createCreatureCard(creature, database, db, userId) {
    const card = document.createElement('div');
    card.className = 'creature-card';
    
    // Load database data for details
    const creatureFeats = await loadCreatureFeats(database);
    const powerPartsDb = await fetchPowerParts(database);
    const techniquePartsDb = await fetchTechniqueParts(database);
    const itemPropertiesDb = await loadItemProperties(database);
    
    // Fetch full details for powers, techniques, and armaments from user library
    const userPowers = creature.powers ? await fetchUserPowersByNames(db, userId, creature.powers) : [];
    const userTechniques = creature.techniques ? await fetchUserTechniquesByNames(db, userId, creature.techniques) : [];
    const userArmaments = creature.armaments ? await fetchUserArmamentsByNames(db, userId, creature.armaments) : [];
    
    // Separate weapons and armor
    const weapons = userArmaments.filter(a => a.armamentType === 'Weapon');
    const armor = userArmaments.filter(a => a.armamentType === 'Armor' || a.armamentType === 'Shield');

    const ab = creature.abilities || {};
    const df = creature.defenses || {};
    
    function abilityMod(val) {
        if (typeof val === 'number' && val >= 0) return `+${val}`;
        return val ?? '-';
    }

    // Helper to render inline comma-separated lists
    function renderInline(arr) {
        if (!arr || arr.length === 0) return '—';
        return arr.join(', ');
    }

    // Helper to render skills inline
    function renderSkillsInline(skills) {
        if (!skills || skills.length === 0) return '—';
        return skills.map(s => {
            const bonus = s.bonus >= 0 ? `+${s.bonus}` : s.bonus;
            return `${s.name} ${bonus}`;
        }).join(', ');
    }

    // Collapsed header (shows by default)
    const martialProf = creature.martialProficiency || 0;
    const powerProf = creature.powerProficiency || 0;
    
    let proficiencyText = '';
    if (martialProf > 0 || powerProf > 0) {
        const parts = [];
        if (martialProf > 0) parts.push(`Martial +${martialProf}`);
        if (powerProf > 0) parts.push(`Power +${powerProf}`);
        proficiencyText = ` | ${parts.join(', ')}`;
    }
    
    const collapsedHeader = `
        <div class="creature-header" onclick="this.parentElement.classList.toggle('expanded')">
            <div class="creature-header-content">
                <span class="creature-name">${creature.name || 'Unnamed Creature'}</span>
                <span class="creature-info">Level ${creature.level || 1} ${creature.type || 'Unknown Type'}${proficiencyText}</span>
            </div>
            <span class="expand-toggle">▼</span>
        </div>
    `;
    
    // Full stat block (hidden by default, shown when expanded)
    const statblockContent = `
        <div class="creature-statblock-content">
            <div class="statblock-separator"></div>
    `;

    // Core stats section (always visible)
    const coreStats = `
        <div class="statblock-section">
            <div class="statblock-attribute">
                <span class="attr-label">Hit Points</span>
                <span class="attr-value">${creature.hitPoints || 0}</span>
            </div>
            <div class="statblock-attribute">
                <span class="attr-label">Energy</span>
                <span class="attr-value">${creature.energy || 0}</span>
            </div>
        </div>
        <div class="statblock-separator"></div>
    `;

    // Abilities inline
    const abilities = `
        <div class="statblock-section">
            <div class="statblock-abilities">
                <div class="ability-score"><strong>STR</strong> ${abilityMod(ab.strength)}</div>
                <div class="ability-score"><strong>VIT</strong> ${abilityMod(ab.vitality)}</div>
                <div class="ability-score"><strong>AGI</strong> ${abilityMod(ab.agility)}</div>
                <div class="ability-score"><strong>ACU</strong> ${abilityMod(ab.acuity)}</div>
                <div class="ability-score"><strong>INT</strong> ${abilityMod(ab.intelligence)}</div>
                <div class="ability-score"><strong>CHA</strong> ${abilityMod(ab.charisma)}</div>
            </div>
        </div>
        <div class="statblock-separator"></div>
    `;

    // Defenses inline
    const defenses = `
        <div class="statblock-section">
            <div class="statblock-defenses">
                <div><strong>Might</strong> ${df.might ?? '-'}</div>
                <div><strong>Fortitude</strong> ${df.fortitude ?? '-'}</div>
                <div><strong>Reflex</strong> ${df.reflex ?? '-'}</div>
                <div><strong>Discernment</strong> ${df.discernment ?? '-'}</div>
                <div><strong>Mental Fortitude</strong> ${df.mentalFortitude ?? '-'}</div>
                <div><strong>Resolve</strong> ${df.resolve ?? '-'}</div>
            </div>
        </div>
        <div class="statblock-separator"></div>
    `;

    // Compact features section
    let features = '<div class="statblock-section">';
    
    if (creature.senses && creature.senses.length > 0) {
        features += `<div class="statblock-trait"><strong>Senses</strong> ${renderInline(creature.senses)}</div>`;
    }
    if (creature.movement && creature.movement.length > 0) {
        features += `<div class="statblock-trait"><strong>Movement</strong> ${renderInline(creature.movement)}</div>`;
    }
    if (creature.languages && creature.languages.length > 0) {
        features += `<div class="statblock-trait"><strong>Languages</strong> ${renderInline(creature.languages)}</div>`;
    }
    if (creature.skills && creature.skills.length > 0) {
        features += `<div class="statblock-trait"><strong>Skills</strong> ${renderSkillsInline(creature.skills)}</div>`;
    }
    
    const hasRes = creature.resistances && creature.resistances.length > 0;
    const hasImm = creature.immunities && creature.immunities.length > 0;
    const hasWeak = creature.weaknesses && creature.weaknesses.length > 0;
    const hasCondImm = creature.conditionImmunities && creature.conditionImmunities.length > 0;
    
    if (hasRes) {
        features += `<div class="statblock-trait"><strong>Damage Resistances</strong> ${renderInline(creature.resistances)}</div>`;
    }
    if (hasImm) {
        features += `<div class="statblock-trait"><strong>Damage Immunities</strong> ${renderInline(creature.immunities)}</div>`;
    }
    if (hasWeak) {
        features += `<div class="statblock-trait"><strong>Weaknesses</strong> ${renderInline(creature.weaknesses)}</div>`;
    }
    if (hasCondImm) {
        features += `<div class="statblock-trait"><strong>Condition Immunities</strong> ${renderInline(creature.conditionImmunities)}</div>`;
    }
    
    features += '</div>';
    
    if (hasRes || hasImm || hasWeak || hasCondImm || (creature.senses && creature.senses.length) || (creature.movement && creature.movement.length) || (creature.languages && creature.languages.length) || (creature.skills && creature.skills.length)) {
        features += '<div class="statblock-separator"></div>';
    }

    // Expandable sections for feats, powers, techniques, weapons, armor
    let expandableSections = '';
    
    // FEATS - expandable with descriptions from database
    if (creature.feats && creature.feats.length > 0) {
        const featItems = creature.feats.map(featName => {
            const featData = creatureFeats[featName];
            const description = featData?.description || 'No description available.';
            return `
                <div class="statblock-feature-item" onclick="this.classList.toggle('expanded')">
                    <span class="statblock-feature-name">${featName}</span>
                    <div class="statblock-feature-details">
                        <div class="statblock-feature-detail-line">${description}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        expandableSections += `
            <div class="statblock-expandable-section">
                <div class="statblock-expandable-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <strong>Feats</strong> <span class="expand-count">(${creature.feats.length})</span>
                    <span class="expand-toggle">▼</span>
                </div>
                <div class="statblock-expandable-body">
                    ${featItems}
                </div>
            </div>
        `;
    }
    
    // POWERS - expandable with energy, range, area, duration, damage
    if (userPowers.length > 0) {
        const powerItems = userPowers.map(power => {
            const powerCosts = calculatePowerCosts(power.parts || [], powerPartsDb);
            const energyCost = powerCosts.totalEnergy || 0;
            const range = deriveRange(power.parts || []);
            const area = deriveArea(power.parts || []);
            const duration = deriveDuration(power.parts || []);
            const damageDisplay = formatPowerDamage(power.damage);
            const description = power.description || '';
            
            return `
                <div class="statblock-feature-item" onclick="this.classList.toggle('expanded')">
                    <span class="statblock-feature-name">${power.name}</span>
                    <div class="statblock-feature-details">
                        <div class="statblock-feature-detail-line"><strong>Energy:</strong> ${energyCost}</div>
                        ${range ? `<div class="statblock-feature-detail-line"><strong>Range:</strong> ${range}</div>` : ''}
                        ${area ? `<div class="statblock-feature-detail-line"><strong>Area:</strong> ${area}</div>` : ''}
                        ${duration ? `<div class="statblock-feature-detail-line"><strong>Duration:</strong> ${duration}</div>` : ''}
                        ${damageDisplay ? `<div class="statblock-feature-detail-line"><strong>Damage:</strong> ${damageDisplay}</div>` : ''}
                        ${description ? `<div class="statblock-feature-detail-line" style="margin-top: 4px;">${description}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        expandableSections += `
            <div class="statblock-expandable-section">
                <div class="statblock-expandable-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <strong>Powers</strong> <span class="expand-count">(${userPowers.length})</span>
                    <span class="expand-toggle">▼</span>
                </div>
                <div class="statblock-expandable-body">
                    ${powerItems}
                </div>
            </div>
        `;
    }
    
    // TECHNIQUES - expandable with TP, energy, weapon, action type, damage
    if (userTechniques.length > 0) {
        const techniqueItems = userTechniques.map(technique => {
            const costs = calculateTechniqueCosts(technique.mechanics || [], techniquePartsDb);
            const energyCost = costs.totalEnergy || 0;
            const weaponName = technique.weapon?.name || 'Any';
            const actionType = computeActionType(technique.mechanics || []);
            const damageDisplay = formatTechniqueDamage(technique.damage);
            const description = technique.description || '';
            
            return `
                <div class="statblock-feature-item" onclick="this.classList.toggle('expanded')">
                    <span class="statblock-feature-name">${technique.name}</span>
                    <div class="statblock-feature-details">
                        <div class="statblock-feature-detail-line"><strong>Energy:</strong> ${energyCost}</div>
                        <div class="statblock-feature-detail-line"><strong>Weapon:</strong> ${weaponName}</div>
                        <div class="statblock-feature-detail-line"><strong>Action:</strong> ${actionType}</div>
                        ${damageDisplay ? `<div class="statblock-feature-detail-line"><strong>Damage:</strong> ${damageDisplay}</div>` : ''}
                        ${description ? `<div class="statblock-feature-detail-line" style="margin-top: 4px;">${description}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        expandableSections += `
            <div class="statblock-expandable-section">
                <div class="statblock-expandable-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <strong>Techniques</strong> <span class="expand-count">(${userTechniques.length})</span>
                    <span class="expand-toggle">▼</span>
                </div>
                <div class="statblock-expandable-body">
                    ${techniqueItems}
                </div>
            </div>
        `;
    }
    
    // WEAPONS - expandable with range, damage, properties
    if (weapons.length > 0) {
        const weaponItems = weapons.map(weapon => {
            const rangeDisplay = formatRange(weapon.properties) || '—';
            const damageDisplay = formatItemDamage(weapon.damage);
            const propertiesList = weapon.properties ? weapon.properties.map(p => p.name || p).join(', ') : 'None';
            const description = weapon.description || '';
            
            return `
                <div class="statblock-feature-item" onclick="this.classList.toggle('expanded')">
                    <span class="statblock-feature-name">${weapon.name}</span>
                    <div class="statblock-feature-details">
                        <div class="statblock-feature-detail-line"><strong>Range:</strong> ${rangeDisplay}</div>
                        ${damageDisplay ? `<div class="statblock-feature-detail-line"><strong>Damage:</strong> ${damageDisplay}</div>` : ''}
                        <div class="statblock-feature-detail-line"><strong>Properties:</strong> ${propertiesList}</div>
                        ${description ? `<div class="statblock-feature-detail-line" style="margin-top: 4px;">${description}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        expandableSections += `
            <div class="statblock-expandable-section">
                <div class="statblock-expandable-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <strong>Weapons</strong> <span class="expand-count">(${weapons.length})</span>
                    <span class="expand-toggle">▼</span>
                </div>
                <div class="statblock-expandable-body">
                    ${weaponItems}
                </div>
            </div>
        `;
    }
    
    // ARMOR - expandable with damage reduction, description
    if (armor.length > 0) {
        const armorItems = armor.map(armorItem => {
            const damageReduction = deriveDamageReductionFromProperties(armorItem.properties || []);
            const description = armorItem.description || '';
            
            return `
                <div class="statblock-feature-item" onclick="this.classList.toggle('expanded')">
                    <span class="statblock-feature-name">${armorItem.name}</span>
                    <div class="statblock-feature-details">
                        <div class="statblock-feature-detail-line"><strong>Damage Reduction:</strong> ${damageReduction}</div>
                        ${description ? `<div class="statblock-feature-detail-line" style="margin-top: 4px;">${description}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        expandableSections += `
            <div class="statblock-expandable-section">
                <div class="statblock-expandable-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <strong>Armor</strong> <span class="expand-count">(${armor.length})</span>
                    <span class="expand-toggle">▼</span>
                </div>
                <div class="statblock-expandable-body">
                    ${armorItems}
                </div>
            </div>
        `;
    }

    // Description
    let descriptionSection = '';
    if (creature.description) {
        descriptionSection += `
            <div class="statblock-separator"></div>
            <div class="statblock-section">
                <div class="statblock-description">${creature.description}</div>
            </div>
        `;
    }
    
    // Assemble final stat block
    const closingDiv = '</div>'; // Close creature-statblock-content
    card.innerHTML = collapsedHeader + statblockContent + coreStats + abilities + defenses + features + expandableSections + descriptionSection + closingDiv;
    
    return card;
}

// Sorting function
function sortItems(items, state) {
    const { col, dir } = state;
    items.sort((a, b) => {
        let valA = a[col];
        let valB = b[col];
        
        // Handle nested properties
        if (col === 'weapon' && a.weapon) valA = a.weapon.name || '';
        if (col === 'weapon' && b.weapon) valB = b.weapon.name || '';
        
        // Handle undefined/null
        if (valA == null) valA = '';
        if (valB == null) valB = '';
        
        // Numeric comparison
        if (typeof valA === 'number' && typeof valB === 'number') {
            return dir * (valA - valB);
        }
        
        // String comparison
        return dir * String(valA).localeCompare(String(valB));
    });
}

function toggleExpand(card) {
    card.classList.toggle('expanded');
}

// Creature stat block expand/collapse
window.toggleCreatureExpand = function(row) {
    const expanded = row.nextElementSibling;
    if (expanded && expanded.classList.contains('creature-expanded-row')) {
        expanded.style.display = expanded.style.display === 'table-row' ? 'none' : 'table-row';
    }
};

function formatActionType(actionType, reactionChecked) {
    const formattedActionType = capitalize(actionType);
    return reactionChecked ? `${formattedActionType} Reaction` : `${formattedActionType} Action`;
}

function formatDamage(damageArray) {
    return damageArray.map(damage => {
        if (damage.amount && damage.size && damage.type !== 'none') {
            return `${damage.amount}d${damage.size} ${damage.type}`;
        }
        return '';
    }).join('');
}

document.addEventListener('DOMContentLoaded', async function() {
    const response = await fetch('/__/firebase/init.json');
    const firebaseConfig = await response.json();
    firebaseConfig.authDomain = 'realmsroleplaygame.com';
    const app = initializeApp(firebaseConfig);

    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
        isTokenAutoRefreshEnabled: true
    });

    const auth = getAuth(app);
    const db = getFirestore(app);
    const database = getDatabase(app); // Add Realtime Database instance

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is signed in:', user);
            showSavedPowers(db, user.uid);
            showSavedItems(db, user.uid, database); // Pass database instance
            showSavedTechniques(db, user.uid);
            showSavedCreatures(db, user.uid, database);
        } else {
            console.log('No user is signed in');
        }
    });

    // Setup sorting event listeners
    document.querySelectorAll('.sort').forEach(sortBtn => {
        sortBtn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            const col = e.target.closest('.col').dataset.col;
            const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
            
            if (sortState[tab]) {
                sortState[tab] = { col, dir };
                
                // Re-render the appropriate list
                if (tab === 'powers') showSavedPowers(db, auth.currentUser.uid);
                else if (tab === 'techniques') showSavedTechniques(db, auth.currentUser.uid);
                else if (tab === 'armaments') showSavedItems(db, auth.currentUser.uid, database);
                else if (tab === 'creatures') showSavedCreatures(db, auth.currentUser.uid, database);
            }
        });
    });
});
