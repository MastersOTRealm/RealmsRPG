// Load header/footer
async function loadHeaderFooter() {
    const header = document.getElementById('header');
    const footer = document.getElementById('footer');
    if (header) header.innerHTML = await fetch('/header.html').then(r => r.text());
    if (footer) footer.innerHTML = await fetch('/footer.html').then(r => r.text());
}
loadHeaderFooter();

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
    });
  });
}

// Setup feats tab
function initFeats() {
  if (!featsInitialized) {
    // Accordion for main sections
    document.querySelectorAll('#content-feats .section-header').forEach(header => {
      header.addEventListener('click', () => {
        const body = header.nextElementSibling;
        const arrow = header.querySelector('.toggle-arrow');
        body.classList.toggle('open');
        arrow.classList.toggle('open');
      });
    });

    // Search functionality for each section
    document.querySelectorAll('#content-feats .search-input').forEach(input => {
      input.addEventListener('keyup', () => {
        const sectionId = input.id.replace('-search', '');
        populateFeatsSection(sectionId, sectionId === 'archetype' ? archetypeFeats : characterFeats, sectionId === 'archetype');
      });
    });

    // Continue button
    document.getElementById('feats-continue').addEventListener('click', () => {
      document.querySelector('.tab[data-tab="equipment"]').click();
    });

    // Open Codex button
    document.getElementById('open-codex').addEventListener('click', () => {
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
}

// Initialize and load data
(async () => {
  db = await initializeFirebase();
  await loadTraits();
  await loadSpecies();
  await loadFeats();
  populateAncestryGrid();
})();

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

    // Store globally
    window.character = window.character || {};
    window.character.species = chosenSpecies;

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
  } else {
    selected = char[`${type}Trait`];
  }

  if (selected && selected.name === trait.name) {
    // Deselect
    li.classList.remove('selected');
    if (type === 'ancestry') {
      char.ancestryTraits = char.ancestryTraits.filter(t => t.name !== trait.name);
    } else {
      delete char[`${type}Trait`];
    }

    // Special handling for flaw deselection
    if (type === 'flaw') {
      if (char.ancestryTraits && char.ancestryTraits.length > 1) {
        char.ancestryTraits.pop(); // Remove excess ancestry trait
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
    }

    li.classList.add('selected');
    if (type === 'ancestry') {
      if (!char.ancestryTraits) char.ancestryTraits = [];
      char.ancestryTraits.push(trait);
    } else {
      char[`${type}Trait`] = trait;
    }
  }
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
  fillTraitSection('flaw', species.flaws, false, true, false); // Optional, no limit shown

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
  if (window.character && window.character.species) {
    showTraitSelection(window.character.species);
  }
});

// Abilities Initialization
function initAbilities() {
  const abilities = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
  let values = new Array(6).fill(0);
  const pointsSpan = document.getElementById('ability-points');

  function updateDisplay() {
    const sum = values.reduce((a, b) => a + b, 0);
    pointsSpan.textContent = 7 - sum;

    document.querySelectorAll('.abilities-values .value').forEach((span, i) => {
      const v = values[i];
      span.textContent = v > 0 ? `+${v}` : v;
    });
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
