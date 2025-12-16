/**
 * Feat Modal
 * Handles adding archetype and character feats from the RTDatabase
 */

import { 
    openResourceModal, 
    closeResourceModal, 
    getCharacterData, 
    refreshLibraryAfterChange,
    getWithRetry,
    applySort,
    initFirebase
} from './modal-core.js';
import { getCharacterResourceTracking, validateFeatAddition } from '../../validation.js';

// --- Feat state ---
let allFeats = [];
let filteredFeats = [];
let featSortState = { col: 'name', dir: 1 };
let featsLoaded = false;
let selectedFeatType = 'archetype';
let selectedFeatCategory = '';

/**
 * Show the feat selection modal
 * @param {string} featType - 'archetype' or 'character'
 */
export async function showFeatModal(featType = 'archetype') {
    await initFirebase();
    selectedFeatType = featType;
    selectedFeatCategory = '';
    openResourceModal();
    
    const title = document.getElementById('resource-modal-title');
    if (title) title.textContent = featType === 'archetype' ? 'Add Archetype Feat' : 'Add Character Feat';
    
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div class="modal-loading">Loading feats...</div>';
    
    if (!featsLoaded) {
        try {
            const snap = await getWithRetry('feats');
            const data = snap.val();
            const toStrArray = (val) => {
                if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
                if (typeof val === 'string') return val.split(',').map(v => v.trim()).filter(Boolean);
                if (val && typeof val === 'object') {
                    return Object.keys(val).sort((a, b) => Number(a) - Number(b)).map(k => String(val[k]).trim()).filter(Boolean);
                }
                return [];
            };
            const toNumArray = (val) => {
                if (val == null) return [];
                if (Array.isArray(val)) return val.map(v => parseInt(String(v).trim()) || 0);
                if (typeof val === 'number') return [val];
                if (typeof val === 'string') {
                    const parts = val.split(',').map(v => v.trim()).filter(Boolean);
                    return parts.map(p => parseInt(p) || 0);
                }
                if (typeof val === 'object') {
                    return Object.keys(val).sort((a, b) => Number(a) - Number(b)).map(k => parseInt(String(val[k]).trim()) || 0);
                }
                return [];
            };
            allFeats = Object.values(data).map(f => ({
                ...f,
                ability_req: toStrArray(f.ability_req),
                abil_req_val: toNumArray(f.abil_req_val),
                skill_req: toStrArray(f.skill_req),
                skill_req_val: toNumArray(f.skill_req_val),
                lvl_req: parseInt(f.lvl_req) || 0,
                char_feat: f.char_feat || false,
                state_feat: f.state_feat || false,
            }));
            featsLoaded = true;
        } catch (e) {
            body.innerHTML = `<div class="modal-error">Error loading feats.<br>${e.message || e}</div>`;
            return;
        }
    }
    
    renderFeatModal(body);
}

/**
 * Check if character meets feat requirements
 */
function checkFeatRequirements(feat, charData) {
    const issues = [];
    const level = charData.level || 1;
    
    if (feat.lvl_req && level < feat.lvl_req) {
        issues.push(`Level ${feat.lvl_req} required`);
    }
    
    if (feat.ability_req && feat.ability_req.length > 0) {
        const abilities = charData.abilities || {};
        for (let i = 0; i < feat.ability_req.length; i++) {
            const reqAbil = feat.ability_req[i];
            const reqVal = feat.abil_req_val?.[i] || 0;
            const charVal = abilities[reqAbil.toLowerCase()] || 0;
            if (charVal < reqVal) {
                issues.push(`${reqAbil} ${reqVal} required (have ${charVal})`);
            }
        }
    }
    
    if (feat.skill_req && feat.skill_req.length > 0) {
        const skills = charData.skills || {};
        for (let i = 0; i < feat.skill_req.length; i++) {
            const reqSkill = feat.skill_req[i];
            const reqVal = feat.skill_req_val?.[i] || 0;
            const charVal = skills[reqSkill.toLowerCase()] || 0;
            if (charVal < reqVal) {
                issues.push(`${reqSkill} ${reqVal} required (have ${charVal})`);
            }
        }
    }
    
    if (feat.mart_prof_req) {
        const martProf = charData.mart_prof || 0;
        if (martProf < parseInt(feat.mart_prof_req)) {
            issues.push(`Martial Prof ${feat.mart_prof_req} required`);
        }
    }
    if (feat.pow_prof_req) {
        const powProf = charData.pow_prof || 0;
        if (powProf < parseInt(feat.pow_prof_req)) {
            issues.push(`Power Prof ${feat.pow_prof_req} required`);
        }
    }
    
    return { met: issues.length === 0, issues };
}

