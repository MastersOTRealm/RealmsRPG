import creatureFeatsData from './creatureFeatsData.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

// --- Firebase Initialization (v11 compat, global) ---
let firebaseApp, firebaseAuth, firebaseDb, currentUser;
let authReadyPromise = new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', async function() {
        const response = await fetch('/__/firebase/init.json');
        const firebaseConfig = await response.json();
        firebaseConfig.authDomain = 'realmsroleplaygame.com';
        firebaseApp = initializeApp(firebaseConfig);

        initializeAppCheck(firebaseApp, {
            provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
            isTokenAutoRefreshEnabled: true
        });

        firebaseAuth = getAuth(firebaseApp);
        firebaseDb = getFirestore(firebaseApp);

        onAuthStateChanged(firebaseAuth, (user) => {
            currentUser = user;
            resolve();
        });
    });
});

// --- Basic Mechanics State ---
let resistances = [];
let weaknesses = [];
let immunities = [];
let senses = [];
let movement = [];
let feats = [];
let powersTechniques = []; // { ...power, type: "power" } or { name, bp, type: "technique" }
let armaments = [];

// --- Descriptions for Senses and Movement ---
const SENSES_DESCRIPTIONS = {
    "Darkvision": "Can see in darkness up to 6 spaces as shades of grey.",
    "Darkvision II": "Can see in darkness up to 12 spaces as shades of grey.",
    "Darkvision III": "Can see in darkness up to 24 spaces as shades of grey.",
    "Blindsense": "Has Blindsense out to 3 spaces.",
    "Blindsense II": "Has Blindsense out to 6 spaces.",
    "Blindsense III": "Has Blindsense out to 12 spaces.",
    "Blindsense IV": "Has Blindsense out to 24 spaces.",
    "Amphibious": "Can breathe air and water.",
    "All-Surface Climber": "Can climb on difficult vertical and horizontal surfaces, even upside down, without needing to make a Climb Roll.",
    "Telepathy": "This creature can communicate telepathically with creatures it is aware of within 12 spaces.",
    "Telepathy II": "This creature can communicate telepathically with creatures it is aware of within 48 spaces.",
    "Telepathically Intune": "Can perceive content of all telepathic communication within 12 spaces.",
    "Waterbreathing": "This creature can only breathe underwater.",
    "Unrestrained Movement": "Ignores difficult terrain, the slowed condition, and any other effect that would slow its movement due to environmental effects."
};

const MOVEMENT_DESCRIPTIONS = {
    "Ground": "Standard ground movement.",
    "Fly Half": "You can fly with a speed equal to half of your regular speed.",
    "Fly": "You can fly with a speed equal to your regular speed.",
    "Burrow": "You can burrow with a speed equal to half of your regular speed.",
    "Burrow II": "You can burrow with a speed equal to your regular speed.",
    "Jump": "Can long jump 3 spaces and high jump 2.",
    "Jump II": "Can long jump 4 spaces and high jump 3.",
    "Jump III": "Can long jump 5 spaces and high jump 4.",
    "Speedy": "Movement speed is increased by 2.",
    "Speedy II": "Movement speed is increased by 4.",
    "Speedy III": "Movement speed is increased by 6.",
    "Slow": "Movement speed is decreased by 2.",
    "Slow II": "Movement speed is decreased by 4.",
    "Slow III": "Movement speed is decreased by 6.",
    "Slow Walker": "Ground Speed is 1/4 of your normal speed.",
    "Hover": "Must end turn within 1 space of the ground, but need not touch it. Only applicable if the creature has a flying speed."
};

// --- Display Names for Senses and Movement ---
const SENSES_DISPLAY = {
    "Darkvision": "Darkvision (6 spaces)",
    "Darkvision II": "Darkvision II (12 spaces)",
    "Darkvision III": "Darkvision III (24 spaces)",
    "Blindsense": "Blindsense (3 spaces)",
    "Blindsense II": "Blindsense II (6 spaces)",
    "Blindsense III": "Blindsense III (12 spaces)",
    "Blindsense IV": "Blindsense IV (24 spaces)",
    "Amphibious": "Amphibious",
    "All-Surface Climber": "All-Surface Climber",
    "Telepathy": "Telepathy (12 spaces)",
    "Telepathy II": "Telepathy II (48 spaces)",
    "Telepathically Intune": "Telepathically Intune (12 spaces)",
    "Waterbreathing": "Waterbreathing",
    "Unrestrained Movement": "Unrestrained Movement"
};

const MOVEMENT_DISPLAY = {
    "Ground": "Ground",
    "Fly Half": "Flying (Half Speed)",
    "Fly": "Flying II (Full Speed)",
    "Burrow": "Burrow (Half Speed)",
    "Burrow II": "Burrow II (Full Speed)",
    "Jump": "Jump (Long 3, High 2 spaces)",
    "Jump II": "Jump II (Long 4, High 3 spaces)",
    "Jump III": "Jump III (Long 5, High 4 spaces)",
    "Speedy": "Speedy (+2 spaces)",
    "Speedy II": "Speedy II (+4 spaces)",
    "Speedy III": "Speedy III (+6 spaces)",
    "Slow": "Slow (-2 spaces)",
    "Slow II": "Slow II (-4 spaces)",
    "Slow III": "Slow III (-6 spaces)",
    "Slow Walker": "Slow Walker",
    "Hover": "Hover"
};

