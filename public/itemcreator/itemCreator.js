import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { 
  calculateItemCosts,
  calculateCurrencyCostAndRarity,
  extractProficiencies,
  formatProficiencyChip,
  computeSplits
} from '/scripts/item_calc.js';

let appCheckInitialized = false;

(() => {
    let itemProperties = [];

    // Sanitize property name to ID (matches your script)
    function sanitizeId(name) {
        if (!name) return '';
        return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    }

    // Fetch item properties from Realtime Database
    async function fetchItemProperties(database) {
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
            // Use lowercase 'properties' to match the actual database path
            const propertiesRef = ref(database, 'properties');
            console.log('Fetching from path: properties');
            const snapshot = await getWithRetry('properties');
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('Raw properties data:', data);
                itemProperties = Object.entries(data).map(([id, prop]) => ({
                    id: id,
                    name: prop.name || '',
                    description: prop.description || '',
                    base_ip: parseFloat(prop.base_ip) || 0,
                    base_tp: parseFloat(prop.base_tp) || 0,
                    base_c: parseFloat(prop.base_c) || 0,
                    op_1_desc: prop.op_1_desc || '',
                    op_1_ip: parseFloat(prop.op_1_ip) || 0,
                    op_1_tp: parseFloat(prop.op_1_tp) || 0,
                    op_1_c: parseFloat(prop.op_1_c) || 0,
                    type: prop.type ? prop.type.charAt(0).toUpperCase() + prop.type.slice(1) : 'Weapon'
                }));
                
                console.log('Loaded', itemProperties.length, 'properties from database');
                return true;
            } else {
                console.error('No properties found in database at path: properties');
                return false;
            }
        } catch (error) {
            console.error('Error fetching properties:', error);
            if (error.code === 'PERMISSION_DENIED') {
                console.error('Permission denied for /properties - check Firebase Realtime Database Rules');
            }
            return false;
        }
    }

    const selectedItemProperties = [];
    window.selectedItemProperties = selectedItemProperties; // Expose for HTML logic
    let tpSources = []; // Array to track TP sources
    let range = 0; // Internal default value
    let handedness = "One-Handed"; // Default handedness

    // --- Damage Reduction State ---
    let damageReduction = 0;
    window.getDamageReduction = () => damageReduction;

    // Find Damage Reduction property from itemPropertiesData
    const damageReductionProperty = itemProperties.find(
        p => p.type === "Armor" && p.name === "Damage Reduction"
    );

    function addWeaponProperty() {
        // Only allow if armament type is Weapon
        if (window.selectedArmamentType && window.selectedArmamentType() !== 'Weapon') return;
        const property = itemProperties.find(p => p.type === 'Weapon' && !generalPropertyNames.has(p.name));
        if (property) {
            selectedItemProperties.push({ property, op_1_lvl: 0, opt2Level: 0 });
            renderItemProperties();
            updateTotalCosts();
        }
    }

    function addShieldProperty() {
        if (window.selectedArmamentType && window.selectedArmamentType() !== 'Shield') return;
        const property = itemProperties.find(p => p.type === 'Shield' && !generalPropertyNames.has(p.name));
        if (property) {
            selectedItemProperties.push({ property, op_1_lvl: 0, opt2Level: 0 });
            renderItemProperties();
            updateTotalCosts();
        }
    }

    function addArmorProperty() {
        if (window.selectedArmamentType && window.selectedArmamentType() !== 'Armor') return;
        const property = itemProperties.find(p => p.type === 'Armor' && !generalPropertyNames.has(p.name));
        if (property) {
            selectedItemProperties.push({ property, op_1_lvl: 0, opt2Level: 0 });
            renderItemProperties();
            updateTotalCosts();
        }
    }

    // General properties list
    const generalPropertyNames = new Set([
        "Damage Reduction",
        "Armor Strength Requirement",
        "Armor Agility Requirement",
        "Armor Vitality Requirement",
        "Agility Reduction",
        "Weapon Strength Requirement",
        "Weapon Agility Requirement",
        "Weapon Vitality Requirement",
        "Weapon Acuity Requirement",
        "Weapon Intelligence Requirement",
        "Weapon Charisma Requirement",
        "Split Damage Dice",
        "Range",
        "Two-Handed",
        "Shield Base",
        "Armor Base",
        "Weapon Damage"
    ]);
    function getPropertyByName(name) {
        // match by display name or sanitized id (e.g., 'Two-Handed' or 'two_handed')
        const target = sanitizeId(name);
        return itemProperties.find(p => p.name === name || sanitizeId(p.name) === target);
    }

    function generatePropertyContent(propertyIndex, property) {
        const hasOption1 =
            (property.op_1_desc && property.op_1_desc.trim() !== '') ||
            (property.op_1_ip && property.op_1_ip !== 0) ||
            (property.op_1_tp && property.op_1_tp !== 0) ||
            (property.op_1_c && property.op_1_c !== 0);

        return `
            <h3>${property.name} <span class="small-text">Item Points: <span id="baseIP-${propertyIndex}">${property.base_ip}</span></span> <span class="small-text">Training Points: <span id="baseTP-${propertyIndex}">${property.base_tp}</span></span> <span class="small-text">Currency Points: <span id="baseCurrency-${propertyIndex}">${property.base_c}</span></span></h3>
            <p>Property IP: <span id="totalIP-${propertyIndex}">${property.base_ip}</span> Property TP: <span id="totalTP-${propertyIndex}">${property.base_tp}</span> Property Currency: <span id="totalCurrency-${propertyIndex}">${property.base_c}</span></p>
            <p>${property.description}</p>
            ${hasOption1 ? `
            <div class="option-container">
                <div class="option-box">
                    <h4>Item Points: ${property.op_1_ip >= 0 ? '+' : ''}${property.op_1_ip}     Training Points: ${property.op_1_tp >= 0 ? '+' : ''}${property.op_1_tp}</h4>
                    <button onclick="changeOptionLevel(${propertyIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${propertyIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="op_1_lvl-${propertyIndex}">${selectedItemProperties[propertyIndex].op_1_lvl}</span></span>
                    <p>${property.op_1_desc}</p>
                </div>
            </div>` : ''}
        `;
    }

    // Helper: Names of requirement properties and agility reduction
    const requirementPropertyNames = [
        "Weapon Strength Requirement",
        "Weapon Agility Requirement",
        "Weapon Vitality Requirement",
        "Weapon Acuity Requirement",
        "Weapon Intelligence Requirement",
        "Weapon Charisma Requirement",
        "Armor Strength Requirement",
        "Armor Agility Requirement",
        "Armor Vitality Requirement"
    ];
    const agilityReductionName = "Agility Reduction";

    // Helper: Remove requirement and agility reduction properties from selectedItemProperties
    function removeRequirementAndAgilityProperties(keepAgilityReductionForArmor = false) {
        for (let i = selectedItemProperties.length - 1; i >= 0; i--) {
            const property = selectedItemProperties[i].property;
            if (
                requirementPropertyNames.includes(property.name) ||
                (!keepAgilityReductionForArmor && property.name === agilityReductionName)
            ) {
                selectedItemProperties.splice(i, 1);
            }
        }
    }

    // Helper: Remove all item properties
    function clearAllItemProperties() {
        selectedItemProperties.length = 0;
        renderItemProperties();
        updateTotalCosts();
    }

    // Helper: Remove all ability requirements (if window.setAbilityRequirements exists)
    function clearAllAbilityRequirements() {
        if (typeof window.setAbilityRequirements === "function") {
            window.setAbilityRequirements([]);
        }
    }

    // Listen for armament type changes and clear all properties/requirements
    function setupArmamentTypeWatcher() {
        let lastType = window.selectedArmamentType ? window.selectedArmamentType() : null;
        setInterval(() => {
            const currentType = window.selectedArmamentType ? window.selectedArmamentType() : null;
            if (currentType !== lastType) {
                lastType = currentType;
                clearAllItemProperties();
                clearAllAbilityRequirements();
            }
        }, 200);
    }

    function updateSelectedProperty(index, selectedValue) {
        const selectedProperty = itemProperties[selectedValue];
        selectedItemProperties[index].property = selectedProperty;
        selectedItemProperties[index].op_1_lvl = 0;
        selectedItemProperties[index].opt2Level = 0;

        // Remove requirement/agility properties if switching armament type
        if (window.selectedArmamentType) {
            const type = window.selectedArmamentType();
            if (type === "Armor") {
                removeRequirementAndAgilityProperties(true);
            } else {
                removeRequirementAndAgilityProperties(false);
            }
        }

        renderItemProperties();
        updateTotalCosts();
    }

    function changeOptionLevel(index, option, delta) {
        const propertyObj = selectedItemProperties[index];
        if (option === 'opt1') {
            propertyObj.op_1_lvl = Math.max(0, propertyObj.op_1_lvl + delta);
            const el = document.getElementById(`op_1_lvl-${index}`);
            if (el) el.textContent = propertyObj.op_1_lvl;
        } else {
            // keep existing opt2 if present
            const levelKey = 'opt2Level';
            propertyObj[levelKey] = Math.max(0, propertyObj[levelKey] + delta);
            const el2 = document.getElementById(`${levelKey}-${index}`);
            if (el2) el2.textContent = propertyObj[levelKey];
        }
        updateTotalCosts();
    }

    function changeRange(delta) {
        range = Math.max(0, range + delta);
        const displayRange = range === 0 ? 'Melee' : `${range * 8} Spaces`;
        const rangeValueElement = document.getElementById('rangeValue');
        if (rangeValueElement) {
            rangeValueElement.textContent = displayRange;
        }
        updateTotalCosts();
    }

    function changeHandedness(value) {
        handedness = value;
        updateTotalCosts();
    }

    function removeItemProperty(index) {
        selectedItemProperties.splice(index, 1);
        renderItemProperties();
        updateTotalCosts();
    }

    function updateDamageType() {
        updateTotalCosts();
    }

    // --- calculateCosts function for splitting logic ---
    function updateTotalCosts() {
        // Build a temporary properties array representing current state (used only for live cost display)
        const tempProperties = [];

        // Selected item properties
        selectedItemProperties.forEach(p => {
            if (!p.property) return;
            tempProperties.push({
                id: p.property.id || p.property.name,
                name: p.property.name,
                op_1_lvl: p.op_1_lvl || 0
            });
        });

        const armamentType = window.selectedArmamentType ? window.selectedArmamentType() : 'Weapon';

        // Two-Handed
        if (handedness === "Two-Handed") {
            const propTwoHanded = itemProperties.find(p => p.name === "Two-Handed");
            if (propTwoHanded) tempProperties.push({ id: propTwoHanded.id || propTwoHanded.name, name: propTwoHanded.name, op_1_lvl: 0 });
        }

        // Range
        if (armamentType === "Weapon" && range > 0) {
            const propRange = itemProperties.find(p => p.name === "Range");
            if (propRange) tempProperties.push({ id: propRange.id || propRange.name, name: propRange.name, op_1_lvl: range - 1 });
        }

        // Weapon Damage
        if (armamentType === "Weapon") {
            const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
            const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
            const damageType1 = document.getElementById('damageType1')?.value;
            const validSizes = [4,6,8,10,12];
            if (!isNaN(dieAmount1) && !isNaN(dieSize1) && validSizes.includes(dieSize1) && damageType1 && damageType1 !== 'none') {
                const propWeaponDamage = itemProperties.find(p => p.name === "Weapon Damage");
                if (propWeaponDamage) {
                    const weaponDamageLevel = Math.max(0, ((dieAmount1 * dieSize1) - 4) / 2);
                    tempProperties.push({ id: propWeaponDamage.id || propWeaponDamage.name, name: propWeaponDamage.name, op_1_lvl: weaponDamageLevel });
                }
                // Split Damage Dice
                const splits = computeSplits(dieAmount1, dieSize1);
                if (splits > 0) {
                    const propSplitDice = itemProperties.find(p => p.name === "Split Damage Dice");
                    if (propSplitDice) tempProperties.push({ id: propSplitDice.id || propSplitDice.name, name: propSplitDice.name, op_1_lvl: splits - 1 });
                }
            }
        }

        // Shield / Armor Base
        if (armamentType === "Shield") {
            const propShieldBase = itemProperties.find(p => p.name === "Shield Base");
            if (propShieldBase) tempProperties.push({ id: propShieldBase.id || propShieldBase.name, name: propShieldBase.name, op_1_lvl: 0 });
        }
        if (armamentType === "Armor") {
            const propArmorBase = itemProperties.find(p => p.name === "Armor Base");
            if (propArmorBase) tempProperties.push({ id: propArmorBase.id || propArmorBase.name, name: propArmorBase.name, op_1_lvl: 0 });
        }

        // Damage Reduction
        if (armamentType === "Armor" && damageReduction > 0) {
            const propDR = itemProperties.find(p => p.name === "Damage Reduction");
            if (propDR) tempProperties.push({ id: propDR.id || propDR.name, name: propDR.name, op_1_lvl: damageReduction - 1 });
        }

        // Agility Reduction
        if (armamentType === "Armor" && typeof window.agilityReduction === "number" && window.agilityReduction > 0) {
            const propAR = itemProperties.find(p => p.name === "Agility Reduction");
            if (propAR) tempProperties.push({ id: propAR.id || propAR.name, name: propAR.name, op_1_lvl: window.agilityReduction - 1 });
        }

        // Ability Requirements
        const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];
        abilityRequirements.forEach(req => {
            const value = parseInt(req.value, 10);
            if (value > 0) {
                const prefix = (armamentType === "Armor") ? "Armor" : "Weapon";
                const propertyName = `${prefix} ${req.type} Requirement`;
                const propReq = itemProperties.find(p => p.name === propertyName);
                if (propReq) {
                    tempProperties.push({
                        id: propReq.id || propReq.name,
                        name: propReq.name,
                        op_1_lvl: value - 1
                    });
                }
            }
        });

        // Centralized totals
        const { totalIP, totalTP, totalCurrency } = calculateItemCosts(tempProperties, itemProperties);
        const { currencyCost, rarity } = calculateCurrencyCostAndRarity(totalCurrency, totalIP);

        // Update numeric displays
        const totalIPElement = document.getElementById("totalIP");
        const totalTPElement = document.getElementById("totalTP");
        const totalCurrencyElement = document.getElementById("totalCurrency");
        const totalRarityElement = document.getElementById("totalRarity");
        if (totalIPElement) totalIPElement.textContent = totalIP.toFixed(2);
        if (totalTPElement) totalTPElement.textContent = totalTP.toFixed(2);
        if (totalCurrencyElement) totalCurrencyElement.textContent = currencyCost.toFixed(2);
        if (totalRarityElement) totalRarityElement.textContent = rarity;

        // Proficiency sources (TP chips)
        const profs = extractProficiencies(tempProperties, itemProperties);
        tpSources = profs.map(p => formatProficiencyChip(p));

        updateItemSummary(totalIP, rarity);
    }

    function renderItemProperties() {
        const itemPropertiesContainer = document.getElementById("itemPropertiesContainer");
        itemPropertiesContainer.innerHTML = "";

        selectedItemProperties.forEach((propertyData, propertyIndex) => {
            const itemPropertySection = document.createElement("div");
            itemPropertySection.id = `itemProperty-${propertyIndex}`;
            itemPropertySection.classList.add("item-property-section");

            // Filter out general properties and requirements from selectable list
            let filteredProperties = itemProperties.filter(property => {
                if (generalPropertyNames.has(property.name)) return false; // exclude general properties
                if (requirementPropertyNames.includes(property.name)) return false;
                if (propertyData.property.type === "Armor" && (property.name === agilityReductionName || property.name === "Damage Reduction")) return false;
                if (propertyData.property.type === "Weapon" && property.name === "Split Damage Dice") return false; // was "Sure Hit"
                if (propertyData.property.type === "Shield" && property.name === "Shield") return false;
                return property.type === propertyData.property.type;
            });

            filteredProperties.sort((a, b) => a.name.localeCompare(b.name));

            itemPropertySection.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <select onchange="updateSelectedProperty(${propertyIndex}, this.value)">
                        ${filteredProperties.map((property, index) => `<option value="${itemProperties.indexOf(property)}" ${propertyData.property === property ? 'selected' : ''}>${property.name}</option>`).join('')}
                    </select>
                </div>
                <div id="propertyContent-${propertyIndex}">
                    ${generatePropertyContent(propertyIndex, propertyData.property)}
                </div>
                <button class="delete-button" onclick="removeItemProperty(${propertyIndex})">Delete</button>
            `;
            itemPropertiesContainer.appendChild(itemPropertySection);
        });
    }

    function updateItemSummary(totalIP, rarity) {
        const itemName = document.getElementById('itemName').value;
        const summaryIP = document.getElementById('totalIP')?.textContent;
        let summaryTP = document.getElementById('totalTP')?.textContent;
        const summaryCurrency = document.getElementById('totalCurrency')?.textContent;
        const summaryRange = range === 0 ? 'Melee' : `${range * 8} Spaces`;

        // Clamp TP to 0 for weapons
        if (window.selectedArmamentType && window.selectedArmamentType() === "Weapon") {
            summaryTP = Math.max(0, parseFloat(summaryTP || "0")).toFixed(2);
        }

        if (document.getElementById('summaryIP')) document.getElementById('summaryIP').textContent = summaryIP;
        if (document.getElementById('summaryTP')) document.getElementById('summaryTP').textContent = summaryTP;
        if (document.getElementById('summaryCurrency')) document.getElementById('summaryCurrency').textContent = summaryCurrency;
        if (document.getElementById('summaryRange')) document.getElementById('summaryRange').textContent = summaryRange;

        // Build damage summary without calculateCosts; use computeSplits for display
        const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
        const damageType1 = document.getElementById('damageType1')?.value;
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        let damageText = '';
        const validSizes = ["4","6","8","10","12"];

        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && validSizes.includes(String(dieSize1)) && damageType1 && damageType1 !== 'none') {
            const splits1 = computeSplits(dieAmount1, dieSize1);
            damageText += `${dieAmount1}d${dieSize1} ${damageType1}${splits1 > 0 ? ` (${splits1} split${splits1 > 1 ? 's' : ''})` : ''}`;
        }

        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && validSizes.includes(String(dieSize2)) && damageType2 && damageType2 !== 'none') {
            const splits2 = computeSplits(dieAmount2, dieSize2);
            damageText += damageText ? ', ' : '';
            damageText += `${dieAmount2}d${dieSize2} ${damageType2}${splits2 > 0 ? ` (${splits2} split${splits2 > 1 ? 's' : ''})` : ''}`;
        }

        if (document.getElementById('summaryDamage')) {
            document.getElementById('summaryDamage').textContent = damageText;
            document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';
        }

        // Update the summary properties
        const summaryPropertiesContainer = document.getElementById('summaryProperties');
        if (summaryPropertiesContainer) {
            summaryPropertiesContainer.innerHTML = '';
            // Show Damage Reduction if > 0
            if (window.selectedArmamentType && window.selectedArmamentType() === "Armor" && typeof damageReduction === "number" && damageReduction > 0) {
                const drDiv = document.createElement('div');
                drDiv.innerHTML = `<h4>${damageReduction} Damage Reduction</h4>`;
                summaryPropertiesContainer.appendChild(drDiv);
            }
            selectedItemProperties.forEach((propertyData, propertyIndex) => {
                const property = propertyData.property;
                const propertyElement = document.createElement('div');
                propertyElement.innerHTML = `
                    <h4>${property.name}</h4>
                    <p>Item Points: ${property.base_ip}</p>
                    <p>Training Points: ${property.base_tp}</p>
                    <p>Currency Points: ${property.base_c}</p>
                    <p>${property.description}</p>
                    ${property.op_1_desc ? `<p>Option 1: ${property.op_1_desc} (Level: ${propertyData.op_1_lvl})</p>` : ''}
                `;
                summaryPropertiesContainer.appendChild(propertyElement);
            });

            // Add ability requirements to summary
            const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];
            if (abilityRequirements.length > 0) {
                const reqDiv = document.createElement('div');
                reqDiv.innerHTML = `<h4>Ability Requirements</h4>` +
                    abilityRequirements.map(r => `<p>${r.type}: ${r.value}</p>`).join('');
                summaryPropertiesContainer.appendChild(reqDiv);
            }
        }

        // Update the summary proficiencies
        const summaryProficiencies = document.getElementById('summaryProficiencies');
        if (summaryProficiencies) {
            const displaySources = tpSources.filter(src => {
                const m = src.match(/^(-?\d+(?:\.\d+)?) TP:/);
                return !m || parseFloat(m[1]) > 0;
            });
            summaryProficiencies.innerHTML = displaySources.map(source => `<p>${source}</p>`).join('');
        }

        if (document.getElementById('summaryRarity')) document.getElementById('summaryRarity').textContent = rarity;

        const summaryType = document.getElementById('summaryType');
        if (summaryType && window.selectedArmamentType) {
            summaryType.textContent = window.selectedArmamentType();
        }
    }

    function toggleTotalCosts() {
        const totalCosts = document.getElementById('totalCosts');
        totalCosts.classList.toggle('collapsed');
        const arrow = document.querySelector('#totalCosts .toggle-arrow');
        arrow.textContent = totalCosts.classList.contains('collapsed') ? '>' : '<';
    }

    async function saveItemToLibrary(functions, userId) {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.warn('No authenticated user found');
            alert('You must be logged in to save items.');
            window.location.href = '/login.html';
            return;
        }

        // Collect item data
        const itemName = document.getElementById('itemName').value || '';
        const itemDescription = document.getElementById('itemDescription').value || '';
        const armamentType = window.selectedArmamentType ? window.selectedArmamentType() : 'Weapon';

        // Build properties array (including general properties if selected)
        let properties = [];

        // Add selected item properties
        selectedItemProperties.forEach(propertyData => {
            if (!propertyData.property) return;
            properties.push({
                id: propertyData.property.id || propertyData.property.name,
                name: propertyData.property.name,
                op_1_lvl: propertyData.op_1_lvl || 0
            });
        });

        // Add general properties if selected
        // Two-Handed
        const handedness = document.getElementById('handedness')?.value || 'One-Handed';
        if (handedness === "Two-Handed") {
            const propTwoHanded = itemProperties.find(p => p.name === "Two-Handed");
            if (propTwoHanded) {
                properties.push({
                    id: propTwoHanded.id || propTwoHanded.name,
                    name: propTwoHanded.name,
                    op_1_lvl: 0
                });
            }
        }
        // Range (if > 0)
        const rangeVal = typeof range === "number" ? range : 0;
        if (armamentType === "Weapon" && rangeVal > 0) {
            const propRange = itemProperties.find(p => p.name === "Range");
            if (propRange) {
                properties.push({
                    id: propRange.id || propRange.name,
                    name: propRange.name,
                    op_1_lvl: rangeVal - 1 // Base property gives 8 spaces, so level 0 = 8 spaces, level 1 = 16 spaces
                });
            }
        }
        // Weapon Damage (if valid)
        if (armamentType === "Weapon") {
            const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
            const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
            const validSizes = [4,6,8,10,12];
            if (!isNaN(dieAmount1) && !isNaN(dieSize1) && validSizes.includes(dieSize1)) {
                const propWeaponDamage = itemProperties.find(p => p.name === "Weapon Damage");
                if (propWeaponDamage) {
                    const weaponDamageLevel = Math.max(0, ((dieAmount1 * dieSize1) - 4) / 2);
                    properties.push({
                        id: propWeaponDamage.id || propWeaponDamage.name,
                        name: propWeaponDamage.name,
                        op_1_lvl: weaponDamageLevel
                    });
                }
            }
        }
        // Split Damage Dice (if valid and splits > 0)
        if (armamentType === "Weapon") {
            const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
            const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
            const validSizes = [4,6,8,10,12];
            if (!isNaN(dieAmount1) && !isNaN(dieSize1) && validSizes.includes(dieSize1)) {
                const splits = computeSplits(dieAmount1, dieSize1);
                if (splits > 0) {
                    const propSplitDice = itemProperties.find(p => p.name === "Split Damage Dice");
                    if (propSplitDice) {
                        properties.push({
                            id: propSplitDice.id || propSplitDice.name,
                            name: propSplitDice.name,
                            op_1_lvl: splits - 1 // base covers first split
                        });
                    }
                }
            }
        }
        // Shield Base (if Shield)
        if (armamentType === "Shield") {
            const propShieldBase = itemProperties.find(p => p.name === "Shield Base");
            if (propShieldBase) {
                properties.push({
                    id: propShieldBase.id || propShieldBase.name,
                    name: propShieldBase.name,
                    op_1_lvl: 0
                });
            }
        }
        // Armor Base (if Armor)
        if (armamentType === "Armor") {
            const propArmorBase = itemProperties.find(p => p.name === "Armor Base");
            if (propArmorBase) {
                properties.push({
                    id: propArmorBase.id || propArmorBase.name,
                    name: propArmorBase.name,
                    op_1_lvl: 0
                });
            }
        }
        // Damage Reduction (if Armor and > 0)
        if (armamentType === "Armor" && typeof damageReduction === "number" && damageReduction > 0) {
            const propDamageReduction = itemProperties.find(p => p.name === "Damage Reduction");
            if (propDamageReduction) {
                properties.push({
                    id: propDamageReduction.id || propDamageReduction.name,
                    name: propDamageReduction.name,
                    op_1_lvl: damageReduction - 1 // base is 1, so option level is (damageReduction - 1)
                });
            }
        }
        // Agility Reduction (if Armor and > 0)
        if (armamentType === "Armor" && typeof window.agilityReduction === "number" && window.agilityReduction > 0) {
            const propAgilityReduction = itemProperties.find(p => p.name === "Agility Reduction");
            if (propAgilityReduction) {
                properties.push({
                    id: propAgilityReduction.id || propAgilityReduction.name,
                    name: propAgilityReduction.name,
                    op_1_lvl: window.agilityReduction - 1
                });
            }
        }

        // Add ability requirements as properties
        const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];
        abilityRequirements.forEach(req => {
            const value = parseInt(req.value, 10);
            if (value > 0) {
                let propertyName = '';
                if (armamentType === "Weapon" || armamentType === "Shield") {
                    propertyName = `Weapon ${req.type} Requirement`;
                } else if (armamentType === "Armor") {
                    propertyName = `Armor ${req.type} Requirement`;
                }
                
                const property = itemProperties.find(p => p.name === propertyName);
                if (property) {
                    properties.push({
                        id: property.id || property.name,
                        name: property.name,
                        op_1_lvl: value - 1 // base covers requirement of 1
                    });
                }
            }
        });

        // Collect damage information for display
        const damage = [];
        const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
        const damageType1 = document.getElementById('damageType1')?.value;
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 && damageType1 !== 'none') {
            damage.push({ amount: dieAmount1, size: dieSize1, type: damageType1 });
        }
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 && damageType2 !== 'none') {
            damage.push({ amount: dieAmount2, size: dieSize2, type: damageType2 });
        }

        // Save to Firestore
        try {
            const db = getFirestore();
            const itemsRef = collection(db, 'users', userId, 'itemLibrary');
            const q = query(itemsRef, where('name', '==', itemName));
            const querySnapshot = await getDocs(q);

            let docRef;
            if (!querySnapshot.empty) {
                docRef = doc(db, 'users', userId, 'itemLibrary', querySnapshot.docs[0].id);
            } else {
                docRef = doc(itemsRef);
            }

            await setDoc(docRef, {
                name: itemName,
                description: itemDescription,
                armamentType,
                properties,
                damage, // Add damage array
                timestamp: new Date()
            });

            alert('Item saved to library');
        } catch (e) {
            console.error('Error saving item:', e.message, e.stack);
            alert('Error saving item to library: ' + e.message);
        }
    }

    document.addEventListener("DOMContentLoaded", async () => {
        const addItemPropertyButton = document.getElementById("addItemPropertyButton");
        if (addItemPropertyButton) addItemPropertyButton.addEventListener("click", addWeaponProperty);
    
        const dieAmount1 = document.getElementById('dieAmount1');
        const dieSize1 = document.getElementById('dieSize1');
        const damageType1 = document.getElementById('damageType1');
        const dieAmount2 = document.getElementById('dieAmount2');
        const dieSize2 = document.getElementById('dieSize2');
        const damageType2 = document.getElementById('damageType2');
    
        if (dieAmount1) dieAmount1.addEventListener('input', updateTotalCosts);
        if (dieSize1) dieSize1.addEventListener('change', updateTotalCosts);
        if (damageType1) damageType1.addEventListener('change', updateTotalCosts);
        if (dieAmount2) dieAmount2.addEventListener('input', updateTotalCosts);
        if (dieSize2) dieSize2.addEventListener('change', updateTotalCosts);
        if (damageType2) damageType2.addEventListener('change', updateTotalCosts);
    
        const itemName = document.getElementById('itemName');
        if (itemName) itemName.addEventListener('input', updateItemSummary);

        const addShieldPropertyButton = document.getElementById("addShieldPropertyButton");
        if (addShieldPropertyButton) addShieldPropertyButton.addEventListener("click", addShieldProperty);

        const addArmorPropertyButton = document.getElementById("addArmorPropertyButton");
        if (addArmorPropertyButton) addArmorPropertyButton.addEventListener("click", addArmorProperty);

        const handednessSelect = document.getElementById("handedness");
        if (handednessSelect) handednessSelect.addEventListener("change", (event) => changeHandedness(event.target.value));

        const toggleArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (toggleArrow) toggleArrow.addEventListener('click', toggleTotalCosts);

        let firebaseConfig = null;
        try {
            const response = await fetch('/__/firebase/init.json');
            firebaseConfig = await response.json();
            console.log('Firebase Config:', firebaseConfig);
            firebaseConfig.authDomain = 'realmsroleplaygame.com';
        } catch (e) {
            console.error('Error fetching Firebase config:', e);
        }

        const addToLibraryButton = document.getElementById("add-to-library-button");
        if (addToLibraryButton) {
            addToLibraryButton.disabled = true;
            addToLibraryButton.textContent = "Loading...";
        }

        if (firebaseConfig) {
            const app = initializeApp(firebaseConfig);

            // --- App Check: Only initialize once ---
            if (!appCheckInitialized) {
                const appCheck = initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
                    isTokenAutoRefreshEnabled: true
                });
                appCheckInitialized = true;
                
                // Add a small delay to ensure AppCheck token is ready (like codex.js)
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            // ---------------------------------------

            const auth = getAuth(app);
            const functions = getFunctions(app);
            const database = getDatabase(app);

            // Fetch properties from Realtime Database
            const propertiesLoaded = await fetchItemProperties(database);
            
            if (!propertiesLoaded) {
                alert('Failed to load item properties. Please refresh the page.');
            } else {
                // Populate initial ability requirement dropdown after properties load
                updateAbilityRequirementDropdown(window.selectedArmamentType ? window.selectedArmamentType() : 'Weapon');
            }

            auth.onAuthStateChanged(user => {
                if (addToLibraryButton) {
                    setTimeout(() => {
                        if (user) {
                            addToLibraryButton.disabled = false;
                            addToLibraryButton.textContent = "Add to Library";
                            addToLibraryButton.onclick = async () => {
                                const currentUser = auth.currentUser;
                                if (!currentUser) {
                                    alert("You must be logged in to save items.");
                                    return;
                                }
                                console.log("User is signed in:", currentUser.uid);
                                await saveItemToLibrary(functions, currentUser.uid);
                            };
                        } else {
                            addToLibraryButton.disabled = false;
                            addToLibraryButton.textContent = "Login to Add";
                            addToLibraryButton.onclick = () => {
                                alert("You must be logged in to save items.");
                                window.location.href = "/login.html";
                            };
                        }
                    }, 500);
                }
            });
        }

        // --- Damage Reduction UI logic ---
        const damageReductionContainer = document.getElementById('damageReductionContainer');
        const damageReductionValue = document.getElementById('damageReductionValue');
        const damageReductionIncrease = document.getElementById('damageReductionIncrease');
        const damageReductionDecrease = document.getElementById('damageReductionDecrease');
        const damageReductionCostSummary = document.getElementById('damageReductionCostSummary');

        function updateDamageReductionDisplay() {
            const damageReductionProperty = itemProperties.find(
                p => p.type === "Armor" && p.name === "Damage Reduction"
            );
            
            if (damageReductionValue)
                damageReductionValue.textContent = damageReduction > 0 ? damageReduction : "None";
            if (damageReductionCostSummary && damageReductionProperty) {
                if (damageReduction > 0) {
                    const ip = damageReductionProperty.base_ip + (damageReduction - 1) * (damageReductionProperty.op_1_ip || 0);
                    const tp = damageReductionProperty.base_tp + (damageReduction - 1) * (damageReductionProperty.op_1_tp || 0);
                    const c = damageReductionProperty.base_c + (damageReduction - 1) * (damageReductionProperty.op_1_c || 0);
                    damageReductionCostSummary.textContent = `IP: ${ip}, TP: ${tp}, Currency: ${c}`;
                } else {
                    damageReductionCostSummary.textContent = "";
                }
            }
        }

        if (damageReductionIncrease) {
            damageReductionIncrease.addEventListener('click', () => {
                damageReduction = Math.min(20, damageReduction + 1);
                updateDamageReductionDisplay();
                updateTotalCosts();
            });
        }
        if (damageReductionDecrease) {
            damageReductionDecrease.addEventListener('click', () => {
                damageReduction = Math.max(0, damageReduction - 1);
                updateDamageReductionDisplay();
                updateTotalCosts();
            });
        }
        updateDamageReductionDisplay();

        // Show/hide Damage Reduction control based on armament type
        const armamentTypeSelect = document.getElementById('armamentType');
        function updateDamageReductionVisibility() {
            if (damageReductionContainer) {
                damageReductionContainer.style.display = (window.selectedArmamentType && window.selectedArmamentType() === "Armor") ? "" : "none";
            }
        }
        if (armamentTypeSelect) {
            armamentTypeSelect.addEventListener('change', () => {
                updateDamageReductionVisibility();
                // Reset to 0 when switching to Armor, hide when not Armor
                if (window.selectedArmamentType && window.selectedArmamentType() === "Armor") {
                    damageReduction = 0;
                    updateDamageReductionDisplay();
                    updateTotalCosts();
                }
            });
            updateDamageReductionVisibility();
        }
    });

    function addDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = `
            <h4>Damage: 
                <input type="number" id="dieAmount2" min="1" max="99" value="" placeholder="Amount"> d 
                <select id="dieSize2">
                    <option value="" selected disabled>Size</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                </select>
                <select id="damageType2" onchange="updateDamageType()">
                    <option value="none" selected>No Damage</option>
                    <option value="blunt">Blunt</option>
                    <option value="piercing">Piercing</option>
                    <option value="slashing">Slashing</option>
                </select>
                <button id="removeDamageRowButton" class="medium-button red-button" onclick="removeDamageRow()">-</button>
            </h4>
        `;
        document.getElementById('addDamageRowButton').style.display = 'none';

        // Attach event listeners for new elements
        const dieAmount2 = document.getElementById('dieAmount2');
        const dieSize2 = document.getElementById('dieSize2');
        const damageType2 = document.getElementById('damageType2');
        if (dieAmount2) dieAmount2.addEventListener('input', updateTotalCosts);
        if (dieSize2) dieSize2.addEventListener('change', updateTotalCosts);
        if (damageType2) damageType2.addEventListener('change', updateTotalCosts);
    }

    function removeDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = '';
        document.getElementById('addDamageRowButton').style.display = 'inline-block';
    }

    // Dynamic ability requirement dropdown (armor uses only armor reqs; weapon & shield use weapon reqs)
    function updateAbilityRequirementDropdown(type) {
        const select = document.getElementById('abilityRequirementType');
        if (!select) return;

        // Always reset content with a placeholder
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Choose ability';
        select.appendChild(placeholder);

        // Build from loaded properties if present
        const prefix = (type === 'Armor') ? 'Armor ' : 'Weapon'; // shields use weapon-type requirements
        const abilityOrder = ['Strength','Agility','Vitality','Acuity','Intelligence','Charisma'];
        let opts = [];
        if (Array.isArray(itemProperties) && itemProperties.length) {
            opts = abilityOrder
                .map(ab => {
                    const name = `${prefix}${ab} Requirement`;
                    const exists = itemProperties.some(p => p.name === name);
                    if (!exists) return null;
                    const needsApproval = ['Vitality','Agility','Intelligence','Charisma'].includes(ab);
                    return { value: ab, label: needsApproval ? `${ab} (RM Apv. Req.)` : ab };
                })
                .filter(Boolean);
        }

        // Fallback defaults if DB doesn’t have these properties yet
        if (opts.length === 0) {
            if (type === 'Armor') {
                // Armor defaults: no Acuity
                opts = [
                    { value: 'Strength', label: 'Strength' },
                    { value: 'Agility', label: 'Agility (RM Apv. Req.)' },
                    { value: 'Vitality', label: 'Vitality (RM Apv. Req.)' },
                    { value: 'Intelligence', label: 'Intelligence (RM Apv. Req.)' },
                    { value: 'Charisma', label: 'Charisma (RM Apv. Req.)' }
                ];
            } else {
                // Weapon/Shield defaults
                opts = [
                    { value: 'Strength', label: 'Strength' },
                    { value: 'Agility', label: 'Agility' },
                    { value: 'Acuity', label: 'Acuity' },
                    { value: 'Vitality', label: 'Vitality (RM Apv. Req.)' },
                    { value: 'Intelligence', label: 'Intelligence (RM Apv. Req.)' },
                    { value: 'Charisma', label: 'Charisma (RM Apv. Req.)' }
                ];
            }
        }

        // Populate the select
        opts.forEach(o => {
            const optEl = document.createElement('option');
            optEl.value = o.value;
            optEl.textContent = o.label;
            select.appendChild(optEl);
        });
    }

    // Expose functions to global scope for inline event handlers
    window.updateSelectedProperty = updateSelectedProperty;
    window.changeOptionLevel = changeOptionLevel;
    window.updateTotalCosts = updateTotalCosts;
    window.addDamageRow = addDamageRow;
    window.removeDamageRow = removeDamageRow;
    window.addShieldProperty = addShieldProperty;
    window.addArmorProperty = addArmorProperty;
    window.updateDamageType = updateDamageType;
    window.removeItemProperty = removeItemProperty;
    window.changeRange = changeRange;
    window.changeHandedness = changeHandedness;
    window.clearAllItemProperties = clearAllItemProperties; // expose for armament switch
    window.updateAbilityRequirementDropdown = updateAbilityRequirementDropdown; // expose for armament type change

})();