function renderFeatModal(container) {
    const charData = getCharacterData();
    const tracking = charData ? getCharacterResourceTracking(charData) : null;
    const featTracking = selectedFeatType === 'archetype' ? tracking?.feats?.archetype : tracking?.feats?.character;
    const remaining = featTracking?.remaining ?? '?';
    const max = featTracking?.max ?? '?';
    
    let typeFilteredFeats = allFeats.filter(f => {
        if (selectedFeatType === 'archetype') return !f.char_feat && !f.state_feat;
        return f.char_feat && !f.state_feat;
    });
    
    const categories = Array.from(new Set(typeFilteredFeats.map(f => f.category).filter(Boolean))).sort();
    const remainingClass = remaining > 0 ? 'points-available' : 'points-complete';
    
    container.innerHTML = `
        <div class="modal-header-info">
            <span class="feat-slots-badge ${remainingClass}">${remaining} / ${max} slots remaining</span>
        </div>
        <div class="modal-filters">
            <input id="modal-feat-search" type="text" class="modal-search" placeholder="Search feats...">
            <select id="modal-feat-category" class="modal-select">
                <option value="">All Categories</option>
                ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
            <label class="modal-checkbox-label">
                <input type="checkbox" id="modal-feat-eligible" class="modal-checkbox" checked>
                Show only eligible
            </label>
        </div>
        <div class="modal-table-container">
            <table class="modal-table">
                <thead>
                    <tr>
                        <th data-col="name" class="sortable">Name</th>
                        <th data-col="lvl_req" class="sortable">Lvl</th>
                        <th data-col="category" class="sortable">Category</th>
                        <th>Requirements</th>
                        <th style="width:80px;"></th>
                    </tr>
                </thead>
                <tbody id="modal-feat-tbody"></tbody>
            </table>
        </div>
    `;
    
    document.getElementById('modal-feat-search').addEventListener('input', applyFeatFilters);
    document.getElementById('modal-feat-category').addEventListener('change', e => {
        selectedFeatCategory = e.target.value;
        applyFeatFilters();
    });
    document.getElementById('modal-feat-eligible').addEventListener('change', applyFeatFilters);
    
    container.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.getAttribute('data-col');
            if (featSortState.col === col) {
                featSortState.dir *= -1;
            } else {
                featSortState.col = col;
                featSortState.dir = 1;
            }
            applyFeatFilters();
        });
    });
    
    applyFeatFilters();
}

function applyFeatFilters() {
    const charData = getCharacterData();
    const search = document.getElementById('modal-feat-search')?.value?.toLowerCase() || '';
    const onlyEligible = document.getElementById('modal-feat-eligible')?.checked ?? true;
    
    let typeFiltered = allFeats.filter(f => {
        if (selectedFeatType === 'archetype') return !f.char_feat && !f.state_feat;
        return f.char_feat && !f.state_feat;
    });
    
    filteredFeats = typeFiltered.filter(f => {
        if (search && !f.name.toLowerCase().includes(search) && !(f.description && f.description.toLowerCase().includes(search))) return false;
        if (selectedFeatCategory && f.category !== selectedFeatCategory) return false;
        
        if (charData) {
            const featsArray = charData.feats || [];
            const alreadyHas = featsArray.some(existing => {
                const name = typeof existing === 'string' ? existing : existing?.name;
                return name === f.name;
            });
            if (alreadyHas) return false;
        }
        
        if (onlyEligible && charData) {
            const req = checkFeatRequirements(f, charData);
            if (!req.met) return false;
        }
        
        return true;
    });
    
    applySort(filteredFeats, featSortState, featSortState.col);
    renderFeatTable();
}

