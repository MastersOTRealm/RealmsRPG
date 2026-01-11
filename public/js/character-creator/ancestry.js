import { allSpecies } from './firebase.js';
import { saveCharacter } from './storage.js';
import { sanitizeId } from '../shared/string-utils.js';

// Helper to check if a saved trait value matches a trait object (handles both ID and name formats)
function traitMatches(savedValue, trait) {
  if (!savedValue || !trait) return false;
  // Direct ID match
  if (savedValue === trait.id) return true;
  // Direct name match (old format)
  if (savedValue === trait.name) return true;
  // Sanitized name matches ID (old format converted)
  if (sanitizeId(savedValue) === trait.id) return true;
  return false;
}

// Populate ancestry grid dynamically
export function populateAncestryGrid() {
  const grid = document.getElementById('ancestry-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  allSpecies.forEach(species => {
    const card = document.createElement('div');
    card.className = 'species-card';
    card.dataset.species = species.name.toLowerCase().replace(/\s+/g, '');
    
    // NEW: Mark as selected if this is the current species
    if (window.character?.speciesName === species.name) {
      card.classList.add('selected');
    }
    
    card.innerHTML = `
      <div class="species-img" style="background-image: url('${species.image || 'https://via.placeholder.com/140'}')"></div>
      <h3 class="species-name">${species.name}</h3>
    `;
    grid.appendChild(card);
  });
  setupModal();
}

// Setup modal
function setupModal() {
  const modal = document.getElementById('ancestry-modal');
  const modalClose = document.querySelector('.modal-close');
  const modalChoose = document.querySelector('.modal-choose');
  const modalNah = document.querySelector('.modal-nah');
  const showMoreBtn = document.getElementById('show-more-desc');
  const descEl = document.getElementById('modal-species-description');

  document.querySelectorAll('.species-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.species;
      const species = allSpecies.find(s => s.name.toLowerCase().replace(/\s+/g, '') === key);
      if (!species) return;

      document.querySelector('.modal-species-name').textContent = species.name;
      if (descEl) {
        descEl.textContent = species.description || 'No description available.';
        descEl.classList.add('truncated-description');
        showMoreBtn.style.display = 'block';
        showMoreBtn.textContent = 'Show More';
      }

      document.querySelector('.stat-height').textContent = species.ave_height ? `${Math.floor(species.ave_height / 30.48)}'${Math.round((species.ave_height % 30.48) / 2.54)}"` : 'N/A';
      document.querySelector('.stat-weight').textContent = species.ave_weight ? `${species.ave_weight} kg` : 'N/A';
      document.querySelector('.stat-type').textContent = species.type;
      document.querySelector('.stat-skills').textContent = species.skills.join(', ') || 'None';
      document.querySelector('.stat-adulthood').textContent = species.adulthood || 'N/A';
      document.querySelector('.stat-languages').textContent = species.languages.join(', ') || 'None';
      document.querySelector('.stat-maxage').textContent = species.max_age || 'N/A';

      const fillSection = (id, arr) => {
        const container = document.getElementById(id);
        container.innerHTML = '';
        arr.forEach(t => {
          const el = document.createElement('div');
          el.className = 'trait-item';
          el.innerHTML = `<strong>${t.name}</strong>${t.desc}`;
          container.appendChild(el);
        });
      };

      fillSection('species-traits', species.species_traits);
      fillSection('ancestry-traits', species.ancestry_traits);
      fillSection('characteristics', species.characteristics);

      modal.classList.remove('hidden');
    });
  });

  showMoreBtn.addEventListener('click', () => {
    if (descEl.classList.contains('truncated-description')) {
      descEl.classList.remove('truncated-description');
      showMoreBtn.textContent = 'Show Less';
    } else {
      descEl.classList.add('truncated-description');
      showMoreBtn.textContent = 'Show More';
    }
  });

  function closeModal() { modal.classList.add('hidden'); }
  modalClose.addEventListener('click', closeModal);
  modalNah.addEventListener('click', closeModal);
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  modalChoose.addEventListener('click', () => {
    const chosenName = document.querySelector('.modal-species-name').textContent;
    const chosenSpecies = allSpecies.find(s => s.name === chosenName);
    if (!chosenSpecies) return;

    window.character = window.character || {};
    window.character.speciesName = chosenSpecies.name;
    // NEW: reset size when species changes
    delete window.character.size;
    saveCharacter();

    // NEW: update finalize tab (Size dropdown) immediately
    window.updateFinalizeTab?.();

    // NEW: show ancestry main content and hide warning
    updateAncestryVisibility();
    
    // NEW: Re-populate grid to show selection
    populateAncestryGrid();

    closeModal();
    document.querySelector('.tab[data-tab="ancestry"]').click();
  });
}

