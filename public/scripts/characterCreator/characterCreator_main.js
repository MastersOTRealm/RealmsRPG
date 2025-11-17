import { initializeFirebase, loadTraits, loadSpecies, loadFeats, loadSkills, loadEquipment } from './characterCreator_firebase.js';
import { loadCharacter, clearCharacter, restoreCharacterState } from './characterCreator_storage.js';
import { populateAncestryGrid } from './characterCreator_ancestry.js';
import './characterCreator_tabs.js';
import './characterCreator_archetype.js';
import './characterCreator_ancestry.js';
import './characterCreator_abilities.js';
import './characterCreator_skills.js';
import './characterCreator_feats.js';
import './characterCreator_equipment.js';

// Global character object
window.character = {};

// Load header/footer
async function loadHeaderFooter() {
  const header = document.getElementById('header');
  const footer = document.getElementById('footer');
  if (header) header.innerHTML = await fetch('/header.html').then(r => r.text());
  if (footer) footer.innerHTML = await fetch('/footer.html').then(r => r.text());
}
loadHeaderFooter();

// Clear progress button
document.getElementById('clear-progress-btn')?.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all progress? This cannot be undone.')) {
    clearCharacter();
  }
});

// Initialize and load data
(async () => {
  window.db = await initializeFirebase();
  await Promise.all([
    loadTraits(),
    loadSpecies(),
    loadFeats(),
    loadSkills(),
    loadEquipment()
  ]);

  populateAncestryGrid();

  const hasData = loadCharacter();
  if (hasData && window.character) {
    restoreCharacterState();
  }
})();