// --- Feat Point Values for Senses and Movement ---
const SENSES_POINTS = {
    "Darkvision": 1,
    "Darkvision II": 2,
    "Darkvision III": 4,
    "Blindsense": 0.5,
    "Blindsense II": 1,
    "Blindsense III": 2,
    "Blindsense IV": 4,
    "Amphibious": 1,
    "All-Surface Climber": 2,
    "Telepathy": 1,
    "Telepathy II": 2,
    "Telepathically Intune": 1,
    "Waterbreathing": 0,
    "Unrestrained Movement": 1.5
};
const MOVEMENT_POINTS = {
    "Fly Half": 2,
    "Fly": 3,
    "Burrow": 1,
    "Burrow II": 2,
    "Jump": 1,
    "Jump II": 2,
    "Jump III": 3,
    "Speedy": 1,
    "Speedy II": 2,
    "Speedy III": 3,
    "Slow": -0.5,
    "Slow II": -1.5,
    "Slow III": -3,
    "Slow Walker": -0.5,
    "Hover": 0 // Only applies if flying, handled in points logic if needed
};

// --- Utility Functions ---
function updateList(listId, arr, removeHandler, descMap, displayMap) {
    const ul = document.getElementById(listId);
    ul.innerHTML = "";
    arr.slice().sort().forEach((val, idx) => {
        const li = document.createElement("li");
        li.textContent = displayMap && displayMap[val] ? displayMap[val] : val;
        if (descMap && descMap[val]) {
            li.title = descMap[val];
        }
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => { removeHandler(idx); };
        li.appendChild(btn);
        ul.appendChild(li);
    });
}
function updateMovementList() {
    const ul = document.getElementById("movementList");
    ul.innerHTML = "";
    // Show all movement types alphabetically
    const sorted = movement.slice().sort((a, b) => a.type.localeCompare(b.type));
    sorted.forEach((move, idx) => {
        const li = document.createElement("li");
        li.textContent = MOVEMENT_DISPLAY[move.type] || move.type;
        if (MOVEMENT_DESCRIPTIONS[move.type]) {
            li.title = MOVEMENT_DESCRIPTIONS[move.type];
        }
        const btn = document.createElement("button");
        btn.textContent = "✕";
        btn.className = "small-button red-button";
        btn.onclick = () => {
            movement.splice(idx, 1);
            updateMovementList();
            updateSummary();
        };
        li.appendChild(btn);
        ul.appendChild(li);
    });
}
function updateSensesList() {
    senses = senses.slice().sort();
    updateList("sensesList", senses, idx => {
        senses.splice(idx, 1);
        updateSensesList();
        updateSummary();
    }, SENSES_DESCRIPTIONS, SENSES_DISPLAY);
}
function updateResistancesList() {
    resistances = resistances.slice().sort();
    updateList("resistancesList", resistances, idx => {
        resistances.splice(idx, 1);
        updateResistancesList();
        updateSummary();
    });
}
function updateWeaknessesList() {
    weaknesses = weaknesses.slice().sort();
    updateList("weaknessesList", weaknesses, idx => {
        weaknesses.splice(idx, 1);
        updateWeaknessesList();
        updateSummary();
    });
}
function updateImmunitiesList() {
    immunities = immunities.slice().sort();
    updateList("immunitiesList", immunities, idx => {
        immunities.splice(idx, 1);
        updateImmunitiesList();
        updateSummary();
    });
}
function getSpecialFeatPoints() {
    let points = 0;

    // Immunities, Resistances, Weaknesses
    points += immunities.length * 2;
    points += resistances.length * 1;
    points += weaknesses.length * -0.5;

    // Senses
    senses.forEach(sense => {
        if (SENSES_POINTS.hasOwnProperty(sense)) points += SENSES_POINTS[sense];
    });

    // Movement
    movement.forEach(move => {
        if (move.type === "Ground") return;
        if (MOVEMENT_POINTS.hasOwnProperty(move.type)) points += MOVEMENT_POINTS[move.type];
    });

    // Hover: -1 per level of flying speed if flying is present
    if (movement.some(m => m.type === "Hover")) {
        let flyingLevel = 0;
        if (movement.some(m => m.type === "Fly")) flyingLevel = 2;
        else if (movement.some(m => m.type === "Fly Half")) flyingLevel = 1;
        points += -1 * flyingLevel;
    }

    return points;
}
function isMartialCreature() {
    const martial = document.getElementById("martialCreatureToggle");
    return martial && martial.checked;
}

function getBaseFeatPoints(level) {
    level = parseInt(level) || 1;
    let base = 4.5 + 1.5 * (level - 1);
    if (isMartialCreature()) {
        base += 2; // +2 at level 1
        // +1 for every 3 levels starting at 4 (i.e., 4, 7, 10, ...)
        if (level >= 4) {
            base += Math.floor((level - 1) / 3);
        }
    }
    return base;
}

function getSpentFeatPoints() {
    let points = feats.reduce((sum, f) => sum + (parseFloat(f.points) || 0), 0);
    points += getSpecialFeatPoints();
    return points;
}

function getRemainingFeatPoints() {
    const level = document.getElementById("creatureLevel").value || 1;
    return getBaseFeatPoints(level) - getSpentFeatPoints();
}

