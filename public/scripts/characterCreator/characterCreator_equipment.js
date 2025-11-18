import { saveCharacter } from './characterCreator_storage.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

export let selectedEquipment = [];
let equipmentInitialized = false;
let itemPropertiesCache = null;
let weaponLibrary = [];
let armorLibrary = [];
let generalEquipment = [];
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

// Calculate gold cost from GP and IP (matching library.js logic)
function calculateGoldCostAndRarity(gp, ip) {
  let goldCost = 0;
  let rarity = 'Common';

  // Clamp totalIP and totalGP to at least 0
  const clampedIP = Math.max(0, ip);
  const clampedGP = Math.max(0, gp);

  // Use IP for rarity brackets (matching itemMechanics.js)
  const rarityBrackets = [
    { name: 'Common', low: 25, ipLow: 0, ipHigh: 4 },
    { name: 'Uncommon', low: 100, ipLow: 4.01, ipHigh: 6 },
    { name: 'Rare', low: 500, ipLow: 6.01, ipHigh: 8 },
    { name: 'Epic', low: 2500, ipLow: 8.01, ipHigh: 11 },
    { name: 'Legendary', low: 10000, ipLow: 11.01, ipHigh: 14 },
    { name: 'Mythic', low: 50000, ipLow: 14.01, ipHigh: 16 },
    { name: 'Ascended', low: 100000, ipLow: 16.01, ipHigh: Infinity }
  ];

  // Find rarity bracket based on IP
  for (let i = 0; i < rarityBrackets.length; i++) {
    const bracket = rarityBrackets[i];
    if (clampedIP >= bracket.ipLow && clampedIP <= bracket.ipHigh) {
      rarity = bracket.name;
      // Calculate gold cost: bracket minimum * (1 + 0.125 * GP)
      goldCost = bracket.low * (1 + 0.125 * clampedGP);
      break;
    }
  }

  // Ensure goldCost is never less than the bracket minimum
  const bracket = rarityBrackets.find(b => b.name === rarity);
  if (bracket) {
    goldCost = Math.max(goldCost, bracket.low);
  }

  return { goldCost, rarity };
}

// Load properties from Realtime Database (matching library.js)
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
      return itemPropertiesCache;
    }
  } catch (error) {
    console.error('Error loading properties:', error);
  }
  return [];
}

// Calculate item costs (matching library.js)
function calculateItemCosts(properties, propertiesData) {
  let totalTP = 0;
  let totalGP = 0;
  let totalIP = 0;

  if (!Array.isArray(properties)) return { totalTP: 0, totalGP: 0, totalIP: 0 };

  properties.forEach(propRef => {
    const propData = propertiesData.find(p => p.id === propRef.id || p.name === propRef.name);
    if (!propData) return;

    const level = propRef.op_1_lvl || 0;
    totalTP += propData.base_tp + (propData.op_1_tp * level);
    totalGP += propData.base_gp + (propData.op_1_gp * level);
    totalIP += propData.base_ip + (propData.op_1_ip * level);
  });

  return { totalTP, totalGP, totalIP };
}

// Fetch weapons from user's library
async function fetchWeaponsFromLibrary() {
  const user = await waitForAuth();
  if (!user) {
    console.log('No user authenticated, skipping weapon fetch');
    return [];
  }

  try {
    const database = getDatabase();
    const propertiesData = await loadItemProperties(database);
    if (!propertiesData || propertiesData.length === 0) return [];

    const db = getFirestore();
    const itemsRef = collection(db, 'users', user.uid, 'itemLibrary');
    const snapshot = await getDocs(itemsRef);
    
    const weapons = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.armamentType === 'Weapon') {
        const costs = calculateItemCosts(data.properties || [], propertiesData);
        const { goldCost, rarity } = calculateGoldCostAndRarity(costs.totalGP, costs.totalIP);
        
        weapons.push({
          id: docSnap.id,
          name: data.name,
          description: data.description,
          damage: data.damage || [],
          range: data.range || 0,
          properties: data.properties || [],
          itemParts: data.properties || [],
          totalBP: costs.totalTP,
          totalGP: costs.totalGP,
          totalIP: costs.totalIP,
          goldCost: goldCost,
          rarity: rarity
        });
      }
    });
    
    return weapons;
  } catch (error) {
    console.error('Error fetching weapons:', error);
    return [];
  }
}

