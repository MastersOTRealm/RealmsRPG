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
    // Show type after dice, capitalized (e.g., "1d6 Slashing")
    return usable.map(d => `${d.amount}d${d.size} ${capitalizeDamageType(d.type)}`).join(', ');
}

// Helper for capitalizing damage type
function capitalizeDamageType(type) {
    if (!type) return '';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}

// REPLACED createInventoryContent with enriched calculations
export function createInventoryContent(inventoryObj) {
    const content = document.createElement('div');
    content.id = 'inventory-content';
    content.className = 'tab-content';

    // --- Currency box is created here, but appended to parent after tab activation ---
    content._currencyBox = (() => {
        const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
        let currency = charData?.currency ?? 0;
        const currencyBox = document.createElement('div');
        currencyBox.className = 'inventory-currency-box';
        currencyBox.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: flex-end;
            margin-bottom: 10px;
        `;
        currencyBox.innerHTML = `
            <div style="
                background: var(--bg-medium);
                color: var(--primary-dark);
                border-radius: 7px;
                padding: 6px 14px;
                font-weight: 700;
                font-size: 0.98em;
                box-shadow: var(--shadow);
                border: 1px solid var(--border-color);
                letter-spacing: 0.2px;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                CURRENCY:
                <input
                    id="inventory-currency-input"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9+-]*"
                    value="${currency}"
                    style="
                        width: 54px;
                        font-size: 1em;
                        font-weight: 700;
                        color: var(--primary-blue);
                        background: #fff;
                        border: 1px solid var(--border-color);
                        border-radius: 5px;
                        padding: 2px 6px;
                        text-align: right;
                        margin-left: 4px;
                        transition: border-color 0.2s;
                    "
                    title="Click to edit. Use +5, -5, or a number."
                >
            </div>
        `;

        // --- Add logic for editing currency ---
        setTimeout(() => {
            const input = currencyBox.querySelector('#inventory-currency-input');
            if (!input) return;
            input.addEventListener('focus', e => {
                setTimeout(() => input.select(), 1);
            });
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const raw = input.value.trim();
                    let currentVal = parseInt(charData?.currency) || 0;
                    let newValue;
                    if (/^[+]/.test(raw)) newValue = currentVal + (parseInt(raw.substring(1)) || 0);
                    else if (/^-/.test(raw)) newValue = currentVal - (parseInt(raw.substring(1)) || 0);
                    else newValue = parseInt(raw) || 0;
                    newValue = Math.max(0, newValue);
                    input.value = newValue;
                    if (charData) {
                        charData.currency = newValue;
                        window.scheduleAutoSave?.();
                    }
                }
            });
            input.addEventListener('blur', () => {
                // Reset to current value if not changed
                input.value = (charData?.currency ?? 0);
            });
        }, 0);

        return currencyBox;
    })();

    // Don't append currencyBox here; it will be inserted on tab activation

    // Accept inventoryObj: { weapons, armor, equipment }
    // --- FILTER OUT Unarmed Prowess from weapons ---
    const weapons = (Array.isArray(inventoryObj.weapons) ? inventoryObj.weapons : []).filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
    const armor = Array.isArray(inventoryObj.armor) ? inventoryObj.armor : [];
    const equipment = Array.isArray(inventoryObj.equipment) ? inventoryObj.equipment : [];

    if (!weapons.length && !armor.length && !equipment.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No items in inventory</p>';
        return content;
    }

    // Weapons
    if (weapons.length) {
        const title = document.createElement('h3');
        title.textContent = 'WEAPONS';
        title.style.cssText = 'margin:0 0 12px;padding:12px;background:var(--bg-medium);border-radius:8px;font-size:14px;font-weight:700;';
        content.appendChild(title);

        const header = document.createElement('div');
        header.className = 'library-table-header';
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
                ${w.proficiencies && w.proficiencies.length > 0 ? `
                  <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Properties & Proficiencies</h4>
                  <div class="part-chips">
                    ${w.proficiencies.map(p => {
                        let txt = p.name;
                        if (p.level > 0) txt += ` (Level ${p.level})`;
                        if (p.totalTP > 0) txt += ` | TP: ${p.baseTP}${p.optionTP > 0 ? ` + ${p.optionTP}` : ''}`;
                        return `<span class="part-chip${p.totalTP > 0 ? ' tp-cost' : ''}" title="${p.description || ''}">${txt}</span>`;
                    }).join('')}
                  </div>
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
                const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                if (charData?.weapons && charData.weapons[idx]) charData.weapons[idx].equipped = e.target.checked;
                window.scheduleAutoSave && window.scheduleAutoSave();
                if (window.refreshArchetypeColumn) window.refreshArchetypeColumn();
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
                ${a.proficiencies && a.proficiencies.length > 0 ? `
                  <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Properties & Proficiencies</h4>
                  <div class="part-chips">
                    ${a.proficiencies.map(p => {
                        let txt = p.name;
                        if (p.level > 0) txt += ` (Level ${p.level})`;
                        if (p.totalTP > 0) txt += ` | TP: ${p.baseTP}${p.optionTP > 0 ? ` + ${p.optionTP}` : ''}`;
                        return `<span class="part-chip${p.totalTP > 0 ? ' tp-cost' : ''}" title="${p.description || ''}">${txt}</span>`;
                    }).join('')}
                  </div>
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
                const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
                if (charData?.armor && charData.armor[idx]) charData.armor[idx].equipped = e.target.checked;
                window.scheduleAutoSave && window.scheduleAutoSave();
                if (window.refreshArchetypeColumn) window.refreshArchetypeColumn();
            });
            content.appendChild(wrapper);
        });
    }

    // General equipment
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
    // --- FILTER OUT Unarmed Prowess from weapons ---
    weapons = weapons.filter(w => {
        if (typeof w === 'string') return w !== 'Unarmed Prowess';
        return w.name !== 'Unarmed Prowess';
    });
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
        // --- CHANGED: buildDamageString now includes type after dice ---
        const damageStr = w.damageStr || w.damage || buildDamageString(w.damage);
        // Also extract first damage type for possible display (if needed elsewhere)
        let damageType = '';
        if (Array.isArray(w.damage) && w.damage.length > 0) {
            const firstDmg = w.damage.find(d => d && d.type && d.type !== 'none');
            if (firstDmg) damageType = capitalizeDamageType(firstDmg.type);
        }
        const rangeStr = w.range && w.range !== 'Melee'
            ? w.range
            : deriveRange(w.properties || w.itemParts || [], propertiesCatalog);
        const { currencyCost, rarity } = calculateCurrencyCostAndRarity(compute.c, compute.ip);
        return {
            ...w,
            damage: damageStr,
            damageType, // for completeness, not used in this table
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
                // Refresh archetype/weapons section immediately
                if (window.refreshArchetypeColumn) window.refreshArchetypeColumn();
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
                // Refresh archetype/weapons section immediately (for completeness)
                if (window.refreshArchetypeColumn) window.refreshArchetypeColumn();
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
