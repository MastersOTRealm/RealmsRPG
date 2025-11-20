import { initializeFirebase, loadTraits, loadSpecies, loadFeats, loadSkills, loadEquipment, allSpecies } from './characterCreator_firebase.js';
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

    // NEW: Deduplicate any accidentally duplicated Size dropdowns (keep the first)
    const sizeDupes = document.querySelectorAll('select#finalize-size');
    if (sizeDupes.length > 1) {
        sizeDupes.forEach((sel, idx) => {
            if (idx > 0) {
                const prevLabel = sel.previousElementSibling;
                if (prevLabel && prevLabel.tagName === 'LABEL' && prevLabel.getAttribute('for') === 'finalize-size') {
                    prevLabel.remove();
                }
                sel.remove();
            }
        });
    }

    // NEW: Populate Size dropdown from species
    const sizeSelect = document.getElementById('finalize-size');
    if (sizeSelect) {
        sizeSelect.innerHTML = '';
        const speciesName = window.character?.speciesName;
        if (!speciesName) {
            sizeSelect.disabled = true;
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Select species first';
            opt.disabled = true;
            opt.selected = true;
            sizeSelect.appendChild(opt);
        } else {
            sizeSelect.disabled = false;
            const species = allSpecies.find(s => s.name === speciesName);
            const sizes = species?.sizes || [];
            const savedSize = window.character?.size || '';

            if (sizes.length > 1) {
                const ph = document.createElement('option');
                ph.value = '';
                ph.textContent = 'Choose a size';
                ph.disabled = true;
                ph.selected = !savedSize;
                sizeSelect.appendChild(ph);
            }
            sizes.forEach(sz => {
                const opt = document.createElement('option');
                opt.value = sz;
                opt.textContent = sz;
                if (savedSize === sz) opt.selected = true;
                sizeSelect.appendChild(opt);
            });

            // Auto-select if exactly one size and none saved yet
            if (!savedSize && sizes.length === 1) {
                sizeSelect.value = sizes[0];
                window.character.size = sizes[0];
            }
        }
    }
}

