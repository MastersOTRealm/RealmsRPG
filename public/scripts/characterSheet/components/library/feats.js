function sanitizeId(str) {
    return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

// Helper: Collapsible section
function createCollapsibleSection(title, count, content, open = true) {
    const section = document.createElement('div');
    section.className = 'feats-collapsible-section';
    // Header styled like other library headers
    section.innerHTML = `
        <div class="library-table-header section-header" style="cursor:pointer;user-select:none;">
            <div style="font-weight:700;">${title}</div>
            <div style="text-align:right;font-size:13px;color:var(--primary-blue);">${count > 0 ? count : ''} <span class="expand-indicator" style="margin-left:8px;">${open ? '▲' : '▼'}</span></div>
        </div>
        <div class="section-body" style="${open ? '' : 'display:none;'}"></div>
    `;
    const header = section.querySelector('.section-header');
    const body = section.querySelector('.section-body');
    if (Array.isArray(content)) content.forEach(el => body.appendChild(el));
    else if (content) body.appendChild(content);

    header.addEventListener('click', () => {
        const expanded = body.style.display !== 'none';
        body.style.display = expanded ? 'none' : '';
        header.querySelector('.expand-indicator').textContent = expanded ? '▼' : '▲';
    });
    return section;
}

// Helper: Trait chip
function createTraitRow(trait, type, allTraits) {
    const wrapper = document.createElement('div');
    wrapper.className = 'collapsible-feat';
    // Subtext for trait type
    let subtext = '';
    if (type === 'ancestry') subtext = 'Ancestry Trait';
    else if (type === 'flaw') subtext = 'Flaw';
    else if (type === 'characteristic') subtext = 'Characteristic';
    // No subtext for species traits

    // Use sanitized trait name to look up description from allTraits
    let desc = trait.desc;
    if ((!desc || desc === 'No description' || desc === '') && allTraits) {
        const traitObj = allTraits[sanitizeId(trait.name)];
        if (traitObj && traitObj.description) desc = traitObj.description;
    }
    if (!desc) desc = 'No description available.';

    wrapper.innerHTML = `
        <div class="collapsed-row">
            <div>
                <strong>${trait.name}</strong>
                <span class="expand-indicator">▼</span><br>
                <span style="font-size:10px;color:var(--text-secondary);">${subtext}</span>
            </div>
            <div class="truncated">${(desc || 'No description').split(/\s+/).slice(0,14).join(' ')}...</div>
            <div style="text-align:right;font-size:11px;color:var(--text-secondary);">—</div>
        </div>
        <div class="expanded-body">
            <p style="margin:0 0 10px 0;">${desc}</p>
        </div>
    `;
    wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
        wrapper.classList.toggle('open');
        const ind = wrapper.querySelector('.expand-indicator');
        if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
    });
    return wrapper;
}

// Helper: Feat row (no subtext for archetype/character/state)
function createFeatRow(f) {
    const wrapper = document.createElement('div');
    wrapper.className = 'collapsible-feat';
    const truncatedDesc = (f.description || 'No description').split(/\s+/).slice(0,14).join(' ') + '...';
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
              <span class="expand-indicator">▼</span>
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
    wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
        if (e.target.classList.contains('use-button')) return;
        wrapper.classList.toggle('open');
        const ind = wrapper.querySelector('.expand-indicator');
        if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
    });
    if (f.uses) {
        wrapper.querySelectorAll('.use-button').forEach(btn => {
            btn.addEventListener('click', (ev) => {
                ev.stopPropagation();
                const dir = parseInt(btn.dataset.dir);
                changeFeatUses(f.name, dir);
                const expSpan = wrapper.querySelector(`#exp-uses-${sanitizeId(f.name)}`);
                const baseSpan = wrapper.querySelector(`#uses-${sanitizeId(f.name)}`);
                if (expSpan && baseSpan) expSpan.textContent = baseSpan.textContent;
            });
        });
    }
    return wrapper;
}

// Main export
export function createFeatsContent(feats, charData = {}) {
    // --- Split feats into sections ---
    // Traits: from charData.traits (array of trait names or objects), and ancestryTraits, flawTrait, characteristicTrait, speciesTraits
    // Feats: archetype feats, character feats, state feats
    // If charData is not passed, try window.currentCharacterData?.()
    if (!charData || Object.keys(charData).length === 0) {
        charData = window.currentCharacterData?.() || {};
    }

    // --- Traits Section ---
    // Collect all traits with their type
    const traitRows = [];
    let allTraits = (window.allTraits && typeof window.allTraits === 'object') ? window.allTraits : (charData.allTraits || {});

    // Ancestry traits
    if (Array.isArray(charData.traits)) {
        charData.traits.forEach(nameOrObj => {
            let name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj.name;
            // Try to infer type from charData fields
            let type = '';
            if (charData.ancestryTraits && charData.ancestryTraits.includes(name)) type = 'ancestry';
            else if (charData.flawTrait && charData.flawTrait === name) type = 'flaw';
            else if (charData.characteristicTrait && charData.characteristicTrait === name) type = 'characteristic';
            // No subtext for species traits
            traitRows.push(createTraitRow({ name }, type, allTraits));
        });
    }
    // If not present, try ancestryTraits, flawTrait, characteristicTrait, speciesTraits
    if (!traitRows.length) {
        const tryAddTrait = (name, type) => {
            if (name) traitRows.push(createTraitRow({ name }, type, allTraits));
        };
        tryAddTrait(charData.flawTrait, 'flaw');
        tryAddTrait(charData.characteristicTrait, 'characteristic');
        if (Array.isArray(charData.ancestryTraits)) {
            charData.ancestryTraits.forEach(name => tryAddTrait(name, 'ancestry'));
        }
        if (Array.isArray(charData.speciesTraits)) {
            charData.speciesTraits.forEach(name => tryAddTrait(name, ''));
        }
    }

    // --- Feats Section ---
    // Sort feats into state, character, archetype
    const stateFeats = [];
    const characterFeats = [];
    const archetypeFeats = [];
    feats.forEach(f => {
        if (f.state_feat === true) {
            stateFeats.push(f);
        } else if (f.char_feat === true) {
            characterFeats.push(f);
        } else {
            archetypeFeats.push(f);
        }
    });

    // --- Build sections ---
    const sections = [];

    // Traits section (always open)
    sections.push(createCollapsibleSection('Traits', traitRows.length, traitRows, true));

    // Archetype feats
    sections.push(createCollapsibleSection('Archetype Feats', archetypeFeats.length, archetypeFeats.map(createFeatRow), true));

    // Character feats
    sections.push(createCollapsibleSection('Character Feats', characterFeats.length, characterFeats.map(createFeatRow), true));

    // State feats
    sections.push(createCollapsibleSection('State Feats', stateFeats.length, stateFeats.map(createFeatRow), true));

    // --- Compose content ---
    const content = document.createElement('div');
    content.id = 'feats-content';
    content.className = 'tab-content active';
    if (sections.every(sec => sec.querySelector('.section-body').children.length === 0)) {
        content.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">No feats or traits selected</p>';
        return content;
    }
    sections.forEach(sec => content.appendChild(sec));
    return content;
}
