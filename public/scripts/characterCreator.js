// Load header/footer
async function loadHeaderFooter() {
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    if (header) header.innerHTML = await fetch('/header.html').then(r => r.text());
    if (footer) footer.innerHTML = await fetch('/footer.html').then(r => r.text());
}
loadHeaderFooter();

// ========== NEW: localStorage helpers ==========
function saveCharacter() {
    if (window.character) {
        localStorage.setItem('characterCreator_draft', JSON.stringify(window.character));
        console.log('Character saved:', window.character);
    }
}

function loadCharacter() {
    const saved = localStorage.getItem('characterCreator_draft');
    if (saved) {
        try {
            window.character = JSON.parse(saved);
            console.log('Character loaded:', window.character);
            return true;
        } catch (e) {
            console.error('Error loading saved character:', e);
        }
    }
    return false;
}

function clearCharacter() {
    localStorage.removeItem('characterCreator_draft');
    window.character = {};
    location.reload(); // Refresh page to reset UI
}
// ========== END localStorage helpers ==========

// Tab System
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.content');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        contents.forEach(c => c.classList.remove('active'));
        document.getElementById(`content-${tab.dataset.tab}`).classList.add('active');
    });
});

// Archetype Selection
const buttons = document.querySelectorAll('.archetype-btn');
const dropdowns = {
    power: document.getElementById('dropdown-power'),
    'powered-martial': document.getElementById('dropdown-powered-martial'),
    martial: document.getElementById('dropdown-martial')
};
let selectedArchetype = null;
let selectedAbility = null;

buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.id;

        // Deselect previous
        if (selectedArchetype) {
            selectedArchetype.classList.remove('selected');
            dropdowns[selectedArchetype.id].style.display = 'none';
        }

        // Select new
        btn.classList.add('selected');
        selectedArchetype = btn;
        selectedAbility = null; // Reset ability

        // Show dropdown
        const dropdown = dropdowns[id];
        const rect = btn.getBoundingClientRect();
        dropdown.style.display = id === 'powered-martial' ? 'flex' : 'block';
        dropdown.style.top = `${rect.bottom + window.scrollY + 12}px`;

        if (id === 'powered-martial') {
            const dropdownWidth = 340;
            const buttonCenter = rect.left + rect.width / 2;
            dropdown.style.left = `${buttonCenter - dropdownWidth / 2}px`;
            dropdown.style.width = `${dropdownWidth}px`;
        } else {
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.width = `${rect.width}px`;
        }

        // Disable confirm initially
        const confirmBtn = dropdown.querySelector('.dropdown-confirm button');
        confirmBtn.disabled = true;
    });
});

// Selection in dropdowns
document.querySelectorAll('.dropdown ul').forEach(ul => {
    ul.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            ul.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
            e.target.classList.add('selected');
            // Store selected ability temporarily
            const ability = e.target.textContent.trim();
            const dropdownId = ul.closest('.dropdown').id.replace('dropdown-', '');
            if (dropdownId === 'powered-martial') {
                const column = e.target.closest('.column');
                const type = column.querySelector('h3').textContent.toLowerCase().replace(' ', '');
                selectedAbility = selectedAbility || {};
                selectedAbility[type] = ability;
            } else {
                selectedAbility = ability;
            }

            // Enable confirm if all required abilities selected
            const dropdown = ul.closest('.dropdown');
            const confirmBtn = dropdown.querySelector('.dropdown-confirm button');
            if (dropdownId === 'powered-martial') {
                confirmBtn.disabled = !selectedAbility || !selectedAbility.power || !selectedAbility.martial;
            } else {
                confirmBtn.disabled = !selectedAbility;
            }
        }
    });
});

// Confirm buttons
document.getElementById('confirm-power').addEventListener('click', () => confirmArchetype());
document.getElementById('confirm-martial').addEventListener('click', () => confirmArchetype());
document.getElementById('confirm-powered-martial').addEventListener('click', () => confirmArchetype());

function confirmArchetype() {
    if (!selectedArchetype || !selectedAbility) return;

    // Lock in
    window.character = window.character || {};
    window.character.archetype = { type: selectedArchetype.id, abilities: selectedAbility };
    saveCharacter(); // NEW: Save to localStorage

    // Update UI
    document.querySelectorAll('.archetype-btn').forEach(btn => btn.style.display = 'none');
    document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');

    const lockedDiv = document.getElementById('archetype-locked');
    lockedDiv.style.display = 'block';
    document.getElementById('locked-archetype').textContent = selectedArchetype.textContent;
    const abilityText = typeof selectedAbility === 'string' ? selectedAbility : Object.values(selectedAbility).join(' / ');
    document.getElementById('locked-ability').textContent = abilityText;
}

// Change archetype button
document.getElementById('change-archetype').addEventListener('click', () => {
    // Reset
    selectedArchetype = null;
    selectedAbility = null;
    document.getElementById('archetype-locked').style.display = 'none';
    document.querySelectorAll('.archetype-btn').forEach(btn => {
        btn.style.display = '';
        btn.classList.remove('selected');
    });
});

// Close dropdown only on outside click
document.addEventListener('click', (e) => {
    if (selectedArchetype && !e.target.closest('.archetype-btn') && !e.target.closest('.dropdown')) {
        selectedArchetype.classList.remove('selected');
        dropdowns[selectedArchetype.id].style.display = 'none';
        selectedArchetype = null;
        selectedAbility = null;
    }
});

