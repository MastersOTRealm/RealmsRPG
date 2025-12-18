import { formatPowerDamage } from '../../../power_calc.js';
import { buildTechniquePartChips } from './techniques.js';
import { CollapsibleRow } from '../shared/collapsible-row.js';

export function createPowersContent(powers) {
    const content = document.createElement('div');
    content.id = 'powers-content';
    content.className = 'tab-content';
    
    const isEditMode = document.body.classList.contains('edit-mode');
    
    // Calculate innate values using archetype progression (always visible)
    const charData = window.currentCharacterData ? (typeof window.currentCharacterData === 'function' ? window.currentCharacterData() : window.currentCharacterData) : null;
    let innateThreshold = 0;
    let innatePools = 0;
    let innateEnergy = 0;
    
    if (typeof window.calculateArchetypeProgression === 'function' && charData) {
        const progression = window.calculateArchetypeProgression(
            charData.level || 1,
            charData.mart_prof || 0,
            charData.pow_prof || 0,
            charData.archetypeChoices || {}
        );
        innateThreshold = progression.innateThreshold || 0;
        innatePools = progression.innatePools || 0;
        innateEnergy = progression.innateEnergy || 0;
    }

    // Add header with "Add Power" button - always visible
    const editHeader = document.createElement('div');
    editHeader.className = 'library-section-header';
    editHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;';
    
    // Left side: Title
    const titleEl = document.createElement('h3');
    titleEl.textContent = 'INNATE POWER';
    editHeader.appendChild(titleEl);
    
    // Right side: Innate displays + Add button
    const rightControls = document.createElement('div');
    rightControls.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    
    // Add innate displays if any values > 0
    if (innateThreshold > 0 || innatePools > 0 || innateEnergy > 0) {
        const displays = [
            { label: 'Threshold', value: innateThreshold },
            { label: 'Pools', value: innatePools },
            { label: 'Energy', value: innateEnergy }
        ].filter(item => item.value > 0);

        displays.forEach(item => {
            const display = document.createElement('div');
            display.className = 'innate-stat-chip';
            display.style.cssText = `
                background: var(--bg-medium);
                color: var(--primary-dark);
                border-radius: 6px;
                padding: 4px 10px;
                font-weight: 600;
                font-size: 0.85em;
                border: 1px solid var(--border-color);
                display: flex;
                align-items: center;
                gap: 6px;
            `;
            display.innerHTML = `
                <span style="color: var(--text-secondary); font-weight: 500;">${item.label}:</span>
                <span style="color: var(--primary-blue); font-weight: 700;">${item.value}</span>
            `;
            rightControls.appendChild(display);
        });
    }
    
    // Add Power button
    const addBtn = document.createElement('button');
    addBtn.className = 'resource-add-btn';
    addBtn.innerHTML = '+ Add Power';
    addBtn.onclick = () => window.showPowerModal?.();
    rightControls.appendChild(addBtn);
    
    editHeader.appendChild(rightControls);
    content.appendChild(editHeader);
    
    if (!powers.length) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px;';
        emptyMsg.textContent = 'No powers selected';
        content.appendChild(emptyMsg);
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

        // Add remove button in edit mode
        if (isEditMode) {
            collapsedRow.style.position = 'relative';
            const removeBtn = document.createElement('button');
            removeBtn.className = 'resource-remove-btn';
            removeBtn.innerHTML = '✕';
            removeBtn.title = 'Remove power';
            removeBtn.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);padding:4px 8px;font-size:0.9em;background:var(--error-color, #dc3545);color:white;border:none;border-radius:4px;cursor:pointer;z-index:10;';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Remove "${power.name}" power?`)) {
                    window.removePowerFromCharacter(encodeURIComponent(power.name));
                }
            };
            collapsedRow.appendChild(removeBtn);
        }

        row.element.style.marginBottom = '10px';
        content.appendChild(row.element);
    });
    return content;
}
