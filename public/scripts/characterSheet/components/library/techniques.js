import { CollapsibleRow } from '../shared/collapsible-row.js';

export function createTechniquesContent(techniques) {
    const content = document.createElement('div');
    content.id = 'techniques-content';
    content.className = 'tab-content';
    
    const isEditMode = document.body.classList.contains('edit-mode');
    
    // Add header with "Add Technique" button in edit mode
    const editHeader = document.createElement('div');
    editHeader.className = 'library-section-header';
    editHeader.innerHTML = `
        <h3>TECHNIQUES</h3>
        <button class="resource-add-btn" onclick="window.showTechniqueModal()">
            + Add Technique
        </button>
    `;
    content.appendChild(editHeader);
    
    if (!techniques.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px;';
        emptyMsg.textContent = 'No techniques selected';
        content.appendChild(emptyMsg);
        return content;
    }
    const header = document.createElement('div');
    header.className = 'library-table-header tech';
    header.innerHTML = '<div>NAME</div><div>ACTION</div><div>WEAPON</div><div>ENERGY</div>';
    content.appendChild(header);

    techniques.forEach(t => {
        // Build chips with blue highlight for TP cost
        let chipsHTML = '';
        if (Array.isArray(t.parts) && t.parts.length && t.partsDb) {
            chipsHTML = buildTechniquePartChips(t.parts, t.partsDb);
        } else if (t.partChipsHTML) {
            chipsHTML = t.partChipsHTML;
        }

        const expandedContent = chipsHTML ? `
            <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
            <div class="part-chips">${chipsHTML}</div>
        ` : '';

        const row = new CollapsibleRow({
            title: t.name,
            columns: [
                { content: t.actionType || 'Basic Action' },
                { content: t.weaponName || 'Unarmed' }
            ],
            description: t.description || '',
            className: 'collapsible-tech',
            actionButton: {
                label: `Use (${t.energy})`,
                data: { name: t.name, energy: t.energy },
                onClick: (e) => {
                    const energy = parseInt(e.target.dataset.energy);
                    const name = e.target.dataset.name;
                    window.useTechnique(name, energy);
                }
            },
            expandedContent: expandedContent
        });

        // Add remove button in edit mode
        if (isEditMode) {
            const collapsedRow = row.element.querySelector('.collapsed-row');
            if (collapsedRow) {
                collapsedRow.style.position = 'relative';
                const removeBtn = document.createElement('button');
                removeBtn.className = 'resource-remove-btn';
                removeBtn.innerHTML = '✕';
                removeBtn.title = 'Remove technique';
                removeBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:4px 8px;font-size:0.9em;background:var(--error-color, #dc3545);color:white;border:none;border-radius:4px;cursor:pointer;z-index:10;';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Remove "${t.name}" technique?`)) {
                        window.removeTechniqueFromCharacter(encodeURIComponent(t.name));
                    }
                };
                collapsedRow.appendChild(removeBtn);
            }
        }

        content.appendChild(row.element);
    });
    return content;
}

// --- Shared helper for blue chips for powers/techniques ---
export function buildTechniquePartChips(parts, partsDb) {
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