function renderFeatTable() {
    const tbody = document.getElementById('modal-feat-tbody');
    if (!tbody) return;
    
    const charData = getCharacterData();
    const tracking = charData ? getCharacterResourceTracking(charData) : null;
    const featTracking = selectedFeatType === 'archetype' ? tracking?.feats?.archetype : tracking?.feats?.character;
    const canAdd = (featTracking?.remaining ?? 0) > 0;
    
    if (filteredFeats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="modal-empty">No feats match your filters.</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredFeats.map(f => {
        const req = charData ? checkFeatRequirements(f, charData) : { met: true, issues: [] };
        const reqText = [];
        
        if (f.lvl_req) reqText.push(`Lvl ${f.lvl_req}`);
        if (f.ability_req?.length) {
            const abilReqs = f.ability_req.map((a, i) => `${a} ${f.abil_req_val?.[i] || 0}`).join(', ');
            reqText.push(abilReqs);
        }
        if (f.skill_req?.length) {
            const skillReqs = f.skill_req.map((s, i) => `${s} ${f.skill_req_val?.[i] || 0}`).join(', ');
            reqText.push(skillReqs);
        }
        
        const isDisabled = !canAdd || !req.met;
        const btnTitle = !canAdd ? 'No slots remaining' : (!req.met ? req.issues.join(', ') : 'Add feat');
        
        return `
            <tr class="${req.met ? '' : 'row-unmet'}">
                <td><strong>${f.name}</strong></td>
                <td>${f.lvl_req || '-'}</td>
                <td>${f.category || '-'}</td>
                <td class="requirements-cell ${req.met ? '' : 'unmet'}">${reqText.join('; ') || '-'}</td>
                <td>
                    <button class="modal-add-btn ${isDisabled ? 'disabled' : ''}" 
                            onclick="window.addFeatToCharacter('${encodeURIComponent(f.name)}', '${selectedFeatType}')"
                            ${isDisabled ? 'disabled' : ''}
                            title="${btnTitle}">
                        Add
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Add a feat to the character
 */
window.addFeatToCharacter = function(encodedName, featType) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    const validation = validateFeatAddition(charData, featType);
    if (!validation.valid) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(validation.error, 'error');
        } else {
            alert(validation.error);
        }
        return;
    }
    
    if (!Array.isArray(charData.feats)) charData.feats = [];
    
    const alreadyHas = charData.feats.some(f => {
        const featName = typeof f === 'string' ? f : f?.name;
        return featName === name;
    });
    
    if (!alreadyHas) {
        charData.feats.push(name);
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'feats');
    closeResourceModal();
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" feat.`, 'success');
};

/**
 * Remove a feat from the character
 */
window.removeFeatFromCharacter = function(encodedName, featType) {
    const name = decodeURIComponent(encodedName);
    const charData = getCharacterData();
    
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    
    if (Array.isArray(charData.feats)) {
        charData.feats = charData.feats.filter(f => {
            if (typeof f === 'string') return f !== name;
            if (f && typeof f === 'object') return f.name !== name;
            return true;
        });
    }
    
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    refreshLibraryAfterChange(charData, 'feats');
    if (typeof window.showNotification === 'function') window.showNotification(`Removed "${name}" feat.`, 'success');
};

// Export to window
window.showFeatModal = showFeatModal;