function updateSummary() {
    document.getElementById("summaryName").textContent = document.getElementById("creatureName").value || "-";
    document.getElementById("summaryLevel").textContent = document.getElementById("creatureLevel").value || "-";
    document.getElementById("summaryType").textContent = document.getElementById("creatureType").value || "-";
    document.getElementById("summaryResistances").textContent = resistances.slice().sort().join(", ") || "None";
    document.getElementById("summaryWeaknesses").textContent = weaknesses.slice().sort().join(", ") || "None";
    document.getElementById("summaryImmunities").textContent = immunities.slice().sort().join(", ") || "None";
    document.getElementById("summarySenses").textContent = senses
        .slice()
        .sort()
        .map(s => SENSES_DISPLAY[s] || s)
        .join(", ") || "None";
    // Movement: show all movement types
    const others = movement.slice().sort((a, b) => a.type.localeCompare(b.type));
    let movementSummary = others.map(m => MOVEMENT_DISPLAY[m.type] || m.type);
    document.getElementById("summaryMovement").textContent = movementSummary.length ? movementSummary.join(", ") : "None";
    // Feat points: show remaining feat points
    const remaining = getRemainingFeatPoints();
    const featPointsElem = document.getElementById("summaryFeatPoints");
    if (featPointsElem) {
        featPointsElem.textContent = remaining.toFixed(1).replace(/\.0$/, "");
        featPointsElem.style.color = remaining < 0 ? "red" : "";
    }

    // --- Building Points Calculation ---
    function getCreatureBP(level) {
        level = parseInt(level) || 1;
        const highestNonVit = getHighestNonVitalityAbility();
        if (level <= 1) {
            return 9 + highestNonVit;
        }
        return 9 + highestNonVit + (level - 1) * (1 + highestNonVit);
    }

    function getSpentBP() {
        // Sum up BP spent on powers/techniques and armaments
        let spent = powersTechniques.reduce((sum, item) => {
            if (item.type === "power") return sum + (parseFloat(item.totalBP) || 0);
            if (item.type === "technique") return sum + (parseFloat(item.bp) || 0);
            return sum;
        }, 0);
        spent += armaments.reduce((sum, item) => sum + (parseFloat(item.bp) || 0), 0);
        return spent;
    }
    // Add BP summary for powers/techniques
    let level = document.getElementById("creatureLevel").value || 1;
    let bpTotal = getCreatureBP(level);
    let bpSpent = getSpentBP();
    let summaryBP = document.getElementById("summaryBP");
    if (summaryBP) summaryBP.textContent = `${bpTotal - bpSpent} / ${bpTotal}`;

    // Add Innate Powers/Energy summary
    const isPower = getCreatureTypeToggle();
    const innatePowers = getInnatePowers(level, isPower);
    const innateEnergy = getInnateEnergy(innatePowers, isPower);
    let summaryInnatePowers = document.getElementById("summaryInnatePowers");
    let summaryInnateEnergy = document.getElementById("summaryInnateEnergy");
    if (summaryInnatePowers) summaryInnatePowers.textContent = innatePowers;
    if (summaryInnateEnergy) summaryInnateEnergy.textContent = innateEnergy;
}

// --- Powers/Techniques Section (updated) ---
function renderPowersTechniques() {
    const container = document.getElementById("powersTechniquesContainer");
    container.innerHTML = "";
    powersTechniques.forEach((item, idx) => {
        const isPower = item.type === "power";
        const div = document.createElement("div");
        div.className = "power-technique-item";
        if (isPower) {
            // Expandable power display
            const detailsId = `power-details-${idx}`;
            div.innerHTML = `
                <div class="power-header">
                    <span class="toggle-details" data-details-id="${detailsId}" style="cursor:pointer;">[+]</span>
                    <span>${item.name} (BP: ${item.totalBP || item.bp || 0})</span>
                    <button class="small-button red-button remove-btn">✕</button>
                </div>
                <div id="${detailsId}" class="power-details" style="display: none;">
                    <table class="power-table">
                        <tr><th>Energy</th><td>${item.totalEnergy || item.energy || '-'}</td></tr>
                        <tr><th>Action</th><td>${item.action || '-'}</td></tr>
                        <tr><th>Duration</th><td>${item.duration ? `${item.duration} ${item.durationType || ''}` : '-'}</td></tr>
                        <tr><th>Range</th><td>${item.range || '-'}</td></tr>
                        <tr><th>Area of Effect</th><td>${item.areaOfEffect || item.areaEffect || '-'}</td></tr>
                        <tr><th>Focus</th><td>${item.focus ? 'Yes' : (item.focusChecked ? 'Yes' : 'No')}</td></tr>
                        <tr><th>Sustain</th><td>${item.sustainValue > 0 ? item.sustainValue : 'None'}</td></tr>
                        <tr><th>Damage</th><td>${formatDamage(item.damage)}</td></tr>
                        <tr><th>Building Points</th><td>${item.totalBP || item.bp || '-'}</td></tr>
                        <tr><th>Power Parts</th><td>${item.powerParts ? (Array.isArray(item.powerParts) ? item.powerParts.map(p => p.part || p).join(', ') : '-') : '-'}</td></tr>
                        <tr><th>Description</th><td>${item.description || '-'}</td></tr>
                    </table>
                </div>
            `;
        } else {
            // Technique
            div.innerHTML = `
                <span>${item.name} (BP: ${item.bp})</span>
                <button class="small-button red-button remove-btn">✕</button>
            `;
        }
        div.querySelector('.remove-btn').onclick = () => {
            powersTechniques.splice(idx, 1);
            renderPowersTechniques();
            updateSummary();
        };
        if (isPower) {
            div.querySelector('.toggle-details').onclick = () => {
                const details = document.getElementById(`power-details-${idx}`);
                const toggle = div.querySelector('.toggle-details');
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    toggle.textContent = '[-]';
                } else {
                    details.style.display = 'none';
                    toggle.textContent = '[+]';
                }
            };
        }
        container.appendChild(div);
    });
    updateSummary();
}

