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
import './characterCreator_powers.js'; // NEW
import { getArchetypeAbilityScore, getBaseHealth, getBaseEnergy, getDefaultTrainingPoints } from './characterCreator_utils.js';

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
  console.log('Initializing character creator...');
  
  // Initialize Firebase first
  window.db = await initializeFirebase();
  console.log('Firebase initialized');
  
  // Load all database content in parallel
  console.log('Loading database content...');
  await Promise.all([
    loadTraits(),
    loadSpecies(),
    loadFeats(),
    loadSkills(),
    loadEquipment() // Load general equipment from database
  ]);
  console.log('All database content loaded');

  // Populate ancestry grid (requires species and traits)
  populateAncestryGrid();

  // Restore saved character if exists
  const hasData = loadCharacter();
  if (hasData && window.character) {
    console.log('Restoring saved character state');
    restoreCharacterState();
  }
  
  console.log('Character creator ready');
})();

function getArchetypeAbility() {
    const char = window.character || {};
    const archetype = char.archetype || {};
    if (archetype.type === 'power') return archetype.ability;
    if (archetype.type === 'martial') return archetype.ability;
    if (archetype.type === 'powered-martial') return [archetype.powerAbility, archetype.martialAbility];
    return null;
}

function getAbilityScore(name) {
    return (window.character?.abilities?.[name?.toLowerCase()] ?? 0);
}

function updateFinalizeTab() {
    // Fill fields from character if available
    document.getElementById('finalize-name').value = window.character?.name || '';
    document.getElementById('finalize-height').value = window.character?.height || '';
    document.getElementById('finalize-weight').value = window.character?.weight || '';
    document.getElementById('finalize-appearance').value = window.character?.appearance || '';
    document.getElementById('finalize-archetype-desc').value = window.character?.archetypeDesc || '';
    document.getElementById('finalize-notes').value = window.character?.notes || '';

    // Health/Energy allocation
    const baseHealth = getBaseHealth();
    const baseEnergy = getBaseEnergy();
    let health = window.character?.finalizeHealth ?? baseHealth;
    let energy = window.character?.finalizeEnergy ?? baseEnergy;
    let hepRemaining = 18 - ((health - baseHealth) + (energy - baseEnergy));
    if (hepRemaining < 0) {
        health = baseHealth;
        energy = baseEnergy;
        hepRemaining = 18;
    }
    document.getElementById('finalize-health').value = health;
    document.getElementById('finalize-energy').value = energy;
    document.getElementById('finalize-hep-remaining').textContent = hepRemaining;
    document.getElementById('finalize-health-base').textContent = `(Base: ${baseHealth})`;
    document.getElementById('finalize-energy-base').textContent = `(Base: ${baseEnergy})`;
}

function setupFinalizeTabEvents() {
    // Save fields to character object
    ['finalize-name','finalize-height','finalize-weight','finalize-appearance','finalize-archetype-desc','finalize-notes'].forEach(id => {
        document.getElementById(id).addEventListener('input', e => {
            const key = id.replace('finalize-','');
            window.character[key] = e.target.value;
        });
    });

    // Health/Energy allocation
    function updateAllocation(deltaHealth, deltaEnergy) {
        const baseHealth = getBaseHealth();
        const baseEnergy = getBaseEnergy();
        let health = parseInt(document.getElementById('finalize-health').value) || baseHealth;
        let energy = parseInt(document.getElementById('finalize-energy').value) || baseEnergy;
        health += deltaHealth;
        energy += deltaEnergy;
        // Clamp to base values
        health = Math.max(baseHealth, health);
        energy = Math.max(baseEnergy, energy);
        // Clamp to max allocation
        let hepUsed = (health - baseHealth) + (energy - baseEnergy);
        if (hepUsed > 18) {
            // Don't allow over-allocation
            if (deltaHealth > 0) health -= deltaHealth;
            if (deltaEnergy > 0) energy -= deltaEnergy;
            hepUsed = (health - baseHealth) + (energy - baseEnergy);
        }
        document.getElementById('finalize-health').value = health;
        document.getElementById('finalize-energy').value = energy;
        document.getElementById('finalize-hep-remaining').textContent = 18 - hepUsed;
        window.character.finalizeHealth = health;
        window.character.finalizeEnergy = energy;
    }
    document.getElementById('finalize-inc-health').addEventListener('click', () => updateAllocation(1,0));
    document.getElementById('finalize-dec-health').addEventListener('click', () => updateAllocation(-1,0));
    document.getElementById('finalize-inc-energy').addEventListener('click', () => updateAllocation(0,1));
    document.getElementById('finalize-dec-energy').addEventListener('click', () => updateAllocation(0,-1));
}

document.querySelector('.tab[data-tab="finalize"]')?.addEventListener('click', () => {
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.getElementById('content-finalize').classList.add('active');
    updateFinalizeTab();
});

// Patch training points display everywhere to use getDefaultTrainingPoints()
function updateTrainingPointsDisplay() {
    // Used by equipment/powers tabs
    import('./characterCreator_equipment.js').then(mod => {
        const equipmentTP = mod.getTotalEquipmentTP ? mod.getTotalEquipmentTP() : 0;
        import('./characterCreator_powers.js').then(mod2 => {
            const powersTP = mod2.getTotalPowersTP ? mod2.getTotalPowersTP() : 0;
            const totalSpent = equipmentTP + powersTP;
            const remaining = getDefaultTrainingPoints() - totalSpent;
            const trainingPointsEl = document.getElementById('training-points');
            if (trainingPointsEl) trainingPointsEl.textContent = remaining;
            const powersTrainingPointsEl = document.getElementById('powers-training-points');
            if (powersTrainingPointsEl) powersTrainingPointsEl.textContent = remaining;
        });
    });
}

// Setup events after DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('content-finalize')) {
        setupFinalizeTabEvents();
        updateFinalizeTab();
    }
});

// Make updateTrainingPointsDisplay and updateFinalizeTab globally available for other modules
window.updateTrainingPointsDisplay = updateTrainingPointsDisplay;
window.updateFinalizeTab = updateFinalizeTab;