// Prevent dropdown click from closing
document.querySelectorAll('.dropdown').forEach(d => {
    d.addEventListener('click', (e) => e.stopPropagation());
});

// Firebase imports and initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

// Fetch config and initialize Firebase/appCheck
async function initializeFirebase() {
  const response = await fetch('/__/firebase/init.json');
  const firebaseConfig = await response.json();
  firebaseConfig.authDomain = 'realmsroleplaygame.com';
  const app = initializeApp(firebaseConfig);
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
    isTokenAutoRefreshEnabled: true
  });
  await new Promise(resolve => setTimeout(resolve, 500));
  return getDatabase(app);
}

let db;
let allTraits = {};
let allSpecies = [];
let allFeats = [];
let archetypeFeats = [];
let characterFeats = [];
let selectedArchetypeFeats = [];
let selectedCharacterFeats = [];
let featsInitialized = false;
let traitsLoaded = false;
let speciesLoaded = false;
let allSkills = [];
let selectedSkills = [];
let skillsInitialized = false;
let accordionInitialized = false; // Add this new flag

// Load traits
async function loadTraits() {
  if (traitsLoaded) return;
  console.log('Loading traits...');
  const snap = await get(ref(db, 'traits'));
  const data = snap.val();
  if (data) {
    allTraits = data;
    console.log(`✓ Loaded ${Object.keys(allTraits).length} traits`);
  }
  traitsLoaded = true;
}

// Load species
async function loadSpecies() {
  if (speciesLoaded) return;
  console.log('Loading species...');
  const snap = await get(ref(db, 'species'));
  const data = snap.val();
  if (!data) return;
  allSpecies = Object.values(data).map(s => {
    let adulthood_lifespan = Array.isArray(s.adulthood_lifespan) ? s.adulthood_lifespan.map(n => parseInt(String(n).trim())) : (typeof s.adulthood_lifespan === 'string' ? s.adulthood_lifespan.split(',').map(n => parseInt(n.trim())) : [0, 0]);
    let adulthood = adulthood_lifespan[0] || 0;
    let max_age = adulthood_lifespan[1] || 0;
    let skills = typeof s.skills === 'string' ? s.skills.split(',').map(sk => sk.trim()) : (Array.isArray(s.skills) ? s.skills : []);
    let languages = typeof s.languages === 'string' ? s.languages.split(',').map(l => l.trim()) : (Array.isArray(s.languages) ? s.languages : []);
    let species_traits = typeof s.species_traits === 'string' ? s.species_traits.split(',').map(name => name.trim()) : (Array.isArray(s.species_traits) ? s.species_traits : []);
    let ancestry_traits = typeof s.ancestry_traits === 'string' ? s.ancestry_traits.split(',').map(name => name.trim()) : (Array.isArray(s.ancestry_traits) ? s.ancestry_traits : []);
    let flaws = typeof s.flaws === 'string' ? s.flaws.split(',').map(name => name.trim()) : (Array.isArray(s.flaws) ? s.flaws : []);
    let characteristics = typeof s.characteristics === 'string' ? s.characteristics.split(',').map(name => name.trim()) : (Array.isArray(s.characteristics) ? s.characteristics : []);
    function sanitizeId(name) {
      if (!name) return '';
      return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }
    species_traits = species_traits.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    ancestry_traits = ancestry_traits.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    flaws = flaws.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    characteristics = characteristics.map(name => ({ name, desc: allTraits[sanitizeId(name)]?.description || 'No description' }));
    return {
      ...s,
      ave_height: s.ave_hgt_cm,
      ave_weight: s.ave_wgt_kg,
      adulthood,
      max_age,
      skills,
      languages,
      species_traits,
      ancestry_traits,
      flaws,
      characteristics,
      sizes: typeof s.sizes === 'string' ? s.sizes.split(',').map(sz => sz.trim()) : (Array.isArray(s.sizes) ? s.sizes : []),
      type: s.type || '',
    };
  });
  console.log(`✓ Loaded ${allSpecies.length} species`);
  speciesLoaded = true;
}

// Load feats from Firebase
async function loadFeats() {
  if (allFeats.length > 0) return;
  console.log('Loading feats...');
  const snap = await get(ref(db, 'feats'));
  const data = snap.val();
  if (data) {
    allFeats = Object.values(data).map(f => ({
      ...f,
      char_feat: f.char_feat || false,
    }));
    archetypeFeats = allFeats.filter(f => !f.char_feat);
    characterFeats = allFeats.filter(f => f.char_feat);
    console.log(`✓ Loaded ${allFeats.length} feats (${archetypeFeats.length} archetype, ${characterFeats.length} character)`);
  }
}

