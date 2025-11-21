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
    
    if (feats.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No feats selected</p>';
        return content;
    }
    
    // Group feats by category
    const categories = {
        'Ancestry': [],
        'Archetype': [],
        'Character': [],
        'State': []
    };
    
    feats.forEach(feat => {
        const category = feat.category || 'Character';
        if (categories[category]) {
            categories[category].push(feat);
        } else {
            categories['Character'].push(feat);
        }
    });
    
    Object.entries(categories).forEach(([category, categoryFeats]) => {
        if (categoryFeats.length > 0) {
            const divider = document.createElement('div');
            divider.className = 'category-divider';
            divider.innerHTML = `
                <span class="category-arrow">▼</span>
                ${category.toUpperCase()} FEATS
            `;
            
            const categoryContent = document.createElement('div');
            categoryContent.className = 'category-content';
            
            categoryFeats.forEach(feat => {
                const featDiv = createFeatElement(feat);
                categoryContent.appendChild(featDiv);
            });
            
            divider.addEventListener('click', () => {
                const arrow = divider.querySelector('.category-arrow');
                arrow.classList.toggle('collapsed');
                categoryContent.classList.toggle('collapsed');
            });
            
            content.appendChild(divider);
            content.appendChild(categoryContent);
        }
    });
    
    return content;
}

function createFeatElement(feat) {
    const div = document.createElement('div');
    div.className = 'feat';
    
    const recovery = feat.recovery || 'FULL RECOVERY';
    const usesControl = feat.uses ? `
        <div class="uses">
            <button class="use-button" onclick="changeFeatUses('${feat.name}', -1)">▼</button>
            <span id="uses-${sanitizeId(feat.name)}">${feat.currentUses ?? feat.uses}</span>
            <span class="uses-separator">/</span>
            <span>${feat.uses}</span>
            <button class="use-button" onclick="changeFeatUses('${feat.name}', 1)">▲</button>
            <span class="recovery-text">${recovery}</span>
        </div>
    ` : '';
    
    div.innerHTML = `
        <div class="feat-header">
            <div class="feat-title">${feat.name}</div>
            <div class="feat-category">${feat.category ? `${feat.category.toUpperCase()} FEAT` : ''}</div>
        </div>
        <div class="feat-description">${feat.description || 'No description available'}</div>
        <div class="feat-controls">
            ${usesControl}
        </div>
    `;
    
    return div;
}

function createTechniquesContent(techniques) {
    const content = document.createElement('div');
    content.id = 'techniques-content';
    content.className = 'tab-content';
    
    if (techniques.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No techniques selected</p>';
        return content;
    }
    
    techniques.forEach(technique => {
        const div = document.createElement('div');
        div.className = 'technique';
        div.innerHTML = `
            <div class="feat-header">
                <div class="feat-title">${technique.name}</div>
                <button class="bonus-button" onclick="useTechnique('${technique.name}', ${technique.energy})">${technique.energy} EN</button>
            </div>
            <div class="feat-description">
                <strong>Range:</strong> ${technique.range || 'Melee'}<br>
                <strong>Damage:</strong> ${technique.damage || 'None'}<br>
                ${technique.description || ''}
            </div>
        `;
        content.appendChild(div);
    });
    
    return content;
}

function createPowersContent(powers) {
    const content = document.createElement('div');
    content.id = 'powers-content';
    content.className = 'tab-content';
    
    if (powers.length === 0) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No powers selected</p>';
        return content;
    }
    
    powers.forEach(power => {
        const div = document.createElement('div');
        div.className = 'power';
        div.innerHTML = `
            <div class="feat-header">
                <div class="feat-title">${power.name}</div>
                <button class="bonus-button" onclick="usePower('${power.name}', ${power.energy})">${power.energy} EN</button>
            </div>
            <div class="feat-description">
                <strong>Range:</strong> ${power.range || 'N/A'}<br>
                <strong>Damage:</strong> ${power.damage || 'None'}<br>
                <strong>Targets:</strong> ${power.targets || 'N/A'}<br>
                <strong>Duration:</strong> ${power.duration || 'Instant'}<br>
                ${power.description || ''}
            </div>
        `;
        content.appendChild(div);
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
