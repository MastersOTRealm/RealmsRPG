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
    const inventoryContent = createInventoryContent(charData.equipment || []);
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
        // --- Build chips with blue highlight for TP cost ---
        let chipsHTML = '';
        if (Array.isArray(t.parts) && t.parts.length && t.partsDb) {
            chipsHTML = buildTechniquePartChips(t.parts, t.partsDb);
        } else if (t.partChipsHTML) {
            chipsHTML = t.partChipsHTML;
        }
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
                ${t.description ? `<p style="margin:0 0 10px;">${t.description}</p>` : ''}
                ${chipsHTML ? `
                    <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
                    <div class="part-chips">${chipsHTML}</div>
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
        // --- Build chips with blue highlight for TP cost ---
        let chipsHTML = '';
        if (Array.isArray(p.parts) && p.parts.length && p.partsDb) {
            chipsHTML = buildTechniquePartChips(p.parts, p.partsDb);
        } else if (p.partChipsHTML) {
            chipsHTML = p.partChipsHTML;
        }
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
                ${p.description ? `<p style="margin:0 0 10px;">${p.description}</p>` : ''}
                ${chipsHTML ? `
                    <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
                    <div class="part-chips">${chipsHTML}</div>
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

// --- Add this helper for blue chips for powers/techniques ---
function buildTechniquePartChips(parts, partsDb) {
    if (!Array.isArray(parts) || !partsDb) return '';
    return parts.map(pl => {
        const def = partsDb.find(p => p.name === pl.name);
        if (!def) return '';
        // Calculate TP cost
        const l1 = pl.op_1_lvl || 0, l2 = pl.op_2_lvl || 0, l3 = pl.op_3_lvl || 0;
        let opt1TPRaw = (def.op_1_tp || 0) * l1;
        if (def.name === 'Additional Damage') opt1TPRaw = Math.floor(opt1TPRaw);
        const rawTP =
            (def.base_tp || 0) +
            opt1TPRaw +
            (def.op_2_tp || 0) * l2 +
            (def.op_3_tp || 0) * l3;
        const finalTP = Math.floor(rawTP);
        let text = def.name;
        if (l1 > 0) text += ` (Opt1 ${l1})`;
        if (l2 > 0) text += ` (Opt2 ${l2})`;
        if (l3 > 0) text += ` (Opt3 ${l3})`;
        if (finalTP > 0) text += ` [+${finalTP} TP]`;
        const tpClass = finalTP > 0 ? 'tp-cost' : '';
        return `<span class="part-chip ${tpClass}" title="TP:${finalTP}">${text}</span>`;
    }).join('');
}

let _itemPropertiesCache = null;
async function loadItemPropertiesIfNeeded() {
    if (_itemPropertiesCache) return _itemPropertiesCache;
    try {
        if (typeof firebase === 'undefined' || !firebase.database) return [];
        const snap = await firebase.database().ref('properties').once('value');
        const data = snap.val();
        if (!data) return [];
        _itemPropertiesCache = Object.entries(data).map(([id, p]) => ({
            id,
            name: p.name || '',
            base_ip: parseFloat(p.base_ip) || 0,
            base_tp: parseFloat(p.base_tp) || 0,
            base_c: parseFloat(p.base_c) || 0,
            op_1_ip: parseFloat(p.op_1_ip) || 0,
            op_1_tp: parseFloat(p.op_1_tp) || 0,
            op_1_c: parseFloat(p.op_1_c) || 0
        }));
        return _itemPropertiesCache;
    } catch {
        return [];
    }
}

function computePropertyTotals(itemProps, catalog) {
    let ip = 0, tp = 0, c = 0;
    const displayNames = [];
    (itemProps || []).forEach(ref => {
        // ref may be string OR object {id/name, op_1_lvl}
        const id = (ref && (ref.id || ref.name)) ? (ref.id || ref.name) : ref;
        const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
        const found = catalog.find(pp => pp.id === id || pp.name === id);
        if (!found) {
            if (typeof id === 'string') displayNames.push(id);
            return;
        }
        ip += found.base_ip + (found.op_1_ip * lvl);
        tp += found.base_tp + (found.op_1_tp * lvl);
        c  += found.base_c  + (found.op_1_c  * lvl);
        displayNames.push(lvl > 0 ? `${found.name} (Lvl ${lvl})` : found.name);
    });
    return { ip, tp, c, displayNames };
}

function deriveRange(itemProps, catalog) {
    const ref = (itemProps || []).find(r => {
        const nm = r && (r.name || r.id) ? (r.name || r.id) : r;
        return nm === 'Range';
    });
    if (!ref) return 'Melee';
    const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
    // Base 8 spaces + 8 per level (matches creator logic)
    return `${8 + lvl * 8} spaces`;
}

function deriveDamageReduction(itemProps, catalog) {
    const ref = (itemProps || []).find(r => {
        const nm = r && (r.name || r.id) ? (r.name || r.id) : r;
        return nm === 'Damage Reduction';
    });
    if (!ref) return 0;
    const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
    return 1 + lvl;
}

function buildDamageString(dmgArr) {
    if (!Array.isArray(dmgArr)) return '-';
    const usable = dmgArr.filter(d => d && d.amount && d.size && d.type && d.type !== 'none');
    if (!usable.length) return '-';
    return usable.map(d => `${d.amount}d${d.size} ${d.type}`).join(', ');
}

// REPLACED createInventoryContent with enriched calculations
function createInventoryContent(inventory) {
    const content = document.createElement('div');
    content.id = 'inventory-content';
    content.className = 'tab-content';
    enrichAndRenderInventory(content, inventory);
    return content;
}

function computeSinglePropertyTotals(ref, catalog) {
    const id = (ref && (ref.id || ref.name)) ? (ref.id || ref.name) : ref;
    const lvl = ref && typeof ref === 'object' ? (ref.op_1_lvl || 0) : 0;
    const found = catalog.find(pp => pp.id === id || pp.name === id);
    if (!found) return null;
    return {
        name: found.name,
        lvl,
        ip: found.base_ip + found.op_1_ip * lvl,
        tp: found.base_tp + found.op_1_tp * lvl,
        c: found.base_c + found.op_1_c * lvl
    };
}

function buildPropertyChips(itemProps, catalog) {
    if (!Array.isArray(itemProps) || !itemProps.length) return '';
    const chips = itemProps
        .map(r => computeSinglePropertyTotals(r, catalog))
        .filter(Boolean)
        .map(info => {
            const tpClass = info.tp > 0 ? 'tp-cost' : '';
            const lvlTag = info.lvl > 0 ? ` (Lvl ${info.lvl})` : '';
            return `<span class="part-chip ${tpClass}" title="IP:${info.ip} TP:${info.tp} C:${info.c}">${info.name}${lvlTag}${info.tp > 0 ? ` [+${info.tp} TP]` : ''}</span>`;
        }).join('');
    return chips ? `<div class="part-chips">${chips}</div>` : '';
}

// Minimal inline style injection (only once)
if (!window.__propChipStylesInjected) {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .part-chips { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0 0; }
      .part-chip { padding:4px 10px; font-size:11px; border-radius:14px; background:var(--bg-medium); border:1px solid var(--border-color); line-height:1.2; white-space:nowrap; color:var(--text-primary);}
      .part-chip.tp-cost {
        background: var(--primary-blue) !important;
        border-color: var(--primary-blue) !important;
        color: #fff !important;
        font-weight:600;
      }
    `;
    document.head.appendChild(styleEl);
    window.__propChipStylesInjected = true;
}

async function enrichAndRenderInventory(content, inventory) {
    const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
    let weapons = charData?.weapons || [];
    let armor = charData?.armor || [];
    const equipment = inventory || [];

    const propertiesCatalog = await loadItemPropertiesIfNeeded();
    const { calculateCurrencyCostAndRarity } = await import('/scripts/item_calc.js');

    // Normalize weapon objects (some may be names only)
    weapons = weapons.map(w => {
        if (typeof w === 'string') return { name: w };
        return { ...w };
    }).map(w => {
        const compute = computePropertyTotals(w.properties || w.itemParts || [], propertiesCatalog);
        const damageStr = w.damageStr || w.damage || buildDamageString(w.damage);
        const rangeStr = w.range && w.range !== 'Melee'
            ? w.range
            : deriveRange(w.properties || w.itemParts || [], propertiesCatalog);
        const { currencyCost, rarity } = calculateCurrencyCostAndRarity(compute.c, compute.ip);
        return {
            ...w,
            damage: damageStr,
            range: rangeStr,
            totalTP: w.totalTP || w.totalBP || compute.tp,
            currencyCost: w.currencyCost || currencyCost,
            rarity: w.rarity || rarity,
            _propNames: compute.displayNames.length ? compute.displayNames : (w.properties || [])
        };
    });

    armor = armor.map(a => {
        if (typeof a === 'string') return { name: a };
        return { ...a };
    }).map(a => {
        const compute = computePropertyTotals(a.properties || a.itemParts || [], propertiesCatalog);
        const dr = a.damageReduction != null ? a.damageReduction : deriveDamageReduction(a.properties || a.itemParts || [], propertiesCatalog);
        const { currencyCost, rarity } = calculateCurrencyCostAndRarity(compute.c, compute.ip);
        return {
            ...a,
            damageReduction: dr,
            totalTP: a.totalTP || a.totalBP || compute.tp,
            currencyCost: a.currencyCost || currencyCost,
            rarity: a.rarity || rarity,
            _propNames: compute.displayNames.length ? compute.displayNames : (a.properties || [])
        };
    });

    if (!weapons.length && !armor.length && !equipment.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No items in inventory</p>';
        return;
    }

    // Clear for rebuild
    content.innerHTML = '';

    // Weapons
    if (weapons.length) {
        const title = document.createElement('h3');
        title.textContent = 'WEAPONS';
        title.style.cssText = 'margin:0 0 12px;padding:12px;background:var(--bg-medium);border-radius:8px;font-size:14px;font-weight:700;';
        content.appendChild(title);

        const header = document.createElement('div');
        header.className = 'library-table-header';
        // CHANGED: removed PROPERTIES column, adjusted template
        header.style.gridTemplateColumns = '1.8fr 1fr 1fr 0.6fr 0.9fr 0.9fr 0.7fr';
        header.innerHTML = '<div>NAME</div><div>DAMAGE</div><div>RANGE</div><div>TP</div><div>CURRENCY</div><div>RARITY</div><div>EQUIPPED</div>';
        content.appendChild(header);

        weapons.forEach((w, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-tech';
            wrapper.style.marginBottom = '8px';
            wrapper.innerHTML = `
              <div class="collapsed-row" style="grid-template-columns:1.8fr 1fr 1fr 0.6fr 0.9fr 0.9fr 0.7fr;">
                <div><strong>${w.name || 'Unnamed'}</strong> <span class="expand-indicator">▼</span></div>
                <div>${w.damage || '-'}</div>
                <div>${w.range || 'Melee'}</div>
                <div>${w.totalTP || 0}</div>
                <div>${Math.ceil(w.currencyCost || 0)}</div>
                <div>${w.rarity || 'Common'}</div>
                <div style="text-align:center;"><input type="checkbox" class="equipped-checkbox" data-type="weapon" data-index="${idx}" ${w.equipped ? 'checked' : ''}></div>
              </div>
              <div class="expanded-body">
                ${w.description ? `<p style="margin:0 0 10px;">${w.description}</p>` : ''}
                ${buildPropertyChips(w.properties || w.itemParts || [], propertiesCatalog) ? `
                  <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Properties & Proficiencies</h4>
                  ${buildPropertyChips(w.properties || w.itemParts || [], propertiesCatalog)}
                ` : ''}
              </div>
            `;
            wrapper.querySelector('.collapsed-row').addEventListener('click', e => {
                if (e.target.type === 'checkbox') return;
                wrapper.classList.toggle('open');
                const ind = wrapper.querySelector('.expand-indicator');
                if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
            });
            wrapper.querySelector('.equipped-checkbox').addEventListener('change', e => {
                weapons[idx].equipped = e.target.checked;
                if (charData?.weapons && charData.weapons[idx]) charData.weapons[idx].equipped = e.target.checked;
                window.scheduleAutoSave && window.scheduleAutoSave();
            });
            content.appendChild(wrapper);
        });
    }
    // Armor
    if (armor.length) {
        const title = document.createElement('h3');
        title.textContent = 'ARMOR';
        title.style.cssText = 'margin:24px 0 12px;padding:12px;background:var(--bg-medium);border-radius:8px;font-size:14px;font-weight:700;';
        content.appendChild(title);

        const header = document.createElement('div');
        header.className = 'library-table-header';
        // CHANGED: removed PROPERTIES column, adjusted template
        header.style.gridTemplateColumns = '2fr 0.9fr 0.6fr 0.9fr 0.9fr 0.7fr';
        header.innerHTML = '<div>NAME</div><div>DMG RED.</div><div>TP</div><div>CURRENCY</div><div>RARITY</div><div>EQUIPPED</div>';
        content.appendChild(header);

        armor.forEach((a, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-tech';
            wrapper.style.marginBottom = '8px';
            wrapper.innerHTML = `
              <div class="collapsed-row" style="grid-template-columns:2fr 0.9fr 0.6fr 0.9fr 0.9fr 0.7fr;">
                <div><strong>${a.name || 'Unnamed'}</strong> <span class="expand-indicator">▼</span></div>
                <div>${a.damageReduction ?? 0}</div>
                <div>${a.totalTP || 0}</div>
                <div>${Math.ceil(a.currencyCost || 0)}</div>
                <div>${a.rarity || 'Common'}</div>
                <div style="text-align:center;"><input type="checkbox" class="equipped-checkbox" data-type="armor" data-index="${idx}" ${a.equipped ? 'checked' : ''}></div>
              </div>
              <div class="expanded-body">
                ${a.description ? `<p style="margin:0 0 10px;">${a.description}</p>` : ''}
                ${buildPropertyChips(a.properties || a.itemParts || [], propertiesCatalog) ? `
                  <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Properties & Proficiencies</h4>
                  ${buildPropertyChips(a.properties || a.itemParts || [], propertiesCatalog)}
                ` : ''}
              </div>
            `;
            wrapper.querySelector('.collapsed-row').addEventListener('click', e => {
                if (e.target.type === 'checkbox') return;
                wrapper.classList.toggle('open');
                const ind = wrapper.querySelector('.expand-indicator');
                if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
            });
            wrapper.querySelector('.equipped-checkbox').addEventListener('change', e => {
                armor[idx].equipped = e.target.checked;
                if (charData?.armor && charData.armor[idx]) charData.armor[idx].equipped = e.target.checked;
                window.scheduleAutoSave && window.scheduleAutoSave();
            });
            content.appendChild(wrapper);
        });
    }

    // General equipment (unchanged logic – keep simple)
    if (equipment.length) {
        const title = document.createElement('h3');
        title.textContent = 'GENERAL EQUIPMENT';
        title.style.cssText = 'margin:24px 0 12px;padding:12px;background:var(--bg-medium);border-radius:8px;font-size:14px;font-weight:700;';
        content.appendChild(title);

        const header = document.createElement('div');
        header.className = 'library-table-header';
        header.style.gridTemplateColumns = '1.5fr 2fr 1fr 0.9fr 0.8fr';
        header.innerHTML = '<div>NAME</div><div>DESCRIPTION</div><div>CATEGORY</div><div>CURRENCY</div><div>QUANTITY</div>';
        content.appendChild(header);

        equipment.forEach(item => {
            const wrapper = document.createElement('div');
            wrapper.className = 'collapsible-tech';
            wrapper.style.marginBottom = '8px';
            const truncatedDesc = (item.description || 'No description').split(/\s+/).slice(0, 12).join(' ') + '...';
            wrapper.innerHTML = `
              <div class="collapsed-row" style="grid-template-columns:1.5fr 2fr 1fr 0.9fr 0.8fr;">
                <div><strong>${item.name || 'Unnamed'}</strong> <span class="expand-indicator">▼</span></div>
                <div class="truncated">${truncatedDesc}</div>
                <div>${item.category || 'General'}</div>
                <div>${item.currency || 0}</div>
                <div>${item.quantity || 1}</div>
              </div>
              <div class="expanded-body">
                ${item.description ? `<p style="margin:0;">${item.description}</p>` : ''}
              </div>
            `;
            wrapper.querySelector('.collapsed-row').addEventListener('click', () => {
                wrapper.classList.toggle('open');
                const ind = wrapper.querySelector('.expand-indicator');
                if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
            });
            content.appendChild(wrapper);
        });
    }
}

function formatAbilityReq(req) {
    if (!req || typeof req !== 'object') return 'None';
    const entries = Object.entries(req);
    if (entries.length === 0) return 'None';
    return entries.map(([ability, value]) => `${value} ${ability.substring(0, 3).toUpperCase()}`).join(', ');
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
