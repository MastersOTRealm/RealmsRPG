// codex.js content
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

document.addEventListener('DOMContentLoaded', async () => {
  if (window.codexInitialized) return;
  window.codexInitialized = true;

  // Fetch config and initialize Firebase/appCheck
  const response = await fetch('/__/firebase/init.json');
  const firebaseConfig = await response.json();
  firebaseConfig.authDomain = 'realmsroleplaygame.com';
  const app = initializeApp(firebaseConfig);

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
    isTokenAutoRefreshEnabled: true
  });

  const db = getDatabase(app);

  const elements = {
    list: document.getElementById('featList'),
    search: document.getElementById('search'),
    reqLevel: document.getElementById('reqLevel'),
    abilReqSelect: document.getElementById('abilReqSelect'),
    abilReqValue: document.getElementById('abilReqValue'),
    addAbilReq: document.getElementById('addAbilReq'),
    abilReqChips: document.getElementById('abilReqChips'),
    categorySelect: document.getElementById('categorySelect'),
    categoryChips: document.getElementById('categoryChips'),
    abilitySelect: document.getElementById('abilitySelect'),
    abilityChips: document.getElementById('abilityChips'),
    tagSelect: document.getElementById('tagSelect'),
    tagChips: document.getElementById('tagChips'),
  };

  let allFeats = [];
  let filteredFeats = [];
  let sortState = { col: 'name', dir: 1 }; // 1 asc, -1 desc

  let selectedAbilReqs = []; // [{abil: 'Strength', val: 13}]
  let selectedCategories = [];
  let selectedAbilities = [];
  let selectedTags = [];
  let tagMode = 'all'; // 'all' or 'any'
  let showArchetype = true;
  let showCharacter = true;

  let allSkills = [];
  let filteredSkills = [];
  let skillSortState = { col: 'name', dir: 1 };
  let selectedSkillAbilities = [];
  let selectedBaseSkill = '';
  let showSubSkills = true;
  let subSkillsOnly = false;
  let skillsMap = new Map(); // Map for skill name to description

  let allSpecies = [];
  let filteredSpecies = [];
  let speciesSortState = { col: 'name', dir: 1 };
  let selectedTypes = [];
  let selectedSizes = [];
  let allTraits = {};

  // Utility functions for species
  function cmToFtIn(cm) {
    if (!cm) return 'N/A';
    const inches = cm / 2.54;
    const ft = Math.floor(inches / 12);
    const inc = Math.round(inches % 12);
    return `${ft}'${inc}"`;
  }

  function kgToLb(kg) {
    if (!kg) return 'N/A';
    return Math.round(kg * 2.20462);
  }

  let featsLoaded = false;
  let skillsLoaded = false;
  let traitsLoaded = false;
  let speciesLoaded = false;

  // Load traits
  function loadTraits() {
    if (traitsLoaded) return;
    console.log('Loading traits...');
    get(ref(db, 'traits'))
      .then(snap => {
        const data = snap.val();
        if (data) {
          allTraits = data;
          console.log(`✓ Loaded ${Object.keys(allTraits).length} traits`);
        }
        traitsLoaded = true;
      })
      .catch(err => {
        console.error('Error loading traits:', err);
      });
  }

  // -------------------------------------------------
  // Load data
  // -------------------------------------------------
  function loadFeats() {
    if (featsLoaded) return;
    console.log('Firebase ready. Starting feat load...');
    console.log('Database URL:', firebaseConfig.databaseURL);

    const timeoutId = setTimeout(() => {
      if (elements.list.innerHTML.includes('Loading')) {
        console.warn('Load timeout (10s) - check network/rules in Firebase Console');
        elements.list.innerHTML = '<div class="no-results">Load timed out. Check console for details.<br>Possible causes:<br>- Database rules blocking access<br>- Network/CORS issue<br>- AppCheck misconfiguration</div>';
      }
    }, 10000);

    get(ref(db, 'feats'))
      .then(snap => {
        clearTimeout(timeoutId);
        console.log('Snapshot received:', snap.exists() ? 'Data exists' : 'No data at /feats');
        const data = snap.val();
        console.log('Raw data:', data);

        if (!data) {
          elements.list.innerHTML = '<div class="no-results">No feats found in database.</div>';
          return;
        }

        allFeats = Object.values(data).map(f => ({
          ...f,
          tags: typeof f.tags === 'string' ? f.tags.split(',').map(t => t.trim()) : (Array.isArray(f.tags) ? f.tags : []),
          ability_req: typeof f.ability_req === 'string' ? f.ability_req.split(',').map(a => a.trim()).filter(a => a) : [],
          abil_req_val: typeof f.abil_req_val === 'string' ? f.abil_req_val.split(',').map(v => parseInt(v.trim()) || 0) : [],
          skill_req: typeof f.skill_req === 'string' ? f.skill_req.split(',').map(s => s.trim()).filter(s => s) : [],
          skill_req_value: typeof f.skill_req_value === 'string' ? f.skill_req_value.split(',').map(v => parseInt(v.trim()) || 0) : [],
          lvl_req: parseInt(f.lvl_req) || 0,
          uses_per_recovery: parseInt(f.uses_per_recovery) || 0,
          mart_abil_req: f.mart_abil_req || '',
          char_feat: f.char_feat || false,
        }));

        console.log(`✓ Loaded ${allFeats.length} feats successfully`);
        featsLoaded = true;
        populateFilters();
        applyFilters();
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error('Error loading feats:', err);
        let errorMsg = 'Error loading feats: ';
        if (err.code === 'PERMISSION_DENIED') {
          errorMsg += 'Permission denied. Check Firebase Database Rules.';
        } else if (err.message && err.message.includes('AppCheck')) {
          errorMsg += 'AppCheck error. Check AppCheck configuration.';
        } else {
          errorMsg += err.message || err.code || 'Unknown error';
        }
        elements.list.innerHTML = `<div class="no-results">${errorMsg}<br><br>Check browser console for details.</div>`;
      });
  }

  // Start loading feats
  loadFeats();

  // -------------------------------------------------
  // Populate Filters
  // -------------------------------------------------
  function populateFilters() {
    const levels = new Set();
    const abilitiesForReq = new Set();
    const categories = new Set();
    const abilities = new Set();
    const tags = new Set();

    allFeats.forEach(f => {
      if (f.lvl_req) levels.add(f.lvl_req);
      f.ability_req.forEach(a => abilitiesForReq.add(a));
      if (f.category) categories.add(f.category);
      if (f.ability) abilities.add(f.ability);
      f.tags.forEach(t => tags.add(t));
    });

    const addOpts = (sel, vals) => {
      sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort((a, b) => {
        // Handle both strings and numbers
        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        return String(a).localeCompare(String(b));
      }).map(v => `<option value="${v}">${v}</option>`).join('');
    };

    // Special handling for reqLevel - sort numerically
    elements.reqLevel.innerHTML = '<option value="">No limit</option>' + Array.from(levels).sort((a, b) => a - b).map(v => `<option value="${v}">Up to ${v}</option>`).join('');

    addOpts(elements.abilReqSelect, abilitiesForReq);
    addOpts(elements.categorySelect, categories);
    addOpts(elements.abilitySelect, abilities);
    addOpts(elements.tagSelect, tags);
  }

  // -------------------------------------------------
  // Chip Management
  // -------------------------------------------------
  function createChip(text, container, removeCallback) {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `${text} <span class="remove">×</span>`;
    chip.querySelector('.remove').addEventListener('click', () => {
      chip.remove();
      removeCallback();
    });
    container.appendChild(chip);
  }

  // -------------------------------------------------
  // Apply Filters and Sort
  // -------------------------------------------------
  function applyFilters() {
    const searchTerm = elements.search.value.toLowerCase();
    const maxLevel = elements.reqLevel.value ? parseInt(elements.reqLevel.value) : Infinity;

    filteredFeats = allFeats.filter(f => {
      if (searchTerm && !f.name.toLowerCase().includes(searchTerm) && !f.tags.some(t => t.toLowerCase().includes(searchTerm)) && !(f.description && f.description.toLowerCase().includes(searchTerm))) return false;
      if (f.lvl_req > maxLevel) return false;

      // Feat Type
      if (!showArchetype && !f.char_feat) return false;
      if (!showCharacter && f.char_feat) return false;

      // Ability Requirements
      for (const req of selectedAbilReqs) {
        const index = f.ability_req.indexOf(req.abil);
        if (index !== -1 && f.abil_req_val[index] > req.val) return false;
      }

      // Categories (OR)
      if (selectedCategories.length && !selectedCategories.includes(f.category)) return false;

      // Abilities (OR)
      if (selectedAbilities.length && !selectedAbilities.includes(f.ability)) return false;

      // Tags
      if (selectedTags.length) {
        if (tagMode === 'all') {
          if (!selectedTags.every(t => f.tags.includes(t))) return false;
        } else {
          if (!selectedTags.some(t => f.tags.includes(t))) return false;
        }
      }

      return true;
    });

    applySort();
    renderFeats();
  }

  function applySort() {
    const { col, dir } = sortState;
    filteredFeats.sort((a, b) => {
      let valA = a[col] || (typeof a[col] === 'number' ? 0 : '');
      let valB = b[col] || (typeof b[col] === 'number' ? 0 : '');
      if (typeof valA === 'string') {
        return dir * valA.localeCompare(valB);
      } else {
        return dir * (valA - valB);
      }
    });
  }

  // -------------------------------------------------
  // Render Feats
  // -------------------------------------------------
  function renderFeats() {
    if (!filteredFeats.length) {
      elements.list.innerHTML = '<div class="no-results">No feats match your filters.</div>';
      return;
    }

    elements.list.innerHTML = filteredFeats.map(f => `
      <div class="feat-card" data-name="${f.name}">
        <div class="feat-header" onclick="toggleExpand(this)">
          <div class="col">${f.name}</div>
          <div class="col">${f.lvl_req || ''}</div>
          <div class="col">${f.category || ''}</div>
          <div class="col">${f.ability || ''}</div>
          <div class="col">${f.recovery_period || ''}</div>
          <div class="col">${f.uses_per_recovery || ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="feat-body">
          ${f.description ? `<div class="feat-description">${f.description}</div>` : ''}
          ${f.char_feat ? '<div class="feat-type-chip">Character Feat</div>' : ''}
          <div class="requirements">
            ${f.req_desc ? `<div class="req-field"><label>Requirement Description:</label><span>${f.req_desc}</span></div>` : ''}
            ${f.ability_req.length ? `<div class="req-field"><label>Ability Requirements:</label><span>${f.ability_req.map((a, i) => `${a}${typeof f.abil_req_val[i] === 'number' ? ` ${f.abil_req_val[i]}` : ''}`).join(', ')}</span></div>` : ''}
            ${f.skill_req.length ? `<div class="req-field"><label>Skill Requirements:</label><span>${f.skill_req.map((s, i) => `${s}${typeof f.skill_req_value[i] === 'number' ? ` ${f.skill_req_value[i]}` : ''}`).join(', ')}</span></div>` : ''}
            ${f.feat_cat_req ? `<div class="req-field"><label>Feat Category Requirement:</label><span>${f.feat_cat_req}</span></div>` : ''}
            ${f.pow_abil_req ? `<div class="req-field"><label>Power Ability Requirement:</label><span>${f.pow_abil_req}</span></div>` : ''}
            ${f.mart_abil_req ? `<div class="req-field"><label>Martial Ability Requirement:</label><span>${f.mart_abil_req}</span></div>` : ''}
            ${f.mart_prof_req ? `<div class="req-field"><label>Martial Proficiency Requirement:</label><span>${f.mart_prof_req}</span></div>` : ''}
            ${f.pow_prof_req ? `<div class="req-field"><label>Power Proficiency Requirement:</label><span>${f.pow_prof_req}</span></div>` : ''}
            ${f.speed_req ? `<div class="req-field"><label>Speed Requirement:</label><span>${f.speed_req}</span></div>` : ''}
            ${f.feat_lvl && f.feat_lvl > 1 ? `<div class="req-field"><label>Feat Level:</label><span>${f.feat_lvl}</span></div>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  window.toggleExpand = function(header) {
    header.parentElement.classList.toggle('expanded');
  };

  // -------------------------------------------------
  // Event Listeners
  // -------------------------------------------------
  elements.search.addEventListener('input', applyFilters);
  elements.reqLevel.addEventListener('change', applyFilters);

  // Ability Req Add
  elements.addAbilReq.addEventListener('click', () => {
    const abil = elements.abilReqSelect.value;
    const val = parseInt(elements.abilReqValue.value);
    if (abil && !isNaN(val)) {
      selectedAbilReqs.push({ abil, val });
      createChip(`${abil} ≤ ${val}`, elements.abilReqChips, () => {
        selectedAbilReqs = selectedAbilReqs.filter(r => r.abil !== abil || r.val !== val);
        applyFilters();
      });
      elements.abilReqSelect.value = '';
      elements.abilReqValue.value = '';
      applyFilters();
    }
  });

  // Multi-selects
  elements.categorySelect.addEventListener('change', () => {
    const val = elements.categorySelect.value;
    if (val && !selectedCategories.includes(val)) {
      selectedCategories.push(val);
      createChip(val, elements.categoryChips, () => {
        selectedCategories = selectedCategories.filter(c => c !== val);
        applyFilters();
      });
      elements.categorySelect.value = '';
      applyFilters();
    }
  });

  elements.abilitySelect.addEventListener('change', () => {
    const val = elements.abilitySelect.value;
    if (val && !selectedAbilities.includes(val)) {
      selectedAbilities.push(val);
      createChip(val, elements.abilityChips, () => {
        selectedAbilities = selectedAbilities.filter(a => a !== val);
        applyFilters();
      });
      elements.abilitySelect.value = '';
      applyFilters();
    }
  });

  elements.tagSelect.addEventListener('change', () => {
    const val = elements.tagSelect.value;
    if (val && !selectedTags.includes(val)) {
      selectedTags.push(val);
      createChip(val, elements.tagChips, () => {
        selectedTags = selectedTags.filter(t => t !== val);
        applyFilters();
      });
      elements.tagSelect.value = '';
      applyFilters();
    }
  });

  // Tag mode switch
  document.getElementById('tagModeSwitch').addEventListener('change', (e) => {
    tagMode = e.target.checked ? 'any' : 'all';
    applyFilters();
  });

  // Feat Type switches
  document.getElementById('showArchetype').addEventListener('change', (e) => {
    showArchetype = e.target.checked;
    applyFilters();
  });
  document.getElementById('showCharacter').addEventListener('change', (e) => {
    showCharacter = e.target.checked;
    applyFilters();
  });

  // Sorting
  document.querySelectorAll('.feat-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      sortState = { col, dir };
      applyFilters(); // re-filters and sorts
    });
  });

  // Tab switching
  window.openTab = function(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => content.classList.remove("active-tab"));

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));

    document.getElementById(tabName).classList.add("active-tab");
    event.currentTarget.classList.add("active");
  };

  // Load skills
  function loadSkills() {
    if (skillsLoaded) return;
    console.log('Loading skills...');
    get(ref(db, 'skills'))
      .then(snap => {
        const data = snap.val();
        if (!data) {
          document.getElementById('skillList').innerHTML = '<div class="no-results">No skills found in database.</div>';
          return;
        }
        allSkills = Object.values(data).map(s => ({
          ...s,
          ability: typeof s.ability === 'string' ? s.ability.split(',').map(a => a.trim()).filter(a => a) : (Array.isArray(s.ability) ? s.ability : []),
        }));
        skillsMap = new Map(allSkills.map(s => [s.name, s.description || 'No description'])); // Populate map with name and description
        console.log(`✓ Loaded ${allSkills.length} skills successfully`);
        skillsLoaded = true;
        populateSkillFilters();
        applySkillFilters();
      })
      .catch(err => {
        console.error('Error loading skills:', err);
        document.getElementById('skillList').innerHTML = `<div class="no-results">Error loading skills.</div>`;
      });
  }

  // Populate skill filters
  function populateSkillFilters() {
    const abilities = new Set();
    const baseSkills = new Set();

    allSkills.forEach(s => {
      s.ability.forEach(a => abilities.add(a));
      if (s.base_skill) baseSkills.add(s.base_skill);
    });

    const addOpts = (sel, vals) => {
      sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
    };

    addOpts(document.getElementById('skillAbilitySelect'), abilities);
    document.getElementById('baseSkillSelect').innerHTML = '<option value="">Any</option>' + Array.from(baseSkills).sort().map(v => `<option value="${v}">${v}</option>`).join('');
  }

  // Apply skill filters
  function applySkillFilters() {
    const searchTerm = document.getElementById('skillSearch').value.toLowerCase();

    filteredSkills = allSkills.filter(s => {
      if (searchTerm && !s.name.toLowerCase().includes(searchTerm) && !(s.description && s.description.toLowerCase().includes(searchTerm)) && !(s.success_desc && s.success_desc.toLowerCase().includes(searchTerm)) && !(s.failure_desc && s.failure_desc.toLowerCase().includes(searchTerm))) return false;

      if (selectedSkillAbilities.length && !selectedSkillAbilities.some(a => s.ability.includes(a))) return false;

      if (selectedBaseSkill && s.base_skill !== selectedBaseSkill) return false;

      if (!showSubSkills && s.base_skill) return false;

      if (subSkillsOnly && !s.base_skill) return false;

      return true;
    });

    applySkillSort();
    renderSkills();
  }

  function applySkillSort() {
    const { col, dir } = skillSortState;
    filteredSkills.sort((a, b) => {
      let valA = a[col] || '';
      let valB = b[col] || '';
      if (col === 'ability') {
        valA = valA.join(', ');
        valB = valB.join(', ');
      }
      return dir * valA.localeCompare(valB);
    });
  }

  // Render skills
  function renderSkills() {
    if (!filteredSkills.length) {
      document.getElementById('skillList').innerHTML = '<div class="no-results">No skills match your filters.</div>';
      return;
    }

    document.getElementById('skillList').innerHTML = filteredSkills.map(s => `
      <div class="skill-card" data-name="${s.name}">
        <div class="skill-header" onclick="toggleSkillExpand(this)">
          <div class="col">${s.name}</div>
          <div class="col">${s.ability.join(', ')}</div>
          <div class="col">${s.base_skill || ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="skill-body">
          ${s.description ? `<div class="skill-description">${s.description}</div>` : ''}
          ${s.success_desc ? `<div class="skill-success"><strong>Success:</strong> ${s.success_desc}</div>` : ''}
          ${s.failure_desc ? `<div class="skill-failure"><strong>Failure:</strong> ${s.failure_desc}</div>` : ''}
          ${s.ds_calc ? `<div class="ds-calc-chip" onclick="toggleDsCalc(this)">Difficulty Score Calculation ▼</div><div class="ds-calc-content">${s.ds_calc}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  window.toggleSkillExpand = function(header) {
    header.parentElement.classList.toggle('expanded');
  };

  window.toggleDsCalc = function(chip) {
    chip.nextElementSibling.classList.toggle('expanded');
    chip.textContent = chip.nextElementSibling.classList.contains('expanded') ? 'Difficulty Score Calculation ▲' : 'Difficulty Score Calculation ▼';
  };

  // Load both on start
  loadFeats();
  loadSkills();

  // Skill event listeners
  document.getElementById('skillSearch').addEventListener('input', applySkillFilters);

  document.getElementById('skillAbilitySelect').addEventListener('change', () => {
    const val = document.getElementById('skillAbilitySelect').value;
    if (val && !selectedSkillAbilities.includes(val)) {
      selectedSkillAbilities.push(val);
      createChip(val, document.getElementById('skillAbilityChips'), () => {
        selectedSkillAbilities = selectedSkillAbilities.filter(a => a !== val);
        applySkillFilters();
      });
      document.getElementById('skillAbilitySelect').value = '';
      applySkillFilters();
    }
  });

  document.getElementById('baseSkillSelect').addEventListener('change', () => {
    selectedBaseSkill = document.getElementById('baseSkillSelect').value;
    applySkillFilters();
  });

  document.getElementById('showSubSkills').addEventListener('change', (e) => {
    showSubSkills = e.target.checked;
    if (!showSubSkills) document.getElementById('subSkillsOnly').checked = false;
    applySkillFilters();
  });

  document.getElementById('subSkillsOnly').addEventListener('change', (e) => {
    subSkillsOnly = e.target.checked;
    if (subSkillsOnly) document.getElementById('showSubSkills').checked = true;
    showSubSkills = true;
    applySkillFilters();
  });

  // Skill sorting
  document.querySelectorAll('.skill-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      skillSortState = { col, dir };
      applySkillFilters();
    });
  });

  // Load species
  function loadSpecies() {
    if (speciesLoaded) return;
    console.log('Loading species...');
    get(ref(db, 'species'))
      .then(snap => {
        const data = snap.val();
        if (!data) {
          document.getElementById('speciesList').innerHTML = '<div class="no-results">No species found in database.</div>';
          return;
        }
        allSpecies = Object.values(data).map(s => {
          let adulthood_max_age = s.adulthood_max_age ? s.adulthood_max_age.split(',').map(n => parseInt(n.trim())) : [0, 0];
          let adulthood = adulthood_max_age[0] || 0;
          let max_age = adulthood_max_age[1] || 0;
          let skills = typeof s.skills === 'string' ? s.skills.split(',').map(sk => sk.trim()) : (Array.isArray(s.skills) ? s.skills : []);
          let languages = typeof s.languages === 'string' ? s.languages.split(',').map(l => l.trim()) : (Array.isArray(s.languages) ? s.languages : []);
          let species_traits = typeof s.species_traits === 'string' ? s.species_traits.split(',').map(name => name.trim()) : (Array.isArray(s.species_traits) ? s.species_traits : []);
          let ancestry_traits = typeof s.ancestry_traits === 'string' ? s.ancestry_traits.split(',').map(name => name.trim()) : (Array.isArray(s.ancestry_traits) ? s.ancestry_traits : []);
          let flaws = typeof s.flaws === 'string' ? s.flaws.split(',').map(name => name.trim()) : (Array.isArray(s.flaws) ? s.flaws : []);
          let characteristics = typeof s.characteristics === 'string' ? s.characteristics.split(',').map(name => name.trim()) : (Array.isArray(s.characteristics) ? s.characteristics : []);
          const cleanTraitName = (rawName) => {
            let cleanKey = rawName.trim()
              .replace(/[.$#\[\]\/]/g, '_')
              .replace(/\s+/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_+|_+$/g, '');
            return cleanKey || rawName.trim().replace(/\s+/g, '_');
          };
          species_traits = species_traits.map(name => ({ name, desc: allTraits[cleanTraitName(name)]?.description || 'No description' }));
          ancestry_traits = ancestry_traits.map(name => ({ name, desc: allTraits[cleanTraitName(name)]?.description || 'No description' }));
          flaws = flaws.map(name => ({ name, desc: allTraits[cleanTraitName(name)]?.description || 'No description' }));
          characteristics = characteristics.map(name => ({ name, desc: allTraits[cleanTraitName(name)]?.description || 'No description' }));
          return {
            ...s,
            ave_height: cmToFtIn(s.ave_hgt_cm),
            ave_weight: kgToLb(s.ave_wgt_kg),
            adulthood,
            max_age,
            skills,
            languages,
            species_traits,
            ancestry_traits,
            flaws,
            characteristics,
            sizes: s.sizes ? s.sizes.split(',').map(sz => sz.trim()) : [],
            type: s.type || '',
          };
        });
        console.log(`✓ Loaded ${allSpecies.length} species successfully`);
        speciesLoaded = true;
        populateSpeciesFilters();
        applySpeciesFilters();
      })
      .catch(err => {
        console.error('Error loading species:', err);
        document.getElementById('speciesList').innerHTML = `<div class="no-results">Error loading species.</div>`;
      });
  }

  // Populate species filters
  function populateSpeciesFilters() {
    const types = new Set();
    const sizes = new Set();

    allSpecies.forEach(s => {
      if (s.type) types.add(s.type);
      s.sizes.forEach(sz => sizes.add(sz));
    });

    const addOpts = (sel, vals) => {
      sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
    };

    addOpts(document.getElementById('speciesTypeSelect'), types);
    addOpts(document.getElementById('speciesSizeSelect'), sizes);
  }

  // Apply species filters
  function applySpeciesFilters() {
    const searchTerm = document.getElementById('speciesSearch').value.toLowerCase();

    filteredSpecies = allSpecies.filter(s => {
      if (searchTerm && 
        !s.name.toLowerCase().includes(searchTerm) && 
        !(s.description && s.description.toLowerCase().includes(searchTerm))) return false;

      if (selectedTypes.length && !selectedTypes.includes(s.type)) return false;

      if (selectedSizes.length && !s.sizes.some(sz => selectedSizes.includes(sz))) return false;

      return true;
    });

    applySpeciesSort();
    renderSpecies();
  }

  function applySpeciesSort() {
    const { col, dir } = speciesSortState;
    filteredSpecies.sort((a, b) => {
      let valA = a[col];
      let valB = b[col];
      if (col === 'sizes') {
        valA = a.sizes.join(', ');
        valB = b.sizes.join(', ');
      }
      if (typeof valA === 'string') {
        return dir * valA.localeCompare(valB);
      } else {
        return dir * (valA - valB);
      }
    });
  }

  // Render species
  function renderSpecies() {
    if (!filteredSpecies.length) {
      document.getElementById('speciesList').innerHTML = '<div class="no-results">No species match your filters.</div>';
      return;
    }

    document.getElementById('speciesList').innerHTML = filteredSpecies.map(s => `
      <div class="species-card" data-name="${s.name}">
        <div class="species-header" onclick="toggleSpeciesExpand(this)">
          <div class="col">${s.name}</div>
          <div class="col">${s.type || ''}</div>
          <div class="col">${s.sizes.join(', ')}</div>
          <div class="col">${s.description ? s.description.substring(0, 100) + '...' : ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="species-body">
          ${s.description ? `<div class="species-description">${s.description}</div>` : ''}
          <div class="trait-section">
            <h3>Species Traits</h3>
            <div class="trait-grid">
              ${s.species_traits.map(t => `<div class="trait-item"><h4>${t.name}</h4><p>${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Ancestry Traits</h3>
            <div class="trait-grid">
              ${s.ancestry_traits.map(t => `<div class="trait-item"><h4>${t.name}</h4><p>${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Flaws</h3>
            <div class="trait-grid">
              ${s.flaws.map(t => `<div class="trait-item"><h4>${t.name}</h4><p>${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Characteristics</h3>
            <div class="trait-grid">
              ${s.characteristics.map(t => `<div class="trait-item"><h4>${t.name}</h4><p>${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Skills</h3>
            <div class="trait-grid">
              ${s.skills.length ? s.skills.map(skill => {
                const desc = skillsMap.get(skill) || 'No description';
                return `<div class="trait-item"><h4>${skill}</h4><p>${desc}</p></div>`;
              }).join('') : '<div class="trait-item"><h4>No skills listed</h4></div>'}
            </div>
          </div>
          <div class="species-details">
            <div><strong>Average Weight:</strong> ${s.ave_wgt_kg || 'N/A'} kg</div>
            <div><strong>Average Height:</strong> ${s.ave_hgt_cm || 'N/A'} cm</div>
            <div><strong>Lifespan:</strong> ${s.max_age || 'N/A'} years</div>
            <div><strong>Adulthood:</strong> ${s.adulthood || 'N/A'} years</div>
            <div><strong>Languages:</strong> ${s.languages.join(', ') || 'None'}</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  window.toggleSpeciesExpand = function(header) {
    header.parentElement.classList.toggle('expanded');
  };

  // Species event listeners
  document.getElementById('speciesSearch').addEventListener('input', applySpeciesFilters);

  document.getElementById('speciesTypeSelect').addEventListener('change', () => {
    const val = document.getElementById('speciesTypeSelect').value;
    if (val && !selectedTypes.includes(val)) {
      selectedTypes.push(val);
      createChip(val, document.getElementById('speciesTypeChips'), () => {
        selectedTypes = selectedTypes.filter(t => t !== val);
        applySpeciesFilters();
      });
      document.getElementById('speciesTypeSelect').value = '';
      applySpeciesFilters();
    }
  });

  document.getElementById('speciesSizeSelect').addEventListener('change', () => {
    const val = document.getElementById('speciesSizeSelect').value;
    if (val && !selectedSizes.includes(val)) {
      selectedSizes.push(val);
      createChip(val, document.getElementById('speciesSizeChips'), () => {
        selectedSizes = selectedSizes.filter(sz => sz !== val);
        applySpeciesFilters();
      });
      document.getElementById('speciesSizeSelect').value = '';
      applySpeciesFilters();
    }
  });

  // Species sorting
  document.querySelectorAll('.species-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      speciesSortState = { col, dir };
      applySpeciesFilters();
    });
  });

  // Load all on start
  loadTraits();
  loadFeats();
  loadSkills();
  loadSpecies();
});