// Function to populate a feats section
function populateFeatsSection(sectionId, feats, isArchetype) {
  const list = document.getElementById(`${sectionId}-feats-list`);
  list.innerHTML = '';
  const searchTerm = document.getElementById(`${sectionId}-search`).value.toLowerCase();
  const char = window.character || {};
  const abilities = char.abilities || {}; // Assume abilities are stored as {strength: 1, ...}

  let filteredFeats = feats.filter(feat => {
    // Always include selected feats
    if ((isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name)) return true;

    // If no search term, don't include others
    if (!searchTerm) return false;
    
    // Apply filters for all feats
    if (feat.lvl_req > 1) return false;
    if (feat.ability_req && Array.isArray(feat.ability_req) && feat.abil_req_val && Array.isArray(feat.abil_req_val)) {
      for (let i = 0; i < feat.ability_req.length; i++) {
        const reqAbil = feat.ability_req[i].toLowerCase();
        const reqVal = feat.abil_req_val[i] || 0;
        if ((abilities[reqAbil] || 0) < reqVal) return false;
      }
    }
    if (!feat.name.toLowerCase().includes(searchTerm) && !(feat.description && feat.description.toLowerCase().includes(searchTerm))) return false;
    return true;
  });

  const selectedFeats = filteredFeats.filter(feat => (isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name));
  const nonSelectedFeats = filteredFeats.filter(feat => !(isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name));

  // Display non-selected first
  [...nonSelectedFeats, ...selectedFeats].forEach(feat => {
    const item = document.createElement('div');
    item.className = 'feat-item';
    if ((isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name)) {
      item.classList.add('selected-feat');
    }
    const selected = (isArchetype ? selectedArchetypeFeats : selectedCharacterFeats).includes(feat.name);
    item.innerHTML = `
      <div class="feat-header">
        <h4>${feat.name}</h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${feat.description || 'No description'}</p>
        <button class="feat-select-btn ${selected ? 'selected' : ''}" data-name="${feat.name}" data-type="${isArchetype ? 'archetype' : 'character'}">${selected ? 'Deselect' : 'Select'}</button>
      </div>
    `;
    list.appendChild(item);

    // Toggle expansion
    const header = item.querySelector('.feat-header');
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.feat-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    // Select button
    const btn = item.querySelector('.feat-select-btn');
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const type = btn.dataset.type;
      if (type === 'archetype') {
        const char = window.character || {};
        const archetype = char.archetype || {};
        let limit = 0;
        if (archetype.type === 'martial') limit = 3;
        else if (archetype.type === 'powered-martial') limit = 2;
        else if (archetype.type === 'power') limit = 1;
        if (selectedArchetypeFeats.includes(name)) {
          selectedArchetypeFeats = selectedArchetypeFeats.filter(n => n !== name);
          btn.textContent = 'Select';
          btn.classList.remove('selected');
          item.classList.remove('selected-feat');
        } else if (selectedArchetypeFeats.length < limit) {
          selectedArchetypeFeats.push(name);
          btn.textContent = 'Deselect';
          btn.classList.add('selected');
          item.classList.add('selected-feat');
        }
      } else {
        if (selectedCharacterFeats.includes(name)) {
          selectedCharacterFeats = selectedCharacterFeats.filter(n => n !== name);
          btn.textContent = 'Select';
          btn.classList.remove('selected');
          item.classList.remove('selected-feat');
        } else if (selectedCharacterFeats.length < 1) {
          selectedCharacterFeats.push(name);
          btn.textContent = 'Deselect';
          btn.classList.add('selected');
          item.classList.add('selected-feat');
        }
      }
      // Store in character
      if (!window.character) window.character = {};
      window.character.feats = {
        archetype: selectedArchetypeFeats,
        character: selectedCharacterFeats
      };
      saveCharacter(); // NEW: Ensure this line exists
    });
  });
}

// Setup feats tab
function initFeats() {
  if (!featsInitialized) {
    // Accordion for main sections - only initialize once
    document.querySelectorAll('#content-feats .section-header').forEach(header => {
      // Remove any existing listeners by cloning
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
      
      newHeader.addEventListener('click', () => {
        const body = newHeader.nextElementSibling;
        const arrow = newHeader.querySelector('.toggle-arrow');
        if (body && arrow) {
          body.classList.toggle('open');
          arrow.classList.toggle('open');
        }
      });
    });

    // Search functionality for each section - only initialize once
    document.querySelectorAll('#content-feats .search-input').forEach(input => {
      // Remove existing listeners by cloning
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      newInput.addEventListener('keyup', () => {
        const sectionId = newInput.id.replace('-search', '');
        populateFeatsSection(sectionId, sectionId === 'archetype' ? archetypeFeats : characterFeats, sectionId === 'archetype');
      });
    });

    // Continue button - only initialize once
    const continueBtn = document.getElementById('feats-continue');
    const newContinueBtn = continueBtn.cloneNode(true);
    continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
    newContinueBtn.addEventListener('click', () => {
      document.querySelector('.tab[data-tab="equipment"]').click();
    });

    // Open Codex button - only initialize once
    const codexBtn = document.getElementById('open-codex');
    const newCodexBtn = codexBtn.cloneNode(true);
    codexBtn.parentNode.replaceChild(newCodexBtn, codexBtn);
    newCodexBtn.addEventListener('click', () => {
      window.open('/codex.html', '_blank');
    });

    featsInitialized = true;
  }

  // Update description based on archetype
  const char = window.character || {};
  const archetype = char.archetype || {};
  let archetypeName = 'Unknown';
  let featCount = 0;
  if (archetype.type === 'martial') {
    archetypeName = 'Martial';
    featCount = 3;
  } else if (archetype.type === 'powered-martial') {
    archetypeName = 'Powered-Martial';
    featCount = 2;
  } else if (archetype.type === 'power') {
    archetypeName = 'Power';
    featCount = 1;
  }
  let featText = featCount === 1 ? 'archetype feat' : 'archetype feats';
  const descEl = document.getElementById('feats-description');
  descEl.innerHTML = `As a <strong>${archetypeName} archetype</strong>, you get to choose <strong>${featCount} ${featText}</strong>, and <strong>one character feat</strong>! Open a new tab to the codex and search through feats that might fit your character idea, abilities, and archetype! Once you find the ones you like, search for their names here and add them to your character.`;

  populateFeatsSection('archetype', archetypeFeats, true);
  populateFeatsSection('character', characterFeats, false);
  
  // Ensure sections are open by default
  document.querySelectorAll('#content-feats .section-body').forEach(body => {
    body.classList.add('open');
  });
  document.querySelectorAll('#content-feats .toggle-arrow').forEach(arrow => {
    arrow.classList.add('open');
  });
}

