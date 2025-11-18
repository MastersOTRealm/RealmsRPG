import { saveCharacter } from './characterCreator_storage.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';
import { getDefaultTrainingPoints } from './characterCreator_utils.js';

export let selectedPowersTechniques = [];
let powersInitialized = false;
let powerPartsCache = null;
let techniquePartsCache = null;
let powersLibrary = [];
let techniquesLibrary = [];
let authReady = false;
let currentUser = null;

// Wait for auth
function waitForAuth() {
  return new Promise((resolve) => {
    if (authReady && currentUser) {
      resolve(currentUser);
      return;
    }
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      authReady = true;
      currentUser = user;
      unsubscribe();
      resolve(user);
    });
  });
}

// Load power parts from Realtime Database
async function loadPowerParts(database) {
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
          base_en: parseFloat(part.base_en) || 0,
          base_tp: parseFloat(part.base_tp) || 0,
          op_1_en: parseFloat(part.op_1_en) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_en: parseFloat(part.op_2_en) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_en: parseFloat(part.op_3_en) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0,
          mechanic: part.mechanic === 'true' || part.mechanic === true,
          percentage: part.percentage === 'true' || part.percentage === true,
          duration: part.duration === 'true' || part.duration === true
        }));
      return powerPartsCache;
    }
  } catch (error) {
    console.error('Error loading power parts:', error);
  }
  return [];
}

// Load technique parts from Realtime Database
async function loadTechniqueParts(database) {
  if (techniquePartsCache) return techniquePartsCache;
  
  try {
    const partsRef = ref(database, 'parts');
    const snapshot = await get(partsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      techniquePartsCache = Object.entries(data)
        .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique')
        .map(([id, part]) => ({
          id: id,
          name: part.name || '',
          description: part.description || '',
          base_en: parseFloat(part.base_en) || 0,
          base_tp: parseFloat(part.base_tp) || 0,
          op_1_en: parseFloat(part.op_1_en) || 0,
          op_1_tp: parseFloat(part.op_1_tp) || 0,
          op_2_en: parseFloat(part.op_2_en) || 0,
          op_2_tp: parseFloat(part.op_2_tp) || 0,
          op_3_en: parseFloat(part.op_3_en) || 0,
          op_3_tp: parseFloat(part.op_3_tp) || 0,
          mechanic: part.mechanic === 'true' || part.mechanic === true,
          percentage: part.percentage === 'true' || part.percentage === true
        }));
      return techniquePartsCache;
    }
  } catch (error) {
    console.error('Error loading technique parts:', error);
  }
  return [];
}

// Calculate power costs
function calculatePowerCosts(parts, powerPartsDb) {
  let flat_normal = 0;
  let flat_duration = 0;
  let perc_all = 1;
  let perc_dur = 1;
  let dur_all = 1;
  let hasDurationParts = false;
  let totalTP = 0;

  parts.forEach((partData) => {
    const part = powerPartsDb.find(p => p.name === partData.name);
    if (!part) return;
    
    let partContribution = part.base_en + (part.op_1_en * (partData.op_1_lvl || 0)) + (part.op_2_en * (partData.op_2_lvl || 0)) + (part.op_3_en * (partData.op_3_lvl || 0));
    const applyToDuration = partData.applyDuration || false;

    if (part.duration) {
      dur_all *= partContribution;
      hasDurationParts = true;
    } else if (part.percentage) {
      perc_all *= partContribution;
      if (applyToDuration) perc_dur *= partContribution;
    } else {
      flat_normal += partContribution;
      if (applyToDuration) flat_duration += partContribution;
    }

    let partTP = part.base_tp;
    totalTP += partTP;
    const opt1TP = (part.op_1_tp || 0) * (partData.op_1_lvl || 0);
    const opt2TP = (part.op_2_tp || 0) * (partData.op_2_lvl || 0);
    const opt3TP = (part.op_3_tp || 0) * (partData.op_3_lvl || 0);
    totalTP += opt1TP + opt2TP + opt3TP;
  });

  if (!hasDurationParts) dur_all = 0;
  const PowerEnergy = (flat_normal * perc_all) + ((dur_all + 1) * flat_duration * perc_dur) - (flat_duration * perc_dur);

  return { totalEnergy: PowerEnergy, totalTP };
}

