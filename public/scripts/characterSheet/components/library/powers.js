import { formatPowerDamage } from '../../../power_calc.js';
import { buildTechniquePartChips } from './techniques.js';

export function createPowersContent(powers) {
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
    powers.forEach(power => {
        const wrapper = document.createElement('div');
        wrapper.className = 'collapsible-tech'; // reuse styling
        wrapper.style.marginBottom = '10px';
        // --- Build chips with blue highlight for TP cost ---
        let chipsHTML = '';
        if (Array.isArray(power.parts) && power.parts.length && power.partsDb) {
            chipsHTML = buildTechniquePartChips(power.parts, power.partsDb);
        } else if (power.partChipsHTML) {
            chipsHTML = power.partChipsHTML;
        }
        const damageStr = formatPowerDamage(power.damage);
        wrapper.innerHTML = `
            <div class="collapsed-row" style="grid-template-columns:1.4fr 1fr 1fr 0.8fr 0.9fr 0.9fr;">
                <div><strong>${power.name}</strong> <span class="expand-indicator">▼</span></div>
                <div>${power.actionType || 'Basic Action'}</div>
                <div>${damageStr || '-'}</div>
                <div><button class="energy-use-btn" data-name="${power.name}" data-energy="${power.energy || 0}">Use (${power.energy || 0})</button></div>
                <div>${power.area || '-'}</div>
                <div>${power.duration || '-'}</div>
            </div>
            <div class="expanded-body">
                ${power.description ? `<p style="margin:0 0 10px;">${power.description}</p>` : ''}
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