function setupFinalizeTabEvents() {
    // Save fields to character object
    ['finalize-name','finalize-height','finalize-weight','finalize-appearance','finalize-archetype-desc','finalize-notes','finalize-size'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', e => {
            const key = id.replace('finalize-','');
            window.character[key] = e.target.value;
        });
        // Also respond to change for select
        el.addEventListener('change', e => {
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

// NEW: Validation function
function validateCharacter() {
    const char = window.character || {};
    const issues = [];
    
    // NEW: Finalize details – Name and Weight
    const name = (char.name || '').trim();
    if (!name) {
        issues.push("📝 Your hero needs a name! Give them something legendary.");
    }
    const weightNum = Number(char.weight);
    if (!Number.isFinite(weightNum) || weightNum <= 0) {
        issues.push("⚖️ You still need to enter a valid weight! Make sure it's a positive number.");
    }

    // 1. Check archetype selection
    if (!char.archetype || !char.archetype.type) {
        issues.push("🎭 You haven't selected an archetype yet! Head back to the Archetype tab to choose your path.");
    } else if (!char.archetype.abilities) {
        issues.push("✨ Your archetype needs an ability assignment! Pick which ability drives your character.");
    } else {
        // Check archetype feats
        const archetypeType = char.archetype.type;
        const archetypeFeats = char.feats?.archetype || [];
        let expectedCount = 0;
        if (archetypeType === 'power') expectedCount = 1;
        else if (archetypeType === 'powered-martial') expectedCount = 2;
        else if (archetypeType === 'martial') expectedCount = 3;
        
        if (archetypeFeats.length < expectedCount) {
            const diff = expectedCount - archetypeFeats.length;
            const plural = diff === 1 ? 'feat' : 'feats';
            issues.push(`💪 You still need to select ${diff} more archetype ${plural}! Visit the Feats tab to complete your selection.`);
        }
    }
    
    // 2. Check species and ancestry traits
    if (!char.speciesName) {
        issues.push("🌟 You need to choose your species! Head to the Species tab to pick your ancestry.");
    } else {
        // NEW: require Size if species provides sizes
        const species = allSpecies.find(s => s.name === char.speciesName);
        const sizes = species?.sizes || [];
        if (sizes.length > 0) {
            if (!char.size || !sizes.includes(char.size)) {
                issues.push("📏 You still need to select a size!");
            }
        }

        const hasFlaw = !!char.flawTrait;
        const ancestryCount = char.ancestryTraits?.length || 0;
        const expectedAncestry = hasFlaw ? 2 : 1;
        
        if (ancestryCount < expectedAncestry) {
            const diff = expectedAncestry - ancestryCount;
            const plural = diff === 1 ? 'trait' : 'traits';
            issues.push(`🧬 You need to select ${diff} more ancestry ${plural}! ${hasFlaw ? 'Since you picked a flaw, you get to choose 2!' : 'Choose one that fits your character.'}`);
        }
        
        if (!char.characteristicTrait) {
            issues.push("🎨 Don't forget to pick a characteristic! This helps define who your character is.");
        }
    }
    
    // 3. Check character feat
    const characterFeats = char.feats?.character || [];
    if (characterFeats.length < 1) {
        issues.push("🌠 You need to select 1 character feat! These are the unique touches that make your character special.");
    }
    
    // 4. Check ability points
    const abilityValues = char.abilityValues || [0, 0, 0, 0, 0, 0];
    const abilitySum = abilityValues.reduce((a, b) => a + b, 0);
    const abilityPoints = 7 - abilitySum;
    if (abilityPoints > 0) {
        issues.push(`⚡ You still have ${abilityPoints} ability point${abilityPoints === 1 ? '' : 's'} to spend! Make your character stronger by allocating them.`);
    }
    
    // 5. Check skill points
    import('./characterCreator_skills.js').then(mod => {
        const selectedSkills = mod.selectedSkills || [];
        const skillVals = char.skillVals || {};
        const skillValsTotal = selectedSkills.reduce((sum, s) => sum + Math.max(0, parseInt(skillVals[s]) || 0), 0);
        const skillPoints = 5 - selectedSkills.length - skillValsTotal;
        
        if (skillPoints > 0) {
            issues.push(`📚 You have ${skillPoints} skill point${skillPoints === 1 ? '' : 's'} left to spend! Boost your skills to become more proficient.`);
        }
        
        // 6. Check health-energy points
        const baseHealth = getBaseHealth();
        const baseEnergy = getBaseEnergy();
        const health = char.finalizeHealth ?? baseHealth;
        const energy = char.finalizeEnergy ?? baseEnergy;
        const hepUsed = (health - baseHealth) + (energy - baseEnergy);
        const hepRemaining = 18 - hepUsed;
        
        if (hepRemaining > 0) {
            issues.push(`❤️ You have ${hepRemaining} Health-Energy point${hepRemaining === 1 ? '' : 's'} to allocate! Decide whether to boost your health or energy.`);
        }
        
        // Display results
        displayValidationResults(issues);
    });
}

// NEW: Display validation results in modal
function displayValidationResults(issues) {
    const modal = document.getElementById('validation-modal');
    const titleEl = document.getElementById('validation-title');
    const resultsEl = document.getElementById('validation-results');
    
    if (issues.length === 0) {
        titleEl.textContent = '🎉 Character Complete!';
        titleEl.style.color = '#28a745';
        resultsEl.innerHTML = `
            <p style="font-size: 1.1em; color: #28a745; text-align: center; margin: 20px 0;">
                <strong>Congratulations!</strong> Your character is ready for adventure! 🎊
            </p>
            <p style="text-align: center; color: #666;">
                All requirements have been met. Your hero is prepared to face whatever challenges await!
            </p>
        `;
    } else {
        titleEl.textContent = '📋 Almost There!';
        titleEl.style.color = '#ff9800';
        resultsEl.innerHTML = `
            <p style="margin-bottom: 16px; color: #666;">
                Just a few more things to complete before your character is ready:
            </p>
            <ul style="list-style: none; padding: 0; margin: 0;">
                ${issues.map(issue => `
                    <li style="padding: 12px; margin: 8px 0; background: #fff3cd; border-left: 4px solid #ff9800; border-radius: 4px;">
                        ${issue}
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    modal.style.display = 'block';
}

// NEW: Setup validation modal events
function setupValidationModal() {
    const modal = document.getElementById('validation-modal');
    const closeBtn = document.getElementById('close-validation-modal');
    const okBtn = document.getElementById('validation-ok-btn');
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    okBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Setup events after DOM loaded
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('content-finalize')) {
        setupFinalizeTabEvents();
        updateFinalizeTab();
    }
    
    // NEW: Setup validation
    setupValidationModal();
    
    const completeBtn = document.getElementById('complete-character-btn');
    if (completeBtn) {
        completeBtn.addEventListener('click', validateCharacter);
    }
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

// Make updateTrainingPointsDisplay and updateFinalizeTab globally available for other modules
window.updateTrainingPointsDisplay = updateTrainingPointsDisplay;
window.updateFinalizeTab = updateFinalizeTab;
