export function renderLibrary(charData) {
    const container = document.getElementById('library-section');
    container.innerHTML = '';
    
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabs.innerHTML = `
        <button class="tab active" data-tab="feats">FEATS</button>
        <button class="tab" data-tab="techniques">TECHNIQUES</button>
        <button class="tab" data-tab="powers">POWERS</button>
        <button class="tab" data-tab="inventory">INVENTORY</button>
        <button class="tab" data-tab="notes">NOTES</button>
    `;
    
    container.appendChild(tabs);
    
    // Tab contents
    const featsContent = createFeatsContent(charData.feats || []);
    const techniquesContent = createTechniquesContent(charData.techniques || []);
    const powersContent = createPowersContent(charData.powers || []);
    const inventoryContent = createInventoryContent(charData.inventory || []);
    const notesContent = createNotesContent(charData.notes || '');
    
    container.appendChild(featsContent);
    container.appendChild(techniquesContent);
    container.appendChild(powersContent);
    container.appendChild(inventoryContent);
    container.appendChild(notesContent);
    
    // Tab switching
    const tabButtons = tabs.querySelectorAll('.tab');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const targetTab = button.dataset.tab;
            container.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-content`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function createFeatsContent(feats) {
    const content = document.createElement('div');
    content.id = 'feats-content';
    content.className = 'tab-content active';
    if (!feats.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No feats selected</p>';
        return content;
    }
    // Header
    const header = document.createElement('div');
    header.className = 'library-table-header';
    header.innerHTML = '<div>NAME</div><div>DESCRIPTION</div><div>USES</div>';
    content.appendChild(header);

    // Build collapsible rows
    feats.forEach(f => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-feat';
        const truncatedDesc = (f.description || 'No description').split(/\s+/).slice(0,14).join(' ') + '...';

        // Uses cell (collapsed)
        const usesActive = f.uses ? `
            <div class="uses-cell">
                <button class="use-button" data-dir="-1">-</button>
                <span id="uses-${sanitizeId(f.name)}">${f.currentUses ?? f.uses}</span>/<span>${f.uses}</span>
                <button class="use-button" data-dir="1">+</button>
            </div>` : '<div style="text-align:right;font-size:11px;color:var(--text-secondary);">—</div>';

        wrapper.innerHTML = `
            <div class="collapsed-row">
                <div>
                  <strong>${f.name}</strong>
                  <span class="expand-indicator">▼</span><br>
                  <span style="font-size:10px;color:var(--text-secondary);">${f.category ? f.category.toUpperCase() : ''}</span>
                </div>
                <div class="truncated">${truncatedDesc}</div>
                ${usesActive}
            </div>
            <div class="expanded-body">
                <p style="margin:0 0 10px 0;">${f.description || 'No description available.'}</p>
                ${f.uses ? `
                    <div style="margin:6px 0 10px;font-size:12px;">
                        <strong>Recovery:</strong> ${f.recovery || 'Full Recovery'}<br>
                        <strong>Uses:</strong> <span id="exp-uses-${sanitizeId(f.name)}">${f.currentUses ?? f.uses}</span> / ${f.uses}
                    </div>` : ''
                }
            </div>
        `;
        // Toggle handler
        wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
            // Ignore clicks on use buttons
            if (e.target.classList.contains('use-button')) return;
            wrapper.classList.toggle('open');
            const ind = wrapper.querySelector('.expand-indicator');
            if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
        });
        // Use buttons
        if (f.uses) {
            wrapper.querySelectorAll('.use-button').forEach(btn => {
                btn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    const dir = parseInt(btn.dataset.dir);
                    changeFeatUses(f.name, dir);
                    // Sync expanded display if open
                    const expSpan = wrapper.querySelector(`#exp-uses-${sanitizeId(f.name)}`);
                    const baseSpan = wrapper.querySelector(`#uses-${sanitizeId(f.name)}`);
                    if (expSpan && baseSpan) expSpan.textContent = baseSpan.textContent;
                });
            });
        }
        content.appendChild(wrapper);
    });

    return content;
}

