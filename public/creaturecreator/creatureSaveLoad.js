import { 
    resistances, weaknesses, immunities, senses, movement, feats, creatureSkills, creatureSkillValues, 
    creatureLanguages, conditionImmunities, defenseSkillState 
} from './creatureState.js';
import { getAbilityValue, getSkillBonus } from './creatureUtils.js';

// Utility: Get IDs from array of objects
function extractIds(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(obj => obj && obj.id ? obj.id : null).filter(Boolean);
}

let skills = [];
export function setSkills(skillsArr) {
    skills = Array.isArray(skillsArr) ? skillsArr : [];
}

// Gather all creature data for saving
export async function getCreatureSaveData() {
    const abilities = {
        strength: getAbilityValue('creatureAbilityStrength'),
        vitality: getAbilityValue('creatureAbilityVitality'),
        agility: getAbilityValue('creatureAbilityAgility'),
        acuity: getAbilityValue('creatureAbilityAcuity'),
        intelligence: getAbilityValue('creatureAbilityIntelligence'),
        charisma: getAbilityValue('creatureAbilityCharisma')
    };
    const defenses = {
        might: getBaseDefenseValue("Might") + (defenseSkillState["Might"] || 0),
        fortitude: getBaseDefenseValue("Fortitude") + (defenseSkillState["Fortitude"] || 0),
        reflex: getBaseDefenseValue("Reflex") + (defenseSkillState["Reflex"] || 0),
        discernment: getBaseDefenseValue("Discernment") + (defenseSkillState["Discernment"] || 0),
        mentalFortitude: getBaseDefenseValue("Mental Fortitude") + (defenseSkillState["Mental Fortitude"] || 0),
        resolve: getBaseDefenseValue("Resolve") + (defenseSkillState["Resolve"] || 0)
    };
    const skillsArr = creatureSkills.slice().map(skillName => {
        const skillObj = skills.find(s => s.name === skillName);
        const bonus = getSkillBonus(skillObj);
        return { name: skillName, bonus };
    });
    const featsArr = feats.map(f => {
        const featObj = typeof f === "string" ? { name: f } : f;
        return {
            name: featObj.name,
            description: featObj.description || "",
            feat_points: featObj.points || 0
        };
    });
    const allImmunities = [...immunities, ...conditionImmunities];
    const movementArr = movement.map(m => m.type || m);
    const sensesArr = senses.slice();
    // const powerIds = extractIds(powersTechniques.filter(x => x.type === "power"));
    // const techniqueIds = extractIds(powersTechniques.filter(x => x.type === "technique"));
    // const armamentIds = extractIds(armaments);
    const hitPoints = parseInt(document.getElementById('hitPointsInput')?.value) || 0;
    const energy = parseInt(document.getElementById('energyInput')?.value) || 0;
    const creatureName = document.getElementById("creatureName")?.value || "";
    const level = parseFloat(document.getElementById("creatureLevel")?.value) || 1;
    const type = document.getElementById("creatureType")?.value || "";
    const languagesArr = creatureLanguages.slice();
    const description = document.getElementById("creatureDescription")?.value || "";
    const powerProficiency = parseInt(document.getElementById("powerProficiencyInput")?.value) || 0;
    const martialProficiency = parseInt(document.getElementById("martialProficiencyInput")?.value) || 0;
    return {
        name: creatureName,
        level,
        type,
        powerProficiency,
        martialProficiency,
        resistances: resistances.slice(),
        weaknesses: weaknesses.slice(),
        immunities: allImmunities.slice(),
        senses: sensesArr,
        movement: movementArr,
        hitPoints,
        energy,
        languages: languagesArr,
        skills: skillsArr,
        abilities,
        defenses,
        feats: featsArr,
        description
    };
}

// Save Creature to Library
export async function saveCreatureToLibrary() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) {
        alert("You must be logged in to save creatures.");
        return;
    }
    const creatureName = document.getElementById("creatureName")?.value?.trim();
    if (!creatureName) {
        alert("Please enter a name for your creature.");
        return;
    }
    const creatureData = await getCreatureSaveData();
    try {
        const creaturesRef = collection(firebaseDb, 'users', currentUser.uid, 'creatureLibrary');
        const q = query(creaturesRef, where('name', '==', creatureName));
        const querySnapshot = await getDocs(q);
        let docRef;
        if (!querySnapshot.empty) {
            docRef = doc(firebaseDb, 'users', currentUser.uid, 'creatureLibrary', querySnapshot.docs[0].id);
        } else {
            docRef = doc(creaturesRef);
        }
        await setDoc(docRef, {
            name: creatureName,
            ...creatureData,
            timestamp: new Date()
        });
        alert("Creature saved to your library!");
    } catch (error) {
        console.error("Error saving creature:", error.message, error.stack);
        alert("Error saving creature: " + error.message);
    }
}

