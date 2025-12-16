import { CollapsibleRow } from '../shared/collapsible-row.js';

export function createTechniquesContent(techniques) {
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
