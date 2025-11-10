import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { 
    calculateItemCosts, 
    calculateGoldCostAndRarity, 
    formatRange,
    formatDamage as formatItemDamage
} from '../itemcreator/itemMechanics.js';

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

async function showSavedPowers(db, userId) {
    const powersList = document.getElementById('powersList');
    powersList.innerHTML = '';

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
        let powers = [];
        
        querySnapshot.forEach((docSnapshot) => {
            const power = docSnapshot.data();
            powers.push({ ...power, docId: docSnapshot.id });
        });

        // Sort powers
        sortItems(powers, sortState.powers);

        // Render powers
        powers.forEach(power => {
            const card = createPowerCard(power, db, userId);
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

function createPowerCard(power, db, userId) {
    const card = document.createElement('div');
    card.className = 'library-card';

    const header = document.createElement('div');
    header.className = 'library-header';
    header.onclick = () => toggleExpand(card);

    const energy = Math.ceil(power.totalEnergy) || 1;
    const duration = power.duration ? `${power.duration} ${capitalize(power.durationType)}` : '1 round';
    const areaEffect = power.areaEffect === 'none (1)' ? '1 target' : capitalize(`${power.areaEffect} (${power.areaEffectLevel})`);

    header.innerHTML = `
        <div class="col">${power.name}</div>
        <div class="col">${energy}</div>
        <div class="col">${formatActionType(power.actionType, power.reactionChecked)}</div>
        <div class="col">${duration}</div>
        <div class="col">${power.range}</div>
        <div class="col">${areaEffect}</div>
        <div class="col">${power.targets}</div>
        <span class="expand-icon">▼</span>
    `;

    const body = document.createElement('div');
    body.className = 'library-body';

    if (power.description) {
        body.innerHTML += `<div class="library-description">${power.description}</div>`;
    }

    const detailsHTML = `
        <div class="library-details">
            <div class="detail-field">
                <label>Training Points:</label>
                <span>${power.totalTP}</span>
            </div>
            ${power.focusChecked ? '<div class="detail-field"><label>Focus:</label><span>Required</span></div>' : ''}
            ${power.sustainValue > 0 ? `<div class="detail-field"><label>Sustain:</label><span>${power.sustainValue} AP</span></div>` : ''}
            ${formatDamage(power.damage) ? `<div class="detail-field"><label>Damage:</label><span>${formatDamage(power.damage)}</span></div>` : ''}
        </div>
    `;
    body.innerHTML += detailsHTML;

    if (power.powerParts && power.powerParts.length > 0) {
        const partsHTML = `
            <div class="library-parts">
                ${power.powerParts.sort((a, b) => a.part.localeCompare(b.part)).map(part => {
                    let text = part.part;
                    if (part.opt1Level) text += ` Opt 1: (${part.opt1Level})`;
                    if (part.opt2Level) text += ` Opt 2: (${part.opt2Level})`;
                    if (part.opt3Level) text += ` Opt 3: (${part.opt3Level})`;
                    return `<div class="part-chip">${text}</div>`;
                }).join('')}
            </div>
        `;
        body.innerHTML += partsHTML;
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'Delete Power';
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${power.name}?`)) {
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

// Load properties from Realtime Database
let itemPropertiesCache = null;
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
                base_gp: parseFloat(prop.base_gp) || 0,
                op_1_desc: prop.op_1_desc || '',
                op_1_ip: parseFloat(prop.op_1_ip) || 0,
                op_1_tp: parseFloat(prop.op_1_tp) || 0,
                op_1_gp: parseFloat(prop.op_1_gp) || 0,
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
            const { goldCost, rarity } = calculateGoldCostAndRarity(costs.totalGP, costs.totalIP);
            
            items.push({ 
                ...item, 
                docId: docSnapshot.id,
                costs,
                goldCost,
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
        <div class="col">${Math.round(item.goldCost)}</div>
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
                <label>Gold Points:</label>
                <span>${item.costs.totalGP.toFixed(2)}</span>
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

// --- Dynamic calculation for technique costs and TP ---
function calculateTechniqueCosts(parts, techniquePartsDb) {
    // Ensure parts is always an array
    if (!Array.isArray(parts)) parts = [];
    let sumNonPercentage = 0;
    let productPercentage = 1;
    let totalTP = 0;
    let tpSources = [];

    parts.forEach((partData) => {
        const part = techniquePartsDb.find(tp => tp.name === partData.name);
        if (!part) return;
        // Calculate energy
        let partContribution = part.base_en +
            (part.op_1_en || 0) * (partData.op_1_lvl || 0) +
            (part.op_2_en || 0) * (partData.op_2_lvl || 0) +
            (part.op_3_en || 0) * (partData.op_3_lvl || 0);
        if (part.percentage) {
            productPercentage *= partContribution;
        } else {
            sumNonPercentage += partContribution;
        }
        // Calculate TP
        let partTP = part.base_tp;
        totalTP += partTP;
        const opt1TP = (part.op_1_tp || 0) * (partData.op_1_lvl || 0);
        const opt2TP = (part.op_2_tp || 0) * (partData.op_2_lvl || 0);
        const opt3TP = (part.op_3_tp || 0) * (partData.op_3_lvl || 0);
        let adjustedOpt1TP = part.name === 'Additional Damage' ? Math.floor(opt1TP) : opt1TP;
        totalTP += adjustedOpt1TP + opt2TP + opt3TP;
        if (partTP > 0 || adjustedOpt1TP > 0 || opt2TP > 0 || opt3TP > 0) {
            let partSource = `${partTP} TP: ${part.name}`;
            if (adjustedOpt1TP > 0) partSource += ` (Opt 1 ${partData.op_1_lvl}: ${adjustedOpt1TP} TP)`;
            if (opt2TP > 0) partSource += ` (Opt 2 ${partData.op_2_lvl}: ${opt2TP} TP)`;
            if (opt3TP > 0) partSource += ` (Opt 3 ${partData.op_3_lvl}: ${opt3TP} TP)`;
            tpSources.push({ name: part.name, tp: partTP + adjustedOpt1TP + opt2TP + opt3TP, part, partData });
        }
    });

    const finalEnergy = sumNonPercentage * productPercentage;
    return {
        totalEnergy: finalEnergy,
        totalTP,
        tpSources
    };
}

// Helper function to compute action type from parts
function computeActionType(parts) {
    if (!Array.isArray(parts)) return 'Basic Action';
    let actionType = 'Basic';
    let isReaction = false;
    for (let p of parts) {
        if (p.name === 'Reaction') {
            isReaction = true;
        } else if (p.name === 'Quick or Free Action') {
            if (p.op_1_lvl == 0) actionType = 'Quick';
            else if (p.op_1_lvl == 1) actionType = 'Free';
        } else if (p.name === 'Long Action') {
            if (p.op_1_lvl == 0) actionType = 'Long (3)';
            else if (p.op_1_lvl == 1) actionType = 'Long (4)';
        }
    }
    return isReaction ? `${actionType} Reaction` : `${actionType} Action`;
}

// --- Technique card with dynamic calculation ---
function createTechniqueCardDynamic(technique, techniquePartsDb, db, userId) {
    // Ensure technique.parts is always an array
    const partsArr = Array.isArray(technique.parts) ? technique.parts : [];

    const card = document.createElement('div');
    card.className = 'library-card';

    const header = document.createElement('div');
    header.className = 'library-header technique-header';
    header.style.gridTemplateColumns = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr';
    header.onclick = () => toggleExpand(card);

    // Calculate costs
    const calc = calculateTechniqueCosts(partsArr, techniquePartsDb);

    // Damage display
    let damageStr = "";
    if (technique.damage && typeof technique.damage === 'object' && technique.damage.amount && technique.damage.size && technique.damage.amount !== '0' && technique.damage.size !== '0') {
        damageStr = `+${technique.damage.amount}d${technique.damage.size}`;
    }

    header.innerHTML = `
        <div class="col">${technique.name}</div>
        <div class="col">${calc.totalEnergy.toFixed(2)}</div>
        <div class="col">${calc.totalTP}</div>
        <div class="col">${computeActionType(technique.parts)}</div>
        <div class="col">${technique.weapon && technique.weapon.name ? technique.weapon.name : "Unarmed"}</div>
        <div class="col">${damageStr}</div>
        <span class="expand-icon">▼</span>
    `;

    const body = document.createElement('div');
    body.className = 'library-body';

    if (technique.description) {
        body.innerHTML += `<div class="library-description">${technique.description}</div>`;
    }

    // Parts/proficiencies chips
    if (partsArr && partsArr.length > 0) {
        const partsHTML = `
            <h4 style="margin: 16px 0 8px 0; color: var(--primary);">Technique Parts & Proficiencies</h4>
            <div class="library-parts">
                ${partsArr.map(partData => {
                    const part = techniquePartsDb.find(tp => tp.name === partData.name);
                    if (!part) return '';
                    let tp = part.base_tp +
                        (part.op_1_tp || 0) * (partData.op_1_lvl || 0) +
                        (part.op_2_tp || 0) * (partData.op_2_lvl || 0) +
                        (part.op_3_tp || 0) * (partData.op_3_lvl || 0);
                    if (part.name === 'Additional Damage') {
                        tp = part.base_tp + Math.floor((part.op_1_tp || 0) * (partData.op_1_lvl || 0)) +
                            (part.op_2_tp || 0) * (partData.op_2_lvl || 0) +
                            (part.op_3_tp || 0) * (partData.op_3_lvl || 0);
                    }
                    let text = part.name;
                    if (partData.op_1_lvl > 0) text += ` (Opt 1: ${partData.op_1_lvl})`;
                    if (partData.op_2_lvl > 0) text += ` (Opt 2: ${partData.op_2_lvl})`;
                    if (partData.op_3_lvl > 0) text += ` (Opt 3: ${partData.op_3_lvl})`;
                    if (tp > 0) text += ` | TP: ${tp}`;
                    return `<div class="part-chip proficiency-chip" title="${part.description}">${text}</div>`;
                }).join('')}
            </div>
        `;
        body.innerHTML += partsHTML;
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-button';
    deleteBtn.textContent = 'Delete Technique';
    deleteBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete ${technique.name}?`)) {
            try {
                await deleteDoc(doc(db, 'users', userId, 'techniqueLibrary', technique.docId));
                card.remove();
            } catch (error) {
                console.error('Error deleting technique: ', error);
                alert('Error deleting technique');
            }
        }
    };
    body.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(body);
    return card;
}

async function showSavedCreatures(db, userId) {
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

        // Render creatures
        creatures.forEach(creature => {
            const card = createCreatureCard(creature);
            creaturesList.appendChild(card);
        });
    } catch (e) {
        creaturesList.innerHTML = '<div class="no-results">Error loading creatures.</div>';
        console.error('Error fetching saved creatures: ', e);
    }
}

