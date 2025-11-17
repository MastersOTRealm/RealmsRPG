import { allSpecies } from './characterCreator_firebase.js';
import { saveCharacter } from './characterCreator_storage.js';

// Populate ancestry grid dynamically
export function populateAncestryGrid() {
  const grid = document.getElementById('ancestry-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  allSpecies.forEach(species => {
    const card = document.createElement('div');
    card.className = 'species-card';
    card.dataset.species = species.name.toLowerCase().replace(/\s+/g, '');
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
    saveCharacter();

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
  let selected;

  if (type === 'ancestry') {
    selected = char.ancestryTraits ? char.ancestryTraits.find(t => t.name === trait.name) : null;
  } else if (type === 'characteristic') {
    selected = char.characteristicTrait;
  } else if (type === 'flaw') {
    selected = char.flawTrait;
  }

  if (selected && selected.name === trait.name) {
    li.classList.remove('selected');
    if (type === 'ancestry') {
      char.ancestryTraits = char.ancestryTraits.filter(t => t.name !== trait.name);
    } else if (type === 'characteristic') {
      delete char.characteristicTrait;
    } else if (type === 'flaw') {
      delete char.flawTrait;
      if (char.ancestryTraits && char.ancestryTraits.length > 1) {
        char.ancestryTraits.pop();
      }
    }
  } else {
    if (hasLimit) {
      if (type === 'ancestry') {
        const flawSelected = char.flawTrait;
        const limit = flawSelected ? 2 : 1;
        if (char.ancestryTraits && char.ancestryTraits.length >= limit) return;
      } else if (type === 'characteristic' && char.characteristicTrait) return;
      else if (type === 'flaw' && char.flawTrait) return;
    }

    if (type === 'flaw') {
      document.querySelectorAll('#flaw-section-body .trait-list li').forEach(item => {
        item.classList.remove('selected');
      });
    }

    li.classList.add('selected');
    if (type === 'ancestry') {
      if (!char.ancestryTraits) char.ancestryTraits = [];
      char.ancestryTraits.push({ name: trait.name, desc: trait.desc });
    } else if (type === 'characteristic') {
      char.characteristicTrait = { name: trait.name, desc: trait.desc };
    } else if (type === 'flaw') {
      char.flawTrait = { name: trait.name, desc: trait.desc };
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

  document.querySelectorAll('.section-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.toggle-arrow');
      body.classList.toggle('open');
      arrow.classList.toggle('open');
    });
  });

  document.getElementById('ancestry-continue').onclick = () => {
    document.querySelector('.tab[data-tab="abilities"]').click();
  };
}

document.querySelector('.tab[data-tab="ancestry"]')?.addEventListener('click', () => {
  if (window.character && window.character.speciesName) {
    const species = allSpecies.find(s => s.name === window.character.speciesName);
    if (species) {
      showTraitSelection(species);
      restoreTraitSelections();
    }
  }
});

function restoreTraitSelections() {
  const char = window.character;
  if (!char) return;
  
  if (char.ancestryTraits && char.ancestryTraits.length > 0) {
    char.ancestryTraits.forEach(trait => {
      const li = Array.from(document.querySelectorAll('#ancestry-section-body .trait-list li')).find(
        item => item.querySelector('.trait-name').textContent === trait.name
      );
      if (li) li.classList.add('selected');
    });
  }
  
  if (char.characteristicTrait) {
    const li = Array.from(document.querySelectorAll('#characteristic-section-body .trait-list li')).find(
      item => item.querySelector('.trait-name').textContent === char.characteristicTrait.name
    );
    if (li) li.classList.add('selected');
  }
  
  if (char.flawTrait) {
    const li = Array.from(document.querySelectorAll('#flaw-section-body .trait-list li')).find(
      item => item.querySelector('.trait-name').textContent === char.flawTrait.name
    );
    if (li) li.classList.add('selected');
  }
}

export function restoreAncestry() {
  // Called by storage module
  if (window.character?.speciesName) {
    const species = allSpecies.find(s => s.name === window.character.speciesName);
    if (species) {
      showTraitSelection(species);
      restoreTraitSelections();
    }
  }
}
