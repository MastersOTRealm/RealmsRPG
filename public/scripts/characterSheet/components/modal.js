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

// --- Add "Edit" button to character sheet header (top right, next to Save) ---
export function addEditButton(rtdb) {
    console.log('[Modal] addEditButton called with rtdb:', !!rtdb);
    // Try multiple selectors to ensure the button is added somewhere visible
    let container = document.querySelector('.sheet-actions');
    if (!container) {
        console.log('[Modal] .sheet-actions not found, trying .character-sheet');
        container = document.querySelector('.character-sheet');
    }
    if (!container) {
        console.log('[Modal] .character-sheet not found, trying document.body');
        container = document.body;
    }
    if (!container || document.getElementById('edit-sheet-btn')) {
        console.log('[Modal] Container not found or button already exists');
        return;
    }
    console.log('[Modal] Adding edit button to', container.className || container.tagName);
    const btn = document.createElement('button');
    btn.id = 'edit-sheet-btn';
    btn.className = 'action-button';
    btn.textContent = 'Edit';
    btn.onclick = () => {
        console.log('[Modal] Edit button clicked');
        showEquipmentModal(rtdb);
    };
    container.appendChild(btn);
    console.log('[Modal] Edit button added');
}

// --- Usage: In your main character sheet JS, after Firebase init ---
// import { addEditButton } from './components/modal.js';
// addEditButton(rtdb); // pass your RTDB instance

// --- Style: Use modal.css for modal appearance ---
