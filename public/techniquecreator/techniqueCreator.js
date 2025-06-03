import techniquePartsData from './techniquePartsData.js';
import { initializeFirebase } from '/scripts/auth.js'; // Use correct path for your project
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Store Firebase objects after initialization
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseFunctions = null;
let selectedWeapon = { name: "Unarmed Prowess", bp: 0, id: null };
let weaponLibrary = [];

(() => {
    const techniqueParts = techniquePartsData;

    const selectedTechniqueParts = [];

    const actionTypeDescriptions = {
        basic: "Basic Action",
        free: "+50% EN: This technique uses a free action to activate instead of a basic action.",
        quick: "+25% EN: This technique uses a quick action to activate instead of a basic action.",
        long3: "-12.5% EN: This technique takes 1 more AP to perform (cannot be added to a quick or free action technique).",
        long4: "-12.5% EN: For each additional 1 AP required. This type of technique can only be used with this reduced cost if used inside combat and does not linger longer than 1 minute (10 rounds).",
        reaction: "+25% EN: This technique uses a basic reaction instead of a basic action."
    };

    function addTechniquePart() {
        // Add the first available part of any type (base, increase, decrease)
        const allParts = techniqueParts;
        if (allParts.length === 0) return;
        selectedTechniqueParts.push({ part: allParts[0], opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });

        renderTechniqueParts();
        updateTotalCosts();
    }

    function generatePartContent(partIndex, part) {
        return `
            <h3>${part.name} <span class="small-text">Energy: <span id="baseEnergy-${partIndex}">${part.baseEnergy}</span></span> <span class="small-text">Building Points: <span id="baseBP-${partIndex}">${part.baseBP}</span></span></h3>
            <p>Part EN: <span id="totalEnergy-${partIndex}">${part.baseEnergy}</span> Part BP: <span id="totalBP-${partIndex}">${part.baseBP}</span></p>
            <p>${part.description}</p>
            
            ${part.opt1Cost !== undefined || part.opt1Description ? `
            <div class="option-container">
                ${part.opt1Cost !== undefined || part.opt1Description ? `
                <div class="option-box">
                    <h4>Energy: ${part.opt1Cost >= 0 ? '+' : ''}${part.opt1Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="opt1Level-${partIndex}">${selectedTechniqueParts[partIndex].opt1Level}</span></span>
                    <p>${part.opt1Description}</p>
                </div>` : ''}
                
                ${part.opt2Cost !== undefined || part.opt2Description ? `
                <div class="option-box">
                    <h4>Energy: ${part.opt2Cost >= 0 ? '+' : ''}${part.opt2Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="opt2Level-${partIndex}">${selectedTechniqueParts[partIndex].opt2Level}</span></span>
                    <p>${part.opt2Description}</p>
                </div>` : ''}
    
                ${part.opt3Cost !== undefined || part.opt3Description ? `
                <div class="option-box">
                    <h4>Energy: ${part.opt3Cost >= 0 ? '+' : ''}${part.opt3Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', -1)">-</button>
                    <span>Level: <span id="opt3Level-${partIndex}">${selectedTechniqueParts[partIndex].opt3Level}</span></span>
                    <p>${part.opt3Description}</p>
                </div>` : ''}
            </div>` : ''}
    
            ${part.altBaseEnergy !== undefined || part.altBP !== undefined ? `
            <div class="option-box">
                <h4>Alternate Base Energy: ${part.altBaseEnergy}</h4>
                <button id="altEnergyButton-${partIndex}" class="alt-energy-button" onclick="toggleAltEnergy(${partIndex})">Toggle</button>
                <p>${part.altEnergyDescription}</p>
            </div>` : ''}
        `;
    }

    function updateSelectedPart(index, selectedValue) {
        const selectedPart = techniqueParts[selectedValue];
        selectedTechniqueParts[index].part = selectedPart;
        selectedTechniqueParts[index].opt1Level = 0;
        selectedTechniqueParts[index].opt2Level = 0;
        selectedTechniqueParts[index].opt3Level = 0;
        selectedTechniqueParts[index].useAltCost = false;

        // Preserve the selected category
        const selectedCategory = selectedTechniqueParts[index].category || 'any';
        filterPartsByCategory(index, selectedCategory);

        renderTechniqueParts();
        updateTotalCosts();
    }

    function changeOptionLevel(index, option, delta) {
        const part = selectedTechniqueParts[index];
        const levelKey = `${option}Level`;

        part[levelKey] = Math.max(0, part[levelKey] + delta);

        document.getElementById(`${levelKey}-${index}`).textContent = part[levelKey];

        renderTechniqueParts();
        updateTotalCosts();
    }

    function toggleAltEnergy(partIndex) {
        const partData = selectedTechniqueParts[partIndex];
        partData.useAltCost = !partData.useAltCost;

        renderTechniqueParts();
        updateTotalCosts();
    }

    function updateActionType() {
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        let description = actionTypeDescriptions[actionType];
        if (reactionChecked) {
            description += " " + actionTypeDescriptions.reaction;
        }
        document.getElementById('actionTypeDescription').textContent = description;
        updateTotalCosts();
    }

    function updateDamageType() {
        updateTotalCosts();
    }

    function calculateDamageEnergyCost() {
        let totalDamageEnergy = 0;

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);

        if (!isNaN(dieAmount1) && !isNaN(dieSize1)) {
            totalDamageEnergy += ((dieAmount1 * dieSize1) / 2) * 1.5;
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);

        if (!isNaN(dieAmount2) && !isNaN(dieSize2)) {
            totalDamageEnergy += ((dieAmount2 * dieSize2) / 2) * 1.5;
        }

        return totalDamageEnergy;
    }

    function updateTotalCosts() {
        let sumBaseEnergy = 0;
        let totalBP = 0;

        // Only base, increase, decrease parts (no linger, duration, etc)
        const baseEnergyParts = [];
        const increaseParts = [];
        const decreaseParts = [];

        selectedTechniqueParts.forEach((partData) => {
            const part = partData.part;
            if (part.type === "base") {
                baseEnergyParts.push(partData);
            } else if (part.type === "increase") {
                increaseParts.push(partData);
            } else if (part.type === "decrease") {
                decreaseParts.push(partData);
            }
        });

        // Step 1: Calculate base energy parts
        baseEnergyParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = partData.useAltCost ? part.altBaseEnergy : part.baseEnergy;
            let partBP = part.baseBP;
            partEnergy += (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += (part.opt3Cost || 0) * partData.opt3Level;
            sumBaseEnergy += partEnergy;
            totalBP += partBP;
        });

        // --- Add weapon energy cost if weapon is selected ---
        if (selectedWeapon && selectedWeapon.name !== "Unarmed Prowess" && selectedWeapon.bp > 0) {
            sumBaseEnergy += 0.5 * selectedWeapon.bp;
        }
        // ----------------------------------------------------

        // Calculate damage energy cost
        sumBaseEnergy += calculateDamageEnergyCost();

        // Increase BP if damage dice are present
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        if (!isNaN(dieAmount1) && !isNaN(dieSize1)) {
            totalBP += 1;
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        if (!isNaN(dieAmount2) && !isNaN(dieSize2)) {
            totalBP += 1;
        }

        // Step 2: Apply increase parts
        let increasedEnergy = sumBaseEnergy;
        increaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = increasedEnergy * part.baseEnergy;
            partEnergy += increasedEnergy * (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += increasedEnergy * (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += increasedEnergy * (part.opt3Cost || 0) * partData.opt3Level;
            increasedEnergy += partEnergy;
        });

        // Apply action type cost (only increases)
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const actionTypeCost = {
            basic: 0,
            free: 0.5,
            quick: 0.25,
            long3: -0.125,
            long4: -0.25
        }[actionType];
        if (actionTypeCost > 0) {
            increasedEnergy *= 1 + actionTypeCost;
        }
        if (reactionChecked) {
            increasedEnergy *= 1 + 0.25;
        }

        // Step 3: Apply decrease parts
        let decreasedEnergy = increasedEnergy;
        decreaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = decreasedEnergy * part.baseEnergy;
            partEnergy += decreasedEnergy * (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += decreasedEnergy * (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += decreasedEnergy * (part.opt3Cost || 0) * partData.opt3Level;
            decreasedEnergy += partEnergy;
        });

        // Apply action type cost (only decreases)
        if (actionTypeCost < 0) {
            decreasedEnergy *= 1 + actionTypeCost;
        }

        // Final energy calculation
        const finalEnergy = decreasedEnergy;

        document.getElementById("totalEnergy").textContent = finalEnergy.toFixed(2);
        document.getElementById("totalBP").textContent = totalBP;

        updateTechniqueSummary();
    }

    function updateTechniqueSummary() {
        const techniqueName = document.getElementById('techniqueName').value;
        const summaryEnergy = document.getElementById('totalEnergy').textContent;
        const summaryBP = document.getElementById('totalBP').textContent;
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const actionTypeText = reactionChecked ? `${capitalize(actionType)} Reaction` : `${capitalize(actionType)} Action`;

        document.getElementById('summaryEnergy').textContent = summaryEnergy;
        document.getElementById('summaryBP').textContent = summaryBP;
        document.getElementById('summaryActionType').textContent = actionTypeText;

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);

        let damageText = '';
        if (!isNaN(dieAmount1) && !isNaN(dieSize1)) {
            damageText += `Increased Damage: ${dieAmount1}d${dieSize1}`;
        }
        if (!isNaN(dieAmount2) && !isNaN(dieSize2)) {
            damageText += (damageText ? ', ' : '') + `Increased Damage: ${dieAmount2}d${dieSize2}`;
        }
        document.getElementById('summaryDamage').textContent = damageText;
        document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';

        // Update the summary parts
        const summaryPartsContainer = document.getElementById('summaryParts');
        summaryPartsContainer.innerHTML = '';
        selectedTechniqueParts.forEach((partData, partIndex) => {
            const part = partData.part;
            const partElement = document.createElement('div');
            partElement.innerHTML = `
                <h4>${part.name}</h4>
                <p>Energy: ${part.baseEnergy}</p>
                <p>Building Points: ${part.baseBP}</p>
                <p>${part.description}</p>
                ${part.opt1Description ? `<p>Option 1: ${part.opt1Description} (Level: ${partData.opt1Level})</p>` : ''}
                ${part.opt2Description ? `<p>Option 2: ${part.opt2Description} (Level: ${partData.opt2Level})</p>` : ''}
                ${part.opt3Description ? `<p>Option 3: ${part.opt3Description} (Level: ${partData.opt3Level})</p>` : ''}
                ${part.altEnergyDescription ? `<p>Alternate Energy: ${part.altEnergyDescription}</p>` : ''}
            `;
            summaryPartsContainer.appendChild(partElement);
        });

        // Show selected weapon in summary
        let weaponSummary = document.getElementById('summaryWeapon');
        if (!weaponSummary) {
            // Add if not present
            const summaryTop = document.querySelector('.technique-summary-top');
            weaponSummary = document.createElement('p');
            weaponSummary.id = 'summaryWeapon';
            summaryTop.insertBefore(weaponSummary, summaryTop.querySelector('p'));
        }
        weaponSummary.innerHTML = `Weapon: <span>${selectedWeapon ? selectedWeapon.name : "Unarmed Prowess"}</span>`;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function toggleTotalCosts() {
        const totalCosts = document.getElementById('totalCosts');
        totalCosts.classList.toggle('collapsed');
        const arrow = document.querySelector('#totalCosts .toggle-arrow');
        arrow.textContent = totalCosts.classList.contains('collapsed') ? '>' : '<';
    }

    // Consolidate all event listeners into one function
    function initializeEventListeners() {
        document.getElementById("addTechniquePartButton").addEventListener("click", addTechniquePart);
        document.getElementById('dieAmount1').addEventListener('input', updateTotalCosts);
        document.getElementById('dieSize1').addEventListener('change', updateTotalCosts);

        const totalCostsArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (totalCostsArrow) totalCostsArrow.addEventListener('click', toggleTotalCosts);

        // Modal load/save logic
        const loadTechniqueButton = document.getElementById('loadTechniqueButton');
        const closeButton = document.querySelector('.close-button');
        loadTechniqueButton.addEventListener('click', () => {
            const user = firebaseAuth.currentUser;
            if (user) {
                loadSavedTechniques(firebaseDb, user.uid);
                openModal();
            } else {
                alert('Please login to load saved techniques.');
            }
        });
        closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('loadTechniqueModal')) {
                closeModal();
            }
        });

        // Save button logic (update on auth state)
        const saveTechniqueButton = document.getElementById('saveTechniqueButton');
        onAuthStateChanged(firebaseAuth, (user) => {
            // Remove previous listeners to avoid stacking
            const newBtn = saveTechniqueButton.cloneNode(true);
            saveTechniqueButton.parentNode.replaceChild(newBtn, saveTechniqueButton);
            if (user) {
                newBtn.textContent = 'Save Technique';
                newBtn.addEventListener('click', () => saveTechniqueToLibrary(firebaseFunctions, user.uid));
            } else {
                newBtn.textContent = 'Login to Save Techniques';
                newBtn.addEventListener('click', () => {
                    window.location.href = '/login.html';
                });
            }
        });

        document.getElementById('techniqueWeaponSelect').addEventListener('change', onTechniqueWeaponChange);
    }

    // Single DOMContentLoaded for all initialization
    document.addEventListener("DOMContentLoaded", async () => {
        // Initialize Firebase once
        const { app, auth, db, functions } = await initializeFirebase();
        firebaseApp = app;
        firebaseAuth = auth;
        firebaseDb = db;
        firebaseFunctions = functions;

        // Set up event listeners
        initializeEventListeners();

        // Load weapon library for authenticated users
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                await loadWeaponLibrary();
            }
        });

        updateWeaponBoxUI();
    });

    function addDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <input type="number" id="dieAmount2" min="1" max="99" value="" placeholder="Amount">
                <span>d</span>
                <select id="dieSize2">
                    <option value="" selected disabled>Size</option>
                    <option value="2">2</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                </select>
                <button id="removeDamageRowButton" class="medium-button red-button" onclick="removeDamageRow()">-</button>
            </div>
        `;
        document.getElementById('addDamageRowButton').style.display = 'none';
    }

    function removeDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = '';
        document.getElementById('addDamageRowButton').style.display = 'inline-block';
    }

    function renderTechniqueParts() {
        const techniquePartsContainer = document.getElementById("techniquePartsContainer");
        techniquePartsContainer.innerHTML = "";

        selectedTechniqueParts.forEach((partData, partIndex) => {
            // Prevent error if partData or partData.part is undefined
            if (!partData || !partData.part) return;

            const techniquePartSection = document.createElement("div");
            techniquePartSection.id = `techniquePart-${partIndex}`;
            techniquePartSection.classList.add("technique-part-section");

            let filteredParts = [];
            if (partData.part.type === 'base') {
                filteredParts = techniqueParts.filter(part => part.type === 'base');
            } else if (partData.part.type === 'increase') {
                filteredParts = techniqueParts.filter(part => part.type === 'increase');
            } else if (partData.part.type === 'decrease') {
                filteredParts = techniqueParts.filter(part => part.type === 'decrease');
            }

            const selectedCategory = partData.category || 'any';
            if (selectedCategory !== 'any') {
                filteredParts = filteredParts.filter(part => part.category === selectedCategory);
            }

            filteredParts.sort((a, b) => a.name.localeCompare(b.name));

            const categories = [...new Set(techniqueParts.map(part => part.category))].sort();
            const categoryOptions = categories.map(category => `<option value="${category}" ${selectedCategory === category ? 'selected' : ''}>${category}</option>`).join('');

            techniquePartSection.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <select onchange="updateSelectedPart(${partIndex}, this.value)">
                        ${filteredParts.map((part, index) => `<option value="${techniqueParts.indexOf(part)}" ${partData.part === part ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
                    <select id="categorySelect-${partIndex}" onchange="filterPartsByCategory(${partIndex}, this.value)">
                        <option value="any" ${selectedCategory === 'any' ? 'selected' : ''}>Any</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div id="partContent-${partIndex}">
                    ${generatePartContent(partIndex, partData.part)}
                </div>
                <button class="delete-button" onclick="removeTechniquePart(${partIndex})">Delete</button>
            `;
            techniquePartsContainer.appendChild(techniquePartSection);
        });
    }

    function removeTechniquePart(index) {
        selectedTechniqueParts.splice(index, 1);
        renderTechniqueParts();
        updateTotalCosts();
    }

    // --- MISSING FUNCTION: filterPartsByCategory ---
    function filterPartsByCategory(partIndex, category) {
        selectedTechniqueParts[partIndex].category = category;

        let filteredParts = [];
        const partType = selectedTechniqueParts[partIndex].part.type;

        if (partType === 'base') {
            filteredParts = techniqueParts.filter(part => part.type === 'base');
        } else if (partType === 'increase') {
            filteredParts = techniqueParts.filter(part => part.type === 'increase');
        } else if (partType === 'decrease') {
            filteredParts = techniqueParts.filter(part => part.type === 'decrease');
        }

        if (category !== 'any') {
            filteredParts = filteredParts.filter(part => part.category === category);
        }

        filteredParts.sort((a, b) => a.name.localeCompare(b.name));

        const selectElement = document.querySelector(`#techniquePart-${partIndex} select`);
        selectElement.innerHTML = filteredParts.map((part, index) => `<option value="${techniqueParts.indexOf(part)}" ${selectedTechniqueParts[partIndex].part === part ? 'selected' : ''}>${part.name}</option>`).join('');
    }

    // --- MISSING FUNCTION: updateWeaponBoxUI ---
    function updateWeaponBoxUI() {
        const infoDiv = document.getElementById('selectedWeaponInfo');
        if (!infoDiv) return;
        if (selectedWeapon && selectedWeapon.name !== "Unarmed Prowess") {
            infoDiv.innerHTML = `<b>${selectedWeapon.name}</b> (BP: ${selectedWeapon.bp})`;
        } else {
            infoDiv.innerHTML = `Unarmed Prowess (no additional cost)`;
        }
    }

    // --- MISSING FUNCTION: loadWeaponLibrary ---
    async function loadWeaponLibrary() {
        if (!firebaseAuth || !firebaseDb) return;
        const user = firebaseAuth.currentUser;
        if (!user) return;
        try {
            const snapshot = await getDocs(collection(firebaseDb, 'users', user.uid, 'itemLibrary'));
            weaponLibrary = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if (data && (data.itemParts?.some(p => p.type === "Weapon") || data.totalBP)) {
                    weaponLibrary.push({
                        id: docSnap.id,
                        name: data.name,
                        totalBP: data.totalBP || 0
                    });
                }
            });
            await populateWeaponSelect();
        } catch (e) {
            console.error('Error loading weapon library:', e);
            alert('Error loading weapon library');
        }
    }

    // --- MISSING FUNCTION: populateWeaponSelect ---
    async function populateWeaponSelect() {
        const select = document.getElementById('techniqueWeaponSelect');
        if (!select) return;
        while (select.options.length > 1) select.remove(1);
        weaponLibrary.forEach(weapon => {
            const opt = document.createElement('option');
            opt.value = weapon.id;
            opt.textContent = weapon.name;
            select.appendChild(opt);
        });
    }

    // --- MISSING FUNCTION: openWeaponLibraryModal ---
    function openWeaponLibraryModal() {
        const modal = document.getElementById('weaponLibraryModal');
        if (modal) {
            modal.style.display = 'block';
            renderWeaponLibraryList();
        }
    }

    // --- MISSING FUNCTION: closeWeaponLibraryModal ---
    function closeWeaponLibraryModal() {
        const modal = document.getElementById('weaponLibraryModal');
        if (modal) modal.style.display = 'none';
    }

    // --- MISSING FUNCTION: renderWeaponLibraryList ---
    function renderWeaponLibraryList() {
        const list = document.getElementById('weaponLibraryList');
        if (!list) return;
        list.innerHTML = '';
        weaponLibrary.forEach(weapon => {
            const li = document.createElement('li');
            li.innerHTML = `<b>${weapon.name}</b> (BP: ${weapon.totalBP}) <button onclick="selectWeaponFromLibrary('${weapon.id}')">Select</button>`;
            list.appendChild(li);
        });
    }

    // --- MISSING FUNCTION: onTechniqueWeaponChange ---
    function onTechniqueWeaponChange() {
        const select = document.getElementById('techniqueWeaponSelect');
        const value = select.value;
        if (value === "unarmed") {
            selectedWeapon = { name: "Unarmed Prowess", bp: 0, id: null };
        } else {
            const weapon = weaponLibrary.find(w => w.id === value);
            if (weapon) {
                selectedWeapon = { name: weapon.name, bp: Number(weapon.totalBP) || 0, id: weapon.id };
            }
        }
        updateWeaponBoxUI();
        updateTotalCosts();
    }

    // --- Update saveTechniqueToLibrary to use direct Firestore write ---
    async function saveTechniqueToLibrary(functions, userId) {
        const techniqueName = document.getElementById('techniqueName').value?.trim();
        if (!techniqueName) {
            alert('Please enter a technique name');
            return;
        }
        const techniqueDescription = document.getElementById('techniqueDescription').value || '';
        const totalEnergy = document.getElementById('totalEnergy').textContent || '0';
        const totalBP = document.getElementById('totalBP').textContent || '0';
        if (!totalEnergy || !totalBP) {
            alert('Energy and BP values are required');
            return;
        }
        const actionType = document.getElementById('actionType').value || 'basic';
        const reactionChecked = document.getElementById('reactionCheckbox').checked || false;
        const damage = [
            { amount: document.getElementById('dieAmount1').value || '0', size: document.getElementById('dieSize1').value || '0', type: 'none' },
            { amount: document.getElementById('dieAmount2')?.value || '0', size: document.getElementById('dieSize2')?.value || '0', type: 'none' }
        ];
        const techniqueParts = selectedTechniqueParts.map(partData => ({
            part: partData.part.name,
            opt1Level: partData.opt1Level,
            opt2Level: partData.opt2Level,
            opt3Level: partData.opt3Level,
            useAltCost: partData.useAltCost
        }));
        const weaponToSave = selectedWeapon && selectedWeapon.name
            ? { name: selectedWeapon.name, bp: selectedWeapon.bp, id: selectedWeapon.id }
            : { name: "Unarmed Prowess", bp: 0, id: null };

        try {
            if (!firebaseAuth.currentUser) {
                alert('Please login to save techniques');
                return;
            }
            await firebaseAuth.currentUser.getIdToken(true); // Refresh token
            const db = firebaseDb;
            const techniquesRef = collection(db, 'users', userId, 'techniqueLibrary');
            const q = query(techniquesRef, where('name', '==', techniqueName));
            const querySnapshot = await getDocs(q);

            let docRef;
            if (!querySnapshot.empty) {
                docRef = doc(db, 'users', userId, 'techniqueLibrary', querySnapshot.docs[0].id);
            } else {
                docRef = doc(techniquesRef);
            }

            await setDoc(docRef, {
                name: techniqueName,
                description: techniqueDescription,
                totalEnergy: Number(totalEnergy),
                totalBP: Number(totalBP),
                actionType,
                reactionChecked,
                damage,
                techniqueParts,
                weapon: weaponToSave,
                timestamp: new Date()
            });

            alert('Technique saved to library');
        } catch (e) {
            console.error('Error saving technique:', {
                code: e.code,
                message: e.message,
                details: e.details
            });
            let errorMessage = 'Error saving technique to library';
            if (e.code === 'unauthenticated') {
                errorMessage = 'Please login to save techniques';
            } else if (e.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check your authentication status.';
            }
            alert(errorMessage);
        }
    }

    async function loadSavedTechniques(db, userId) {
        const savedTechniquesList = document.getElementById('savedTechniquesList');
        savedTechniquesList.innerHTML = '';

        try {
            const querySnapshot = await getDocs(collection(db, 'users', userId, 'techniqueLibrary'));
            querySnapshot.forEach((docSnapshot) => {
                const technique = docSnapshot.data();
                const listItem = document.createElement('li');
                listItem.textContent = technique.name;

                const loadButton = document.createElement('button');
                loadButton.textContent = 'Load';
                loadButton.addEventListener('click', () => {
                    loadTechnique(technique);
                    closeModal();
                });

                listItem.appendChild(loadButton);
                savedTechniquesList.appendChild(listItem);
            });
        } catch (e) {
            console.error('Error fetching saved techniques: ', e);
            alert('Error fetching saved techniques');
        }
    }

    function loadTechnique(technique) {
        document.getElementById('techniqueName').value = technique.name;
        document.getElementById('techniqueDescription').value = technique.description;
        document.getElementById('totalEnergy').textContent = technique.totalEnergy;
        document.getElementById('totalBP').textContent = technique.totalBP;
        document.getElementById('actionType').value = technique.actionType;
        document.getElementById('reactionCheckbox').checked = technique.reactionChecked;

        // Load damage values
        document.getElementById('dieAmount1').value = technique.damage?.[0]?.amount || '';
        document.getElementById('dieSize1').value = technique.damage?.[0]?.size || '';
        if (technique.damage?.[1] && (technique.damage[1].amount || technique.damage[1].size)) {
            addDamageRow();
            document.getElementById('dieAmount2').value = technique.damage[1].amount;
            document.getElementById('dieSize2').value = technique.damage[1].size;
        } else {
            removeDamageRow();
        }

        // Load technique parts
        selectedTechniqueParts.length = 0;
        (technique.techniqueParts || []).forEach(partData => {
            const part = techniqueParts.find(p => p.name === partData.part);
            if (part) {
                selectedTechniqueParts.push({
                    part,
                    opt1Level: partData.opt1Level,
                    opt2Level: partData.opt2Level,
                    opt3Level: partData.opt3Level,
                    useAltCost: partData.useAltCost
                });
            }
        });

        // Load weapon
        if (technique.weapon && technique.weapon.name) {
            selectedWeapon = {
                name: technique.weapon.name,
                bp: Number(technique.weapon.bp) || 0,
                id: technique.weapon.id || null
            };
            const select = document.getElementById('techniqueWeaponSelect');
            if (select) select.value = technique.weapon.id || "unarmed";
        } else {
            selectedWeapon = { name: "Unarmed Prowess", bp: 0, id: null };
            const select = document.getElementById('techniqueWeaponSelect');
            if (select) select.value = "unarmed";
        }

        renderTechniqueParts();
        updateWeaponBoxUI();
        updateTotalCosts();
    }

    function openModal() {
        document.getElementById('loadTechniqueModal').style.display = 'block';
    }

    function closeModal() {
        document.getElementById('loadTechniqueModal').style.display = 'none';
    }

    // Expose functions to global scope for inline event handlers
    window.updateSelectedPart = updateSelectedPart;
    window.changeOptionLevel = changeOptionLevel;
    window.toggleAltEnergy = toggleAltEnergy;
    window.updateTotalCosts = updateTotalCosts;
    window.updateActionType = updateActionType;
    window.updateDamageType = updateDamageType;
    window.addDamageRow = addDamageRow;
    window.removeDamageRow = removeDamageRow;
    window.filterPartsByCategory = filterPartsByCategory;
    window.toggleTotalCosts = toggleTotalCosts;
    window.loadSavedTechniques = loadSavedTechniques;
    window.loadTechnique = loadTechnique;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.removeTechniquePart = removeTechniquePart;
    window.openWeaponLibraryModal = openWeaponLibraryModal;
    window.closeWeaponLibraryModal = closeWeaponLibraryModal;
    window.selectWeaponFromLibrary = function(id) {
        const weapon = weaponLibrary.find(w => w.id === id);
        if (weapon) {
            selectedWeapon = { name: weapon.name, bp: Number(weapon.totalBP) || 0, id: weapon.id };
            const select = document.getElementById('techniqueWeaponSelect');
            if (select) select.value = id;
            updateWeaponBoxUI();
            updateTotalCosts();
            closeWeaponLibraryModal();
        }
    };
    window.onTechniqueWeaponChange = onTechniqueWeaponChange;
})();
