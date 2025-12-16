import { getWithRetry, applySort, initFirebase } from '../../codex/core.js';

// Modal logic for character sheet resource selection (equipment, feats, etc.)

// --- Modal HTML injection (if not present) ---
export function ensureResourceModal() {
    let modal = document.getElementById('resource-modal');
    if (!modal) {
        console.log('[Modal] Creating modal element');
        modal = document.createElement('div');
        modal.id = 'resource-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="modal-close" id="resource-modal-close">&times;</span>
                <div class="modal-header">
                    <h2 id="resource-modal-title">Add Equipment</h2>
                </div>
                <div id="resource-modal-body"></div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('[Modal] Modal appended to body');
    } else {
        console.log('[Modal] Modal already exists');
    }
    // Always re-attach close event (in case DOM was replaced)
    const closeBtn = document.getElementById('resource-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeResourceModal);
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeResourceModal();
    });
    return modal;
}

// --- Modal open/close logic ---
export function openResourceModal() {
    console.log('[Modal] Opening modal');
    const modal = ensureResourceModal();
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
export function closeResourceModal() {
    console.log('[Modal] Closing modal');
    const modal = document.getElementById('resource-modal');
    if (modal) modal.classList.add('hidden');
    document.body.style.overflow = '';
}


// --- Mini-codex equipment state ---
let allEquipment = [];
let filteredEquipment = [];
let equipmentSortState = { col: 'name', dir: 1 };
let equipmentLoaded = false;
let selectedCategory = '';
let selectedRarity = '';

// --- Fetch and display general equipment from RTDatabase ---
export async function showEquipmentModal() {
    await initFirebase(); // Ensure modular Firebase is initialized
    openResourceModal();
    const body = document.getElementById('resource-modal-body');
    if (!body) return;
    body.innerHTML = '<div style="text-align:center;padding:24px;">Loading equipment...</div>';
    if (!equipmentLoaded) {
        try {
            const snap = await getWithRetry('items');
            const data = snap.val();
            allEquipment = Object.values(data).map(e => ({
                ...e,
                currency: parseInt(e.currency) || 0,
            }));
            equipmentLoaded = true;
        } catch (e) {
            body.innerHTML = `<div style="color:red;text-align:center;padding:24px;">Error loading equipment.<br>${e.message || e}</div>`;
            return;
        }
    }
    // Render mini-codex UI
    renderMiniCodexEquipment(body);
}

function renderMiniCodexEquipment(container) {
        // Filter controls
        const categories = Array.from(new Set(allEquipment.map(e => e.category).filter(Boolean))).sort();
        const rarities = Array.from(new Set(allEquipment.map(e => e.rarity).filter(Boolean))).sort();

        // Filtering UI
        container.innerHTML = `
            <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;flex-wrap:wrap;">
                <input id="mini-codex-equip-search" type="text" placeholder="Search equipment..." style="flex:1;min-width:180px;padding:6px 10px;">
                <select id="mini-codex-equip-category">
                    <option value="">All Categories</option>
                    ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <select id="mini-codex-equip-rarity">
                    <option value="">All Rarities</option>
                    ${rarities.map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
            </div>
            <div style="overflow-x:auto;">
                <table class="equipment-table" style="width:100%;min-width:600px;">
                    <thead>
                        <tr>
                            <th data-col="name" class="mini-codex-sort">Name <span class="sort-arrow" data-col="name"></span></th>
                            <th data-col="description" class="mini-codex-sort">Description <span class="sort-arrow" data-col="description"></span></th>
                            <th data-col="category" class="mini-codex-sort">Category <span class="sort-arrow" data-col="category"></span></th>
                            <th data-col="currency" class="mini-codex-sort">Currency <span class="sort-arrow" data-col="currency"></span></th>
                            <th data-col="rarity" class="mini-codex-sort">Rarity <span class="sort-arrow" data-col="rarity"></span></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody id="mini-codex-equip-tbody"></tbody>
                </table>
            </div>
        `;
        // Attach filter/sort events
        document.getElementById('mini-codex-equip-search').addEventListener('input', applyMiniCodexEquipmentFilters);
        document.getElementById('mini-codex-equip-category').addEventListener('change', e => {
            selectedCategory = e.target.value;
            applyMiniCodexEquipmentFilters();
        });
        document.getElementById('mini-codex-equip-rarity').addEventListener('change', e => {
            selectedRarity = e.target.value;
            applyMiniCodexEquipmentFilters();
        });
        document.querySelectorAll('.mini-codex-sort').forEach(th => {
            th.addEventListener('click', e => {
                const col = th.getAttribute('data-col');
                if (equipmentSortState.col === col) {
                    equipmentSortState.dir *= -1;
                } else {
                    equipmentSortState.col = col;
                    equipmentSortState.dir = 1;
                }
                applyMiniCodexEquipmentFilters();
            });
        });
        // Initial filter
        applyMiniCodexEquipmentFilters();
}

function applyMiniCodexEquipmentFilters() {
        const search = document.getElementById('mini-codex-equip-search').value.toLowerCase();
        filteredEquipment = allEquipment.filter(e => {
            if (search && !e.name.toLowerCase().includes(search) && !(e.description && e.description.toLowerCase().includes(search))) return false;
            if (selectedCategory && e.category !== selectedCategory) return false;
            if (selectedRarity && e.rarity !== selectedRarity) return false;
            return true;
        });
        applySort(filteredEquipment, equipmentSortState, equipmentSortState.col);
        renderMiniCodexEquipmentTable();
}

function renderMiniCodexEquipmentTable() {
        const tbody = document.getElementById('mini-codex-equip-tbody');
        if (!tbody) return;
        tbody.innerHTML = filteredEquipment.map(e => `
            <tr>
                <td>${e.name}</td>
                <td>${e.description ? e.description.substring(0, 80) + (e.description.length > 80 ? '...' : '') : ''}</td>
                <td>${e.category || ''}</td>
                <td>${e.currency || ''}</td>
                <td>${e.rarity || ''}</td>
                <td><button class="small-button blue-button" onclick="window.addEquipmentToCharacter && window.addEquipmentToCharacter('${encodeURIComponent(e.name)}')">Add</button></td>
            </tr>
        `).join('');
        // Update sort arrows
        document.querySelectorAll('.sort-arrow').forEach(span => {
            const col = span.getAttribute('data-col');
            if (col === equipmentSortState.col) {
                span.textContent = equipmentSortState.dir === 1 ? '▲' : '▼';
            } else {
                span.textContent = '';
            }
        });
}

// --- Add Equipment to Character Logic ---
window.addEquipmentToCharacter = function(encodedName) {
    const name = decodeURIComponent(encodedName);
    const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
    if (!charData) {
        alert('Character data not loaded.');
        return;
    }
    if (!Array.isArray(charData.equipment)) charData.equipment = [];
    // Check if already present (by name)
    const idx = charData.equipment.findIndex(e => {
        if (typeof e === 'string') return e === name;
        if (e && typeof e === 'object' && e.name) return e.name === name;
        return false;
    });
    if (idx !== -1) {
        // If already present, increment quantity
        if (typeof charData.equipment[idx] === 'object' && charData.equipment[idx] !== null) {
            charData.equipment[idx].quantity = (charData.equipment[idx].quantity || 1) + 1;
        } else {
            // If string, convert to object with quantity
            charData.equipment[idx] = { name, quantity: 2 };
        }
    } else {
        // Add new item with quantity 1
        charData.equipment.push({ name, quantity: 1 });
    }
    // Trigger auto-save and UI update
    if (window.scheduleAutoSave) window.scheduleAutoSave();
    
    // --- PATCH: Re-render library tab if visible and preserve active tab ---
    const container = document.getElementById('library-section');
    if (container) {
        // Determine which tab is currently active
        const activeTabBtn = container.querySelector('.tab.active');
        const activeTabName = activeTabBtn ? activeTabBtn.dataset.tab : 'feats';
        
        // Re-enrich and re-render the library with updated equipment
        if (typeof window.enrichCharacterData === 'function' && typeof window.renderLibrary === 'function') {
            const user = window.firebase?.auth?.()?.currentUser;
            const userId = user?.uid;
            
            // Re-enrich character data to include new equipment
            window.enrichCharacterData(charData, userId).then(enrichedData => {
                // Update the reference so other parts of the app see the enriched data
                if (window.currentCharacterData === charData) {
                    Object.assign(charData, enrichedData);
                }
                
                // Re-render library
                window.renderLibrary(enrichedData).then(() => {
                    // Restore the previously active tab
                    setTimeout(() => {
                        const tabs = container.querySelectorAll('.tab');
                        tabs.forEach(btn => {
                            if (btn.dataset.tab === activeTabName) btn.classList.add('active');
                            else btn.classList.remove('active');
                        });
                        container.querySelectorAll('.tab-content').forEach(content => {
                            const contentTab = content.id.replace('-content', '');
                            if (contentTab === activeTabName) content.classList.add('active');
                            else content.classList.remove('active');
                        });
                    }, 0);
                }).catch(err => {
                    console.error('[AddEquipment] Error re-rendering library:', err);
                });
            }).catch(err => {
                console.error('[AddEquipment] Error enriching data:', err);
            });
        }
    }
    // Close modal
    if (typeof window.closeResourceModal === 'function') window.closeResourceModal();
    // Optionally, show notification
    if (typeof window.showNotification === 'function') window.showNotification(`Added "${name}" to equipment.`, 'success');
};