// Initialize and load data
(async () => {
  db = await initializeFirebase();
  await loadTraits();
  await loadSpecies();
  await loadFeats();
  await loadSkills(); // NEW: Load skills early
  populateAncestryGrid();
  
  // NEW: Restore saved character state
  const hasData = loadCharacter();
  if (hasData && window.character) {
    restoreCharacterState();
  }
})();

// NEW: Function to restore UI from saved data
function restoreCharacterState() {
  const char = window.character;
  if (!char) return;
  
  // Restore archetype
  if (char.archetype) {
    const archetypeBtn = document.getElementById(char.archetype.type);
    if (archetypeBtn) {
      selectedArchetype = archetypeBtn;
      selectedAbility = char.archetype.abilities;
      archetypeBtn.classList.add('selected');
      
      // Show locked state
      document.querySelectorAll('.archetype-btn').forEach(btn => btn.style.display = 'none');
      document.querySelectorAll('.dropdown').forEach(d => d.style.display = 'none');
      const lockedDiv = document.getElementById('archetype-locked');
      lockedDiv.style.display = 'block';
      document.getElementById('locked-archetype').textContent = archetypeBtn.textContent;
      const abilityText = typeof selectedAbility === 'string' ? selectedAbility : Object.values(selectedAbility).join(' / ');
      document.getElementById('locked-ability').textContent = abilityText;
    }
  }
  
  // Restore selected feats
  if (char.feats) {
    selectedArchetypeFeats = char.feats.archetype || [];
    selectedCharacterFeats = char.feats.character || [];
  }
  
  // Restore selected skills
  if (char.skills) {
    selectedSkills = char.skills;
  }
  
  // Note: Species traits are restored when the Ancestry tab is activated
  
  console.log('Character state restored');
}

// Populate ancestry grid dynamically
function populateAncestryGrid() {
  const grid = document.getElementById('ancestry-grid');
  grid.innerHTML = '';
  allSpecies.forEach(species => {
    const card = document.createElement('div');
    card.className = 'species-card';
    card.dataset.species = species.name.toLowerCase().replace(/\s+/g, '');
    card.innerHTML = `
      <div class="species-img" style="background-image: url('${species.image || 'https://via.placeholder.com/140'}')"></div>
      <h3 class="species-name">${species.name}</h3>
    `;
    grid.appendChild(card);
  });
  setupModal();
}

// Setup modal
function setupModal() {
  const modal = document.getElementById('ancestry-modal');
  const modalClose = document.querySelector('.modal-close');
  const modalChoose = document.querySelector('.modal-choose');
  const modalNah = document.querySelector('.modal-nah');
  const showMoreBtn = document.getElementById('show-more-desc');
  const descEl = document.getElementById('modal-species-description');

  document.querySelectorAll('.species-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.species;
      const species = allSpecies.find(s => s.name.toLowerCase().replace(/\s+/g, '') === key);
      if (!species) return;

      // Header (no image)
      document.querySelector('.modal-species-name').textContent = species.name;
      if (descEl) {
        descEl.textContent = species.description || 'No description available.';
        descEl.classList.add('truncated-description');
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = 'Show More';
      }

      // Stats
      document.querySelector('.stat-height').textContent = species.ave_height ? `${Math.floor(species.ave_height / 30.48)}'${Math.round((species.ave_height % 30.48) / 2.54)}"` : 'N/A';
      document.querySelector('.stat-weight').textContent = species.ave_weight ? `${species.ave_weight} kg` : 'N/A';
      document.querySelector('.stat-type').textContent = species.type;
      document.querySelector('.stat-skills').textContent = species.skills.join(', ') || 'None';
      document.querySelector('.stat-adulthood').textContent = species.adulthood || 'N/A';
      document.querySelector('.stat-languages').textContent = species.languages.join(', ') || 'None';
      document.querySelector('.stat-maxage').textContent = species.max_age || 'N/A';

      // Traits
      const fillSection = (id, arr) => {
        const container = document.getElementById(id);
        container.innerHTML = '';
        arr.forEach(t => {
          const el = document.createElement('div');
          el.className = 'trait-item';
          el.innerHTML = `<strong>${t.name}</strong>${t.desc}`;
          container.appendChild(el);
        });
      };

      fillSection('species-traits', species.species_traits);
      fillSection('ancestry-traits', species.ancestry_traits);
      fillSection('characteristics', species.characteristics);

      modal.classList.remove('hidden');
    });
  });

  // Show more/less for description
  showMoreBtn.addEventListener('click', () => {
    if (descEl.classList.contains('truncated-description')) {
      descEl.classList.remove('truncated-description');
      showMoreBtn.textContent = 'Show Less';
    } else {
      descEl.classList.add('truncated-description');
      showMoreBtn.textContent = 'Show More';
    }
  });

  // Close modal
  function closeModal() { modal.classList.add('hidden'); }
  modalClose.addEventListener('click', closeModal);
  modalNah.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // Choose button
  modalChoose.addEventListener('click', () => {
    const chosenName = document.querySelector('.modal-species-name').textContent;
    const chosenSpecies = allSpecies.find(s => s.name === chosenName);
    if (!chosenSpecies) return;

    // Store globally - only save species name, not full object
    window.character = window.character || {};
    window.character.speciesName = chosenSpecies.name;
    saveCharacter();

    closeModal();
    // Switch to Ancestry tab
    document.querySelector('.tab[data-tab="ancestry"]').click();
  });
}