// Trait selection functions
function fillTraitSection(type, traitArray, showDefinition, selectable, hasLimit) {
  const bodyId = `${type}-section-body`;
  const defId = showDefinition ? `${type}-definition` : null;
  const container = document.getElementById(bodyId);
  if (!container) return;
  
  container.innerHTML = '';

  if (!traitArray || traitArray.length === 0) {
    container.innerHTML = '<p style="color:#888;">None</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'trait-list';

  traitArray.forEach(t => {
    const li = document.createElement('li');
    li.dataset.traitId = t.id; // Store trait ID for selection/restore
    li.innerHTML = `
      <div class="trait-content">
        <div class="trait-name">${t.name}</div>
        <div class="trait-desc">${t.desc}</div>
      </div>
      ${selectable ? '<button class="add-btn">+</button>' : ''}
    `;
    li.dataset.desc = t.desc;

    if (selectable) {
      const addBtn = li.querySelector('.add-btn');
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectTrait(type, t, li, hasLimit);
      });
    } else {
      li.addEventListener('click', () => {
        if (showDefinition) {
          const defBox = document.getElementById(defId);
          defBox.textContent = t.desc;
          defBox.classList.add('show');
        }
      });
    }

    ul.appendChild(li);
  });

  container.appendChild(ul);

  if (type === 'species') {
    container.classList.add('open');
    container.previousElementSibling.querySelector('.toggle-arrow').classList.add('open');
  }
}

function selectTrait(type, trait, li, hasLimit) {
  const char = window.character || {};
  const traitId = trait.id; // Use trait ID for saving
  let isCurrentlySelected;

  if (type === 'ancestry') {
    // Check if any saved value matches this trait (handles both old names and new IDs)
    isCurrentlySelected = char.ancestryTraits ? char.ancestryTraits.some(saved => traitMatches(saved, trait)) : false;
  } else if (type === 'characteristic') {
    isCurrentlySelected = traitMatches(char.characteristicTrait, trait);
  } else if (type === 'flaw') {
    isCurrentlySelected = traitMatches(char.flawTrait, trait);
  }

  // If clicking on already-selected trait, deselect it
  if (isCurrentlySelected) {
    li.classList.remove('selected');
    if (type === 'ancestry') {
      // Filter out matching trait (handles both old names and new IDs)
      char.ancestryTraits = char.ancestryTraits.filter(saved => !traitMatches(saved, trait));
    } else if (type === 'characteristic') {
      delete char.characteristicTrait;
    } else if (type === 'flaw') {
      delete char.flawTrait;
      // If a flaw is deselected and there are 2 ancestry traits, remove the extra one
      if (char.ancestryTraits && char.ancestryTraits.length > 1) {
        const removedId = char.ancestryTraits.pop();
        // Also update the UI to deselect the removed ancestry trait
        const ancestryItems = document.querySelectorAll('#ancestry-section-body .trait-list li');
        ancestryItems.forEach(item => {
          if (item.dataset.traitId === removedId) {
            item.classList.remove('selected');
          }
        });
      }
    }
  } else {
    // Selecting a new trait
    if (hasLimit) {
      if (type === 'ancestry') {
        const flawSelected = !!char.flawTrait;
        const limit = flawSelected ? 2 : 1;
        if (char.ancestryTraits && char.ancestryTraits.length >= limit) return;
      } else if (type === 'characteristic' && char.characteristicTrait) {
        // Can only have one characteristic - don't allow selecting another
        return;
      }
      // For flaws: allow swapping (deselect old, select new) - no return here
    }

    // For flaw type, deselect any previously selected flaw first
    if (type === 'flaw' && char.flawTrait) {
      document.querySelectorAll('#flaw-section-body .trait-list li').forEach(item => {
        item.classList.remove('selected');
      });
      delete char.flawTrait;
    }

    li.classList.add('selected');
    if (type === 'ancestry') {
      if (!char.ancestryTraits) char.ancestryTraits = [];
      char.ancestryTraits.push(traitId);
    } else if (type === 'characteristic') {
      char.characteristicTrait = traitId;
    } else if (type === 'flaw') {
      char.flawTrait = traitId;
    }
  }

  saveCharacter();
}