// Fetch armor from user's library
async function fetchArmorFromLibrary() {
  const user = await waitForAuth();
  if (!user) {
    console.log('No user authenticated, skipping armor fetch');
    return [];
  }

  try {
    const database = getDatabase();
    const propertiesData = await loadItemProperties(database);
    if (!propertiesData || propertiesData.length === 0) return [];

    const db = getFirestore();
    const itemsRef = collection(db, 'users', user.uid, 'itemLibrary');
    const snapshot = await getDocs(itemsRef);
    
    const armor = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.armamentType === 'Armor' || data.armamentType === 'Shield') {
        const costs = calculateItemCosts(data.properties || [], propertiesData);
        const { goldCost, rarity } = calculateGoldCostAndRarity(costs.totalGP, costs.totalIP);
        
        // Find damage reduction from properties
        let damageReduction = 0;
        if (Array.isArray(data.properties)) {
          const drProp = data.properties.find(p => {
            const propData = propertiesData.find(pd => pd.id === p.id || pd.name === p.name);
            return propData && propData.name === 'Damage Reduction';
          });
          if (drProp) {
            const propData = propertiesData.find(p => p.id === drProp.id || p.name === drProp.name);
            if (propData) {
              damageReduction = 1 + (drProp.op_1_lvl || 0);
            }
          }
        }
        
        armor.push({
          id: docSnap.id,
          name: data.name,
          description: data.description,
          damageReduction: damageReduction,
          properties: data.properties || [],
          itemParts: data.properties || [],
          totalBP: costs.totalTP,
          totalGP: costs.totalGP,
          totalIP: costs.totalIP,
          goldCost: goldCost,
          rarity: rarity
        });
      }
    });
    
    return armor;
  } catch (error) {
    console.error('Error fetching armor:', error);
    return [];
  }
}

function getArmamentMax() {
  const char = window.character || {};
  const archetype = char.archetype || {};
  let max = 4;
  
  if (archetype.type === 'powered-martial') {
    max = 8;
  } else if (archetype.type === 'martial') {
    max = 16;
  }
  
  return max;
}