// ----------  ADD THESE NEW FUNCTIONS AFTER setupModal() ----------
function closeModal() { document.getElementById('ancestry-modal').classList.add('hidden'); }

function fillTraitSection(type, traitArray, showDefinition, selectable, hasLimit) {
  const bodyId = `${type}-section-body`;
  const defId = showDefinition ? `${type}-definition` : null;
  const container = document.getElementById(bodyId);
  container.innerHTML = '';

  if (!traitArray || traitArray.length === 0) {
    container.innerHTML = '<p style="color:#888;">None</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'trait-list';

  traitArray.forEach(t => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="trait-content">
        <div class="trait-name">${t.name}</div>
        <div class="trait-desc">${t.desc}</div>
      </div>
      ${selectable ? '<button class="add-btn">+</button>' : ''}
    `;
    li.dataset.desc = t.desc;

    if (selectable) {
      const addBtn = li.querySelector('.add-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectTrait(type, t, li, hasLimit);
      });
    } else {
      li.addEventListener('click', () => {
        if (showDefinition) {
          const defBox = document.getElementById(defId);
          defBox.textContent = t.desc;
          defBox.classList.add('show');
        }
      });
    }

    ul.appendChild(li);
  });

  container.appendChild(ul);

  // Auto-open species traits
  if (type === 'species') {
    container.classList.add('open');
    container.previousElementSibling.querySelector('.toggle-arrow').classList.add('open');
  }
}

function selectTrait(type, trait, li, hasLimit) {
  const char = window.character || {};
  let selected;

  if (type === 'ancestry') {
    selected = char.ancestryTraits ? char.ancestryTraits.find(t => t.name === trait.name) : null;
  } else if (type === 'characteristic') {
    selected = char.characteristicTrait;
  } else if (type === 'flaw') {
    selected = char.flawTrait;
  }

  if (selected && selected.name === trait.name) {
    // Deselect
    li.classList.remove('selected');
    if (type === 'ancestry') {
      char.ancestryTraits = char.ancestryTraits.filter(t => t.name !== trait.name);
    } else if (type === 'characteristic') {
      delete char.characteristicTrait;
    } else if (type === 'flaw') {
      delete char.flawTrait;
      // Special handling for flaw deselection - remove excess ancestry trait if exists
      if (char.ancestryTraits && char.ancestryTraits.length > 1) {
        char.ancestryTraits.pop();
      }
    }
  } else {
    // Select, but check limits
    if (hasLimit) {
      if (type === 'ancestry') {
        const flawSelected = char.flawTrait;
        const limit = flawSelected ? 2 : 1;
        if (char.ancestryTraits && char.ancestryTraits.length >= limit) return;
      } else if (type === 'characteristic' && char.characteristicTrait) return;
      else if (type === 'flaw' && char.flawTrait) return; // Only allow one flaw
    }

    // For flaw: deselect any previously selected flaw first
    if (type === 'flaw') {
      // Remove 'selected' class from all flaw list items
      document.querySelectorAll('#flaw-section-body .trait-list li').forEach(item => {
        item.classList.remove('selected');
      });
    }

    li.classList.add('selected');
    if (type === 'ancestry') {
      if (!char.ancestryTraits) char.ancestryTraits = [];
      char.ancestryTraits.push({ name: trait.name, desc: trait.desc });
    } else if (type === 'characteristic') {
      char.characteristicTrait = { name: trait.name, desc: trait.desc };
    } else if (type === 'flaw') {
      char.flawTrait = { name: trait.name, desc: trait.desc };
    }
  }

  saveCharacter();
}

function showTraitSelection(species) {
  // Populate species details (always shown in Ancestry tab)
  document.getElementById('selected-species-img').style.backgroundImage = `url('${species.image || 'https://via.placeholder.com/120'}')`;
  document.getElementById('selected-species-name').textContent = species.name;
  document.getElementById('selected-species-description').textContent = species.description || 'No description available.';
  document.getElementById('selected-stat-height').textContent = species.ave_height ? `${Math.floor(species.ave_height / 30.48)}'${Math.round((species.ave_height % 30.48) / 2.54)}"` : 'N/A';
  document.getElementById('selected-stat-weight').textContent = species.ave_weight ? `${species.ave_weight} kg` : 'N/A';
  document.getElementById('selected-stat-type').textContent = species.type || 'N/A';
  document.getElementById('selected-stat-skills').textContent = species.skills.join(', ') || 'None';
  document.getElementById('selected-stat-adulthood').textContent = species.adulthood || 'N/A';
  document.getElementById('selected-stat-languages').textContent = species.languages.join(', ') || 'None';
  document.getElementById('selected-stat-maxage').textContent = species.max_age || 'N/A';

  // Fill trait sections
  fillTraitSection('species', species.species_traits, false, false, false); // Read-only
  fillTraitSection('ancestry', species.ancestry_traits, true, true, true); // Selectable, with limit
  fillTraitSection('characteristic', species.characteristics, true, true, true); // Selectable, with limit
  fillTraitSection('flaw', species.flaws, false, true, true); // NEW: Changed to true for hasLimit

  // Accordion toggles
  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.toggle-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });
  });

  // Continue button
  document.getElementById('ancestry-continue').onclick = () => {
    document.querySelector('.tab[data-tab="abilities"]').click();
  };
}