function formatDamage(damageArr) {
    if (!damageArr || !Array.isArray(damageArr)) return '';
    return damageArr.map(d => {
        if (d.amount && d.size && d.type && d.type !== 'none') {
            return `${d.amount}d${d.size} ${d.type}`;
        }
        return '';
    }).filter(Boolean).join(', ');
}
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Modal Power Loading ---
// Use users/{uid}/library for saved powers, as in the library page
async function fetchSavedPowers() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'library'));
        const powers = [];
        querySnapshot.forEach(doc => {
            powers.push({ id: doc.id, ...doc.data(), type: 'power' });
        });
        return powers;
    } catch (error) {
        if (error.code === "permission-denied") {
            alert("You do not have permission to access your saved powers. Please ensure you are logged in and your account has access.");
        } else {
            alert("Error fetching saved powers: " + (error.message || error));
        }
        return [];
    }
}
function displaySavedPowers(powers) {
    const powerList = document.getElementById('savedPowersList');
    powerList.innerHTML = '';
    if (!powers.length) {
        powerList.innerHTML = '<div>No saved powers found.</div>';
        return;
    }
    powers.forEach(power => {
        const div = document.createElement('div');
        div.className = 'power-item';
        div.innerHTML = `
            <span>${power.name} (BP: ${power.totalBP || 0})</span>
            <button class="small-button blue-button select-power-btn" data-id="${power.id}">Select</button>
        `;
        powerList.appendChild(div);
    });
}
function openPowerModal() {
    if (!currentUser) {
        alert('Please log in to access saved powers.');
        return;
    }
    const modal = document.getElementById('loadPowerModal');
    modal.style.display = 'block';
    fetchSavedPowers().then(displaySavedPowers);
}
function closePowerModal() {
    document.getElementById('loadPowerModal').style.display = 'none';
}

// --- Modal Armament Loading (like powers) ---
async function fetchSavedArmaments() {
    await authReadyPromise;
    if (!currentUser || !firebaseDb) return [];
    try {
        // FIX: Use 'itemLibrary' instead of 'armaments'
        const querySnapshot = await getDocs(collection(firebaseDb, 'users', currentUser.uid, 'itemLibrary'));
        const items = [];
        querySnapshot.forEach(doc => {
            items.push({ id: doc.id, ...doc.data() });
        });
        return items;
    } catch (error) {
        if (error.code === "permission-denied") {
            alert("You do not have permission to access your saved armaments. Please ensure you are logged in and your account has access.");
        } else {
            alert("Error fetching saved armaments: " + (error.message || error));
        }
        return [];
    }
}
function displaySavedArmaments(items) {
    const armamentList = document.getElementById('savedArmamentsList');
    armamentList.innerHTML = '';
    if (!items.length) {
        armamentList.innerHTML = '<div>No saved armaments found.</div>';
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'armament-item';
        div.innerHTML = `
            <span>${item.name} (BP: ${item.totalBP || 0})</span>
            <button class="small-button blue-button select-armament-btn" data-id="${item.id}">Select</button>
        `;
        armamentList.appendChild(div);
    });
}
function openArmamentModal() {
    if (!currentUser) {
        alert('Please log in to access saved armaments.');
        return;
    }
    const modal = document.getElementById('loadArmamentModal');
    modal.style.display = 'block';
    fetchSavedArmaments().then(displaySavedArmaments);
}
function closeArmamentModal() {
    document.getElementById('loadArmamentModal').style.display = 'none';
}

// Expose modal functions to global scope for HTML onclick or other uses
window.openArmamentModal = openArmamentModal;
window.closeArmamentModal = closeArmamentModal;

// --- Prevent duplicate modal event listeners for powers ---
let powerModalListenerAdded = false;

// --- Prevent duplicate modal event listeners for armaments ---
let armamentModalListenerAdded = false;

