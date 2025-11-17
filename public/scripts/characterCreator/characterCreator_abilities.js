import { saveCharacter } from './characterCreator_storage.js';

function initAbilities() {
  const abilities = ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'];
  let values = new Array(6).fill(0);
  const pointsSpan = document.getElementById('ability-points');

  if (window.character && window.character.abilityValues) {
    values = [...window.character.abilityValues];
  }

  function updateDisplay() {
    const sum = values.reduce((a, b) => a + b, 0);
    pointsSpan.textContent = 7 - sum;

    document.querySelectorAll('.abilities-values .value').forEach((span, i) => {
      const v = values[i];
      span.textContent = v > 0 ? `+${v}` : v;
    });
    
    if (!window.character) window.character = {};
    window.character.abilityValues = values;
    window.character.abilities = {
      strength: values[0],
      vitality: values[1],
      agility: values[2],
      acuity: values[3],
      intelligence: values[4],
      charisma: values[5]
    };
    saveCharacter();

    if (document.getElementById('skills-bonus-list')) {
      import('./characterCreator_skills.js').then(m => m.updateSkillsBonusDisplay?.());
    }
  }

  const char = window.character || {};
  const selectedAbilities = [];
  if (char.archetype) {
    if (Array.isArray(char.archetype.abilities)) {
      selectedAbilities.push(...char.archetype.abilities.map(a => a.toLowerCase()));
    } else if (typeof char.archetype.abilities === 'object') {
      Object.values(char.archetype.abilities).forEach(a => selectedAbilities.push(a.toLowerCase()));
    }
  }
  document.querySelectorAll('.abilities-controls .ability-name').forEach((nameEl, i) => {
    const abilityName = abilities[i];
    if (selectedAbilities.includes(abilityName)) {
      nameEl.style.fontWeight = 'bold';
    } else {
      nameEl.style.fontWeight = 'normal';
    }
  });

  document.querySelectorAll('.abilities-values .control').forEach((control, i) => {
    const dec = control.querySelector('.dec');
    const inc = control.querySelector('.inc');

    dec.addEventListener('click', () => {
      if (values[i] > -2) {
        values[i]--;
        const negSum = values.filter(v => v < 0).reduce((a, b) => a + b, 0);
        if (negSum < -3) {
          values[i]++;
          return;
        }
        updateDisplay();
      }
    });

    inc.addEventListener('click', () => {
      const currentSum = values.reduce((a, b) => a + b, 0);
      const currentPoints = 7 - currentSum;
      if (values[i] < 3 && currentPoints > 0) {
        values[i]++;
        updateDisplay();
      }
    });
  });

  updateDisplay();
}

document.querySelector('.tab[data-tab="abilities"]')?.addEventListener('click', () => {
  initAbilities();
});

export function restoreAbilities() {
  // Called by storage module
  initAbilities();
}