// Call showTraitSelection when Ancestry tab is activated, if species is chosen
document.querySelector('.tab[data-tab="ancestry"]').addEventListener('click', () => {
  if (window.character && window.character.speciesName) {
    // Find species by name from loaded data
    const species = allSpecies.find(s => s.name === window.character.speciesName);
    if (species) {
      showTraitSelection(species);
      
      // Restore selected traits if they exist
      restoreTraitSelections();
    }
  }
});

// NEW: Function to restore trait selections
function restoreTraitSelections() {
  const char = window.character;
  if (!char) return;
  
  // Restore ancestry traits
  if (char.ancestryTraits && char.ancestryTraits.length > 0) {
    char.ancestryTraits.forEach(trait => {
      const li = Array.from(document.querySelectorAll('#ancestry-section-body .trait-list li')).find(
        item => item.querySelector('.trait-name').textContent === trait.name
      );
      if (li) li.classList.add('selected');
    });
  }
  
  // Restore characteristic
  if (char.characteristicTrait) {
    const li = Array.from(document.querySelectorAll('#characteristic-section-body .trait-list li')).find(
      item => item.querySelector('.trait-name').textContent === char.characteristicTrait.name
    );
    if (li) li.classList.add('selected');
  }
  
  // Restore flaw
  if (char.flawTrait) {
    const li = Array.from(document.querySelectorAll('#flaw-section-body .trait-list li')).find(
      item => item.querySelector('.trait-name').textContent === char.flawTrait.name
    );
    if (li) li.classList.add('selected');
  }
}

// Abilities Initialization
function initAbilities() {
  const abilities = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
  let values = new Array(6).fill(0);
  const pointsSpan = document.getElementById('ability-points');

  // NEW: Load saved values if they exist
  if (window.character && window.character.abilityValues) {
    values = [...window.character.abilityValues];
  }

  function updateDisplay() {
    const sum = values.reduce((a, b) => a + b, 0);
    pointsSpan.textContent = 7 - sum;

    document.querySelectorAll('.abilities-values .value').forEach((span, i) => {
      const v = values[i];
      span.textContent = v > 0 ? `+${v}` : v;
    });
    
    // NEW: Save ability values
    if (!window.character) window.character = {};
    window.character.abilityValues = values;
    window.character.abilities = {
      strength: values[0],
      vitality: values[1],
      agility: values[2],
      acuity: values[3],
      intelligence: values[4],
      charisma: values[5]
    };
    saveCharacter();

    // NEW: refresh skill bonus values after ability changes
    if (document.getElementById('skills-bonus-list')) {
      updateSkillsBonusDisplay();
    }
  }

  // Bold selected abilities from archetype
  const char = window.character || {};
  const selectedAbilities = [];
  if (char.archetype) {
    if (Array.isArray(char.archetype.abilities)) {
      selectedAbilities.push(...char.archetype.abilities.map(a => a.toLowerCase()));
    } else if (typeof char.archetype.abilities === 'object') {
      Object.values(char.archetype.abilities).forEach(a => selectedAbilities.push(a.toLowerCase()));
    }
  }
  document.querySelectorAll('.abilities-controls .ability-name').forEach((nameEl, i) => {
    const abilityName = abilities[i];
    if (selectedAbilities.includes(abilityName)) {
      nameEl.style.fontWeight = 'bold';
    } else {
      nameEl.style.fontWeight = 'normal';
    }
  });

  document.querySelectorAll('.abilities-values .control').forEach((control, i) => {
    const dec = control.querySelector('.dec');
    const inc = control.querySelector('.inc');

    dec.addEventListener('click', () => {
      if (values[i] > -2) {
        values[i]--;
        const negSum = values.filter(v => v < 0).reduce((a, b) => a + b, 0);
        if (negSum < -3) {
          values[i]++;
          return;
        }
        updateDisplay();
      }
    });

    inc.addEventListener('click', () => {
      const currentSum = values.reduce((a, b) => a + b, 0);
      const currentPoints = 7 - currentSum;
      if (values[i] < 3 && currentPoints > 0) {
        values[i]++;
        updateDisplay();
      }
    });
  });

  updateDisplay();
}

// Call initAbilities when the page loads or tab is activated
document.querySelector('.tab[data-tab="abilities"]').addEventListener('click', () => {
  initAbilities();
});

// Initialize when feats tab is activated
document.querySelector('.tab[data-tab="feats"]').addEventListener('click', async () => {
  await loadFeats();
  initFeats();
});

// Add continue button for skills tab
document.getElementById('skills-continue').addEventListener('click', () => {
  document.querySelector('.tab[data-tab="feats"]').click();
});

