import { saveCharacter } from './characterCreator_storage.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

export let selectedEquipment = [];
let equipmentInitialized = false;
let itemPropertiesCache = null;
let weaponLibrary = [];
let armorLibrary = [];

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
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];

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
          rarity: data.rarity || 'Common'
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
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return [];

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
          rarity: data.rarity || 'Common'
        });
      }
    });
    
    return armor;
  } catch (error) {
    console.error('Error fetching armor:', error);
    return [];
  }
}

function populateWeapons() {
  const list = document.getElementById('weapons-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('weapons-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();

  let weapons = weaponLibrary.filter(weapon => {
    if (searchTerm && !weapon.name.toLowerCase().includes(searchTerm) && !(weapon.description && weapon.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  weapons.forEach(weapon => {
    const selected = selectedEquipment.includes(weapon.id);
    const canAfford = weapon.totalGP <= availableCurrency || selected;
    
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    
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
      const database = getDatabase();
      propsStr = weapon.itemParts.map(p => {
        const propData = itemPropertiesCache?.find(prop => prop.id === p.id || prop.name === p.name);
        return propData ? `<span class="equipment-property">${propData.name}</span>` : '';
      }).filter(Boolean).join(' ');
    }
    
    row.innerHTML = `
      <td>${weapon.name}</td>
      <td class="equipment-damage">${damageStr}</td>
      <td class="equipment-range">${rangeStr}</td>
      <td>${propsStr || 'None'}</td>
      <td>${weapon.totalBP || 0}</td>
      <td>${weapon.totalGP || 0}</td>
      <td>${weapon.rarity || 'Common'}</td>
    `;
    
    row.addEventListener('click', () => {
      if (canAfford || selected) {
        toggleEquipment(weapon.id, availableCurrency, weapon.totalGP);
      }
    });
    
    list.appendChild(row);
  });
}

function populateArmor() {
  const list = document.getElementById('armor-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('armor-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();

  let armor = armorLibrary.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && !(item.description && item.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  armor.forEach(armorItem => {
    const selected = selectedEquipment.includes(armorItem.id);
    const canAfford = armorItem.totalGP <= availableCurrency || selected;
    
    const row = document.createElement('tr');
    if (selected) row.classList.add('selected-equipment');
    
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
      <td>${armorItem.name}</td>
      <td>${drStr}</td>
      <td>${propsStr || 'None'}</td>
      <td>${armorItem.totalBP || 0}</td>
      <td>${armorItem.totalGP || 0}</td>
      <td>${armorItem.rarity || 'Common'}</td>
    `;
    
    row.addEventListener('click', () => {
      if (canAfford || selected) {
        toggleEquipment(armorItem.id, availableCurrency, armorItem.totalGP);
      }
    });
    
    list.appendChild(row);
  });
}

function toggleEquipment(itemId, availableCurrency, itemCurrency) {
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
}

function getSpentCurrency() {
  return selectedEquipment.reduce((sum, id) => {
    const weapon = weaponLibrary.find(w => w.id === id);
    const armor = armorLibrary.find(a => a.id === id);
    const item = weapon || armor;
    return sum + (item ? item.totalGP : 0);
  }, 0);
}

function updateEquipmentCurrency() {
  const spent = getSpentCurrency();
  const remaining = 200 - spent;
  const el = document.getElementById('currency');
  if (el) el.textContent = remaining;
  updateEquipmentBonusDisplay();
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
    const item = weapon || armor;
    if (!item) return '';
    
    return `
      <div class="skill-bonus-item">
        <span class="skill-bonus-name">${item.name}</span>
        <span class="skill-fixed-ability">Currency: ${item.totalGP}, Rarity: ${item.rarity || 'N/A'}</span>
        <span class="skill-bonus-value"></span>
      </div>
    `;
  }).filter(Boolean).join('');
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

    equipmentInitialized = true;
  }

  // Load from library
  weaponLibrary = await fetchWeaponsFromLibrary();
  armorLibrary = await fetchArmorFromLibrary();

  // Open weapons and armor sections by default
  const weaponsBody = document.getElementById('weapons-body');
  const weaponsArrow = document.querySelector('#content-equipment .section-header[data-section="weapons"] .toggle-arrow');
  if (weaponsBody) weaponsBody.classList.add('open');
  if (weaponsArrow) weaponsArrow.classList.add('open');

  const armorBody = document.getElementById('armor-body');
  const armorArrow = document.querySelector('#content-equipment .section-header[data-section="armor"] .toggle-arrow');
  if (armorBody) armorBody.classList.add('open');
  if (armorArrow) armorArrow.classList.add('open');

  populateWeapons();
  populateArmor();
  updateEquipmentBonusDisplay();
  updateEquipmentCurrency();
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
