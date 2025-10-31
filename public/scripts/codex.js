// codex.js content
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

document.addEventListener('DOMContentLoaded', async () => {
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

  // -------------------------------------------------
  // Load data
  // -------------------------------------------------
  function loadFeats() {
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
        }));

        console.log(`✓ Loaded ${allFeats.length} feats successfully`);
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
          <div class="requirements">
            ${f.req_desc ? `<div class="req-field"><label>Requirement Description:</label><span>${f.req_desc}</span></div>` : ''}
            ${f.ability_req.length ? `<div class="req-field"><label>Ability Requirements:</label><span>${f.ability_req.map((a, i) => `${a}${typeof f.abil_req_val[i] === 'number' ? ` ${f.abil_req_val[i]}` : ''}`).join(', ')}</span></div>` : ''}
            ${f.skill_req.length ? `<div class="req-field"><label>Skill Requirements:</label><span>${f.skill_req.map((s, i) => `${s}${typeof f.skill_req_value[i] === 'number' ? ` ${f.skill_req_value[i]}` : ''}`).join(', ')}</span></div>` : ''}
            ${f.feat_cat_req ? `<div class="req-field"><label>Feat Category Requirement:</label><span>${f.feat_cat_req}</span></div>` : ''}
            ${f.pow_abil_req ? `<div class="req-field"><label>Power Ability Requirement:</label><span>${f.pow_abil_req}</span></div>` : ''}
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

  // Sorting
  document.querySelectorAll('.feat-headers .sort').forEach(sortBtn => {
    sortBtn.addEventListener('click', (e) => {
      const col = e.target.closest('.col').dataset.col;
      const dir = e.target.dataset.dir === 'asc' ? 1 : -1;
      sortState = { col, dir };
      applyFilters(); // re-filters and sorts
    });
  });
});