// Load skills
async function loadSkills() {
  if (allSkills.length > 0) return;
  console.log('Loading skills...');
  const snap = await get(ref(db, 'skills'));
  const data = snap.val();
  if (data) {
    allSkills = Object.values(data).map(s => ({
      ...s,
      ability: typeof s.ability === 'string' ? s.ability.split(',').map(a => a.trim()).filter(a => a) : (Array.isArray(s.ability) ? s.ability : []),
    }));
    console.log(`✓ Loaded ${allSkills.length} skills`);
  }
}

// Function to populate skills
function populateSkills() {
  const list = document.getElementById('skills-list');
  list.innerHTML = '';
  const searchTerm = document.getElementById('skills-search').value.toLowerCase();
  const char = window.character || {};
  
  // NEW: Look up species by name from allSpecies array
  const species = char.speciesName ? allSpecies.find(s => s.name === char.speciesName) : null;
  const speciesSkills = species ? species.skills : [];

  let filteredSkills = allSkills.filter(skill => {
    if (searchTerm && !skill.name.toLowerCase().includes(searchTerm) && !(skill.description && skill.description.toLowerCase().includes(searchTerm))) return false;
    // Filter out sub-skills unless base skill is selected
    if (skill.base_skill && !selectedSkills.includes(skill.base_skill)) return false;
    return true;
  });

  filteredSkills.forEach(skill => {
    const item = document.createElement('div');
    item.className = 'feat-item';
    if (selectedSkills.includes(skill.name)) {
      item.classList.add('selected-feat');
    }
    const selected = selectedSkills.includes(skill.name);
    const isSpeciesSkill = speciesSkills.includes(skill.name);
    const abilitiesText = skill.ability.length ? ` (${skill.ability.join(', ')})` : '';
    item.innerHTML = `
      <div class="feat-header">
        <h4>${skill.name}<span style="font-weight: normal; font-size: 14px; color: #888;">${abilitiesText}</span>${isSpeciesSkill ? '<span style="font-size: 12px; color: #0a4a7a; margin-left: 8px;">(Species)</span>' : ''}</h4>
        <span class="feat-arrow">▼</span>
      </div>
      <div class="feat-body">
        <p>${skill.description || 'No description'}</p>
        <button class="feat-select-btn ${selected ? 'selected' : ''}" data-name="${skill.name}" data-type="skill" ${isSpeciesSkill ? 'disabled' : ''}>${selected ? 'Deselect' : 'Select'}</button>
      </div>
    `;
    list.appendChild(item);

    // Toggle expansion
    const header = item.querySelector('.feat-header');
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.feat-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });

    // Select button
    const btn = item.querySelector('.feat-select-btn');
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      if (selectedSkills.includes(name)) {
        // Prevent deselection of species skills
        if (speciesSkills.includes(name)) return;
        selectedSkills = selectedSkills.filter(n => n !== name);
        // If it's a base skill, deselect associated sub-skills
        const subSkills = allSkills.filter(s => s.base_skill === name).map(s => s.name);
        selectedSkills = selectedSkills.filter(n => !subSkills.includes(n));
        btn.textContent = 'Select';
        btn.classList.remove('selected');
        item.classList.remove('selected-feat');
      } else {
        selectedSkills.push(name);
        btn.textContent = 'Deselect';
        btn.classList.add('selected');
        item.classList.add('selected-feat');
      }
      updateSkillPoints();
      // Store in character
      if (!window.character) window.character = {};
      window.character.skills = selectedSkills;
      saveCharacter();
    });
  });
}

function updateSkillPoints() {
  const points = 5 - selectedSkills.length;
  document.getElementById('skill-points').textContent = points;
  updateSkillsBonusDisplay(); // NEW: Update bonus display
}