// --- Event Listeners for Modal and UI ---
document.addEventListener('DOMContentLoaded', () => {
    // Level, Name, Type
    document.getElementById("creatureName").addEventListener("input", updateSummary);
    document.getElementById("creatureLevel").addEventListener("input", updateSummary);
    document.getElementById("creatureType").addEventListener("change", updateSummary);

    // Resistances
    updateResistancesList();
    document.getElementById("addResistanceBtn").onclick = () => {
        const val = document.getElementById("resistanceDropdown").value;
        if (val && !resistances.includes(val)) {
            resistances.push(val);
            updateResistancesList();
            updateSummary();
        }
    };
    // Remove all resistances button
    const removeAllResistBtn = document.createElement("button");
    removeAllResistBtn.textContent = "Remove All";
    removeAllResistBtn.className = "small-button red-button";
    removeAllResistBtn.style.marginLeft = "5px";
    removeAllResistBtn.onclick = () => {
        resistances = [];
        updateResistancesList();
        updateSummary();
    };
    document.getElementById("addResistanceBtn").after(removeAllResistBtn);

    // Weaknesses
    updateWeaknessesList();
    document.getElementById("addWeaknessBtn").onclick = () => {
        const val = document.getElementById("weaknessDropdown").value;
        if (val && !weaknesses.includes(val)) {
            weaknesses.push(val);
            updateWeaknessesList();
            updateSummary();
        }
    };
    // Remove all weaknesses button
    const removeAllWeakBtn = document.createElement("button");
    removeAllWeakBtn.textContent = "Remove All";
    removeAllWeakBtn.className = "small-button red-button";
    removeAllWeakBtn.style.marginLeft = "5px";
    removeAllWeakBtn.onclick = () => {
        weaknesses = [];
        updateWeaknessesList();
        updateSummary();
    };
    document.getElementById("addWeaknessBtn").after(removeAllWeakBtn);

    // Immunities
    updateImmunitiesList();
    document.getElementById("addImmunityBtn").onclick = () => {
        const val = document.getElementById("immunityDropdown").value;
        if (val && !immunities.includes(val)) {
            immunities.push(val);
            updateImmunitiesList();
            updateSummary();
        }
    };
    // Remove all immunities button
    const removeAllImmuneBtn = document.createElement("button");
    removeAllImmuneBtn.textContent = "Remove All";
    removeAllImmuneBtn.className = "small-button red-button";
    removeAllImmuneBtn.style.marginLeft = "5px";
    removeAllImmuneBtn.onclick = () => {
        immunities = [];
        updateImmunitiesList();
        updateSummary();
    };
    document.getElementById("addImmunityBtn").after(removeAllImmuneBtn);

    // Senses
    updateSensesList();
    document.getElementById("addSenseBtn").onclick = () => {
        const val = document.getElementById("senseDropdown").value;
        if (!val) return;

        // Replacement logic for senses levels
        const sensesGroups = [
            ["Darkvision", "Darkvision II", "Darkvision III"],
            ["Blindsense", "Blindsense II", "Blindsense III", "Blindsense IV"],
            ["Telepathy", "Telepathy II"],
        ];

        for (const group of sensesGroups) {
            if (group.includes(val)) {
                for (const g of group) {
                    if (g !== val) {
                        const idx = senses.indexOf(g);
                        if (idx !== -1) {
                            senses.splice(idx, 1);
                        }
                    }
                }
            }
        }
        if (!senses.includes(val)) {
            senses.push(val);
        }
        updateSensesList();
        updateSummary();
    };
    // Remove all senses button
    const removeAllSensesBtn = document.createElement("button");
    removeAllSensesBtn.textContent = "Remove All";
    removeAllSensesBtn.className = "small-button red-button";
    removeAllSensesBtn.style.marginLeft = "5px";
    removeAllSensesBtn.onclick = () => {
        senses = [];
        updateSensesList();
        updateSummary();
    };
    document.getElementById("addSenseBtn").after(removeAllSensesBtn);

    // Movement
    updateMovementList();

    // Remove ground speed input and buttons if present
    const groundSpeedInput = document.getElementById("groundSpeed");
    if (groundSpeedInput) groundSpeedInput.parentElement.style.display = "none";
    const halfGroundBtn = document.getElementById("halfGroundBtn");
    if (halfGroundBtn) halfGroundBtn.style.display = "none";
    const doubleGroundBtn = document.getElementById("doubleGroundBtn");
    if (doubleGroundBtn) doubleGroundBtn.style.display = "none";

    document.getElementById("addMovementBtn").onclick = () => {
        const val = document.getElementById("movementDropdown").value;
        if (!val) return;

        // Replacement logic for movement levels
        // Define movement level groups
        const movementGroups = [
            ["Fly Half", "Fly"],
            ["Burrow", "Burrow II"],
            ["Jump", "Jump II", "Jump III"],
            ["Speedy", "Speedy II", "Speedy III"],
            ["Slow", "Slow II", "Slow III"]
        ];

        // Find if the new value is in a group
        let replaced = false;
        for (const group of movementGroups) {
            if (group.includes(val)) {
                // Remove any other in the group
                for (const g of group) {
                    if (g !== val) {
                        const idx = movement.findIndex(m => m.type === g);
                        if (idx !== -1) {
                            movement.splice(idx, 1);
                            replaced = true;
                        }
                    }
                }
            }
        }
        // Add or replace
        if (!movement.some(m => m.type === val)) {
            movement.push({ type: val });
        }
        updateMovementList();
        updateSummary();
    };

    // Remove all movement types
    const removeAllMoveBtn = document.createElement("button");
    removeAllMoveBtn.textContent = "Remove All";
    removeAllMoveBtn.className = "small-button red-button";
    removeAllMoveBtn.style.marginLeft = "5px";
    removeAllMoveBtn.onclick = () => {
        movement = [];
        updateMovementList();
        updateSummary();
    };
    document.getElementById("addMovementBtn").after(removeAllMoveBtn);

    // Feats
    renderFeats();
    document.getElementById("addFeatBtn").onclick = () => {
        feats.push({ name: "", points: 1 });
        renderFeats();
        updateSummary();
    };

    // Powers/Techniques
    renderPowersTechniques();
    document.getElementById("addPowerBtn").onclick = openPowerModal;
    document.getElementById("addTechniqueBtn").onclick = () => {
        powersTechniques.push({ name: "", bp: 0, type: "technique" });
        renderPowersTechniques();
        updateSummary();
    };

    // Modal close for powers
    if (document.querySelector('#loadPowerModal .close-button')) {
        document.querySelector('#loadPowerModal .close-button').onclick = closePowerModal;
    }
    if (!powerModalListenerAdded) {
        const powerList = document.getElementById('savedPowersList');
        if (powerList) {
            powerList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('select-power-btn')) {
                    const powerId = e.target.dataset.id;
                    const powers = await fetchSavedPowers();
                    const power = powers.find(p => p.id === powerId);
                    if (power) {
                        powersTechniques.push(power);
                        renderPowersTechniques();
                        closePowerModal();
                        updateSummary();
                    }
                }
            });
            powerModalListenerAdded = true;
        }
    }

    // Armaments section
    renderArmaments();
    document.getElementById("addArmamentBtn").onclick = openArmamentModal;

    // Modal close for armaments
    if (document.querySelector('#loadArmamentModal .close-button')) {
        document.querySelector('#loadArmamentModal .close-button').onclick = closeArmamentModal;
    }
    if (!armamentModalListenerAdded) {
        const armamentList = document.getElementById('savedArmamentsList');
        if (armamentList) {
            armamentList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('select-armament-btn')) {
                    const armamentId = e.target.dataset.id;
                    const items = await fetchSavedArmaments();
                    const item = items.find(i => i.id === armamentId);
                    if (item) {
                        // Add to armaments array, using name and BP
                        armaments.push({
                            name: item.name,
                            bp: item.totalBP || 0,
                            // Optionally, you can add more fields if needed
                        });
                        renderArmaments();
                        closeArmamentModal();
                        updateSummary();
                    }
                }
            });
            armamentModalListenerAdded = true;
        }
    }

    // Creature type dropdown (replaces toggle)
    const creatureTypeDropdown = document.getElementById("creatureTypeDropdown");
    if (creatureTypeDropdown) {
        creatureTypeDropdown.addEventListener('change', () => {
            updateInnateInfo();
            updateSummary();
        });
    }

    updateInnateInfo();
    updateSummary();
});

