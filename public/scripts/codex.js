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

  // Initialize AppCheck FIRST and wait for it
  const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
    isTokenAutoRefreshEnabled: true
  });

  // Add a small delay to ensure AppCheck token is ready
  await new Promise(resolve => setTimeout(resolve, 500));

  const db = getDatabase(app);

  // Retry wrapper for transient offline/network hiccups
  async function getWithRetry(path, attempts = 3) {
    const r = ref(db, path);
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        return await get(r);
      } catch (err) {
        lastErr = err;
        const msg = (err && err.message) || '';
        const isOffline = msg.includes('Client is offline') || msg.toLowerCase().includes('network');
        if (!isOffline || i === attempts - 1) throw err;
        await new Promise(res => setTimeout(res, 500 * (i + 1))); // simple backoff
      }
    }
    throw lastErr;
  }

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
  let partsLoaded = false;
  let propertiesLoaded = false;

  let allParts = [];
  let filteredParts = [];
  let partSortState = { col: 'name', dir: 1 };

  let allProperties = [];
  let filteredProperties = [];
  let propertySortState = { col: 'name', dir: 1 };

  let allEquipment = [];
  let filteredEquipment = [];
  let equipmentSortState = { col: 'name', dir: 1 };

  let equipmentLoaded = false;

  // Load traits
  function loadTraits() {
    if (traitsLoaded) return Promise.resolve();
    console.log('Loading traits...');
    return get(ref(db, 'traits'))
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
        if (err.code === 'PERMISSION_DENIED') {
          console.error('Permission denied for /traits - check Firebase Realtime Database Rules');
        }
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

    // Helpers to normalize DB shapes: string | array | object-with-numeric-keys
    const toStrArray = (val) => {
      if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
      if (typeof val === 'string') return val.split(',').map(v => v.trim()).filter(Boolean);
      if (val && typeof val === 'object') {
        return Object.keys(val)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => String(val[k]).trim())
          .filter(Boolean);
      }
      return [];
    };
    const toNumArray = (val) => {
      // Normalize numbers coming from Firebase which may be:
      // - an array of numbers
      // - a comma-separated string
      // - a numeric scalar
      // - an object with numeric keys (Firebase's array-like object)
      if (val == null) return [];
      if (Array.isArray(val)) return val.map(v => parseInt(String(v).trim()) || 0);
      if (typeof val === 'number') return [val];
      if (typeof val === 'string') {
        const parts = val.split(',').map(v => v.trim()).filter(Boolean);
        if (parts.length === 0) return [];
        return parts.map(p => parseInt(p) || 0);
      }
      if (typeof val === 'object') {
        return Object.keys(val)
          .sort((a, b) => Number(a) - Number(b))
          .map(k => {
            const v = val[k];
            return typeof v === 'number' ? v : parseInt(String(v).trim()) || 0;
          });
      }
      return [];
    };

    getWithRetry('feats')
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
          // Normalized arrays (handles string | array | object)
          ability_req: toStrArray(f.ability_req),
          abil_req_val: toNumArray(f.abil_req_val),
          tags: toStrArray(f.tags),
          skill_req: toStrArray(f.skill_req),
          skill_req_val: toNumArray(f.skill_req_val),
          lvl_req: parseInt(f.lvl_req) || 0,
          uses_per_rec: parseInt(f.uses_per_rec) || 0,
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
  // loadFeats();
  // loadSkills();
  // loadTraits();
  // loadSpecies();

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
        if (index !== -1) {
          // Support abil_req_val being an array or a numeric scalar
          let v = NaN;
          if (Array.isArray(f.abil_req_val)) v = Number(f.abil_req_val[index]);
          else if (typeof f.abil_req_val === 'number') v = Number(f.abil_req_val);
          else if (typeof f.abil_req_val === 'string') v = Number(f.abil_req_val);
          if (Number.isFinite(v) && v > req.val) return false;
        }
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
          <div class="col">${f.rec_period || ''}</div>
          <div class="col">${f.uses_per_rec || ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="feat-body">
          ${f.description ? `<div class="feat-description" style="color:#000;">${f.description}</div>` : ''}
          ${f.char_feat ? '<div class="feat-type-chip">Character Feat</div>' : ''}
          <div class="requirements">
            ${f.req_desc ? `<div class="req-field"><label>Requirement Description:</label><span>${f.req_desc}</span></div>` : ''}
            ${f.ability_req.length ? `<div class="req-field"><label>Ability Requirements:</label><span>${
              f.ability_req.map((a, i) => {
                let v = NaN;
                if (Array.isArray(f.abil_req_val)) v = Number(f.abil_req_val[i]);
                else if (typeof f.abil_req_val === 'number') v = Number(f.abil_req_val);
                else if (typeof f.abil_req_val === 'string') v = Number(f.abil_req_val);
                return `${a}${Number.isFinite(v) ? ` ${v}` : ''}`;
              }).join(', ')
            }</span></div>` : ''}
            ${f.skill_req.length ? `<div class="req-field"><label>Skill Requirements:</label><span>${
              f.skill_req.map((s, i) => {
                const v = Number(f.skill_req_val?.[i]);
                return `${s}${Number.isFinite(v) ? ` ${v}` : ''}`;
              }).join(', ')
            }</span></div>` : ''}
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
    getWithRetry('skills')
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
        let errorMsg = 'Error loading skills. ';
        if (err.code === 'PERMISSION_DENIED') {
          errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
        }
        document.getElementById('skillList').innerHTML = `<div class="no-results">${errorMsg}</div>`;
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
          ${s.description ? `<div class="skill-description" style="color:#000;">${s.description}</div>` : ''}
          ${s.success_desc ? `<div class="skill-success" style="color:#000;"><strong>Success:</strong> ${s.success_desc}</div>` : ''}
          ${s.failure_desc ? `<div class="skill-failure" style="color:#000;"><strong>Failure:</strong> ${s.failure_desc}</div>` : ''}
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
        console.log(`✓ Loaded ${allSpecies.length} species successfully`);
        speciesLoaded = true;
        populateSpeciesFilters();
        applySpeciesFilters();
      })
      .catch(err => {
        console.error('Error loading species:', err);
        let errorMsg = 'Error loading species. ';
        if (err.code === 'PERMISSION_DENIED') {
          errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
        }
        document.getElementById('speciesList').innerHTML = `<div class="no-results">${errorMsg}</div>`;
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
          ${s.description ? `<div class="species-description" style="font-style:normal;color:#000;">${s.description}</div>` : ''}
          <div class="trait-section">
            <h3>Species Traits</h3>
            <div class="trait-grid">
              ${s.species_traits.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Ancestry Traits</h3>
            <div class="trait-grid">
              ${s.ancestry_traits.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Flaws</h3>
            <div class="trait-grid">
              ${s.flaws.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Characteristics</h3>
            <div class="trait-grid">
              ${s.characteristics.map(t => `<div class="trait-item"><h4>${t.name}</h4><p style="color:#000;">${t.desc}</p></div>`).join('')}
            </div>
          </div>
          <div class="trait-section">
            <h3>Skills</h3>
            <div class="trait-grid">
              ${s.skills.length ? s.skills.map(skill => {
                const desc = skillsMap.get(skill) || 'No description';
                return `<div class="trait-item"><h4>${skill}</h4><p style="color:#000;">${desc}</p></div>`;
              }).join('') : '<div class="trait-item"><h4>No skills listed</h4></div>'}
            </div>
          </div>
          <div class="species-details">
            <div><strong>Average Weight:</strong> ${s.ave_weight || 'N/A'} kg</div>
            <div><strong>Average Height:</strong> ${s.ave_height || 'N/A'} cm</div>
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

  // ---------------------------
// Skills event listeners
  // ---------------------------
  document.getElementById('skillSearch').addEventListener('input', applySkillFilters);

  document.getElementById('skillAbilitySelect').addEventListener('change', () => {
    const sel = document.getElementById('skillAbilitySelect');
    const val = sel.value;
    if (val && !selectedSkillAbilities.includes(val)) {
      selectedSkillAbilities.push(val);
      createChip(val, document.getElementById('skillAbilityChips'), () => {
        selectedSkillAbilities = selectedSkillAbilities.filter(a => a !== val);
        applySkillFilters();
      });
      sel.value = '';
      applySkillFilters();
    }
  });

  document.getElementById('baseSkillSelect').addEventListener('change', () => {
    selectedBaseSkill = document.getElementById('baseSkillSelect').value || '';
    applySkillFilters();
  });

  document.getElementById('showSubSkills').addEventListener('change', (e) => {
    showSubSkills = e.target.checked;
    if (!showSubSkills && subSkillsOnly) {
      subSkillsOnly = false;
      document.getElementById('subSkillsOnly').checked = false;
    }
    applySkillFilters();
  });

  document.getElementById('subSkillsOnly').addEventListener('change', (e) => {
    subSkillsOnly = e.target.checked;
    if (subSkillsOnly && !showSubSkills) {
      showSubSkills = true;
      document.getElementById('showSubSkills').checked = true;
    }
    applySkillFilters();
  });

  // Skills sorting
  document.querySelectorAll('.skill-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      skillSortState = { col, dir };
      applySkillFilters();
    });
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

  // Equipment sorting
  document.querySelectorAll('.equipment-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      equipmentSortState = { col, dir };
      applyEquipmentFilters();
    });
  });

  // Load equipment
  function loadEquipment() {
    if (equipmentLoaded) return;
    console.log('Loading equipment...');
    getWithRetry('items')
      .then(snap => {
        const data = snap.val();
        if (!data) {
          document.getElementById('equipmentList').innerHTML = '<div class="no-results">No equipment found in database.</div>';
          return;
        }
        allEquipment = Object.values(data).map(e => ({
          ...e,
          currency: parseInt(e.currency) || 0,
        }));
        console.log(`✓ Loaded ${allEquipment.length} equipment successfully`);
        equipmentLoaded = true;
        populateEquipmentFilters();
        applyEquipmentFilters();
      })
      .catch(err => {
        console.error('Error loading equipment:', err);
        let errorMsg = 'Error loading equipment. ';
        if (err.code === 'PERMISSION_DENIED') {
          errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
        }
        document.getElementById('equipmentList').innerHTML = `<div class="no-results">${errorMsg}</div>`;
      });
  }

  // Populate equipment filters
  function populateEquipmentFilters() {
    const categories = new Set();
    const rarities = new Set();

    allEquipment.forEach(e => {
      if (e.category) categories.add(e.category);
      if (e.rarity) rarities.add(e.rarity);
    });

    const addOpts = (sel, vals) => {
      sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
    };

    addOpts(document.getElementById('equipmentCategorySelect'), categories);
    addOpts(document.getElementById('equipmentRaritySelect'), rarities);
  }

  // Apply equipment filters
  function applyEquipmentFilters() {
    const searchTerm = document.getElementById('equipmentSearch').value.toLowerCase();
    const selectedCategory = document.getElementById('equipmentCategorySelect').value;
    const selectedRarity = document.getElementById('equipmentRaritySelect').value;

    filteredEquipment = allEquipment.filter(e => {
      if (searchTerm && !e.name.toLowerCase().includes(searchTerm) && !(e.description && e.description.toLowerCase().includes(searchTerm))) return false;
      if (selectedCategory && e.category !== selectedCategory) return false;
      if (selectedRarity && e.rarity !== selectedRarity) return false;
      return true;
    });

    applyEquipmentSort();
    renderEquipment();
  }

  function applyEquipmentSort() {
    const { col, dir } = equipmentSortState;
    filteredEquipment.sort((a, b) => {
      let valA = a[col] || '';
      let valB = b[col] || '';
      if (typeof valA === 'string') {
        return dir * valA.localeCompare(valB);
      } else {
        return dir * (valA - valB);
      }
    });
  }

  // Render equipment
  function renderEquipment() {
    if (!filteredEquipment.length) {
      document.getElementById('equipmentList').innerHTML = '<div class="no-results">No equipment match your filters.</div>';
      return;
    }

    document.getElementById('equipmentList').innerHTML = filteredEquipment.map(e => `
      <div class="equipment-card" data-name="${e.name}">
        <div class="equipment-header" onclick="toggleEquipmentExpand(this)">
          <div class="col">${e.name}</div>
          <div class="col">${e.description ? e.description.substring(0, 100) + '...' : ''}</div>
          <div class="col">${e.category || ''}</div>
          <div class="col">${e.currency || ''}</div>
          <div class="col">${e.rarity || ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="equipment-body">
          ${e.description ? `<div class="equipment-description" style="color:#000;">${e.description}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  window.toggleEquipmentExpand = function(header) {
    header.parentElement.classList.toggle('expanded');
  };

  // Equipment event listeners
  document.getElementById('equipmentSearch').addEventListener('input', applyEquipmentFilters);
  document.getElementById('equipmentCategorySelect').addEventListener('change', applyEquipmentFilters);
  document.getElementById('equipmentRaritySelect').addEventListener('change', applyEquipmentFilters);

  // Load all on start
  // Load traits first, then species (since species depends on traits)
  loadTraits().then(() => {
    loadSpecies();
  });
  loadFeats();
  loadSkills();
  loadTraits();
  loadParts();
  loadProperties();
  loadEquipment();

  // Debugging aid - dump entire DB to console (remove in production)
  window.dumpDB = function() {
    get(ref(db, '/')).then(snap => {
      console.log('=== DB DUMP ===');
      function logNode(node, path) {
        const data = node.val();
        if (data && typeof data === 'object') {
          console.log(`${path}:`);
          Object.keys(data).forEach(key => {
            logNode(ref(db, `${path}/${key}`), `${path}/${key}`);
          });
        } else {
          console.log(`${path}: ${data}`);
        }
      }
      logNode(snap, '/');
      console.log('=== END DB DUMP ===');
    });
  };

  // Load parts
  function loadParts() {
    if (partsLoaded) return;
    console.log('Loading parts...');
    getWithRetry('parts')
      .then(snap => {
        const data = snap.val();
        if (!data) {
          document.getElementById('partList').innerHTML = '<div class="no-results">No parts found in database.</div>';
          return;
        }
        allParts = Object.values(data).map(p => ({
          ...p,
          base_en: parseInt(p.base_en) || 0,
          base_tp: parseInt(p.base_tp) || 0,
          op_1_en: parseInt(p.op_1_en) || 0,
          op_1_tp: parseInt(p.op_1_tp) || 0,
          op_2_en: parseInt(p.op_2_en) || 0,
          op_2_tp: parseInt(p.op_2_tp) || 0,
          op_3_en: parseInt(p.op_3_en) || 0,
          op_3_tp: parseInt(p.op_3_tp) || 0,
          mechanic: p.mechanic || false,
          percentage: p.percentage || false,
        }));
        console.log(`✓ Loaded ${allParts.length} parts successfully`);
        partsLoaded = true;
        populatePartFilters();
        applyPartFilters();
      })
      .catch(err => {
        console.error('Error loading parts:', err);
        let errorMsg = 'Error loading parts. ';
        if (err.code === 'PERMISSION_DENIED') {
          errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
        }
        document.getElementById('partList').innerHTML = `<div class="no-results">${errorMsg}</div>`;
      });
  }

  // Populate part filters
  function populatePartFilters() {
    const categories = new Set();
    const types = new Set();

    allParts.forEach(p => {
      if (p.category) categories.add(p.category);
      if (p.type) types.add(p.type);
    });

    const addOpts = (sel, vals) => {
      sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
    };

    addOpts(document.getElementById('partCategorySelect'), categories);
    addOpts(document.getElementById('partTypeSelect'), types);
  }

  // Apply part filters
  function applyPartFilters() {
    const searchTerm = document.getElementById('partSearch').value.toLowerCase();
    const selectedCategory = document.getElementById('partCategorySelect').value;
    const selectedType = document.getElementById('partTypeSelect').value;

    filteredParts = allParts.filter(p => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm) && !(p.description && p.description.toLowerCase().includes(searchTerm))) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedType && p.type !== selectedType) return false;
      return true;
    });

    applyPartSort();
    renderParts();
  }

  function applyPartSort() {
    const { col, dir } = partSortState;
    filteredParts.sort((a, b) => {
      let valA = a[col] || '';
      let valB = b[col] || '';
      if (typeof valA === 'string') {
        return dir * valA.localeCompare(valB);
      } else {
        return dir * (valA - valB);
      }
    });
  }

  // Render parts
  function renderParts() {
    if (!filteredParts.length) {
      document.getElementById('partList').innerHTML = '<div class="no-results">No parts match your filters.</div>';
      return;
    }

    document.getElementById('partList').innerHTML = filteredParts.map(p => `
      <div class="part-card" data-name="${p.name}">
        <div class="part-header" onclick="togglePartExpand(this)">
          <div class="col">${p.name}</div>
          <div class="col">${p.category || ''}</div>
          <div class="col">${p.type || ''}</div>
          <div class="col">${p.base_en || ''}</div>
          <div class="col">${p.base_tp || ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="part-body">
          ${p.description ? `<div class="part-description" style="color:#000;">${p.description}</div>` : ''}
          <div class="part-options">
            ${p.op_1_desc ? `<div class="option"><strong>Option 1:</strong> ${p.op_1_desc} (EN: ${p.op_1_en}, TP: ${p.op_1_tp})</div>` : ''}
            ${p.op_2_desc ? `<div class="option"><strong>Option 2:</strong> ${p.op_2_desc} (EN: ${p.op_2_en}, TP: ${p.op_2_tp})</div>` : ''}
            ${p.op_3_desc ? `<div class="option"><strong>Option 3:</strong> ${p.op_3_desc} (EN: ${p.op_3_en}, TP: ${p.op_3_tp})</div>` : ''}
          </div>
          <div class="part-flags">
            ${p.mechanic ? '<span class="flag">Mechanic</span>' : ''}
            ${p.percentage ? '<span class="flag">Percentage</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  window.togglePartExpand = function(header) {
    header.parentElement.classList.toggle('expanded');
  };

  // Load properties
  function loadProperties() {
    if (propertiesLoaded) return;
    console.log('Loading properties...');
    getWithRetry('properties')
      .then(snap => {
        const data = snap.val();
        if (!data) {
          document.getElementById('propertyList').innerHTML = '<div class="no-results">No properties found in database.</div>';
          return;
        }
        allProperties = Object.values(data).map(p => ({
          ...p,
          base_ip: parseInt(p.base_ip) || 0,
          base_tp: parseInt(p.base_tp) || 0,
          base_gp: parseInt(p.base_gp) || 0,
          opt_1_ip: parseInt(p.opt_1_ip) || 0,
          opt_1_tp: parseInt(p.opt_1_tp) || 0,
          opt_1_gp: parseInt(p.opt_1_gp) || 0,
        }));
        console.log(`✓ Loaded ${allProperties.length} properties successfully`);
        propertiesLoaded = true;
        populatePropertyFilters();
        applyPropertyFilters();
      })
      .catch(err => {
        console.error('Error loading properties:', err);
        let errorMsg = 'Error loading properties. ';
        if (err.code === 'PERMISSION_DENIED') {
          errorMsg += 'Permission denied - check Firebase Realtime Database Rules.';
        }
        document.getElementById('propertyList').innerHTML = `<div class="no-results">${errorMsg}</div>`;
      });
  }

  // Populate property filters
  function populatePropertyFilters() {
    const types = new Set();

    allProperties.forEach(p => {
      if (p.type) types.add(p.type);
    });

    const addOpts = (sel, vals) => {
      sel.innerHTML = '<option value="">Choose...</option>' + Array.from(vals).sort().map(v => `<option value="${v}">${v}</option>`).join('');
    };

    addOpts(document.getElementById('propertyTypeSelect'), types);
  }

  // Apply property filters
  function applyPropertyFilters() {
    const searchTerm = document.getElementById('propertySearch').value.toLowerCase();
    const selectedType = document.getElementById('propertyTypeSelect').value;

    filteredProperties = allProperties.filter(p => {
      if (searchTerm && !p.name.toLowerCase().includes(searchTerm) && !(p.description && p.description.toLowerCase().includes(searchTerm))) return false;
      if (selectedType && p.type !== selectedType) return false;
      return true;
    });

    applyPropertySort();
    renderProperties();
  }

  function applyPropertySort() {
    const { col, dir } = propertySortState;
    filteredProperties.sort((a, b) => {
      let valA = a[col] || '';
      let valB = b[col] || '';
      if (typeof valA === 'string') {
        return dir * valA.localeCompare(valB);
      } else {
        return dir * (valA - valB);
      }
    });
  }

  // Render properties
  function renderProperties() {
    if (!filteredProperties.length) {
      document.getElementById('propertyList').innerHTML = '<div class="no-results">No properties match your filters.</div>';
      return;
    }

    document.getElementById('propertyList').innerHTML = filteredProperties.map(p => `
      <div class="property-card" data-name="${p.name}">
        <div class="property-header" onclick="togglePropertyExpand(this)">
          <div class="col">${p.name}</div>
          <div class="col">${p.type || ''}</div>
          <div class="col">${p.base_tp || ''}</div>
          <span class="expand-icon">▼</span>
        </div>
        <div class="property-body">
          ${p.description ? `<div class="property-description" style="color:#000;">${p.description}</div>` : ''}
          <div class="property-details">
            <div><strong>Base IP:</strong> ${p.base_ip || 'N/A'}</div>
            <div><strong>Base GP:</strong> ${p.base_gp || 'N/A'}</div>
            ${p.opt_1_ip ? `<div><strong>Optional IP:</strong> ${p.opt_1_ip}</div>` : ''}
            ${p.opt_1_gp ? `<div><strong>Optional GP:</strong> ${p.opt_1_gp}</div>` : ''}
          </div>
          ${p.opt_1_desc ? `<div class="option"><strong>Optional:</strong> ${p.opt_1_desc} (IP: ${p.opt_1_ip}, TP: ${p.opt_1_tp}, GP: ${p.opt_1_gp})</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  window.togglePropertyExpand = function(header) {
    header.parentElement.classList.toggle('expanded');
  };

  // Parts event listeners
  document.getElementById('partSearch').addEventListener('input', applyPartFilters);
  document.getElementById('partCategorySelect').addEventListener('change', applyPartFilters);
  document.getElementById('partTypeSelect').addEventListener('change', applyPartFilters);

  // Properties event listeners
  document.getElementById('propertySearch').addEventListener('input', applyPropertyFilters);
  document.getElementById('propertyTypeSelect').addEventListener('change', applyPropertyFilters);

  // Load all on start
  // Load traits first, then species (since species depends on traits)
  loadTraits().then(() => {
    loadSpecies();
  });
  loadFeats();
  loadSkills();
  loadTraits();
  loadParts();
  loadProperties();
  loadEquipment();

  // Debugging aid - dump entire DB to console (remove in production)
  window.dumpDB = function() {
    get(ref(db, '/')).then(snap => {
      console.log('=== DB DUMP ===');
      function logNode(node, path) {
        const data = node.val();
        if (data && typeof data === 'object') {
          console.log(`${path}:`);
          Object.keys(data).forEach(key => {
            logNode(ref(db, `${path}/${key}`), `${path}/${key}`);
          });
        } else {
          console.log(`${path}: ${data}`);
        }
      }
      logNode(snap, '/');
      console.log('=== END DB DUMP ===');
    });
  };
});