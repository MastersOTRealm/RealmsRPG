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

// --- Fetch and display general equipment from RTDatabase ---
export async function showEquipmentModal(rtdb) {
    console.log('[Modal] showEquipmentModal called with rtdb:', !!rtdb);
    if (!rtdb) {
        console.error('[Modal] rtdb is undefined, cannot load equipment');
        openResourceModal();
        const body = document.getElementById('resource-modal-body');
        if (body) body.innerHTML = '<div style="color:#b91c1c;">Error: Firebase Realtime Database not initialized.</div>';
        return;
    }
    openResourceModal();
    const body = document.getElementById('resource-modal-body');
    if (!body) {
        console.error('[Modal] resource-modal-body not found');
        return;
    }
    body.innerHTML = '<div style="text-align:center;padding:24px;">Loading equipment...</div>';
    try {
        console.log('[Modal] Fetching equipment from RTDB');
        const snap = await rtdb.ref('items').once('value'); // Fixed: Use 'items' node instead of 'equipment'
        const data = snap.val();
        if (!data) {
            body.innerHTML = '<div style="text-align:center;color:#b91c1c;">No equipment found.</div>';
            return;
        }
        // Render as a table (like codex/library)
        const items = Object.values(data);
        console.log('[Modal] Loaded', items.length, 'equipment items');
        let html = `
            <table class="equipment-table" style="width:100%;margin-top:8px;">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Currency</th>
                        <th>Rarity</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
        `;
        items.forEach(item => {
            html += `
                <tr>
                    <td>${item.name || ''}</td>
                    <td style="max-width:220px;">${item.description || ''}</td>
                    <td>${item.category || ''}</td>
                    <td>${item.currency || 0}</td>
                    <td>${item.rarity || 'Common'}</td>
                    <td>
                        <button class="small-button blue-button" data-equip-name="${item.name}">Add</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        body.innerHTML = html;
        // Add event listeners for "Add" buttons (for demo, just close modal)
        body.querySelectorAll('button[data-equip-name]').forEach(btn => {
            btn.onclick = () => {
                console.log('[Modal] Add button clicked for', btn.dataset.equipName);
                closeResourceModal();
            };
        });
    } catch (e) {
        console.error('[Modal] Error loading equipment:', e);
        body.innerHTML = `<div style="color:#b91c1c;">Error loading equipment: ${e.message}</div>`;
    }
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