// --- Armaments Section Logic (placeholder, like powers/techniques) ---
function renderArmaments() {
    const container = document.getElementById("armamentsContainer");
    container.innerHTML = "";
    armaments.forEach((item, idx) => {
        // Top row: name, rarity, gold cost, building point cost, damage, range
        const div = document.createElement("div");
        div.className = "armament-row";
        div.style.fontFamily = "'Nunito', sans-serif";
        // Format damage string
        let damageStr = "";
        if (item.damage && Array.isArray(item.damage)) {
            damageStr = item.damage
                .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
                .map(d => `${d.amount}d${d.size} ${d.type}`)
                .join(', ');
        }
        // Range string
        let rangeStr = "-";
        if (item.range !== undefined && item.range !== null && item.range !== "") {
            if (typeof item.range === "number" && item.range > 0) {
                rangeStr = `${item.range} spaces`;
            } else if (typeof item.range === "string" && item.range.trim() !== "") {
                rangeStr = item.range;
            } else if (item.range === 0) {
                rangeStr = "Melee";
            }
        }
        div.innerHTML = `
            <span style="font-family:'Merriweather',serif;font-size:17px;">
                ${item.name || "Armament"}
            </span>
            <span style="margin-left:10px;">Rarity: ${item.rarity || "-"}</span>
            <span style="margin-left:10px;">Gold: ${item.totalGP !== undefined ? item.totalGP : (item.gp !== undefined ? item.gp : "-")}</span>
            <span style="margin-left:10px;">BP: ${item.totalBP !== undefined ? item.totalBP : (item.bp !== undefined ? item.bp : "-")}</span>
            <span style="margin-left:10px;">Range: ${rangeStr}</span>
            <span style="margin-left:10px;">${damageStr ? "Damage: " + damageStr : ""}</span>
            <button class="small-button blue-button" style="margin-left:10px;" id="expand-armament-${idx}">Details</button>
            <button class="small-button red-button remove-btn" style="margin-left:10px;">✕</button>
        `;
        // Remove button
        div.querySelector('.remove-btn').onclick = () => {
            armaments.splice(idx, 1);
            renderArmaments();
            updateSummary();
        };
        // Details button
        div.querySelector(`#expand-armament-${idx}`).onclick = () => {
            const expanded = document.getElementById(`armament-details-${idx}`);
            if (expanded) {
                expanded.style.display = expanded.style.display === "none" ? "block" : "none";
            }
        };
        // Expanded details row (hidden by default)
        const detailsDiv = document.createElement("div");
        detailsDiv.id = `armament-details-${idx}`;
        detailsDiv.style.display = "none";
        detailsDiv.style.background = "#f7f7f7";
        detailsDiv.style.border = "1px solid #ccc";
        detailsDiv.style.margin = "8px 0 8px 0";
        detailsDiv.style.padding = "8px";
        // Item parts with hover descriptions
        let partsHtml = "";
        if (item.itemParts && item.itemParts.length > 0) {
            partsHtml += `<div><strong>Parts:</strong> `;
            partsHtml += item.itemParts.map(part => {
                let desc = "";
                if (window.itemPartsData) {
                    const found = window.itemPartsData.find(p => p.name === part.part);
                    if (found && found.description) desc = found.description;
                }
                let opt = "";
                if (part.opt1Level) opt += ` Opt 1: (${part.opt1Level})`;
                if (part.opt2Level) opt += ` Opt 2: (${part.opt2Level})`;
                return `<span style="margin-right:10px;cursor:help;" title="${desc}">${part.part}${opt}</span>`;
            }).join('');
            partsHtml += `</div>`;
        }
        // Description
        partsHtml += `<div style="margin-top:8px;"><strong>Description:</strong> ${item.description || ""}</div>`;
        detailsDiv.innerHTML = partsHtml;
        container.appendChild(div);
        container.appendChild(detailsDiv);
    });
    updateSummary();
}