function populateWeapons() {
  const list = document.getElementById('weapons-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('weapons-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();
  const armamentMax = getArmamentMax();

  let weapons = weaponLibrary.filter(weapon => {
    if (searchTerm && !weapon.name.toLowerCase().includes(searchTerm) && !(weapon.description && weapon.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  weapons.forEach(weapon => {
    const selected = selectedEquipment.includes(weapon.id);
    const price = Math.ceil(weapon.goldCost || 0);
    const canAfford = price <= availableCurrency || selected;
    const exceedsTP = (weapon.totalBP || 0) > armamentMax;
    const canAdd = canAfford && (!exceedsTP || selected);
    
    // Main row
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = weapon.id;
    
    // Damage
    let damageStr = 'N/A';
    if (weapon.damage && Array.isArray(weapon.damage)) {
      damageStr = weapon.damage
        .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
        .map(d => `${d.amount}d${d.size} ${d.type}`)
        .join(', ');
    }
    
    // Range
    let rangeStr = weapon.range ? (weapon.range === 0 ? 'Melee' : `${weapon.range} spaces`) : 'Melee';
    
    // Properties (show property names from itemParts)
    let propsStr = '';
    if (weapon.itemParts && Array.isArray(weapon.itemParts)) {
      propsStr = weapon.itemParts.map(p => {
        const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
        return propData ? `<span class="equipment-property">${propData.name}</span>` : '';
      }).filter(Boolean).join(' ');
    }
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${weapon.name}</td>
      <td class="equipment-damage">${damageStr}</td>
      <td class="equipment-range">${rangeStr}</td>
      <td>${propsStr || 'None'}</td>
      <td>${weapon.totalBP || 0}</td>
      <td>${price}</td>
      <td>${weapon.rarity}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${weapon.id}" ${!canAdd ? 'disabled' : ''} title="${exceedsTP && !selected ? 'Exceeds Armament Proficiency Max' : ''}">${selected ? '✓' : '+'}</button></td>
    `;
    
    // Details row
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="8" class="equipment-details-cell">
        ${weapon.description ? `<div class="equipment-description">${weapon.description}</div>` : ''}
        ${weapon.itemParts && weapon.itemParts.length > 0 ? `
          <h4 style="margin: 0 0 8px 0; color: var(--primary);">Properties & Proficiencies</h4>
          <div class="equipment-properties-list">
            ${weapon.itemParts.map(p => {
              const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
              if (!propData) return '';
              const baseTP = Math.round(propData.base_tp || 0);
              const optionLevel = p.op_1_lvl || 0;
              const optionTP = optionLevel > 0 ? Math.round((propData.op_1_tp || 0) * optionLevel) : 0;
              const totalTP = baseTP + optionTP;
              let text = propData.name;
              if (optionLevel > 0) text += ` (Level ${optionLevel})`;
              if (totalTP > 0) {
                let tpText = ` | TP: ${baseTP}`;
                if (optionTP > 0) tpText += ` + ${optionTP}`;
                text += tpText;
              }
              const chipClass = totalTP > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
              return `<div class="${chipClass}" title="${propData.description}">${text}</div>`;
            }).join('')}
          </div>
        ` : ''}
      </td>
    `;
    
    // Toggle expand on row click (but not button)
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    // Add button click
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (canAdd) {
        toggleEquipment(weapon.id, availableCurrency, weapon.goldCost, 'weapon');
      }
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function populateArmor() {
  const list = document.getElementById('armor-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('armor-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();
  const armamentMax = getArmamentMax();

  let armor = armorLibrary.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !(item.description && item.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  armor.forEach(armorItem => {
    const selected = selectedEquipment.includes(armorItem.id);
    const price = Math.ceil(armorItem.goldCost || 0);
    const canAfford = price <= availableCurrency || selected;
    const exceedsTP = (armorItem.totalBP || 0) > armamentMax;
    const canAdd = canAfford && (!exceedsTP || selected);
    
    // Main row
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    row.dataset.itemId = armorItem.id;
    
    // Damage Reduction
    let drStr = armorItem.damageReduction || 'N/A';
    
    // Properties
    let propsStr = '';
    if (armorItem.itemParts && Array.isArray(armorItem.itemParts)) {
      propsStr = armorItem.itemParts.map(p => {
        const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
        return propData ? `<span class="equipment-property">${propData.name}</span>` : '';
      }).filter(Boolean).join(' ');
    }
    
    row.innerHTML = `
      <td><span class="expand-icon-equipment">▶</span>${armorItem.name}</td>
      <td>${drStr}</td>
      <td>${propsStr || 'None'}</td>
      <td>${armorItem.totalBP || 0}</td>
      <td>${price}</td>
      <td>${armorItem.rarity}</td>
      <td><button class="equipment-add-btn ${selected ? 'selected' : ''}" data-id="${armorItem.id}" ${!canAdd ? 'disabled' : ''} title="${exceedsTP && !selected ? 'Exceeds Armament Proficiency Max' : ''}">${selected ? '✓' : '+'}</button></td>
    `;
    
    // Details row
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'equipment-details-row';
    detailsRow.innerHTML = `
      <td colspan="7" class="equipment-details-cell">
        ${armorItem.description ? `<div class="equipment-description">${armorItem.description}</div>` : ''}
        ${armorItem.itemParts && armorItem.itemParts.length > 0 ? `
          <h4 style="margin: 0 0 8px 0; color: var(--primary);">Properties & Proficiencies</h4>
          <div class="equipment-properties-list">
            ${armorItem.itemParts.map(p => {
              const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
              if (!propData) return '';
              const baseTP = Math.round(propData.base_tp || 0);
              const optionLevel = p.op_1_lvl || 0;
              const optionTP = optionLevel > 0 ? Math.round((propData.op_1_tp || 0) * optionLevel) : 0;
              const totalTP = baseTP + optionTP;
              let text = propData.name;
              if (optionLevel > 0) text += ` (Level ${optionLevel})`;
              if (totalTP > 0) {
                let tpText = ` | TP: ${baseTP}`;
                if (optionTP > 0) tpText += ` + ${optionTP}`;
                text += tpText;
              }
              const chipClass = totalTP > 0 ? 'equipment-property-chip proficiency-chip' : 'equipment-property-chip';
              return `<div class="${chipClass}" title="${propData.description}">${text}</div>`;
            }).join('')}
          </div>
        ` : ''}
      </td>
    `;
    
    // Toggle expand on row click (but not button)
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('equipment-add-btn')) return;
      row.classList.toggle('expanded-equipment');
      detailsRow.classList.toggle('show');
    });
    
    // Add button click
    const btn = row.querySelector('.equipment-add-btn');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (canAdd) {
        toggleEquipment(armorItem.id, availableCurrency, armorItem.goldCost, 'armor');
      }
    });
    
    list.appendChild(row);
    list.appendChild(detailsRow);
  });
}

function populateGeneralEquipment() {
  const list = document.getElementById('equipment-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('equipment-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();

  let equipment = generalEquipment.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !(item.description && item.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  equipment.forEach(equipItem => {
    const selected = selectedEquipment.includes(equipItem.id);
    const canAfford = equipItem.currency <= availableCurrency || selected;
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'feat-item';
    if (selected) itemDiv.classList.add('selected-feat');
    
    itemDiv.innerHTML = `
      <div class="feat-header">
        <h4>${equipItem.name}</h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${equipItem.description || 'No description'}</p>
        <div class="equipment-details">
          <div><strong>Category:</strong> ${equipItem.category || 'N/A'}</div>
          <div><strong>Currency:</strong> ${equipItem.currency || 0}</div>
          <div><strong>Rarity:</strong> ${equipItem.rarity || 'Common'}</div>
        </div>
        <button class="feat-select-btn ${selected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}" 
                data-id="${equipItem.id}" 
                ${!canAfford ? 'disabled' : ''}>
          ${selected ? 'Deselect' : 'Select'}
        </button>
      </div>
    `;
    
    list.appendChild(itemDiv);

    const header = itemDiv.querySelector('.feat-header');
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.feat-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    const btn = itemDiv.querySelector('.feat-select-btn');
    btn.addEventListener('click', () => {
      if (!canAfford) return;
      toggleEquipment(equipItem.id, availableCurrency, equipItem.currency, 'general');
    });
  });
}

function toggleEquipment(itemId, availableCurrency, itemCurrency, itemType) {
  if (selectedEquipment.includes(itemId)) {
    selectedEquipment = selectedEquipment.filter(id => id !== itemId);
  } else {
    if (itemCurrency > availableCurrency) return;
    selectedEquipment.push(itemId);
  }
  
  updateEquipmentCurrency();
  if (!window.character) window.character = {};
  window.character.equipment = selectedEquipment;
  saveCharacter();
  
  populateWeapons();
  populateArmor();
  populateGeneralEquipment();
}

function getSpentCurrency() {
  return selectedEquipment.reduce((sum, id) => {
    const weapon = weaponLibrary.find(w => w.id === id);
    const armor = armorLibrary.find(a => a.id === id);
    const general = generalEquipment.find(g => g.id === id);
    const item = weapon || armor || general;
    const value = item ? (item.goldCost || item.currency || 0) : 0;
    return sum + Math.ceil(value);
  }, 0);
}

function updateEquipmentCurrency() {
  const spent = getSpentCurrency();
  const remaining = 200 - spent;
  const el = document.getElementById('currency');
  if (el) el.textContent = remaining;
  updateEquipmentBonusDisplay();
  updateArmamentMax();
}

function updateArmamentMax() {
  const char = window.character || {};
  const archetype = char.archetype || {};
  let max = 4; // Default for no archetype or power archetype
  
  if (archetype.type === 'powered-martial') {
    max = 8;
  } else if (archetype.type === 'martial') {
    max = 16;
  }
  
  const el = document.getElementById('armament-max');
  if (el) el.textContent = max;
}

function updateEquipmentBonusDisplay() {
  const bonusList = document.getElementById('equipment-bonus-list');
  if (!bonusList) return;
  
  if (selectedEquipment.length === 0) {
    bonusList.innerHTML = '<p class="no-skills-message">No equipment selected yet</p>';
    return;
  }

  bonusList.innerHTML = selectedEquipment.map(id => {
    const weapon = weaponLibrary.find(w => w.id === id);
    const armor = armorLibrary.find(a => a.id === id);
    const general = generalEquipment.find(g => g.id === id);
    const item = weapon || armor || general;
    if (!item) return '';
    
    const currency = Math.ceil(item.goldCost || item.currency || 0);
    return `
      <div class="skill-bonus-item">
        <span class="skill-bonus-name">${item.name}</span>
        <span class="skill-fixed-ability">Currency: ${currency}</span>
        <button class="equipment-remove-btn" data-id="${id}" title="Remove equipment">×</button>
      </div>
    `;
  }).filter(Boolean).join('');
  
  // Add event listeners to remove buttons
  bonusList.querySelectorAll('.equipment-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.id;
      selectedEquipment = selectedEquipment.filter(id => id !== itemId);
      updateEquipmentCurrency();
      if (!window.character) window.character = {};
      window.character.equipment = selectedEquipment;
      saveCharacter();
      populateWeapons();
      populateArmor();
      populateGeneralEquipment();
    });
  });
}

async function initEquipmentUI() {
  if (!equipmentInitialized) {
    // Weapons header
    const weaponsHeader = document.querySelector('#content-equipment .section-header[data-section="weapons"]');
    if (weaponsHeader) {
      const newWeaponsHeader = weaponsHeader.cloneNode(true);
      weaponsHeader.parentNode.replaceChild(newWeaponsHeader, weaponsHeader);
      
      newWeaponsHeader.addEventListener('click', () => {
        const body = document.getElementById('weapons-body');
        const arrow = newWeaponsHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Armor header
    const armorHeader = document.querySelector('#content-equipment .section-header[data-section="armor"]');
    if (armorHeader) {
      const newArmorHeader = armorHeader.cloneNode(true);
      armorHeader.parentNode.replaceChild(newArmorHeader, armorHeader);
      
      newArmorHeader.addEventListener('click', () => {
        const body = document.getElementById('armor-body');
        const arrow = newArmorHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // General Equipment header
    const equipmentHeader = document.querySelector('#content-equipment .section-header[data-section="equipment"]');
    if (equipmentHeader) {
      const newEquipmentHeader = equipmentHeader.cloneNode(true);
      equipmentHeader.parentNode.replaceChild(newEquipmentHeader, equipmentHeader);
      
      newEquipmentHeader.addEventListener('click', () => {
        const body = document.getElementById('equipment-body');
        const arrow = newEquipmentHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    }

    // Search inputs
    const weaponsSearchInput = document.getElementById('weapons-search');
    if (weaponsSearchInput) {
      const newWeaponsSearchInput = weaponsSearchInput.cloneNode(true);
      weaponsSearchInput.parentNode.replaceChild(newWeaponsSearchInput, weaponsSearchInput);
      newWeaponsSearchInput.addEventListener('keyup', populateWeapons);
    }

    const armorSearchInput = document.getElementById('armor-search');
    if (armorSearchInput) {
      const newArmorSearchInput = armorSearchInput.cloneNode(true);
      armorSearchInput.parentNode.replaceChild(newArmorSearchInput, armorSearchInput);
      newArmorSearchInput.addEventListener('keyup', populateArmor);
    }

    const equipmentSearchInput = document.getElementById('equipment-search');
    if (equipmentSearchInput) {
      const newEquipmentSearchInput = equipmentSearchInput.cloneNode(true);
      equipmentSearchInput.parentNode.replaceChild(newEquipmentSearchInput, equipmentSearchInput);
      newEquipmentSearchInput.addEventListener('keyup', populateGeneralEquipment);
    }

    equipmentInitialized = true;
  }

  // Wait for auth before loading user library
  console.log('Waiting for authentication...');
  await waitForAuth();
  
  // Load weapons and armor from user's library
  console.log('Loading weapons and armor from library...');
  weaponLibrary = await fetchWeaponsFromLibrary();
  armorLibrary = await fetchArmorFromLibrary();
  
  // Load general equipment from Firebase (imported from firebase module)
  console.log('Loading general equipment...');
  const { allEquipment } = await import('./characterCreator_firebase.js');
  generalEquipment = [...allEquipment]; // Copy the array

  // Open all sections by default
  const weaponsBody = document.getElementById('weapons-body');
  const weaponsArrow = document.querySelector('#content-equipment .section-header[data-section="weapons"] .toggle-arrow');
  if (weaponsBody) weaponsBody.classList.add('open');
  if (weaponsArrow) weaponsArrow.classList.add('open');

  const armorBody = document.getElementById('armor-body');
  const armorArrow = document.querySelector('#content-equipment .section-header[data-section="armor"] .toggle-arrow');
  if (armorBody) armorBody.classList.add('open');
  if (armorArrow) armorArrow.classList.add('open');

  const equipmentBody = document.getElementById('equipment-body');
  const equipmentArrow = document.querySelector('#content-equipment .section-header[data-section="equipment"] .toggle-arrow');
  if (equipmentBody) equipmentBody.classList.add('open');
  if (equipmentArrow) equipmentArrow.classList.add('open');

  // Populate all lists
  console.log(`Populating UI with ${weaponLibrary.length} weapons, ${armorLibrary.length} armor, ${generalEquipment.length} general equipment`);
  populateWeapons();
  populateArmor();
  populateGeneralEquipment();
  updateEquipmentBonusDisplay();
  updateEquipmentCurrency();
  updateArmamentMax(); // Add this line
}

document.querySelector('.tab[data-tab="equipment"]')?.addEventListener('click', async () => {
  await initEquipmentUI();
});

export function restoreEquipment() {
  if (window.character?.equipment) {
    selectedEquipment = window.character.equipment;
  }
  initEquipmentUI();
}