function showTraitSelection(species) {
  document.getElementById('selected-species-img').style.backgroundImage = `url('${species.image || 'https://via.placeholder.com/120'}')`;
  document.getElementById('selected-species-name').textContent = species.name;
  document.getElementById('selected-species-description').textContent = species.description || 'No description available.';
  document.getElementById('selected-stat-height').textContent = species.ave_height ? `${Math.floor(species.ave_height / 30.48)}'${Math.round((species.ave_height % 30.48) / 2.54)}"` : 'N/A';
  document.getElementById('selected-stat-weight').textContent = species.ave_weight ? `${species.ave_weight} kg` : 'N/A';
  document.getElementById('selected-stat-type').textContent = species.type || 'N/A';
  document.getElementById('selected-stat-skills').textContent = species.skills.join(', ') || 'None';
  document.getElementById('selected-stat-adulthood').textContent = species.adulthood || 'N/A';
  document.getElementById('selected-stat-languages').textContent = species.languages.join(', ') || 'None';
  document.getElementById('selected-stat-maxage').textContent = species.max_age || 'N/A';

  fillTraitSection('species', species.species_traits, false, false, false);
  fillTraitSection('ancestry', species.ancestry_traits, true, true, true);
  fillTraitSection('characteristic', species.characteristics, true, true, true);
  fillTraitSection('flaw', species.flaws, false, true, true);

  // Remove old event listeners by cloning and replacing
  document.querySelectorAll('.section-header').forEach(header => {
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    
    newHeader.addEventListener('click', () => {
      const body = newHeader.nextElementSibling;
      const arrow = newHeader.querySelector('.toggle-arrow');
      if (body && arrow) {
        body.classList.toggle('open');
        arrow.classList.toggle('open');
      }
    });
  });

  document.getElementById('ancestry-continue').onclick = () => {
    document.querySelector('.tab[data-tab="abilities"]').click();
  };
}

document.querySelector('.tab[data-tab="ancestry"]')?.addEventListener('click', () => {
  // NEW: update visibility each time tab is entered
  updateAncestryVisibility();

  if (window.character && window.character.speciesName) {
    const species = allSpecies.find(s => s.name === window.character.speciesName);
    if (species) {
      showTraitSelection(species);
      restoreTraitSelections();
    }
  }
});

// NEW: Toggle visibility of ancestry tab content based on species selection
function updateAncestryVisibility() {
  const warning = document.getElementById('ancestry-warning');
  const main = document.getElementById('ancestry-main');
  if (!warning || !main) return;
  const hasSpecies = !!(window.character && window.character.speciesName);
  warning.style.display = hasSpecies ? 'none' : 'block';
  main.style.display = hasSpecies ? '' : 'none';
}

// Wire "Go to Species" button
document.getElementById('go-to-species-from-ancestry')?.addEventListener('click', () => {
  document.querySelector('.tab[data-tab="species"]')?.click();
});

function restoreTraitSelections() {
  const char = window.character;
  if (!char) return;
  
  // Helper to find matching list item - supports both old name format and new ID format
  const findMatchingLi = (selector, savedValue) => {
    if (!savedValue) return null;
    return Array.from(document.querySelectorAll(selector)).find(item => {
      const itemId = item.dataset.traitId;
      const itemName = item.querySelector('.trait-name')?.textContent;
      // Match by ID, name, or sanitized name
      return itemId === savedValue || 
             itemName === savedValue || 
             itemId === sanitizeId(savedValue);
    });
  };
  
  if (char.ancestryTraits && char.ancestryTraits.length > 0) {
    char.ancestryTraits.forEach(savedValue => {
      const li = findMatchingLi('#ancestry-section-body .trait-list li', savedValue);
      if (li) li.classList.add('selected');
    });
  }
  
  if (char.characteristicTrait) {
    const li = findMatchingLi('#characteristic-section-body .trait-list li', char.characteristicTrait);
    if (li) li.classList.add('selected');
  }
  
  if (char.flawTrait) {
    const li = findMatchingLi('#flaw-section-body .trait-list li', char.flawTrait);
    if (li) li.classList.add('selected');
  }
}

export function restoreAncestry() {
  // Called by storage module
  updateAncestryVisibility(); // NEW: ensure proper visibility on restore
  if (window.character?.speciesName) {
    const species = allSpecies.find(s => s.name === window.character.speciesName);
    if (species) {
      showTraitSelection(species);
      restoreTraitSelections();
    }
  }
}

// NEW: Dispatch 'species-changed' event when species is selected/locked in.
function confirmSpeciesSelection(species) {
    window.character = window.character || {};
    window.character.speciesName = species.name;
    saveCharacter();
    
    // NEW: Notify skills module (and any other listeners) that species changed
    document.dispatchEvent(new CustomEvent('species-changed', { detail: { speciesName: species.name } }));
}