// --- Creature Type Dropdown Logic ---
function getCreatureTypeToggle() {
    const dropdown = document.getElementById("creatureTypeDropdown");
    return dropdown && dropdown.value === "Power";
}

// --- Innate Powers/Energy Logic (unchanged) ---
function getInnatePowers(level, isPowerCreature) {
    if (!isPowerCreature) return 0;
    level = parseInt(level) || 1;
    if (level < 1) return 0;
    return 2 + Math.floor((level - 1) / 3);
}
function getInnateEnergy(innatePowers, isPowerCreature) {
    if (!isPowerCreature || innatePowers === 0) return 0;
    return 8 + (innatePowers - 2);
}
function updateInnateInfo() {
    const isPower = getCreatureTypeToggle();
    const level = document.getElementById("creatureLevel").value || 1;
    const innatePowers = getInnatePowers(level, isPower);
    const innateEnergy = getInnateEnergy(innatePowers, isPower);
    document.getElementById("innatePowers").textContent = innatePowers;
    document.getElementById("innateEnergy").textContent = innateEnergy;
    document.getElementById("summaryInnatePowers").textContent = innatePowers;
    document.getElementById("summaryInnateEnergy").textContent = innateEnergy;
}

// --- Update getTotalBP to use totalBP for powers ---
function getTotalBP() {
    return powersTechniques.reduce((sum, item) => {
        if (item.type === "power") return sum + (parseFloat(item.totalBP) || 0);
        if (item.type === "technique") return sum + (parseFloat(item.bp) || 0);
        return sum;
    }, 0);
}

// --- Feats Section (allow removal and re-selection) ---
function renderFeats() {
    const container = document.getElementById("featsContainer");
    container.innerHTML = "";
    feats.forEach((feat, idx) => {
        const row = document.createElement("div");
        row.className = "feat-row";

        // Feat dropdown
        const select = document.createElement("select");
        select.style.minWidth = "220px";
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Feat";
        select.appendChild(defaultOption);

        creatureFeatsData.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f.name;
            opt.textContent = `${f.name} (${f.cost})`;
            if (feat.name === f.name) opt.selected = true;
            select.appendChild(opt);
        });

        select.onchange = e => {
            const selected = creatureFeatsData.find(f => f.name === e.target.value);
            if (selected) {
                feat.name = selected.name;
                feat.points = selected.cost;
            } else {
                feat.name = "";
                feat.points = 1;
            }
            renderFeats();
            updateSummary();
        };

        row.appendChild(select);

        // Show feat name, points, and description if selected
        if (feat.name) {
            const selected = creatureFeatsData.find(f => f.name === feat.name);
            if (selected) {
                const info = document.createElement("span");
                info.style.marginLeft = "10px";
                info.innerHTML = `<strong>${selected.name}</strong> (Feat Points: ${selected.cost})<br><span style="font-style:italic;font-size:13px;">${selected.description}</span>`;
                row.appendChild(info);
            }
        }

        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "small-button red-button";
        removeBtn.textContent = "✕";
        removeBtn.onclick = () => { feats.splice(idx, 1); renderFeats(); updateSummary(); };
        row.appendChild(removeBtn);

        container.appendChild(row);
    });
}

// --- Ability Point Calculation for Creature Creator ---
function getAbilityPointCost(val) {
    val = parseInt(val);
    if (isNaN(val)) return 0;
    if (val <= 4) return val;
    // Above 4: each point above 4 counts as 2
    return 4 + (val - 4) * 2;
}
function getAbilityPointTotal(level) {
    level = parseInt(level) || 1;
    return 7 + Math.floor((level - 1) / 3);
}
function updateCreatureAbilityDropdowns() {
    const abilityDropdowns = document.querySelectorAll('.creature-ability-dropdown');
    let total = 0;
    abilityDropdowns.forEach(dropdown => {
        const value = parseInt(dropdown.value);
        if (!isNaN(value)) {
            const cost = getAbilityPointCost(value);
            total += cost;
        }
    });

    // Get level if present, default to 1
    let level = 1;
    const levelInput = document.getElementById('creatureLevel');
    if (levelInput) {
        level = parseInt(levelInput.value) || 1;
    }
    const maxPoints = getAbilityPointTotal(level);

    // Show remaining points (can be negative)
    const remaining = maxPoints - total;

    // Update counter if present
    const counter = document.getElementById('remaining-points');
    if (counter) {
        counter.textContent = remaining;
        counter.style.color = remaining <= 0 ? "red" : "#007bff";
    }

    // No disabling of options for negative values
    abilityDropdowns.forEach(dropdown => {
        const options = dropdown.querySelectorAll('option');
        options.forEach(option => {
            option.disabled = false;
        });
    });
}