// Load all saved creatures
export async function loadSavedCreatures() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'creatureLibrary'));
        const creatures = [];
        querySnapshot.forEach(docSnap => {
            creatures.push({ id: docSnap.id, ...docSnap.data() });
        });
        return creatures;
    } catch (error) {
        alert("Error fetching saved creatures: " + (error.message || error));
        return [];
    }
}

// Display saved creatures in a modal
export function displaySavedCreatures(creatures) {
    const creatureList = document.getElementById('savedCreaturesList');
    creatureList.innerHTML = '';
    if (!creatures.length) {
        creatureList.innerHTML = '<div>No saved creatures found.</div>';
        return;
    }
    creatures.forEach(creature => {
        const div = document.createElement('div');
        div.className = 'creature-item';
        div.innerHTML = `
            <span>${creature.name} (Level: ${creature.level || '-'})</span>
            <button class="small-button blue-button select-creature-btn" data-id="${creature.id}">Load</button>
        `;
        creatureList.appendChild(div);
    });
}

// Open the load creature modal
export function openCreatureModal() {
    if (!currentUser) {
        alert('Please log in to access saved creatures.');
        return;
    }
    const modal = document.getElementById('loadCreatureModal');
    modal.style.display = 'block';
    loadSavedCreatures().then(displaySavedCreatures);
}

// Close the load creature modal
export function closeCreatureModal() {
    document.getElementById('loadCreatureModal').style.display = 'none';
}

// Load a creature into the UI
export async function loadCreatureById(creatureId) {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return;
    try {
        const docSnap = await getDocs(query(
            collection(firebaseDb, 'users', currentUser.uid, 'creatureLibrary'),
            where('__name__', '==', creatureId)
        ));
        if (!docSnap.empty) {
            const creature = docSnap.docs[0].data();
            loadCreature(creature);
        }
    } catch (error) {
        alert("Error loading creature: " + (error.message || error));
    }
}

// Populate the UI with creature data
export function loadCreature(creature) {
    document.getElementById("creatureName").value = creature.name || "";
    document.getElementById("creatureLevel").value = creature.level || 1;
    document.getElementById("creatureType").value = creature.type || "";
    if (document.getElementById("powerProficiencyInput")) {
        document.getElementById("powerProficiencyInput").value = creature.powerProficiency || 0;
    }
    if (document.getElementById("martialProficiencyInput")) {
        document.getElementById("martialProficiencyInput").value = creature.martialProficiency || 0;
    }
    if (document.getElementById("creatureDescription")) {
        document.getElementById("creatureDescription").value = creature.description || "";
    }
    // When loading feats, if you need to set points, use feat_points
    alert("Creature loaded! (You must implement full UI population logic.)");
    updateSummary();
}

// Add Save/Load Creature Buttons and Modal to UI
export function addSaveLoadCreatureUI() {
    const container = document.getElementById("creatureCreatorContainer");
    if (!container) return;
    if (!document.getElementById("saveCreatureButton")) {
        const btn = document.createElement("button");
        btn.id = "saveCreatureButton";
        btn.className = "medium-button blue-button";
        btn.textContent = "Save Creature";
        btn.style.margin = "16px 0";
        btn.onclick = saveCreatureToLibrary;
        container.insertBefore(btn, container.firstChild);
    }
    if (!document.getElementById("loadCreatureButton")) {
        const btn = document.createElement("button");
        btn.id = "loadCreatureButton";
        btn.className = "medium-button blue-button";
        btn.textContent = "Load Creature";
        btn.style.margin = "16px 8px";
        btn.onclick = openCreatureModal;
        container.insertBefore(btn, container.firstChild.nextSibling);
    }
    if (!document.getElementById("loadCreatureModal")) {
        const modal = document.createElement("div");
        modal.id = "loadCreatureModal";
        modal.className = "modal";
        modal.style.display = "none";
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button" id="closeCreatureModalBtn">&times;</span>
                <h3>Load Creature</h3>
                <div id="savedCreaturesList"></div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById("closeCreatureModalBtn").onclick = closeCreatureModal;
        modal.addEventListener('click', async (e) => {
            if (e.target.classList.contains('select-creature-btn')) {
                const creatureId = e.target.dataset.id;
                await loadCreatureById(creatureId);
                closeCreatureModal();
            }
        });
    }
}
