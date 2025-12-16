import { sanitizeId } from '../../utils.js';
import { CollapsibleRow, createCollapsibleSection } from '../shared/collapsible-row.js';

/**
 * Creates a collapsible row for a trait.
 * @param {object|string} trait - Trait data or trait name
 * @param {string} type - Type of trait ('ancestry', 'flaw', 'characteristic', etc.)
 * @param {object} allTraits - Global traits data object
 * @param {object} charData - Character data
 * @returns {HTMLElement} The trait row element
 */
function createTraitRow(trait, type, allTraits, charData) {
    // Get trait object from allTraits if available
    let traitObj = trait;
    if (allTraits && trait.name) {
        const tObj = allTraits[sanitizeId(trait.name)];
        if (tObj) traitObj = { ...tObj, ...trait };
    }

    // Determine subtext/type
    let subtext = '';
    if (typeof traitObj.flaw === 'boolean' && traitObj.flaw) subtext = 'Flaw';
    else if (typeof traitObj.characteristic === 'boolean' && traitObj.characteristic) subtext = 'Characteristic';
    else if (type === 'ancestry') subtext = 'Ancestry Trait';
    else if (type === 'flaw') subtext = 'Flaw';
    else if (type === 'characteristic') subtext = 'Characteristic';

    // Description
    let desc = traitObj.desc || traitObj.description || '';
    if (!desc || desc === 'No description') desc = 'No description available.';

    // Uses/recovery
    const maxUses = traitObj.uses_per_rec || 0;
    const recPeriod = traitObj.rec_period || '';
    
    // Find currentUses for this trait in charData
    let currentUses = maxUses;
    if (charData && Array.isArray(charData.traits)) {
        const found = charData.traits.find(t =>
            (typeof t === 'object' && t.name === traitObj.name && typeof t.currentUses === 'number')
        );
        if (found) currentUses = found.currentUses;
    }

    const row = new CollapsibleRow({
        title: traitObj.name,
        subtext: subtext,
        description: desc,
        className: 'collapsible-feat',
        uses: maxUses ? { current: currentUses, max: maxUses, recovery: recPeriod || 'Full Recovery' } : null,
        onUse: maxUses ? (delta) => window.changeTraitUses(traitObj.name, delta, charData, maxUses) : null
    });

    return row.element;
}

/**
 * Creates a collapsible row for a feat.
 * @param {object} f - Feat data object
 * @returns {HTMLElement} The feat row element
 */
function createFeatRow(f) {
    const row = new CollapsibleRow({
        title: f.name,
        description: f.description || 'No description available.',
        className: 'collapsible-feat',
        uses: f.uses ? { current: f.currentUses ?? f.uses, max: f.uses, recovery: f.recovery || 'Full Recovery' } : null,
        onUse: f.uses ? (delta) => window.changeFeatUses(f.name, delta) : null
    });

    return row.element;
}

/**
 * Creates the feats tab content with organized sections.
 * Displays traits (ancestry, flaw, characteristic) and feats (archetype, character, state).
 * @param {Array} feats - Array of feat objects
 * @param {object} charData - Character data object
 * @returns {HTMLElement} The feats content container
 */
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
            traitRows.push(createTraitRow({ name }, type, allTraits, charData));
        });
    }
    // If not present, try ancestryTraits, flawTrait, characteristicTrait, speciesTraits
    if (!traitRows.length) {
        const tryAddTrait = (name, type) => {
            if (name) traitRows.push(createTraitRow({ name }, type, allTraits, charData));
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