// --- Hit-Energy Points Logic ---
function getHitEnergyTotal(level) {
    level = parseInt(level) || 1;
    return 26 + 12 * (level - 1);
}
function getVitalityValue() {
    const v = document.getElementById('creatureAbilityVitality');
    return v ? parseInt(v.value) || 0 : 0;
}
function getHighestNonVitalityAbility() {
    const ids = [
        'creatureAbilityStrength',
        'creatureAbilityAgility',
        'creatureAbilityAcuity',
        'creatureAbilityIntelligence',
        'creatureAbilityCharisma'
    ];
    let max = -Infinity;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const val = parseInt(el.value) || 0;
            if (val > max) max = val;
        }
    });
    return max === -Infinity ? 0 : max;
}
function getLevelValue() {
    const l = document.getElementById('creatureLevel');
    return l ? parseInt(l.value) || 1 : 1;
}
function getBaseHitPoints() {
    return getLevelValue() * getVitalityValue();
}
function getBaseEnergy() {
    return getLevelValue() * getHighestNonVitalityAbility();
}
function updateHealthEnergyUI() {
    const level = getLevelValue();
    const vitality = getVitalityValue();
    const baseHP = getBaseHitPoints();
    const baseEN = getBaseEnergy();
    const totalPoints = getHitEnergyTotal(level);

    // Get current allocated values or set to base
    const hpInput = document.getElementById('hitPointsInput');
    const enInput = document.getElementById('energyInput');
    let hp = parseInt(hpInput.value);
    let en = parseInt(enInput.value);

    // If not set, initialize to base
    if (isNaN(hp) || hp < baseHP) hp = baseHP;
    if (isNaN(en) || en < baseEN) en = baseEN;

    // Calculate allocated points (above base)
    let allocatedHP = hp - baseHP;
    let allocatedEN = en - baseEN;
    if (allocatedHP < 0) allocatedHP = 0;
    if (allocatedEN < 0) allocatedEN = 0;

    // Remaining hit-energy points
    let spent = allocatedHP + allocatedEN;
    let remaining = totalPoints - spent;

    // Clamp so you can't allocate more than available
    if (remaining < 0) {
        // Reduce the one that was just changed
        if (hpInput === document.activeElement) {
            allocatedHP = Math.max(0, allocatedHP + remaining);
            hp = baseHP + allocatedHP;
        } else if (enInput === document.activeElement) {
            allocatedEN = Math.max(0, allocatedEN + remaining);
            en = baseEN + allocatedEN;
        } else {
            // Default: set energy to max possible
            allocatedEN = Math.max(0, totalPoints - allocatedHP);
            en = baseEN + allocatedEN;
        }
        spent = allocatedHP + allocatedEN;
        remaining = totalPoints - spent;
    }

    // Update UI
    document.getElementById('hitEnergyTotal').textContent = remaining;
    hpInput.value = hp;
    enInput.value = en;

    // Disable - buttons if at minimum
    document.getElementById('decreaseHitPoints').disabled = hp <= baseHP;
    document.getElementById('decreaseEnergy').disabled = en <= baseEN;
    // Disable + buttons if at max allocation
    document.getElementById('increaseHitPoints').disabled = remaining <= 0;
    document.getElementById('increaseEnergy').disabled = remaining <= 0;
}

// --- Event Listeners for Health & Energy ---
function setupHealthEnergyHandlers() {
    const hpInput = document.getElementById('hitPointsInput');
    const enInput = document.getElementById('energyInput');
    const incHP = document.getElementById('increaseHitPoints');
    const decHP = document.getElementById('decreaseHitPoints');
    const incEN = document.getElementById('increaseEnergy');
    const decEN = document.getElementById('decreaseEnergy');

    function changeHP(delta) {
        hpInput.value = parseInt(hpInput.value) + delta;
        updateHealthEnergyUI();
    }
    function changeEN(delta) {
        enInput.value = parseInt(enInput.value) + delta;
        updateHealthEnergyUI();
    }
    incHP.onclick = () => changeHP(1);
    decHP.onclick = () => changeHP(-1);
    incEN.onclick = () => changeEN(1);
    decEN.onclick = () => changeEN(-1);
    hpInput.oninput = updateHealthEnergyUI;
    enInput.oninput = updateHealthEnergyUI;
}

// --- Update Health/Energy on relevant changes ---
function updateAllHealthEnergy() {
    updateHealthEnergyUI();
}

// --- Attach listeners for creature ability dropdowns and health/energy ---
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    document.querySelectorAll('.creature-ability-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', () => {
            updateCreatureAbilityDropdowns();
            updateAllHealthEnergy();
        });
    });
    const levelInput = document.getElementById('creatureLevel');
    if (levelInput) {
        levelInput.addEventListener('input', () => {
            updateCreatureAbilityDropdowns();
            updateAllHealthEnergy();
        });
    }
    // Health/Energy handlers
    setupHealthEnergyHandlers();
    updateCreatureAbilityDropdowns();
    updateAllHealthEnergy();
    // ...existing code...
});

//# sourceMappingURL=creatureCreator.js.map
