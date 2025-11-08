import { initializeFirebase } from '/scripts/auth.js'; // Use correct path for your project
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { calculateItemCosts } from '../itemcreator/itemMechanics.js';

// Store Firebase objects after initialization
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseFunctions = null;
let selectedWeapon = { name: "Unarmed Prowess", tp: 0, id: null };
let weaponLibrary = [];
let techniqueParts = []; // Initialize as empty array - will be populated from database

(() => {
    const selectedTechniqueParts = [];
    let tpSources = []; // New global array to track TP sources

    function addTechniquePart() {
        // Add the first available part of any type (base, increase, decrease), excluding mechanic parts
        const allParts = techniqueParts.filter(p => !p.mechanic);
        if (allParts.length === 0) return;
        selectedTechniqueParts.push({ part: allParts[0], opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });

        renderTechniqueParts();
        updateTotalCosts();
    }

    // Sanitize property name to ID (matches your script)
    function sanitizeId(name) {
        if (!name) return '';
        return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

    // Fetch technique parts from Realtime Database
    async function fetchTechniqueParts(database) {
        // Retry wrapper for transient offline/network hiccups (borrowed from codex.js)
        async function getWithRetry(path, attempts = 3) {
            const r = ref(database, path);
            let lastErr;
            for (let i = 0; i < attempts; i++) {
                try {
                    return await get(r);
                } catch (err) {
                    lastErr = err;
                    const msg = (err && err.message) || '';
                    const isOffline = msg.includes('Client is offline') || msg.toLowerCase().includes('network');
                    if (!isOffline || i === attempts - 1) throw err;
                    await new Promise(res => setTimeout(res, 500 * (i + 1))); // simple backoff
                }
            }
            throw lastErr;
        }

        try {
            // Use 'parts' to match the database path
            const partsRef = ref(database, 'parts');
            console.log('Fetching from path: parts');
            const snapshot = await getWithRetry('parts');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('Raw parts data:', data);
                
                // Log all unique types present in the data for debugging
                const allTypes = Object.values(data).map(part => part.type).filter(Boolean);
                const uniqueTypes = [...new Set(allTypes)];
                console.log('Unique part types in database:', uniqueTypes);
                
                techniqueParts = Object.entries(data)
                    .filter(([id, part]) => part.type && part.type.toLowerCase() === 'technique') // Case-insensitive filter
                    .map(([id, part]) => ({
                        id: id,
                        name: part.name || '',
                        description: part.description || '',
                        category: part.category || '',
                        // Coerce to numbers
                        base_en: parseFloat(part.base_en) || 0,
                        base_tp: parseFloat(part.base_tp) || 0,
                        op_1_desc: part.op_1_desc || '',
                        op_1_en: parseFloat(part.op_1_en) || 0,
                        op_1_tp: parseFloat(part.op_1_tp) || 0,
                        op_2_desc: part.op_2_desc || '',
                        op_2_en: parseFloat(part.op_2_en) || 0,
                        op_2_tp: parseFloat(part.op_2_tp) || 0,
                        op_3_desc: part.op_3_desc || '',
                        op_3_en: parseFloat(part.op_3_en) || 0,
                        op_3_tp: parseFloat(part.op_3_tp) || 0,
                        type: part.type || 'technique',
                        mechanic: part.mechanic === 'true' || part.mechanic === true,
                        percentage: part.percentage === 'true' || part.percentage === true,
                        // Add alt fields if present (assuming similar structure)
                        alt_base_en: parseFloat(part.alt_base_en) || 0,
                        alt_tp: parseFloat(part.alt_tp) || 0,
                        alt_desc: part.alt_desc || ''
                    }));
                
                console.log('Loaded', techniqueParts.length, 'technique parts from database');
                return true;
            } else {
                console.error('No parts found in database at path: parts');
                return false;
            }
        } catch (error) {
            console.error('Error fetching parts:', error);
            if (error.code === 'PERMISSION_DENIED') {
                console.error('Permission denied for /parts - check Firebase Realtime Database Rules');
            }
            return false;
        }
    }

    function generatePartContent(partIndex, part) {
        const hasOption1 =
            (part.op_1_desc && part.op_1_desc.trim() !== '') ||
            (part.op_1_en && part.op_1_en !== 0) ||
            (part.op_1_tp && part.op_1_tp !== 0);

        return `
            <h3>${part.name} <span class="small-text">Energy: <span id="baseEnergy-${partIndex}">${part.base_en}</span></span> <span class="small-text">Training Points: <span id="baseTP-${partIndex}">${part.base_tp}</span></span></h3>
            <p>Part EN: <span id="totalEnergy-${partIndex}">${part.base_en}</span> Part TP: <span id="totalTP-${partIndex}">${part.base_tp}</span></p>
            <p>${part.description}</p>
            
            ${hasOption1 ? `
            <div class="option-container">
                ${hasOption1 ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_1_en >= 0 ? '+' : ''}${part.op_1_en}     Training Points: ${part.op_1_tp >= 0 ? '+' : ''}${part.op_1_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="opt1Level-${partIndex}">${selectedTechniqueParts[partIndex].opt1Level}</span></span>
                    <p>${part.op_1_desc}</p>
                </div>` : ''}
                
                ${part.op_2_desc ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_2_en >= 0 ? '+' : ''}${part.op_2_en}     Training Points: ${part.op_2_tp >= 0 ? '+' : ''}${part.op_2_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="opt2Level-${partIndex}">${selectedTechniqueParts[partIndex].opt2Level}</span></span>
                    <p>${part.op_2_desc}</p>
                </div>` : ''}

                ${part.op_3_desc ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_3_en >= 0 ? '+' : ''}${part.op_3_en}     Training Points: ${part.op_3_tp >= 0 ? '+' : ''}${part.op_3_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', -1)">-</button>
                    <span>Level: <span id="opt3Level-${partIndex}">${selectedTechniqueParts[partIndex].opt3Level}</span></span>
                    <p>${part.op_3_desc}</p>
                </div>` : ''}
            </div>` : ''}

            ${part.alt_base_en ? `
            <div class="option-box">
                <h4>Alternate Base Energy: ${part.alt_base_en}</h4>
                <button id="altEnergyButton-${partIndex}" class="alt-energy-button" onclick="toggleAltEnergy(${partIndex})">Toggle</button>
                <p>${part.alt_desc}</p>
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
        // Remove description setting here
        updateTotalCosts();
    }

    function updateDamageType() {
        updateTotalCosts();
    }

    function updateTotalCosts() {
        // Build mechanic parts based on current selections
        let mechanicParts = [];
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;

        // Reaction
        if (reactionChecked) {
            const reactionPart = techniqueParts.find(p => p.name === 'Reaction' && p.mechanic);
            if (reactionPart) {
                mechanicParts.push({ part: reactionPart, opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });
            }
        }

        // Long Action
        if (actionType === 'long3') {
            const longPart = techniqueParts.find(p => p.name === 'Long Action' && p.mechanic);
            if (longPart) {
                mechanicParts.push({ part: longPart, opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });
            }
        } else if (actionType === 'long4') {
            const longPart = techniqueParts.find(p => p.name === 'Long Action' && p.mechanic);
            if (longPart) {
                mechanicParts.push({ part: longPart, opt1Level: 1, opt2Level: 0, opt3Level: 0, useAltCost: false });
            }
        }

        // Quick or Free Action
        if (actionType === 'quick') {
            const quickFreePart = techniqueParts.find(p => p.name === 'Quick or Free Action' && p.mechanic);
            if (quickFreePart) {
                mechanicParts.push({ part: quickFreePart, opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });
                // Use part description for action type description
                document.getElementById('actionTypeDescription').textContent = quickFreePart.description;
            }
        } else if (actionType === 'free') {
            const quickFreePart = techniqueParts.find(p => p.name === 'Quick or Free Action' && p.mechanic);
            if (quickFreePart) {
                mechanicParts.push({ part: quickFreePart, opt1Level: 1, opt2Level: 0, opt3Level: 0, useAltCost: false });
                // Use part description for action type description
                document.getElementById('actionTypeDescription').textContent = quickFreePart.description;
            }
        }

        // Additional Damage
        let totalDamage = 0;
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && dieSize1 >= 4) {
            totalDamage += dieAmount1 * dieSize1;
        }
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && dieSize2 >= 4) {
            totalDamage += dieAmount2 * dieSize2;
        }
        let damageLevel = 0;
        if (totalDamage > 0) {
            damageLevel = Math.max(0, Math.floor((totalDamage - 4) / 2));
            const damagePart = techniqueParts.find(p => p.name === 'Additional Damage' && p.mechanic);
            if (damagePart) {
                mechanicParts.push({ part: damagePart, opt1Level: damageLevel, opt2Level: 0, opt3Level: 0, useAltCost: false });
            }
        }

        // Add Weapon Attack
        if (selectedWeapon && selectedWeapon.tp >= 1) {
            const weaponPart = techniqueParts.find(p => p.name === 'Add Weapon Attack' && p.mechanic);
            if (weaponPart) {
                mechanicParts.push({ part: weaponPart, opt1Level: selectedWeapon.tp - 1, opt2Level: 0, opt3Level: 0, useAltCost: false });
            }
        }

        // Combine user and mechanic parts
        const allParts = [...selectedTechniqueParts, ...mechanicParts];

        let sumNonPercentage = 0;
        let productPercentage = 1;
        let totalTP = 0;
        tpSources = []; // Reset

        allParts.forEach((partData) => {
            const part = partData.part;
            // Calculate contribution for each part
            let partContribution = part.base_en + (part.op_1_en || 0) * partData.opt1Level + (part.op_2_en || 0) * partData.opt2Level + (part.op_3_en || 0) * partData.opt3Level;
            if (part.percentage) {
                productPercentage *= partContribution;
            } else {
                sumNonPercentage += partContribution;
            }
            // TP calculation remains the same
            let partTP = part.base_tp;
            totalTP += partTP;
            const opt1TP = (part.op_1_tp || 0) * partData.opt1Level;
            const opt2TP = (part.op_2_tp || 0) * partData.opt2Level;
            const opt3TP = (part.op_3_tp || 0) * partData.opt3Level;
            let adjustedOpt1TP = opt1TP;
            if (part.name === 'Additional Damage') {
                adjustedOpt1TP = Math.floor(opt1TP);
            }
            totalTP += adjustedOpt1TP + opt2TP + opt3TP;
            if (partTP > 0 || adjustedOpt1TP > 0 || opt2TP > 0 || opt3TP > 0) {
                let partSource = `${partTP} TP: ${part.name}`;
                if (adjustedOpt1TP > 0) partSource += ` (Option 1 Level ${partData.opt1Level}: ${adjustedOpt1TP} TP)`;
                if (opt2TP > 0) partSource += ` (Option 2 Level ${partData.opt2Level}: ${opt2TP} TP)`;
                if (opt3TP > 0) partSource += ` (Option 3 Level ${partData.opt3Level}: ${opt3TP} TP)`;
                tpSources.push(partSource);
            }
        });

        // Removed: extra manual weapon energy add to avoid double-counting
        // if (selectedWeapon && selectedWeapon.name !== "Unarmed Prowess" && selectedWeapon.tp > 0) {
        //     sumNonPercentage += 0.25 * selectedWeapon.tp;
        // }

        // Final energy calculation
        const finalEnergy = sumNonPercentage * productPercentage;

        document.getElementById("totalEnergy").textContent = finalEnergy.toFixed(2);
        document.getElementById("totalTP").textContent = totalTP;

        updateTechniqueSummary();
    }

    function updateTechniqueSummary() {
        const techniqueName = document.getElementById('techniqueName').value;
        const summaryEnergy = document.getElementById('totalEnergy').textContent;
        const summaryTP = document.getElementById('totalTP').textContent;
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const actionTypeText = reactionChecked ? `${capitalize(actionType)} Reaction` : `${capitalize(actionType)} Action`;

        document.getElementById('summaryEnergy').textContent = summaryEnergy;
        document.getElementById('summaryTP').textContent = summaryTP;
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
                <p>Energy: ${part.base_en}</p>
                <p>Training Points: ${part.base_tp}</p>
                <p>${part.description}</p>
                ${part.op_1_desc ? `<p>Option 1: ${part.op_1_desc} (Level: ${partData.opt1Level})</p>` : ''}
                ${part.op_2_desc ? `<p>Option 2: ${part.op_2_desc} (Level: ${partData.opt2Level})</p>` : ''}
                ${part.op_3_desc ? `<p>Option 3: ${part.op_3_desc} (Level: ${partData.opt3Level})</p>` : ''}
                ${part.alt_desc ? `<p>Alternate Energy: ${part.alt_desc}</p>` : ''}
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

        // Update the summary proficiencies
        const summaryProficiencies = document.getElementById('summaryProficiencies');
        summaryProficiencies.innerHTML = tpSources.map(source => `<p>${source}</p>`).join('');
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

        // Fetch parts from Realtime Database
        const partsLoaded = await fetchTechniqueParts(getDatabase(app));
        
        if (!partsLoaded) {
            alert('Failed to load technique parts. Please refresh the page.');
        }

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

            let filteredParts = techniqueParts.filter(p => !p.mechanic); // Exclude mechanic parts
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

        let filteredParts = techniqueParts.slice(); // Start with all parts
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
            infoDiv.innerHTML = `<b>${selectedWeapon.name}</b> (TP: ${selectedWeapon.tp})`;
        } else {
            infoDiv.innerHTML = `Unarmed Prowess (no additional cost)`;
        }
    }

    // Load properties from Realtime Database (copied from library.js for consistency)
    let itemPropertiesCache = null;
    async function loadItemProperties(database) {
        if (itemPropertiesCache) return itemPropertiesCache;
        
        try {
            const propertiesRef = ref(database, 'properties');
            const snapshot = await get(propertiesRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                itemPropertiesCache = Object.entries(data).map(([id, prop]) => ({
                    id: id,
                    name: prop.name || '',
                    description: prop.description || '',
                    base_ip: parseFloat(prop.base_ip) || 0,
                    base_tp: parseFloat(prop.base_tp) || 0,
                    base_gp: parseFloat(prop.base_gp) || 0,
                    op_1_desc: prop.op_1_desc || '',
                    op_1_ip: parseFloat(prop.op_1_ip) || 0,
                    op_1_tp: parseFloat(prop.op_1_tp) || 0,
                    op_1_gp: parseFloat(prop.op_1_gp) || 0,
                    type: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Weapon'
                }));
                console.log(`Loaded ${itemPropertiesCache.length} properties from database`);
                return itemPropertiesCache;
            }
        } catch (error) {
            console.error('Error loading properties:', error);
        }
        return [];
    }

    // --- MISSING FUNCTION: loadWeaponLibrary ---
    async function loadWeaponLibrary() {
        if (!firebaseAuth || !firebaseDb) return;
        const user = firebaseAuth.currentUser;
        if (!user) return;
        try {
            // Fetch properties data first
            const database = getDatabase(firebaseApp);
            const propertiesData = await loadItemProperties(database);
            if (!propertiesData || propertiesData.length === 0) {
                console.error('Failed to load properties for weapon library');
                return;
            }

            const snapshot = await getDocs(collection(firebaseDb, 'users', user.uid, 'itemLibrary'));
            weaponLibrary = [];
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                // Filter for weapons by armamentType
                if (data.armamentType === 'Weapon') {
                    // Calculate total TP from properties
                    const costs = calculateItemCosts(data.properties || [], propertiesData);
                    weaponLibrary.push({
                        id: docSnap.id,
                        name: data.name,
                        totalTP: costs.totalTP || 0
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
            li.innerHTML = `<b>${weapon.name}</b> (TP: ${weapon.totalTP}) <button onclick="selectWeaponFromLibrary('${weapon.id}')">Select</button>`;
            list.appendChild(li);
        });
    }

    // --- MISSING FUNCTION: onTechniqueWeaponChange ---
    function onTechniqueWeaponChange() {
        const select = document.getElementById('techniqueWeaponSelect');
        const value = select.value;
        if (value === "unarmed") {
            selectedWeapon = { name: "Unarmed Prowess", tp: 0, id: null };
        } else {
            const weapon = weaponLibrary.find(w => w.id === value);
            if (weapon) {
                selectedWeapon = { name: weapon.name, tp: Number(weapon.totalTP) || 0, id: weapon.id };
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
        const totalTP = document.getElementById('totalTP').textContent || '0';
        if (!totalEnergy || !totalTP) {
            alert('Energy and TP values are required');
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
            ? { name: selectedWeapon.name, tp: selectedWeapon.tp, id: selectedWeapon.id }
            : { name: "Unarmed Prowess", tp: 0, id: null };

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
                totalTP: Number(totalTP),
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
        document.getElementById('totalTP').textContent = technique.totalTP;
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
                tp: Number(technique.weapon.tp) || 0,
                id: technique.weapon.id || null
            };
            const select = document.getElementById('techniqueWeaponSelect');
            if (select) select.value = technique.weapon.id || "unarmed";
        } else {
            selectedWeapon = { name: "Unarmed Prowess", tp: 0, id: null };
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
            selectedWeapon = { name: weapon.name, tp: Number(weapon.totalTP) || 0, id: weapon.id };
            const select = document.getElementById('techniqueWeaponSelect');
            if (select) select.value = id;
            updateWeaponBoxUI();
            updateTotalCosts();
            closeWeaponLibraryModal();
        }
    };
    window.onTechniqueWeaponChange = onTechniqueWeaponChange;
})();