function createTechniquesContent(techniques) {
    const content = document.createElement('div');
    content.id = 'techniques-content';
    content.className = 'tab-content';
    if (!techniques.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No techniques selected</p>';
        return content;
    }
    const header = document.createElement('div');
    header.className = 'library-table-header tech';
    header.innerHTML = '<div>NAME</div><div>ACTION</div><div>WEAPON</div><div>ENERGY</div>';
    content.appendChild(header);

    techniques.forEach(t => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-tech';
        wrapper.innerHTML = `
            <div class="collapsed-row">
                <div>
                   <strong>${t.name}</strong>
                   <span class="expand-indicator">▼</span>
                </div>
                <div>${t.actionType || 'Basic Action'}</div>
                <div>${t.weaponName || 'Unarmed'}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                    <button class="energy-use-btn" data-name="${t.name}" data-energy="${t.energy}">Use (${t.energy})</button>
                </div>
            </div>
            <div class="expanded-body">
                <div class="tech-detail-grid">
                    <div><label>Action</label><span>${t.actionType || 'Basic Action'}</span></div>
                    <div><label>Weapon</label><span>${t.weaponName || 'Unarmed'}</span></div>
                    <div><label>Energy</label><span>${t.energy}</span></div>
                    ${t.damageStr ? `<div><label>Damage</label><span>${t.damageStr}</span></div>` : ''}
                </div>
                ${t.description ? `<p style="margin:0 0 12px;">${t.description}</p>` : ''}
                ${t.partChipsHTML ? `
                    <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">${t.partChipsHTML}</div>
                ` : ''}
            </div>
        `;
        wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
            if (e.target.classList.contains('energy-use-btn')) return;
            wrapper.classList.toggle('open');
            const ind = wrapper.querySelector('.expand-indicator');
            if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
        });
        wrapper.querySelector('.energy-use-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const energy = parseInt(e.target.dataset.energy);
            const name = e.target.dataset.name;
            useTechnique(name, energy);
        });
        content.appendChild(wrapper);
    });
    return content;
}

function createPowersContent(powers) {
    const content = document.createElement('div');
    content.id = 'powers-content';
    content.className = 'tab-content';
    if (!powers.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No powers selected</p>';
        return content;
    }
    const header = document.createElement('div');
    header.className = 'library-table-header tech'; // reuse style
    header.style.gridTemplateColumns = '1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr';
    header.innerHTML = '<div>NAME</div><div>ACTION</div><div>DAMAGE</div><div>ENERGY</div><div>AREA</div><div>DURATION</div>';
    content.appendChild(header);
    powers.forEach(p => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-tech'; // reuse styling
        wrapper.style.marginBottom = '10px';
        const truncatedDesc = (p.description || 'No description').split(/\s+/).slice(0,14).join(' ') + '...';
        wrapper.innerHTML = `
            <div class="collapsed-row" style="grid-template-columns:1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr;">
                <div><strong>${p.name}</strong> <span class="expand-indicator">▼</span></div>
                <div>${p.actionType || 'Basic Action'}</div>
                <div>${p.damageStr || p.damage || '-'}</div>
                <div><button class="energy-use-btn" data-name="${p.name}" data-energy="${p.energy || 0}">Use (${p.energy || 0})</button></div>
                <div>${p.area || '-'}</div>
                <div>${p.duration || '-'}</div>
            </div>
            <div class="expanded-body">
                <div class="tech-detail-grid">
                    <div><label>Action</label><span>${p.actionType || 'Basic Action'}</span></div>
                    <div><label>Damage</label><span>${p.damageStr || p.damage || '-'}</span></div>
                    <div><label>Energy</label><span>${p.energy || 0}</span></div>
                    <div><label>Area</label><span>${p.area || '-'}</span></div>
                    <div><label>Duration</label><span>${p.duration || '-'}</span></div>
                </div>
                ${p.description ? `<p style="margin:0 0 12px;">${p.description}</p>` : ''}
                ${p.partChipsHTML ? `
                    <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;">${p.partChipsHTML}</div>
                ` : ''}
            </div>
        `;
        wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
            if (e.target.classList.contains('energy-use-btn')) return;
            wrapper.classList.toggle('open');
            const ind = wrapper.querySelector('.expand-indicator');
            if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
        });
        wrapper.querySelector('.energy-use-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const energy = parseInt(e.target.dataset.energy);
            const name = e.target.dataset.name;
            usePower(name, energy);
        });
        content.appendChild(wrapper);
    });
    return content;
}

function createInventoryContent(inventory) {
    const content = document.createElement('div');
    content.id = 'inventory-content';
    content.className = 'tab-content';
    
    if (inventory.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No items in inventory</p>';
        return content;
    }
    
    inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `
            <div class="feat-header">
                <div class="feat-title">${item.name}</div>
                <div style="font-size:13px;color:var(--text-secondary);">Qty: ${item.quantity || 1}</div>
            </div>
            <div class="feat-description">
                ${item.description || ''}<br>
                <strong>Cost:</strong> ${item.cost || 'N/A'} GP
            </div>
        `;
        content.appendChild(div);
    });
    
    return content;
}

function createNotesContent(notes) {
    const content = document.createElement('div');
    content.id = 'notes-content';
    content.className = 'tab-content';
    
    content.innerHTML = `
        <textarea id="character-notes" style="width:100%;min-height:300px;padding:12px;border:1px solid var(--border-color);border-radius:8px;font-family:inherit;font-size:14px;resize:vertical;">${notes}</textarea>
        <button class="bonus-button" style="margin-top:12px;" onclick="saveNotes()">Save Notes</button>
    `;
    
    return content;
}

function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
}
