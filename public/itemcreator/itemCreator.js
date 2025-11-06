import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

let appCheckInitialized = false;

(() => {
    // Initialize as empty array - will be populated from database
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
                    // Coerce to numbers
                    base_ip: parseFloat(prop.base_ip) || 0,
                    base_tp: parseFloat(prop.base_tp) || 0,
                    base_gp: parseFloat(prop.base_gp) || 0,
                    op_1_desc: prop.op_1_desc || '',
                    op_1_ip: parseFloat(prop.op_1_ip) || 0,
                    op_1_tp: parseFloat(prop.op_1_tp) || 0,
                    op_1_gp: parseFloat(prop.op_1_gp) || 0,
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
            (property.op_1_gp && property.op_1_gp !== 0);

        return `
            <h3>${property.name} <span class="small-text">Item Points: <span id="baseIP-${propertyIndex}">${property.base_ip}</span></span> <span class="small-text">Training Points: <span id="baseTP-${propertyIndex}">${property.base_tp}</span></span> <span class="small-text">Gold Points: <span id="baseGP-${propertyIndex}">${property.base_gp}</span></span></h3>
            <p>Property IP: <span id="totalIP-${propertyIndex}">${property.base_ip}</span> Property TP: <span id="totalTP-${propertyIndex}">${property.base_tp}</span> Property GP: <span id="totalGP-${propertyIndex}">${property.base_gp}</span></p>
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
    function calculateGoldCost(totalGP, totalIP) {
        let goldCost = 0;
        let rarity = 'Common';

        // Clamp totalIP and totalGP to at least 0
        const clampedIP = Math.max(0, totalIP);
        const clampedGP = Math.max(0, totalGP);

        const rarityBrackets = [
            { name: 'Common', low: 25, ipLow: 0, ipHigh: 4 },
            { name: 'Uncommon', low: 100, ipLow: 4.01, ipHigh: 6 },
            { name: 'Rare', low: 500, ipLow: 6.01, ipHigh: 8 },
            { name: 'Epic', low: 2500, ipLow: 8.01, ipHigh: 11 },
            { name: 'Legendary', low: 10000, ipLow: 11.01, ipHigh: 14 },
            { name: 'Mythic', low: 50000, ipLow: 14.01, ipHigh: 16 },
            { name: 'Ascended', low: 100000, ipLow: 16.01, ipHigh: Infinity }
        ];

        for (let i = 0; i < rarityBrackets.length; i++) {
            const bracket = rarityBrackets[i];
            if (clampedIP >= bracket.ipLow && clampedIP <= bracket.ipHigh) {
                rarity = bracket.name;
                goldCost = bracket.low * (1 + 0.125 * clampedGP);
                break;
            }
        }

        // Ensure goldCost is never less than the bracket minimum
        goldCost = Math.max(goldCost, rarityBrackets.find(b => b.name === rarity).low);

        return { goldCost, rarity };
    }

    function updateTotalCosts() {
        let sumBaseIP = 0;
        let totalTP = 0;
        let totalGP = 0;
        let hasArmorProperty = false;
        let hasWeaponProperty = false;
        tpSources = []; // Reset

        // Find general properties we need
        const propShieldBase = getPropertyByName("Shield Base");
        const propArmorBase = getPropertyByName("Armor Base");
        const propRange = getPropertyByName("Range");
        const propTwoHanded = getPropertyByName("Two-Handed");
        const propSplitDice = getPropertyByName("Split Damage Dice");
        const propDamageReduction = getPropertyByName("Damage Reduction");
        const propWeaponDamage = getPropertyByName("Weapon Damage");

        // --- Damage Reduction for Armor ---
        if (window.selectedArmamentType &&
            window.selectedArmamentType() === "Armor" &&
            propDamageReduction &&
            typeof damageReduction === "number" &&
            damageReduction > 0
        ) {
            const ip = propDamageReduction.base_ip + (damageReduction - 1) * (propDamageReduction.op_1_ip || 0);
            const tp = propDamageReduction.base_tp + (damageReduction - 1) * (propDamageReduction.op_1_tp || 0);
            const gp = propDamageReduction.base_gp + (damageReduction - 1) * (propDamageReduction.op_1_gp || 0);
            sumBaseIP += ip;
            totalTP += tp;
            totalGP += gp;
            tpSources.push(`${tp} TP: Damage Reduction ${damageReduction}`);
        }
        // --- end Damage Reduction ---

        // --- Shield base (from DB) ---
        if (window.selectedArmamentType && window.selectedArmamentType() === "Shield" && propShieldBase) {
            sumBaseIP += propShieldBase.base_ip;
            totalTP += propShieldBase.base_tp;
            totalGP += propShieldBase.base_gp;
            tpSources.push(`${propShieldBase.base_tp} TP: Shield Base`);
        }
        // --- Armor base (from DB) ---
        if (window.selectedArmamentType && window.selectedArmamentType() === "Armor" && propArmorBase) {
            sumBaseIP += propArmorBase.base_ip;
            totalTP += propArmorBase.base_tp;
            totalGP += propArmorBase.base_gp;
            tpSources.push(`${propArmorBase.base_tp} TP: Armor Base`);
        }

        // Apply selected item properties (excluding general properties)
        selectedItemProperties.forEach((propertyData) => {
            const property = propertyData.property;

            // Skip if this is a general property by name (now driven by UI)
            if (generalPropertyNames.has(property.name)) return;

            // Skip ability requirement items (handled by global ability requirements)
            if (
                property.name === "Weapon Strength Requirement" ||
                property.name === "Weapon Agility Requirement" ||
                property.name === "Weapon Vitality Requirement" ||
                property.name === "Weapon Acuity Requirement" ||
                property.name === "Weapon Intelligence Requirement" ||
                property.name === "Weapon Charisma Requirement" ||
                property.name === "Armor Strength Requirement" ||
                property.name === "Armor Agility Requirement" ||
                property.name === "Armor Vitality Requirement"
            ) {
                return;
            }

            let propertyIP = property.base_ip;
            let propertyTP = property.base_tp;
            let propertyGP = property.base_gp;
            propertyIP += (property.op_1_ip || 0) * propertyData.op_1_lvl;
            propertyTP += (property.op_1_tp || 0) * propertyData.op_1_lvl;
            propertyGP += (property.op_1_gp || 0) * propertyData.op_1_lvl;

            sumBaseIP += propertyIP;
            totalTP += propertyTP;
            totalGP += propertyGP;

            const opt1TP = (property.op_1_tp || 0) * propertyData.op_1_lvl;
            if (propertyTP > 0 || opt1TP > 0) {
                let propertySource = `${propertyTP} TP: ${property.name}`;
                if (opt1TP > 0) propertySource += ` (Option 1 Level ${propertyData.op_1_lvl}: ${opt1TP} TP)`;
                tpSources.push(propertySource);
            }

            if (property.type === 'Armor') hasArmorProperty = true;
            if (property.type === 'Weapon') hasWeaponProperty = true;
        });

        // --- Ability Requirements (still DB-backed names) ---
        const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];
        abilityRequirements.forEach(req => {
            let property = null;
            let value = parseInt(req.value, 10);
            if (value > 0) {
                const armamentType = window.selectedArmamentType ? window.selectedArmamentType() : 'Weapon';
                if (armamentType === "Weapon" || armamentType === "Shield") {
                    if (req.type === "Strength") {
                        property = itemProperties.find(p => p.name === "Weapon Strength Requirement" && p.type === "Weapon");
                    } else if (req.type === "Agility") {
                        property = itemProperties.find(p => p.name === "Weapon Agility Requirement" && p.type === "Weapon");
                    } else if (req.type === "Acuity") {
                        property = itemProperties.find(p => p.name === "Weapon Acuity Requirement" && p.type === "Weapon");
                    } else if (req.type === "Vitality") {
                        property = itemProperties.find(p => p.name === "Weapon Vitality Requirement" && p.type === "Weapon");
                    } else if (req.type === "Intelligence") {
                        property = itemProperties.find(p => p.name === "Weapon Intelligence Requirement" && p.type === "Weapon");
                    } else if (req.type === "Charisma") {
                        property = itemProperties.find(p => p.name === "Weapon Charisma Requirement" && p.type === "Weapon");
                    }
                } else if (armamentType === "Armor") {
                    if (req.type === "Strength") {
                        property = itemProperties.find(p => p.name === "Armor Strength Requirement" && p.type === "Armor");
                    } else if (req.type === "Agility") {
                        property = itemProperties.find(p => p.name === "Armor Agility Requirement" && p.type === "Armor");
                    } else if (req.type === "Vitality") {
                        property = itemProperties.find(p => p.name === "Armor Vitality Requirement" && p.type === "Armor");
                    } else if (req.type === "Intelligence") {
                        property = null;
                    } else if (req.type === "Charisma") {
                        property = null;
                    }
                }
                if (property) {
                    const gpAdd = property.base_gp + (typeof property.op_1_gp === "number" ? property.op_1_gp : 0) * (value - 1);
                    // Debug log:
                    console.log(`Adding GP for ${req.type} (value=${value}): ${gpAdd}`);
                    totalGP += gpAdd;
                    sumBaseIP += property.base_ip + (typeof property.op_1_ip === "number" ? property.op_1_ip : 0) * (value - 1);
                    const reqTP = property.base_tp + (typeof property.op_1_tp === "number" ? property.op_1_tp : 0) * (value - 1);
                    totalTP += reqTP;
                    tpSources.push(`${reqTP} TP: ${req.type} Requirement ${value}`);
                } else {
                    console.warn(`Property not found for ${req.type} in ${armamentType}`);
                }
            }
        });

        // --- Agility Reduction (DB-backed name) ---
        if (window.selectedArmamentType && window.selectedArmamentType() === "Armor" && typeof window.agilityReduction === "number" && window.agilityReduction > 0) {
            const agilityReductionProperty = itemProperties.find(p => p.name === "Agility Reduction" && p.type === "Armor");
            if (agilityReductionProperty) {
                const gpAdd = agilityReductionProperty.base_gp + ((window.agilityReduction - 1) * (typeof agilityReductionProperty.op_1_gp === "number" ? agilityReductionProperty.op_1_gp : 0));
                // Debug log:
                console.log(`Adding GP for Agility Reduction (${window.agilityReduction}): ${gpAdd}`);
                totalGP += gpAdd;
                sumBaseIP += agilityReductionProperty.base_ip + ((window.agilityReduction - 1) * (typeof agilityReductionProperty.op_1_ip === "number" ? agilityReductionProperty.op_1_ip : 0));
                const agTP = agilityReductionProperty.base_tp + ((window.agilityReduction - 1) * (typeof agilityReductionProperty.op_1_tp === "number" ? agilityReductionProperty.op_1_tp : 0));
                totalTP += agTP;
                tpSources.push(`${agTP} TP: Agility Reduction ${window.agilityReduction}`);
            } else {
                console.warn("Agility Reduction property not found");
            }
        }
        // --- end Agility Reduction ---

        // --- Range cost from DB (levels = range steps) ---
        if (range > 0 && propRange) {
            const ip = propRange.base_ip + (range - 1) * (propRange.op_1_ip || 0);
            const tp = propRange.base_tp + (range - 1) * (propRange.op_1_tp || 0);
            const gp = propRange.base_gp + (range - 1) * (propRange.op_1_gp || 0);
            sumBaseIP += ip;
            totalTP += tp;
            totalGP += gp;
            tpSources.push(`${tp} TP: Range ${range * 8} Spaces`);
        }

        // --- Two-Handed cost from DB ---
        if (handedness === "Two-Handed" && propTwoHanded) {
            sumBaseIP += propTwoHanded.base_ip;
            totalTP += propTwoHanded.base_tp;
            totalGP += propTwoHanded.base_gp;
            tpSources.push(`${propTwoHanded.base_tp} TP: Two-Handed`);
        }

        // --- Weapon Damage (base dice only; splits priced separately) ---
        let weaponDamageLevel = 0;
        const dieAmount1 = parseInt(document.getElementById('dieAmount1')?.value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1')?.value, 10);
        const damageType1 = document.getElementById('damageType1')?.value;
        const validDamage = !isNaN(dieAmount1) && !isNaN(dieSize1) && ["4","6","8","10","12"].includes(String(dieSize1)) && damageType1 && damageType1 !== 'none';

        if (window.selectedArmamentType && window.selectedArmamentType() === 'Weapon' && propWeaponDamage && validDamage) {
            weaponDamageLevel = Math.max(0, ((dieAmount1 * dieSize1) - 4) / 2);
            const ip = propWeaponDamage.base_ip + weaponDamageLevel * (propWeaponDamage.op_1_ip || 0);
            const tp = propWeaponDamage.base_tp + weaponDamageLevel * (propWeaponDamage.op_1_tp || 0);
            const gp = propWeaponDamage.base_gp + weaponDamageLevel * (propWeaponDamage.op_1_gp || 0);
            sumBaseIP += ip;
            totalTP += tp;
            totalGP += gp;
            tpSources.push(`${tp} TP: Weapon Damage ${dieAmount1}d${dieSize1} ${damageType1} (Option 1 Level ${weaponDamageLevel})`);
        }

        // --- Split Damage Dice priced by DB property with levels = totalSplits ---
        if (window.selectedArmamentType && window.selectedArmamentType() === 'Weapon' && propSplitDice && validDamage) {
            const splits = computeSplits(dieAmount1, dieSize1);
            if (splits > 0) {
                const splitLevel = splits - 1; // base covers first split
                const ip = propSplitDice.base_ip + splitLevel * (propSplitDice.op_1_ip || 0);
                const tp = propSplitDice.base_tp + splitLevel * (propSplitDice.op_1_tp || 0);
                const gp = propSplitDice.base_gp + splitLevel * (propSplitDice.op_1_gp || 0);
                sumBaseIP += ip;
                totalTP += tp;
                totalGP += gp;
                tpSources.push(`${tp} TP: Split Damage Dice (${splits} split${splits>1?'s':''})${splitLevel>0?` (Option 1 Level ${splitLevel})`:''}`);
            }
        }

        // Debug log before gold cost calculation:
        console.log(`Before calculateGoldCost: totalGP=${totalGP}, sumBaseIP=${sumBaseIP}`);

        // Calculate gold cost and rarity
        const { goldCost, rarity } = calculateGoldCost(totalGP, sumBaseIP);

        // Debug log after gold cost calculation:
        console.log(`After calculateGoldCost: goldCost=${goldCost}, rarity=${rarity}`);

        // Final IP calculation
        const finalIP = sumBaseIP;

        const totalIPElement = document.getElementById("totalIP");
        const totalTPElement = document.getElementById("totalTP");
        const totalGPElement = document.getElementById("totalGP");
        const totalRarityElement = document.getElementById("totalRarity");

        if (totalIPElement) totalIPElement.textContent = finalIP.toFixed(2);
        if (totalTPElement) totalTPElement.textContent = totalTP.toFixed(2);
        if (totalGPElement) totalGPElement.textContent = goldCost.toFixed(2);
        if (totalRarityElement) totalRarityElement.textContent = rarity;

        updateItemSummary(finalIP, rarity);
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
        const summaryGP = document.getElementById('totalGP')?.textContent;
        const summaryRange = range === 0 ? 'Melee' : `${range * 8} Spaces`;

        // Clamp TP to 0 for weapons
        if (window.selectedArmamentType && window.selectedArmamentType() === "Weapon") {
            summaryTP = Math.max(0, parseFloat(summaryTP || "0")).toFixed(2);
        }

        if (document.getElementById('summaryIP')) document.getElementById('summaryIP').textContent = summaryIP;
        if (document.getElementById('summaryTP')) document.getElementById('summaryTP').textContent = summaryTP;
        if (document.getElementById('summaryGP')) document.getElementById('summaryGP').textContent = summaryGP;
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
                    <p>Gold Points: ${property.base_gp}</p>
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

        const itemName = document.getElementById('itemName').value || '';
        const itemDescription = document.getElementById('itemDescription').value || '';
        const totalTP = document.getElementById('totalTP').textContent || '0';
        const totalIP = document.getElementById('totalIP').textContent || '0';
        const totalGP = document.getElementById('totalGP').textContent || '0';
        const range = document.getElementById('rangeValue').textContent || 'Melee';
        const handedness = document.getElementById('handedness')?.value || 'One-Handed';
        const rarity = document.getElementById('totalRarity')?.textContent || 'Common';
        const damage = [
            {
                type: document.getElementById('damageType1').value || 'none',
                amount: document.getElementById('dieAmount1').value || '0',
                size: document.getElementById('dieSize1').value || '0'
            },
            {
                type: document.getElementById('damageType2')?.value || 'none',
                amount: document.getElementById('dieAmount2')?.value || '0',
                size: document.getElementById('dieSize2')?.value || '0'
            }
        ];
        const itemProperties = selectedItemProperties.map(propertyData => ({
            property: propertyData.property.name,
            op_1_lvl: propertyData.op_1_lvl || 0
        }));
        const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];

        try {
            const idToken = await currentUser.getIdToken(true);
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
                totalTP: Number(totalTP),
                totalIP: Number(totalIP),
                totalGP: Number(totalGP),
                range,
                handedness,
                rarity,
                damage,
                itemProperties,
                abilityRequirements,
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
            // Find damage reduction property after itemProperties is loaded
            const damageReductionProperty = itemProperties.find(
                p => p.type === "Armor" && p.name === "Damage Reduction"
            );
            
            if (damageReductionValue)
                damageReductionValue.textContent = damageReduction > 0 ? damageReduction : "None";
            if (damageReductionCostSummary && damageReductionProperty) {
                if (damageReduction > 0) {
                    const ip = damageReductionProperty.base_ip + (damageReduction - 1) * (damageReductionProperty.op_1_ip || 0);
                    const tp = damageReductionProperty.base_tp + (damageReduction - 1) * (damageReductionProperty.op_1_tp || 0);
                    const gp = damageReductionProperty.base_gp + (damageReduction - 1) * (damageReductionProperty.op_1_gp || 0);
                    damageReductionCostSummary.textContent = `IP: ${ip}, TP: ${tp}, GP: ${gp}`;
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

    // Helper: compute splits (needed by Split Damage Dice)
    function computeSplits(dieAmount, dieSize) {
        if (!dieAmount || !dieSize) return 0;
        const validSizes = [4,6,8,10,12];
        if (!validSizes.includes(dieSize)) return 0;
        let totalValue = dieAmount * dieSize;
        let remaining = totalValue;
        let minDice = 0;
        const sizesDesc = [12,10,8,6,4];
        for (const s of sizesDesc) {
            const need = Math.floor(remaining / s);
            minDice += need;
            remaining -= need * s;
        }
        if (remaining !== 0) return 0;
        return Math.max(0, dieAmount - minDice);
    }

    // Ensure initial pushes use op_1_lvl
    function addShieldProperty() {
        const property = itemProperties.find(p => p.type === 'Shield' && !generalPropertyNames.has(p.name));
        if (property) {
            selectedItemProperties.push({ property, op_1_lvl: 0, opt2Level: 0 });
            renderItemProperties(); updateTotalCosts();
        }
    }
    function addArmorProperty() {
        const property = itemProperties.find(p => p.type === 'Armor' && !generalPropertyNames.has(p.name));
        if (property) {
            selectedItemProperties.push({ property, op_1_lvl: 0, opt2Level: 0 });
            renderItemProperties(); updateTotalCosts();
        }
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