function createCreatureCard(creature) {
    const card = document.createElement('div');
    card.className = 'library-card';

    const header = document.createElement('div');
    header.className = 'library-header creature-header';
    header.onclick = () => toggleExpand(card);

    header.innerHTML = `
        <div class="col">${creature.name || '-'}</div>
        <div class="col">Level ${creature.level || '-'}</div>
        <div class="col">${creature.type || '-'}</div>
        <div class="col">${creature.archetype || '-'}</div>
        <span class="expand-icon">▼</span>
    `;

    const body = document.createElement('div');
    body.className = 'library-body';

    // Build creature stat blocks (reuse existing logic)
    const ab = creature.abilities || {};
    const df = creature.defenses || {};
    
    function abilityCell(val) {
        if (typeof val === 'number' && val >= 0) return `+${val}`;
        return val;
    }

    const abilitiesTable = `
        <table style="width:100%;border-collapse:collapse;font-size:0.9em;">
            <tr><th>STR</th><th>VIT</th><th>AGG</th></tr>
            <tr><td>${abilityCell(ab.strength)}</td><td>${abilityCell(ab.vitality)}</td><td>${abilityCell(ab.agility)}</td></tr>
            <tr><th>ACU</th><th>INT</th><th>CHA</th></tr>
            <tr><td>${abilityCell(ab.acuity)}</td><td>${abilityCell(ab.intelligence)}</td><td>${abilityCell(ab.charisma)}</td></tr>
        </table>
    `;

    const defensesTable = `
        <table style="width:100%;border-collapse:collapse;font-size:0.9em;">
            <tr><th>MGT</th><th>FRT</th><th>RFX</th></tr>
            <tr><td>${df.might ?? ''}</td><td>${df.fortitude ?? ''}</td><td>${df.reflex ?? ''}</td></tr>
            <tr><th>DSC</th><th>MFT</th><th>RSL</th></tr>
            <tr><td>${df.discernment ?? ''}</td><td>${df.mentalFortitude ?? ''}</td><td>${df.resolve ?? ''}</td></tr>
        </table>
    `;

    body.innerHTML = `
        <div class="creature-expanded-content">
            <div class="creature-section">
                <h4>Abilities</h4>
                ${abilitiesTable}
            </div>
            <div class="creature-section">
                <h4>Defenses</h4>
                ${defensesTable}
            </div>
            <div class="creature-section">
                <h4>Details</h4>
                <p><strong>Type:</strong> ${creature.type || '-'}</p>
                <p><strong>Level:</strong> ${creature.level || '-'}</p>
                <p><strong>Archetype:</strong> ${creature.archetype || '-'}</p>
            </div>
        </div>
    `;

    if (creature.description) {
        body.innerHTML += `<div class="library-description">${creature.description}</div>`;
    }

    card.appendChild(header);
    card.appendChild(body);
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
            showSavedCreatures(db, user.uid);
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
                else if (tab === 'creatures') showSavedCreatures(db, auth.currentUser.uid);
            }
        });
    });
});
