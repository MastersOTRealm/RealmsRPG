function sanitizeId(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '_');
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
function createTraitRow(trait, type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'collapsible-feat';
    // Subtext for trait type
    let subtext = '';
    if (type === 'ancestry') subtext = 'Ancestry Trait';
    else if (type === 'flaw') subtext = 'Flaw';
    else if (type === 'species') subtext = 'Species Trait';
    else if (type === 'characteristic') subtext = 'Characteristic';
    wrapper.innerHTML = `
        <div class="collapsed-row">
            <div>
                <strong>${trait.name}</strong>
                <span class="expand-indicator">▼</span><br>
                <span style="font-size:10px;color:var(--text-secondary);">${subtext}</span>
            </div>
            <div class="truncated">${(trait.desc || 'No description').split(/\s+/).slice(0,14).join(' ')}...</div>
            <div style="text-align:right;font-size:11px;color:var(--text-secondary);">—</div>
        </div>
        <div class="expanded-body">
            <p style="margin:0 0 10px 0;">${trait.desc || 'No description available.'}</p>
        </div>
    `;
    wrapper.querySelector('.collapsed-row').addEventListener('click', (e) => {
        wrapper.classList.toggle('open');
        const ind = wrapper.querySelector('.expand-indicator');
        if (ind) ind.textContent = wrapper.classList.contains('open') ? '▲' : '▼';
    });
    return wrapper;
}

// Helper: Feat row (like before)
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
    // Ancestry traits
    if (Array.isArray(charData.traits)) {
        charData.traits.forEach(nameOrObj => {
            let name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj.name;
            let desc = typeof nameOrObj === 'string' ? '' : nameOrObj.desc || '';
            // Try to infer type from name
            let type = '';
            if (charData.ancestryTraits && charData.ancestryTraits.includes(name)) type = 'ancestry';
            else if (charData.flawTrait && charData.flawTrait === name) type = 'flaw';
            else if (charData.characteristicTrait && charData.characteristicTrait === name) type = 'characteristic';
            else type = 'species';
            traitRows.push(createTraitRow({ name, desc }, type));
        });
    }
    // If not present, try ancestryTraits, flawTrait, characteristicTrait, speciesTraits
    if (!traitRows.length) {
        const tryAddTrait = (name, desc, type) => {
            if (name) traitRows.push(createTraitRow({ name, desc }, type));
        };
        tryAddTrait(charData.flawTrait, '', 'flaw');
        tryAddTrait(charData.characteristicTrait, '', 'characteristic');
        if (Array.isArray(charData.ancestryTraits)) {
            charData.ancestryTraits.forEach(name => tryAddTrait(name, '', 'ancestry'));
        }
        if (Array.isArray(charData.speciesTraits)) {
            charData.speciesTraits.forEach(name => tryAddTrait(name, '', 'species'));
        }
    }

    // --- Feats Section ---
    // Split feats into state feats, archetype feats, character feats
    const stateFeats = [];
    const archetypeFeats = [];
    const characterFeats = [];
    // Try to get feat names from charData.feats (array of names or objects)
    let archetypeFeatNames = [];
    let characterFeatNames = [];
    if (charData.feats && Array.isArray(charData.feats)) {
        // If feats is a flat array, can't distinguish archetype/character, so just show all as archetype
        archetypeFeatNames = charData.feats.map(f => typeof f === 'string' ? f : f.name);
    } else if (charData.feats && typeof charData.feats === 'object') {
        archetypeFeatNames = Array.isArray(charData.feats.archetype) ? charData.feats.archetype : [];
        characterFeatNames = Array.isArray(charData.feats.character) ? charData.feats.character : [];
    }
    // If feats is an array of objects, use their state_feat property
    feats.forEach(f => {
        if (f.state_feat) {
            stateFeats.push(f);
        } else if (archetypeFeatNames.includes(f.name)) {
            archetypeFeats.push(f);
        } else if (characterFeatNames.includes(f.name)) {
            characterFeats.push(f);
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