// Calculate technique costs
function calculateTechniqueCosts(parts, techniquePartsDb) {
  let sumNonPercentage = 0;
  let productPercentage = 1;
  let totalTP = 0;

  parts.forEach((partData) => {
    const part = techniquePartsDb.find(tp => tp.name === partData.name);
    if (!part) return;
    
    let partContribution = part.base_en +
      (part.op_1_en || 0) * (partData.op_1_lvl || 0) +
      (part.op_2_en || 0) * (partData.op_2_lvl || 0) +
      (part.op_3_en || 0) * (partData.op_3_lvl || 0);
    
    if (part.percentage) {
      productPercentage *= partContribution;
    } else {
      sumNonPercentage += partContribution;
    }
    
    let partTP = part.base_tp;
    totalTP += partTP;
    const opt1TP = (part.op_1_tp || 0) * (partData.op_1_lvl || 0);
    const opt2TP = (part.op_2_tp || 0) * (partData.op_2_lvl || 0);
    const opt3TP = (part.op_3_tp || 0) * (partData.op_3_lvl || 0);
    totalTP += opt1TP + opt2TP + opt3TP;
  });

  const finalEnergy = sumNonPercentage * productPercentage;
  return { totalEnergy: finalEnergy, totalTP };
}

// Fetch powers from user's library
async function fetchPowersFromLibrary() {
  const user = await waitForAuth();
  if (!user) {
    console.log('No user authenticated, skipping power fetch');
    return [];
  }

  try {
    const database = getDatabase();
    const powerPartsDb = await loadPowerParts(database);
    if (!powerPartsDb || powerPartsDb.length === 0) return [];

    const db = getFirestore();
    const powersRef = collection(db, 'users', user.uid, 'library');
    const snapshot = await getDocs(powersRef);
    
    const powers = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const costs = calculatePowerCosts(data.parts || [], powerPartsDb);
      
      powers.push({
        id: docSnap.id,
        name: data.name,
        description: data.description,
        parts: data.parts || [],
        totalEnergy: Math.ceil(costs.totalEnergy),
        totalTP: costs.totalTP
      });
    });
    
    return powers;
  } catch (error) {
    console.error('Error fetching powers:', error);
    return [];
  }
}

// Fetch techniques from user's library
async function fetchTechniquesFromLibrary() {
  const user = await waitForAuth();
  if (!user) {
    console.log('No user authenticated, skipping technique fetch');
    return [];
  }

  try {
    const database = getDatabase();
    const techniquePartsDb = await loadTechniqueParts(database);
    if (!techniquePartsDb || techniquePartsDb.length === 0) return [];

    const db = getFirestore();
    const techniquesRef = collection(db, 'users', user.uid, 'techniqueLibrary');
    const snapshot = await getDocs(techniquesRef);
    
    const techniques = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const parts = Array.isArray(data.parts) ? data.parts : [];
      const costs = calculateTechniqueCosts(parts, techniquePartsDb);
      techniques.push({
        id: docSnap.id,
        name: data.name,
        description: data.description,
        parts: parts,
        weapon: data.weapon,
        damage: data.damage,
        totalEnergy: Math.ceil(costs.totalEnergy), // rounded up
        totalTP: costs.totalTP
      });
    });
    
    return techniques;
  } catch (error) {
    console.error('Error fetching techniques:', error);
    return [];
  }
}

function getInnateEnergyMax() {
  const char = window.character || {};
  const archetype = char.archetype || {};
  
  if (archetype.type === 'martial') return 0;
  if (archetype.type === 'powered-martial') return 6;
  if (archetype.type === 'power') return 8;
  return 0;
}