// NEW: Function to update skills bonus display
function updateSkillsBonusDisplay() {
  const bonusList = document.getElementById('skills-bonus-list');
  const char = window.character || {};
  if (!window.character) window.character = {};
  window.character.skillAbilities = window.character.skillAbilities || {};

  const species = char.speciesName ? allSpecies.find(s => s.name === char.speciesName) : null;
  const speciesSkills = species ? species.skills : [];
  
  if (selectedSkills.length === 0) {
    bonusList.innerHTML = '<p class="no-skills-message">No skills selected yet</p>';
    return;
  }

  // Ensure abilities object exists
  const abilityVals = (char.abilities) ? char.abilities : {
    strength: 0, vitality: 0, agility: 0,
    acuity: 0, intelligence: 0, charisma: 0
  };

  const sortedSkills = [...selectedSkills].sort();

  bonusList.innerHTML = sortedSkills.map(skillName => {
    const isSpeciesSkill = speciesSkills.includes(skillName);
    const skillObj = allSkills.find(s => s.name === skillName);
    const abilList = (skillObj && Array.isArray(skillObj.ability)) ? skillObj.ability : [];
    let chosenAbility;

    if (abilList.length === 1) {
      chosenAbility = abilList[0];
      window.character.skillAbilities[skillName] = chosenAbility;
      const abilKey = chosenAbility.toLowerCase();
      const rawVal = abilityVals[abilKey] ?? 0;
      const displayVal = rawVal >= 0 ? `+${rawVal}` : rawVal;
      return `
        <div class="skill-bonus-item ${isSpeciesSkill ? 'species-skill' : ''}">
          <span class="skill-bonus-name">${skillName}${isSpeciesSkill ? ' <span style="font-size:11px;color:#0a4a7a;">(Species)</span>' : ''}</span>
          <span class="skill-fixed-ability">${chosenAbility}</span>
          <span class="skill-bonus-value">${displayVal}</span>
        </div>
      `;
    }

    if (abilList.length > 1) {
      chosenAbility = window.character.skillAbilities[skillName] || abilList[0];
      if (!window.character.skillAbilities[skillName]) {
        window.character.skillAbilities[skillName] = chosenAbility;
      }
      const abilKey = chosenAbility.toLowerCase();
      const rawVal = abilityVals[abilKey] ?? 0;
      const displayVal = rawVal >= 0 ? `+${rawVal}` : rawVal;
      const selectHtml = `<select class="skill-ability-select" data-skill="${skillName}">
        ${abilList.map(a => `<option value="${a}" ${a === chosenAbility ? 'selected' : ''}>${a}</option>`).join('')}
      </select>`;
      return `
        <div class="skill-bonus-item ${isSpeciesSkill ? 'species-skill' : ''}">
          <span class="skill-bonus-name">${skillName}${isSpeciesSkill ? ' <span style="font-size:11px;color:#0a4a7a;">(Species)</span>' : ''}</span>
          ${selectHtml}
          <span class="skill-bonus-value">${displayVal}</span>
        </div>
      `;
    }

    // No abilities listed
    const displayVal = '+0';
    return `
      <div class="skill-bonus-item ${isSpeciesSkill ? 'species-skill' : ''}">
        <span class="skill-bonus-name">${skillName}${isSpeciesSkill ? ' <span style="font-size:11px;color:#0a4a7a;">(Species)</span>' : ''}</span>
        <span class="skill-fixed-ability">—</span>
        <span class="skill-bonus-value">${displayVal}</span>
      </div>
    `;
  }).join('');

  saveCharacter();
}

// Delegate ability select changes
document.addEventListener('change', (e) => {
  if (e.target.matches('.skill-ability-select')) {
    const skill = e.target.dataset.skill;
    const val = e.target.value;
    if (!window.character) window.character = {};
    window.character.skillAbilities = window.character.skillAbilities || {};
    window.character.skillAbilities[skill] = val;
    saveCharacter();
    updateSkillsBonusDisplay(); // NEW
  }
});

// Initialize skills tab
function initSkills() {
  if (!skillsInitialized) {
    // Accordion for skills - only initialize once
    const skillsHeader = document.querySelector('#content-skills .section-header');
    const newSkillsHeader = skillsHeader.cloneNode(true);
    skillsHeader.parentNode.replaceChild(newSkillsHeader, skillsHeader);
    
    newSkillsHeader.addEventListener('click', () => {
      const body = document.getElementById('skills-body');
      const arrow = newSkillsHeader.querySelector('.toggle-arrow');
      if (body && arrow) {
        body.classList.toggle('open');
        arrow.classList.toggle('open');
      }
    });

    // Search functionality - only initialize once
    const searchInput = document.getElementById('skills-search');
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    newSearchInput.addEventListener('keyup', populateSkills);

    // Open Codex button - only initialize once
    const codexBtn = document.getElementById('open-codex-skills');
    const newCodexBtn = codexBtn.cloneNode(true);
    codexBtn.parentNode.replaceChild(newCodexBtn, codexBtn);
    newCodexBtn.addEventListener('click', () => {
      window.open('/codex.html', '_blank');
    });

    // Continue button - only initialize once
    const continueBtn = document.getElementById('skills-continue');
    const newContinueBtn = continueBtn.cloneNode(true);
    continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
    newContinueBtn.addEventListener('click', () => {
      document.querySelector('.tab[data-tab="feats"]').click();
    });

    skillsInitialized = true;
  }

  // Set accordion open by default
  const body = document.getElementById('skills-body');
  const arrow = document.querySelector('#content-skills .toggle-arrow');
  if (body) body.classList.add('open');
  if (arrow) arrow.classList.add('open');

  // Update description based on species - NEW: Look up species by name
  const char = window.character || {};
  const species = char.speciesName ? allSpecies.find(s => s.name === char.speciesName) : null;
  const speciesSkills = species ? species.skills : [];
  const skillsText = speciesSkills.length ? speciesSkills.join(', ') : 'None';
  const descEl = document.getElementById('skills-description');
  descEl.innerHTML = `Now you can choose your skills. Picking a new skill grants you proficiency, while allocating more points to a skill you have increases its bonus!<br><strong>Species Skills: ${skillsText}</strong>`;

  // Auto-select species skills - only if not already in selectedSkills
  const skillsToAdd = speciesSkills.filter(skill => !selectedSkills.includes(skill));
  selectedSkills = [...selectedSkills, ...skillsToAdd];
  updateSkillPoints();

  populateSkills();
  updateSkillsBonusDisplay(); // NEW: Initial display of bonus section
}

// Initialize when skills tab is activated
document.querySelector('.tab[data-tab="skills"]').addEventListener('click', async () => {
  await loadSkills();
  initSkills();
});

// NEW: Clear progress button
document.getElementById('clear-progress-btn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
    clearCharacter();
  }
});

// Save character on selection changes
document.addEventListener('change', (e) => {
  if (e.target.matches('.archetype-btn, .dropdown ul li, .feat-select-btn, .ability-control')) {
    saveCharacter();
  }
});

