import { allEquipment } from './characterCreator_firebase.js';
import { saveCharacter } from './characterCreator_storage.js';

export let selectedEquipment = [];
let equipmentInitialized = false;

function populateEquipment() {
  const list = document.getElementById('equipment-list');
  if (!list) return;
  
  list.innerHTML = '';
  const searchInput = document.getElementById('equipment-search');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const availableCurrency = 200 - getSpentCurrency();

  let filteredEquipment = allEquipment.filter(equipment => {
    if (searchTerm && !equipment.name.toLowerCase().includes(searchTerm) && !(equipment.description && equipment.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  filteredEquipment.forEach(equipment => {
    const item = document.createElement('div');
    item.className = 'feat-item';
    if (selectedEquipment.includes(equipment.name)) {
      item.classList.add('selected-feat');
    }
    const selected = selectedEquipment.includes(equipment.name);
    const canAfford = equipment.currency <= availableCurrency || selected;
    
    item.innerHTML = `
      <div class="feat-header">
        <h4>${equipment.name} <span style="font-size: 14px; color: #888;">(Currency: ${equipment.currency}, Rarity: ${equipment.rarity || 'N/A'})</span></h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${equipment.description || 'No description'}</p>
        <button class="feat-select-btn ${selected ? 'selected' : ''}" data-name="${equipment.name}" data-type="equipment" ${!canAfford ? 'disabled' : ''}>${selected ? 'Deselect' : 'Select'}</button>
      </div>
    `;
    list.appendChild(item);

    const header = item.querySelector('.feat-header');
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.feat-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    const btn = item.querySelector('.feat-select-btn');
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (selectedEquipment.includes(name)) {
        selectedEquipment = selectedEquipment.filter(n => n !== name);
        btn.textContent = 'Select';
        btn.classList.remove('selected');
        item.classList.remove('selected-feat');
      } else {
        if (equipment.currency > availableCurrency) return;
        selectedEquipment.push(name);
        btn.textContent = 'Deselect';
        btn.classList.add('selected');
        item.classList.add('selected-feat');
      }
      updateEquipmentCurrency();
      if (!window.character) window.character = {};
      window.character.equipment = selectedEquipment;
      saveCharacter();
      
      populateEquipment();
    });
  });
}

function getSpentCurrency() {
  return selectedEquipment.reduce((sum, name) => {
    const eq = allEquipment.find(e => e.name === name);
    return sum + (eq ? eq.currency : 0);
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

  bonusList.innerHTML = selectedEquipment.map(name => {
    const eq = allEquipment.find(e => e.name === name);
    return `
      <div class="skill-bonus-item">
        <span class="skill-bonus-name">${name}</span>
        <span class="skill-fixed-ability">Currency: ${eq.currency}, Rarity: ${eq.rarity || 'N/A'}</span>
        <span class="skill-bonus-value"></span>
      </div>
    `;
  }).join('');
}

function updateEquipmentResources() {
  const char = window.character || {};
  const abilities = char.abilities || {
    strength: 0, vitality: 0, agility: 0,
    acuity: 0, intelligence: 0, charisma: 0
  };
  
  let trainingPoints = 22;
  if (char.archetype) {
    const archetypeAbilities = char.archetype.abilities;
    if (typeof archetypeAbilities === 'string') {
      const abilityKey = archetypeAbilities.toLowerCase();
      trainingPoints += abilities[abilityKey] || 0;
    } else if (typeof archetypeAbilities === 'object') {
      const powerAbil = archetypeAbilities.power ? archetypeAbilities.power.toLowerCase() : '';
      const martialAbil = archetypeAbilities.martial ? archetypeAbilities.martial.toLowerCase() : '';
      const powerVal = abilities[powerAbil] || 0;
      const martialVal = abilities[martialAbil] || 0;
      trainingPoints += Math.max(powerVal, martialVal);
    }
  }
  
  const currency = 200;
  
  let armamentMax = 4;
  if (char.archetype) {
    if (char.archetype.type === 'powered-martial') armamentMax = 8;
    else if (char.archetype.type === 'martial') armamentMax = 16;
  }
  
  const tpEl = document.getElementById('training-points');
  const currEl = document.getElementById('currency');
  const armEl = document.getElementById('armament-max');
  if (tpEl) tpEl.textContent = trainingPoints;
  if (currEl) currEl.textContent = currency;
  if (armEl) armEl.textContent = armamentMax;
}

function initEquipmentUI() {
  if (!equipmentInitialized) {
    const equipmentHeader = document.querySelector('#content-equipment .section-header');
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

    const searchInput = document.getElementById('equipment-search');
    if (searchInput) {
      const newSearchInput = searchInput.cloneNode(true);
      searchInput.parentNode.replaceChild(newSearchInput, searchInput);
      newSearchInput.addEventListener('keyup', populateEquipment);
    }

    equipmentInitialized = true;
  }

  const body = document.getElementById('equipment-body');
  const arrow = document.querySelector('#content-equipment .toggle-arrow');
  if (body) body.classList.add('open');
  if (arrow) arrow.classList.add('open');

  populateEquipment();
  updateEquipmentBonusDisplay();
  updateEquipmentCurrency();
}

document.querySelector('.tab[data-tab="equipment"]')?.addEventListener('click', () => {
  updateEquipmentResources();
});

document.querySelector('.tab[data-tab="equipment"]')?.addEventListener('click', async () => {
  const { loadEquipment } = await import('./characterCreator_firebase.js');
  await loadEquipment();
  initEquipmentUI();
});

export function restoreEquipment() {
  if (window.character?.equipment) {
    selectedEquipment = window.character.equipment;
  }
  initEquipmentUI();
}
