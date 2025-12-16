import { formatPowerDamage } from '../../../power_calc.js';
import { buildTechniquePartChips } from './techniques.js';
import { CollapsibleRow } from '../shared/collapsible-row.js';

export function createPowersContent(powers) {
    const content = document.createElement('div');
    content.id = 'powers-content';
    content.className = 'tab-content';
    if (!powers.length) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No powers selected</p>';
        return content;
    }
    const header = document.createElement('div');
    header.className = 'library-table-header tech';
    header.style.gridTemplateColumns = '1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr';
    header.innerHTML = '<div>NAME</div><div>ACTION</div><div>DAMAGE</div><div>ENERGY</div><div>AREA</div><div>DURATION</div>';
    content.appendChild(header);

    powers.forEach(power => {
        // Build chips with blue highlight for TP cost
        let chipsHTML = '';
        if (Array.isArray(power.parts) && power.parts.length && power.partsDb) {
            chipsHTML = buildTechniquePartChips(power.parts, power.partsDb);
        } else if (power.partChipsHTML) {
            chipsHTML = power.partChipsHTML;
        }

        const damageStr = formatPowerDamage(power.damage);
        const expandedContent = chipsHTML ? `
            <h4 style="margin:0 0 6px;font-size:12px;color:var(--primary-dark);">Parts & Proficiencies</h4>
            <div class="part-chips">${chipsHTML}</div>
        ` : '';

        const row = new CollapsibleRow({
            title: power.name,
            columns: [
                { content: power.actionType || 'Basic Action' },
                { content: damageStr || '-' }
            ],
            description: power.description || '',
            className: 'collapsible-tech',
            gridColumns: '1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr',
            actionButton: {
                label: `Use (${power.energy || 0})`,
                data: { name: power.name, energy: power.energy || 0 },
                onClick: (e) => {
                    const energy = parseInt(e.target.dataset.energy);
                    const name = e.target.dataset.name;
                    window.usePower(name, energy);
                }
            },
            expandedContent: expandedContent
        });

        // Add additional columns for area and duration after the action button
        const collapsedRow = row.element.querySelector('.collapsed-row');
        const areaDiv = document.createElement('div');
        areaDiv.textContent = power.area || '-';
        const durationDiv = document.createElement('div');
        durationDiv.textContent = power.duration || '-';
        collapsedRow.appendChild(areaDiv);
        collapsedRow.appendChild(durationDiv);

        row.element.style.marginBottom = '10px';
        content.appendChild(row.element);
    });
    return content;
}