function populatePowers() {
  const list = document.getElementById('powers-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('powers-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  let powers = powersLibrary.filter(power => {
    if (searchTerm && !power.name.toLowerCase().includes(searchTerm) && !(power.description && power.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  powers.forEach(power => {
    const selected = selectedPowersTechniques.includes(power.id);
    
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = power.id;
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${power.name}</td>
      <td>${power.totalEnergy}</td>
      <td>${power.totalTP}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${power.id}">${selected ? '✓' : '+'}</button></td>
    `;
    
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="4" class="equipment-details-cell">
        ${power.description ? `<div class="equipment-description">${power.description}</div>` : ''}
        ${power.parts && power.parts.length > 0 ? `
          <h4 style="margin: 0 0 8px 0; color: var(--primary);">Parts & Proficiencies</h4>
          <div class="equipment-properties-list">
            ${power.parts.map(p => {
              const def = powerPartsCache?.find(x => x.name === p.name);
              if (!def) return '';
              const tp = (def.base_tp || 0)
                + (def.op_1_tp || 0) * (p.op_1_lvl || 0)
                + (def.op_2_tp || 0) * (p.op_2_lvl || 0)
                + (def.op_3_tp || 0) * (p.op_3_lvl || 0);
              let text = def.name;
              if (p.op_1_lvl > 0) text += ` (Opt 1: ${p.op_1_lvl})`;
              if (p.op_2_lvl > 0) text += ` (Opt 2: ${p.op_2_lvl})`;
              if (p.op_3_lvl > 0) text += ` (Opt 3: ${p.op_3_lvl})`;
              if (tp > 0) text += ` | TP: ${tp}`;
              const chipClass = tp > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
              return `<div class="${chipClass}" title="${def.description || ''}">${text}</div>`;
            }).join('')}
          </div>
        ` : ''}
      </td>
    `;
    
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePowerTechnique(power.id);
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function populateTechniques() {
  const list = document.getElementById('techniques-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('techniques-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

  let techniques = techniquesLibrary.filter(tech => {
    if (searchTerm && !tech.name.toLowerCase().includes(searchTerm) && !(tech.description && tech.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  techniques.forEach(tech => {
    const selected = selectedPowersTechniques.includes(tech.id);
    
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = tech.id;
    
    let damageStr = '';
    if (tech.damage && tech.damage.amount && tech.damage.size && tech.damage.amount !== '0' && tech.damage.size !== '0') {
      damageStr = `+${tech.damage.amount}d${tech.damage.size}`;
    }
    
    const weaponName = tech.weapon?.name || 'Unarmed';
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${tech.name}</td>
      <td>${tech.totalEnergy}</td>
      <td>${tech.totalTP}</td>
      <td>${weaponName}</td>
      <td>${damageStr}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${tech.id}">${selected ? '✓' : '+'}</button></td>
    `;

    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="6" class="equipment-details-cell">
        ${tech.description ? `<div class="equipment-description">${tech.description}</div>` : ''}
        ${tech.parts && tech.parts.length > 0 ? `
          <h4 style="margin: 0 0 8px 0; color: var(--primary);">Parts & Proficiencies</h4>
          <div class="equipment-properties-list">
            ${tech.parts.map(p => {
              const def = techniquePartsCache?.find(x => x.name === p.name);
              if (!def) return '';
              let tp = (def.base_tp || 0)
                + (def.op_1_tp || 0) * (p.op_1_lvl || 0)
                + (def.op_2_tp || 0) * (p.op_2_lvl || 0)
                + (def.op_3_tp || 0) * (p.op_3_lvl || 0);
              // Mirror Library behavior for Additional Damage TP rounding if needed
              if (def.name === 'Additional Damage') {
                tp = (def.base_tp || 0)
                  + Math.floor((def.op_1_tp || 0) * (p.op_1_lvl || 0))
                  + (def.op_2_tp || 0) * (p.op_2_lvl || 0)
                  + (def.op_3_tp || 0) * (p.op_3_lvl || 0);
              }
              let text = def.name;
              if (p.op_1_lvl > 0) text += ` (Opt 1: ${p.op_1_lvl})`;
              if (p.op_2_lvl > 0) text += ` (Opt 2: ${p.op_2_lvl})`;
              if (p.op_3_lvl > 0) text += ` (Opt 3: ${p.op_3_lvl})`;
              if (tp > 0) text += ` | TP: ${tp}`;
              const chipClass = tp > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
              return `<div class="${chipClass}" title="${def.description || ''}">${text}</div>`;
            }).join('')}
          </div>
        ` : ''}
      </td>
    `;
    
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePowerTechnique(tech.id);
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function togglePowerTechnique(itemId) {
  if (selectedPowersTechniques.includes(itemId)) {
    selectedPowersTechniques = selectedPowersTechniques.filter(id => id !== itemId);
  } else {
    selectedPowersTechniques.push(itemId);
  }
  
  updatePowersDisplay();
  if (!window.character) window.character = {};
  window.character.powersTechniques = selectedPowersTechniques;
  saveCharacter();
  
  populatePowers();
  populateTechniques();
  updateTrainingPointsDisplay(); // <-- Ensure TP updates immediately
}

// Extract and merge proficiencies from selected powers/techniques
function extractPowersProficiencies() {
  const proficiencies = new Map();
  selectedPowersTechniques.forEach(id => {
    const power = powersLibrary.find(p => p.id === id);
    const tech = techniquesLibrary.find(t => t.id === id);
    const item = power || tech;
    if (!item || !item.parts) return;
    const partsDb = power ? powerPartsCache : techniquePartsCache;
    item.parts.forEach(partData => {
      const partDef = partsDb?.find(p => p.name === partData.name);
      if (!partDef) return;
      // ROUND DOWN TP
      const baseTP = Math.floor(partDef.base_tp || 0);
      let op1TP = (partDef.op_1_tp || 0) * (partData.op_1_lvl || 0);
      if (!power && partDef.name === 'Additional Damage') {
        op1TP = Math.floor((partDef.op_1_tp || 0) * (partData.op_1_lvl || 0));
      } else {
        op1TP = Math.floor(op1TP);
      }
      const op2TP = Math.floor((partDef.op_2_tp || 0) * (partData.op_2_lvl || 0));
      const op3TP = Math.floor((partDef.op_3_tp || 0) * (partData.op_3_lvl || 0));
      const totalTP = baseTP + op1TP + op2TP + op3TP;
      if (totalTP <= 0) return;
      const key = partDef.name;
      if (proficiencies.has(key)) {
        const existing = proficiencies.get(key);
        existing.op1Lvl = Math.max(existing.op1Lvl, partData.op_1_lvl || 0);
        existing.op2Lvl = Math.max(existing.op2Lvl, partData.op_2_lvl || 0);
        existing.op3Lvl = Math.max(existing.op3Lvl, partData.op_3_lvl || 0);
      } else {
        proficiencies.set(key, {
          name: partDef.name,
          description: partDef.description || '',
          baseTP: baseTP,
          op1Lvl: partData.op_1_lvl || 0,
          op2Lvl: partData.op_2_lvl || 0,
          op3Lvl: partData.op_3_lvl || 0,
          op1TP: partDef.op_1_tp || 0,
          op2TP: partDef.op_2_tp || 0,
          op3TP: partDef.op_3_tp || 0,
          isAdditionalDamage: partDef.name === 'Additional Damage'
        });
      }
    });
  });
  return proficiencies;
}

export function getTotalPowersTP() {
  const proficiencies = extractPowersProficiencies();
  let total = 0;
  proficiencies.forEach(prof => {
    let op1TP = prof.op1TP * prof.op1Lvl;
    if (prof.isAdditionalDamage) {
      op1TP = Math.floor(prof.op1TP * prof.op1Lvl);
    } else {
      op1TP = Math.floor(op1TP);
    }
    const op2TP = Math.floor(prof.op2TP * prof.op2Lvl);
    const op3TP = Math.floor(prof.op3TP * prof.op3Lvl);
    total += Math.floor(prof.baseTP + op1TP + op2TP + op3TP);
  });
  return total;
}

// Update proficiencies display
function updatePowersProficienciesDisplay() {
  const profList = document.getElementById('powers-proficiencies-list');
  if (!profList) return;

  const proficiencies = extractPowersProficiencies();

  if (proficiencies.size === 0) {
    profList.innerHTML = '<p class="no-skills-message">No proficiencies from selected powers/techniques</p>';
    // Update header to show 0 TP
    const header = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"] h3');
    if (header) header.innerHTML = 'Proficiencies <span style="margin-left: auto; font-weight: normal; color: #666;">Total TP Cost: 0</span>';
    return;
  }

  let totalTP = 0;
  const chips = Array.from(proficiencies.values()).map(prof => {
    let op1TP = prof.op1TP * prof.op1Lvl;
    if (prof.isAdditionalDamage) {
      op1TP = Math.floor(prof.op1TP * prof.op1Lvl);
    } else {
      op1TP = Math.floor(op1TP);
    }
    const op2TP = Math.floor(prof.op2TP * prof.op2Lvl);
    const op3TP = Math.floor(prof.op3TP * prof.op3Lvl);
    const partTotal = Math.ceil(prof.baseTP + op1TP + op2TP + op3TP);
    totalTP += partTotal;
    
    let text = prof.name;
    if (prof.op1Lvl > 0) text += ` (Opt 1: ${prof.op1Lvl})`;
    if (prof.op2Lvl > 0) text += ` (Opt 2: ${prof.op2Lvl})`;
    if (prof.op3Lvl > 0) text += ` (Opt 3: ${prof.op3Lvl})`;
    
    let tpText = ` | TP: ${Math.ceil(prof.baseTP)}`;
    if (op1TP > 0) tpText += ` + ${Math.ceil(op1TP)}`;
    if (op2TP > 0) tpText += ` + ${Math.ceil(op2TP)}`;
    if (op3TP > 0) tpText += ` + ${Math.ceil(op3TP)}`;
    text += tpText;
    
    return `<div class="equipment-property-chip proficiency-chip" title="${prof.description}">${text}</div>`;
  }).join('');

  profList.innerHTML = chips;
  
  // Update header to show total TP
  const header = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"] h3');
  if (header) header.innerHTML = `Proficiencies <span style="margin-left: auto; font-weight: normal; color: #666;">Total TP Cost: ${totalTP}</span>`;
  
  // Update training points display
  updateTrainingPointsDisplay();
}

function getSpentEnergy() {
  return selectedPowersTechniques.reduce((sum, id) => {
    const power = powersLibrary.find(p => p.id === id);
    const tech = techniquesLibrary.find(t => t.id === id);
    const item = power || tech;
    return sum + (item ? (item.totalEnergy || 0) : 0);
  }, 0);
}

function updatePowersDisplay() {
  const innateMax = getInnateEnergyMax();
  
  const maxEl = document.getElementById('innate-energy-max');
  if (maxEl) maxEl.textContent = innateMax;
  
  updatePowersTechniquesBonusDisplay();
  updatePowersProficienciesDisplay();
}

function updatePowersTechniquesBonusDisplay() {
  const bonusList = document.getElementById('powers-techniques-bonus-list');
  if (!bonusList) return;
  
  if (selectedPowersTechniques.length === 0) {
    bonusList.innerHTML = '<p class="no-skills-message">No powers or techniques selected yet</p>';
    updateTrainingPointsDisplay(); // Ensure TP updates when all removed
    return;
  }

  bonusList.innerHTML = selectedPowersTechniques.map(id => {
    const power = powersLibrary.find(p => p.id === id);
    const tech = techniquesLibrary.find(t => t.id === id);
    const item = power || tech;
    if (!item) return '';
    const energyInt = Math.ceil(item.totalEnergy || 0);
    const type = power ? 'Power' : 'Technique';
    return `
      <div class="skill-bonus-item">
        <span class="skill-bonus-name">${item.name}</span>
        <span class="skill-fixed-ability">Energy: ${energyInt} | Type: ${type}</span>
        <button class="equipment-remove-btn" data-id="${id}" title="Remove ${type.toLowerCase()}">×</button>
      </div>
    `;
  }).filter(Boolean).join('');

  bonusList.querySelectorAll('.equipment-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      selectedPowersTechniques = selectedPowersTechniques.filter(id => id !== itemId);
      updatePowersDisplay();
      if (!window.character) window.character = {};
      window.character.powersTechniques = selectedPowersTechniques;
      saveCharacter();
      populatePowers();
      populateTechniques();
      updateTrainingPointsDisplay(); // <-- Ensure TP updates immediately
    });
  });
}

// Update training points display
function updateTrainingPointsDisplay() {
  const powersTP = getTotalPowersTP();
  
  // Import equipment TP if available
  import('./characterCreator_equipment.js').then(mod => {
    const equipmentTP = mod.getTotalEquipmentTP ? mod.getTotalEquipmentTP() : 0;
    const totalSpent = equipmentTP + powersTP;
    const remaining = getDefaultTrainingPoints() - totalSpent;
    const trainingPointsEl = document.getElementById('training-points');
    if (trainingPointsEl) trainingPointsEl.textContent = remaining;
    const powersTrainingPointsEl = document.getElementById('powers-training-points');
    if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
  }).catch(() => {
    // Equipment module not loaded yet
    const remaining = getDefaultTrainingPoints() - powersTP;
    const powersTrainingPointsEl = document.getElementById('powers-training-points');
    if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
  });
}

async function initPowersUI() {
  if (!powersInitialized) {
    // Powers header
    const powersHeader = document.querySelector('#content-powers .section-header[data-section="powers"]');
    if (powersHeader) {
      const newPowersHeader = powersHeader.cloneNode(true);
      powersHeader.parentNode.replaceChild(newPowersHeader, powersHeader);
      
      newPowersHeader.addEventListener('click', () => {
        const body = document.getElementById('powers-body');
        const arrow = newPowersHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Techniques header
    const techniquesHeader = document.querySelector('#content-powers .section-header[data-section="techniques"]');
    if (techniquesHeader) {
      const newTechniquesHeader = techniquesHeader.cloneNode(true);
      techniquesHeader.parentNode.replaceChild(newTechniquesHeader, techniquesHeader);
      
      newTechniquesHeader.addEventListener('click', () => {
        const body = document.getElementById('techniques-body');
        const arrow = newTechniquesHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Powers Proficiencies header
    const powersProfHeader = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"]');
    if (powersProfHeader) {
      const newPowersProfHeader = powersProfHeader.cloneNode(true);
      powersProfHeader.parentNode.replaceChild(newPowersProfHeader, powersProfHeader);
      
      newPowersProfHeader.addEventListener('click', () => {
        const body = document.getElementById('powers-proficiencies-body');
        const arrow = newPowersProfHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Search inputs
    const powersSearchInput = document.getElementById('powers-search');
    if (powersSearchInput) {
      const newPowersSearchInput = powersSearchInput.cloneNode(true);
      powersSearchInput.parentNode.replaceChild(newPowersSearchInput, powersSearchInput);
      newPowersSearchInput.addEventListener('keyup', populatePowers);
    }

    const techniquesSearchInput = document.getElementById('techniques-search');
    if (techniquesSearchInput) {
      const newTechniquesSearchInput = techniquesSearchInput.cloneNode(true);
      techniquesSearchInput.parentNode.replaceChild(newTechniquesSearchInput, techniquesSearchInput);
      newTechniquesSearchInput.addEventListener('keyup', populateTechniques);
    }

    powersInitialized = true;
  }

  console.log('Waiting for authentication...');
  await waitForAuth();
  
  console.log('Loading powers and techniques from library...');
  powersLibrary = await fetchPowersFromLibrary();
  techniquesLibrary = await fetchTechniquesFromLibrary();

  // Open sections by default
  const powersBody = document.getElementById('powers-body');
  const powersArrow = document.querySelector('#content-powers .section-header[data-section="powers"] .toggle-arrow');
  if (powersBody) powersBody.classList.add('open');
  if (powersArrow) powersArrow.classList.add('open');

  const techniquesBody = document.getElementById('techniques-body');
  const techniquesArrow = document.querySelector('#content-powers .section-header[data-section="techniques"] .toggle-arrow');
  if (techniquesBody) techniquesBody.classList.add('open');
  if (techniquesArrow) techniquesArrow.classList.add('open');

  // Open proficiencies section by default
  const powersProfBody = document.getElementById('powers-proficiencies-body');
  const powersProfArrow = document.querySelector('#content-powers .section-header[data-section="powers-proficiencies"] .toggle-arrow');
  if (powersProfBody) powersProfBody.classList.add('open');
  if (powersProfArrow) powersProfArrow.classList.add('open');

  console.log(`Populating UI with ${powersLibrary.length} powers, ${techniquesLibrary.length} techniques`);
  populatePowers();
  populateTechniques();
  updatePowersTechniquesBonusDisplay();
  updatePowersProficienciesDisplay();
  updatePowersDisplay();
  updateTrainingPointsDisplay(); // NEW
}

document.querySelector('.tab[data-tab="powers"]')?.addEventListener('click', async () => {
  await initPowersUI();
});

export function restorePowersTechniques() {
  if (window.character?.powersTechniques) {
    selectedPowersTechniques = window.character.powersTechniques;
  }
  initPowersUI();
}
