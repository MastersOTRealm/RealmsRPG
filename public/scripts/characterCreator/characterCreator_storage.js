export function saveCharacter() {
  if (window.character) {
    localStorage.setItem('characterCreator_draft', JSON.stringify(window.character));
    console.log('Character saved:', window.character);
  }
}

export function loadCharacter() {
  const saved = localStorage.getItem('characterCreator_draft');
  if (saved) {
    try {
      window.character = JSON.parse(saved);
      console.log('Character loaded:', window.character);
      return true;
    } catch (e) {
      console.error('Error loading saved character:', e);
    }
  }
  return false;
}

export function clearCharacter() {
  localStorage.removeItem('characterCreator_draft');
  window.character = {};
  location.reload();
}

export function restoreCharacterState() {
  // Import and call restoration functions from each module
  import('./characterCreator_archetype.js').then(m => m.restoreArchetype?.());
  import('./characterCreator_feats.js').then(m => m.restoreFeats?.());
  import('./characterCreator_skills.js').then(m => m.restoreSkills?.());
  import('./characterCreator_equipment.js').then(m => m.restoreEquipment?.());
  console.log('Character state restored');
}
