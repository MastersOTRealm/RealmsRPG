import itemPartsData from './itemPartsData.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let appCheckInitialized = false;

(() => {
    const itemParts = itemPartsData;

    const selectedItemParts = [];
    window.selectedItemParts = selectedItemParts; // Expose for HTML logic
    let tpSources = []; // Array to track TP sources
    let range = 0; // Internal default value
    let handedness = "One-Handed"; // Default handedness

    // --- Damage Reduction State ---
    let damageReduction = 0;
    window.getDamageReduction = () => damageReduction;

    // Find Damage Reduction part from itemPartsData
    const damageReductionPart = itemParts.find(
        p => p.type === "Armor" && p.name === "Damage Reduction"
    );

    function addWeaponPart() {
        // Only allow if armament type is Weapon
        if (window.selectedArmamentType && window.selectedArmamentType() !== 'Weapon') return;
        const part = itemParts.find(part => part.type === 'Weapon');
        if (part) {
            selectedItemParts.push({ part, opt1Level: 0, opt2Level: 0 });
            renderItemParts();
            updateTotalCosts();
        }
    }

    function addShieldPart() {
        if (window.selectedArmamentType && window.selectedArmamentType() !== 'Shield') return;
        const part = itemParts.find(part => part.type === 'Shield');
        if (part) {
            selectedItemParts.push({ part, opt1Level: 0, opt2Level: 0 });
            renderItemParts();
            updateTotalCosts();
        }
    }

    function addArmorPart() {
        if (window.selectedArmamentType && window.selectedArmamentType() !== 'Armor') return;
        const part = itemParts.find(part => part.type === 'Armor');
        if (part) {
            selectedItemParts.push({ part, opt1Level: 0, opt2Level: 0 });
            renderItemParts();
            updateTotalCosts();
        }
    }

    function generatePartContent(partIndex, part) {
        return `
            <h3>${part.name} <span class="small-text">Item Points: <span id="baseIP-${partIndex}">${part.baseItemPoint}</span></span> <span class="small-text">Training Points: <span id="baseTP-${partIndex}">${part.baseTP}</span></span> <span class="small-text">Gold Points: <span id="baseGP-${partIndex}">${part.baseGoldPoint}</span></span></h3>
            <p>Part IP: <span id="totalIP-${partIndex}">${part.baseItemPoint}</span> Part TP: <span id="totalTP-${partIndex}">${part.baseTP}</span> Part GP: <span id="totalGP-${partIndex}">${part.baseGoldPoint}</span></p>
            <p>${part.description}</p>
            
            ${part.opt1Cost !== undefined || part.opt1Description ? `
            <div class="option-container">
                ${part.opt1Cost !== undefined || part.opt1Description ? `
                <div class="option-box">
                    <h4>Item Points: ${part.opt1Cost >= 0 ? '+' : ''}${part.opt1Cost}     Training Points: ${part.TPIncreaseOpt1 >= 0 ? '+' : ''}${part.TPIncreaseOpt1}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="opt1Level-${partIndex}">${selectedItemParts[partIndex].opt1Level}</span></span>
                    <p>${part.opt1Description}</p>
                </div>` : ''}
                
                ${part.opt2Cost !== undefined || part.opt2Description ? `
                <div class="option-box">
                    <h4>Item Points: ${part.opt2Cost >= 0 ? '+' : ''}${part.opt2Cost}     Training Points: ${part.TPIncreaseOpt2 >= 0 ? '+' : ''}${part.TPIncreaseOpt2}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="opt2Level-${partIndex}">${selectedItemParts[partIndex].opt2Level}</span></span>
                    <p>${part.opt2Description}</p>
                </div>` : ''}
            </div>` : ''}
        `;
    }

    // Helper: Names of requirement parts and agility reduction
    const requirementPartNames = [
        "Strength Requirement",
        "Agility Requirement",
        "(RM) Vitality Requirement",
        "Acuity Requirement",
        "(RM) Intelligence Requirement",
        "(RM) Charisma Requirement",
        "(RM) Agility Requirement"
    ];
    const agilityReductionName = "Agility Reduction";

    // Helper: Remove requirement and agility reduction parts from selectedItemParts
    function removeRequirementAndAgilityParts(keepAgilityReductionForArmor = false) {
        for (let i = selectedItemParts.length - 1; i >= 0; i--) {
            const part = selectedItemParts[i].part;
            if (
                requirementPartNames.includes(part.name) ||
                (!keepAgilityReductionForArmor && part.name === agilityReductionName)
            ) {
                selectedItemParts.splice(i, 1);
            }
        }
    }

    // Helper: Remove all item parts
    function clearAllItemParts() {
        selectedItemParts.length = 0;
        renderItemParts();
        updateTotalCosts();
    }

    // Helper: Remove all ability requirements (if window.setAbilityRequirements exists)
    function clearAllAbilityRequirements() {
        if (typeof window.setAbilityRequirements === "function") {
            window.setAbilityRequirements([]);
        }
    }

    // Listen for armament type changes and clear all parts/requirements
    function setupArmamentTypeWatcher() {
        let lastType = window.selectedArmamentType ? window.selectedArmamentType() : null;
        setInterval(() => {
            const currentType = window.selectedArmamentType ? window.selectedArmamentType() : null;
            if (currentType !== lastType) {
                lastType = currentType;
                clearAllItemParts();
                clearAllAbilityRequirements();
            }
        }, 200);
    }

    function updateSelectedPart(index, selectedValue) {
        const selectedPart = itemParts[selectedValue];
        selectedItemParts[index].part = selectedPart;
        selectedItemParts[index].opt1Level = 0;
        selectedItemParts[index].opt2Level = 0;

        // Remove requirement/agility parts if switching armament type
        if (window.selectedArmamentType) {
            const type = window.selectedArmamentType();
            if (type === "Armor") {
                removeRequirementAndAgilityParts(true);
            } else {
                removeRequirementAndAgilityParts(false);
            }
        }

        renderItemParts();
        updateTotalCosts();
    }

    function changeOptionLevel(index, option, delta) {
        const part = selectedItemParts[index];
        const levelKey = `${option}Level`;

        part[levelKey] = Math.max(0, part[levelKey] + delta);

        // Update the level indicator in the DOM
        const levelElement = document.getElementById(`${levelKey}-${index}`);
        if (levelElement) {
            levelElement.textContent = part[levelKey];
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

    function removeItemPart(index) {
        selectedItemParts.splice(index, 1);
        renderItemParts();
        updateTotalCosts();
    }

    function updateDamageType() {
        updateTotalCosts();
    }

    // --- calculateCosts function for splitting logic ---
    function calculateCosts(dieNotation) {
        // Parse die notation (e.g., "3d6" -> amount = 3, size = 6)
        const match = dieNotation.match(/^(\d+)d(\d+)$/);
        if (!match) {
            return { error: "Invalid die notation. Use format like '3d6'." };
        }
        const amount = parseInt(match[1]);
        const size = parseInt(match[2]);
        const validDieSizes = [2, 4, 6, 8, 10, 12];
        if (!validDieSizes.includes(size)) {
            return { error: "Die size must be one of: 2, 4, 6, 8, 10, 12." };
        }

        // Base calculations
        const totalValue = amount * size;
        let ip = totalValue / 2;
        let gp = totalValue / 2;
        let tp = (totalValue - 2) / 2;

        // Calculate minimum dice needed for totalValue
        let remainingValue = totalValue;
        let minDiceCount = 0;
        const dieSizes = [12, 10, 8, 6, 4, 2]; // Descending order for greedy approach
        for (let dieSize of dieSizes) {
            const diceNeeded = Math.floor(remainingValue / dieSize);
            minDiceCount += diceNeeded;
            remainingValue -= diceNeeded * dieSize;
        }
        if (remainingValue !== 0) {
            return { error: "Cannot represent total value with valid die sizes." };
        }

        // Calculate splits
        const splits = amount - minDiceCount;
        if (splits > 0) {
            ip += splits;
            gp += splits;
            tp += splits;
        }

        // Round to 2 decimal places for consistency
        return {
            itemPoints: Number(ip.toFixed(2)),
            goldPoints: Number(gp.toFixed(2)),
            trainingPoints: Number(tp.toFixed(2)),
            splits: splits
        };
    }

    function calculateDamageIPCost() {
        let totalDamageIP = 0;
        let totalDamageTP = 0;
        let totalDamageGP = 0;
        let damageSources = [];

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;

        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== "none") {
            const result = calculateCosts(`${dieAmount1}d${dieSize1}`);
            if (!result.error) {
                totalDamageIP += result.itemPoints;
                totalDamageTP += result.trainingPoints;
                totalDamageGP += result.goldPoints;
                damageSources.push(`${result.trainingPoints} TP: ${dieAmount1}d${dieSize1} ${damageType1.charAt(0).toUpperCase() + damageType1.slice(1)} Damage`);
            } else {
                console.warn(`Damage 1 calculation error: ${result.error}`);
            }
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            const result = calculateCosts(`${dieAmount2}d${dieSize2}`);
            if (!result.error) {
                totalDamageIP += result.itemPoints;
                totalDamageTP += result.trainingPoints;
                totalDamageGP += result.goldPoints;
                damageSources.push(`${result.trainingPoints} TP: ${dieAmount2}d${dieSize2} ${damageType2.charAt(0).toUpperCase() + damageType2.slice(1)} Damage`);
            } else {
                console.warn(`Damage 2 calculation error: ${result.error}`);
            }
        }

        // Floor TP at 0 to prevent negative values
        totalDamageTP = Math.max(0, totalDamageTP);

        return { totalDamageIP, totalDamageTP, totalDamageGP, damageSources };
    }

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
        let hasArmorPart = false;
        let hasWeaponPart = false;
        tpSources = []; // Reset the array each time

        // --- Damage Reduction for Armor ---
        if (
            window.selectedArmamentType &&
            window.selectedArmamentType() === "Armor" &&
            damageReductionPart &&
            typeof damageReduction === "number" &&
            damageReduction > 0
        ) {
            // Base cost for 1, opt1 for each additional
            sumBaseIP += damageReductionPart.baseItemPoint + (damageReduction - 1) * (damageReductionPart.opt1Cost || 0);
            const drTP = damageReductionPart.baseTP + (damageReduction - 1) * (damageReductionPart.TPIncreaseOpt1 || 0);
            totalTP += drTP;
            totalGP += damageReductionPart.baseGoldPoint + (damageReduction - 1) * (damageReductionPart.GPIncreaseOpt1 || 0);
            tpSources.push(`${drTP} TP: Damage Reduction ${damageReduction}`);
        }
        // --- end Damage Reduction ---

        // --- Shield flat bonus ---
        if (window.selectedArmamentType && window.selectedArmamentType() === "Shield") {
            sumBaseIP += 1;
            totalGP += 2.5;
        }
        // --- end Shield flat bonus ---

        // --- Armor flat bonus ---
        if (window.selectedArmamentType && window.selectedArmamentType() === "Armor") {
            sumBaseIP += 2;
        }
        // --- end Armor flat bonus ---

        selectedItemParts.forEach((partData) => {
            const part = partData.part;
            // Remove ability requirement options from part cost calculation
            if (
                part.name === "Strength Requirement" ||
                part.name === "Agility Requirement" ||
                part.name === "(RM) Vitality Requirement" ||
                part.name === "Acuity Requirement" ||
                part.name === "(RM) Intelligence Requirement" ||
                part.name === "(RM) Charisma Requirement"
            ) {
                // Skip, handled by global ability requirements
                return;
            }
            let partIP = part.baseItemPoint;
            let partTP = part.baseTP;
            let partGP = part.baseGoldPoint;
            partIP += (part.opt1Cost || 0) * partData.opt1Level;
            partIP += (part.opt2Cost || 0) * partData.opt2Level;
            partTP += (part.TPIncreaseOpt1 || 0) * partData.opt1Level;
            partTP += (part.TPIncreaseOpt2 || 0) * partData.opt2Level;
            partGP += (part.GPIncreaseOpt1 || 0) * partData.opt1Level;
            partGP += (part.GPIncreaseOpt2 || 0) * partData.opt2Level;
            sumBaseIP += partIP;
            totalTP += partTP;
            totalGP += partGP;
            const opt1TP = (part.TPIncreaseOpt1 || 0) * partData.opt1Level;
            const opt2TP = (part.TPIncreaseOpt2 || 0) * partData.opt2Level;
            if (partTP > 0 || opt1TP > 0 || opt2TP > 0) {
                let partSource = `${partTP} TP: ${part.name}`;
                if (opt1TP > 0) partSource += ` (Option 1 Level ${partData.opt1Level}: ${opt1TP} TP)`;
                if (opt2TP > 0) partSource += ` (Option 2 Level ${partData.opt2Level}: ${opt2TP} TP)`;
                tpSources.push(partSource);
            }

            if (part.type === 'Armor') {
                hasArmorPart = true;
            }
            if (part.type === 'Weapon') {
                hasWeaponPart = true;
            }
        });

        // --- Ability Requirements ---
        const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];
        abilityRequirements.forEach(req => {
            let part = null;
            let value = parseInt(req.value, 10);
            if (value > 0) {
                const armamentType = window.selectedArmamentType ? window.selectedArmamentType() : 'Weapon';
                if (armamentType === "Weapon" || armamentType === "Shield") {
                    if (req.type === "Strength") {
                        part = itemParts.find(p => p.name === "Strength Requirement" && p.type === "Weapon");
                    } else if (req.type === "Agility") {
                        part = itemParts.find(p => p.name === "Agility Requirement" && p.type === "Weapon");
                    } else if (req.type === "Acuity") {
                        part = itemParts.find(p => p.name === "Acuity Requirement" && p.type === "Weapon");
                    } else if (req.type === "Vitality") {
                        part = itemParts.find(p => p.name === "(RM) Vitality Requirement" && p.type === "Weapon");
                    } else if (req.type === "Intelligence") {
                        part = itemParts.find(p => p.name === "(RM) Intelligence Requirement" && p.type === "Weapon");
                    } else if (req.type === "Charisma") {
                        part = itemParts.find(p => p.name === "(RM) Charisma Requirement" && p.type === "Weapon");
                    }
                } else if (armamentType === "Armor") {
                    if (req.type === "Strength") {
                        part = itemParts.find(p => p.name === "Strength Requirement" && p.type === "Armor");
                    } else if (req.type === "Agility") {
                        part = itemParts.find(p => p.name === "(RM) Agility Requirement" && p.type === "Armor");
                    } else if (req.type === "Vitality") {
                        part = itemParts.find(p => p.name === "(RM) Vitality Requirement" && p.type === "Armor");
                    } else if (req.type === "Intelligence") {
                        part = null;
                    } else if (req.type === "Charisma") {
                        part = null;
                    }
                }
                if (part) {
                    const gpAdd = part.baseGoldPoint + (typeof part.GPIncreaseOpt1 === "number" ? part.GPIncreaseOpt1 : 0) * (value - 1);
                    // Debug log:
                    console.log(`Adding GP for ${req.type} (value=${value}): ${gpAdd}`);
                    totalGP += gpAdd;
                    sumBaseIP += part.baseItemPoint + (typeof part.opt1Cost === "number" ? part.opt1Cost : 0) * (value - 1);
                    const reqTP = part.baseTP + (typeof part.TPIncreaseOpt1 === "number" ? part.TPIncreaseOpt1 : 0) * (value - 1);
                    totalTP += reqTP;
                    tpSources.push(`${reqTP} TP: ${req.type} Requirement ${value}`);
                } else {
                    console.warn(`Part not found for ${req.type} in ${armamentType}`);
                }
            }
        });
        // --- end Ability Requirements ---

        // --- Agility Reduction for Armor ---
        if (window.selectedArmamentType && window.selectedArmamentType() === "Armor" && typeof window.agilityReduction === "number" && window.agilityReduction > 0) {
            const agilityReductionPart = itemParts.find(p => p.name === "Agility Reduction" && p.type === "Armor");
            if (agilityReductionPart) {
                const gpAdd = agilityReductionPart.baseGoldPoint + ((window.agilityReduction - 1) * (typeof agilityReductionPart.GPIncreaseOpt1 === "number" ? agilityReductionPart.GPIncreaseOpt1 : 0));
                // Debug log:
                console.log(`Adding GP for Agility Reduction (${window.agilityReduction}): ${gpAdd}`);
                totalGP += gpAdd;
                sumBaseIP += agilityReductionPart.baseItemPoint + ((window.agilityReduction - 1) * (typeof agilityReductionPart.opt1Cost === "number" ? agilityReductionPart.opt1Cost : 0));
                const agTP = agilityReductionPart.baseTP + ((window.agilityReduction - 1) * (typeof agilityReductionPart.TPIncreaseOpt1 === "number" ? agilityReductionPart.TPIncreaseOpt1 : 0));
                totalTP += agTP;
                tpSources.push(`${agTP} TP: Agility Reduction ${window.agilityReduction}`);
            } else {
                console.warn("Agility Reduction part not found");
            }
        }
        // --- end Agility Reduction ---

        // Apply range cost before any increases or decreases
        if (range > 0) {
            const rangeCost = 2 + (range - 1) * 1;
            const rangeTP = 1 + (range - 1) * 1;
            const rangeGP = 1 + (range - 1) * 1;
            sumBaseIP += rangeCost;
            totalTP += rangeTP;
            totalGP += rangeGP;
            tpSources.push(`${rangeTP} TP: Range ${range * 8} Spaces`);
        }

        // Apply handedness cost
        if (handedness === "Two-Handed") {
            sumBaseIP -= 2;
            totalTP += 1;
            totalGP += 1;
            tpSources.push(`1 TP: Two-Handed`);
        }

        // Calculate damage IP cost
        const { totalDamageIP, totalDamageTP, totalDamageGP, damageSources } = calculateDamageIPCost();
        sumBaseIP += totalDamageIP;
        totalTP += totalDamageTP;
        totalGP += totalDamageGP;
        tpSources.push(...damageSources);

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

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        let damageText = '';
        let splits1 = 0, splits2 = 0;
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== 'none') {
            const result = calculateCosts(`${dieAmount1}d${dieSize1}`);
            if (!result.error) {
                damageText += `${dieAmount1}d${dieSize1} ${damageType1}`;
                splits1 = result.splits;
                if (splits1 > 0) damageText += ` (${splits1} split${splits1 > 1 ? 's' : ''})`;
            }
        }
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== 'none') {
            const result = calculateCosts(`${dieAmount2}d${dieSize2}`);
            if (!result.error) {
                damageText += damageText ? ', ' : '';
                damageText += `${dieAmount2}d${dieSize2} ${damageType2}`;
                splits2 = result.splits;
                if (splits2 > 0) damageText += ` (${splits2} split${splits2 > 1 ? 's' : ''})`;
            }
        }
        if (document.getElementById('summaryDamage')) {
            document.getElementById('summaryDamage').textContent = damageText;
            document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';
        }

        // Update the summary parts
        const summaryPartsContainer = document.getElementById('summaryParts');
        if (summaryPartsContainer) {
            summaryPartsContainer.innerHTML = '';
            // Show Damage Reduction if > 0
            if (window.selectedArmamentType && window.selectedArmamentType() === "Armor" && typeof damageReduction === "number" && damageReduction > 0) {
                const drDiv = document.createElement('div');
                drDiv.innerHTML = `<h4>${damageReduction} Damage Reduction</h4>`;
                summaryPartsContainer.appendChild(drDiv);
            }
            selectedItemParts.forEach((partData, partIndex) => {
                const part = partData.part;
                const partElement = document.createElement('div');
                partElement.innerHTML = `
                    <h4>${part.name}</h4>
                    <p>Item Points: ${part.baseItemPoint}</p>
                    <p>Training Points: ${part.baseTP}</p>
                    <p>Gold Points: ${part.baseGoldPoint}</p>
                    <p>${part.description}</p>
                    ${part.opt1Description ? `<p>Option 1: ${part.opt1Description} (Level: ${partData.opt1Level})</p>` : ''}
                    ${part.opt2Description ? `<p>Option 2: ${part.opt2Description} (Level: ${partData.opt2Level})</p>` : ''}
                `;
                summaryPartsContainer.appendChild(partElement);
            });

            // Add ability requirements to summary
            const abilityRequirements = window.getAbilityRequirements ? window.getAbilityRequirements() : [];
            if (abilityRequirements.length > 0) {
                const reqDiv = document.createElement('div');
                reqDiv.innerHTML = `<h4>Ability Requirements</h4>` +
                    abilityRequirements.map(r => `<p>${r.type}: ${r.value}</p>`).join('');
                summaryPartsContainer.appendChild(reqDiv);
            }
        }

        // Update the summary proficiencies
        const summaryProficiencies = document.getElementById('summaryProficiencies');
        if (summaryProficiencies) {
            summaryProficiencies.innerHTML = tpSources.map(source => `<p>${source}</p>`).join('');
        }

        // Update rarity based on total IP and gold cost
        if (document.getElementById('summaryRarity')) document.getElementById('summaryRarity').textContent = rarity;

        // Update item type in summary
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
        const itemParts = selectedItemParts.map(partData => ({
            part: partData.part.name,
            opt1Level: partData.opt1Level,
            opt2Level: partData.opt2Level
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
                itemParts,
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
        const addItemPartButton = document.getElementById("addItemPartButton");
        if (addItemPartButton) addItemPartButton.addEventListener("click", addWeaponPart);
    
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

        const addShieldPartButton = document.getElementById("addShieldPartButton");
        if (addShieldPartButton) addShieldPartButton.addEventListener("click", addShieldPart);

        const addArmorPartButton = document.getElementById("addArmorPartButton");
        if (addArmorPartButton) addArmorPartButton.addEventListener("click", addArmorPart);

        const handednessSelect = document.getElementById("handedness");
        if (handednessSelect) handednessSelect.addEventListener("change", (event) => changeHandedness(event.target.value));

        const toggleArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (toggleArrow) toggleArrow.addEventListener('click', toggleTotalCosts);

        let firebaseConfig = null;
        try {
            const response = await fetch('/__/firebase/init.json');
            firebaseConfig = await response.json();
            console.log('Firebase Config:', firebaseConfig); // Debug log
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
                initializeAppCheck(app, {
                    provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
                    isTokenAutoRefreshEnabled: true
                });
                appCheckInitialized = true;
            }
            // ---------------------------------------

            const auth = getAuth(app);
            const functions = getFunctions(app);

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
                    }, 500); // 500ms delay to ensure auth state is stable
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
            if (damageReductionValue)
                damageReductionValue.textContent = damageReduction > 0 ? damageReduction : "None";
            if (damageReductionCostSummary && damageReductionPart) {
                if (damageReduction > 0) {
                    const ip = damageReductionPart.baseItemPoint + (damageReduction - 1) * (damageReductionPart.opt1Cost || 0);
                    const tp = damageReductionPart.baseTP + (damageReduction - 1) * (damageReductionPart.TPIncreaseOpt1 || 0);
                    const gp = damageReductionPart.baseGoldPoint + (damageReduction - 1) * (damageReductionPart.GPIncreaseOpt1 || 0);
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
                    <option value="2">2</option>
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

    function renderItemParts() {
        const itemPartsContainer = document.getElementById("itemPartsContainer");
        itemPartsContainer.innerHTML = "";

        selectedItemParts.forEach((partData, partIndex) => {
            const itemPartSection = document.createElement("div");
            itemPartSection.id = `itemPart-${partIndex}`;
            itemPartSection.classList.add("item-part-section");

            // Filter out requirement parts, agility reduction, damage reduction, "Sure Hit" for Weapon, and "Shield" for Shield
            let filteredParts = itemParts.filter(part => {
                if (requirementPartNames.includes(part.name)) return false;
                if (partData.part.type === "Armor" && (part.name === agilityReductionName || part.name === "Damage Reduction")) return false;
                if (partData.part.type === "Weapon" && part.name === "Sure Hit") return false;
                if (partData.part.type === "Shield" && part.name === "Shield") return false;
                return part.type === partData.part.type;
            });

            filteredParts.sort((a, b) => a.name.localeCompare(b.name));

            itemPartSection.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <select onchange="updateSelectedPart(${partIndex}, this.value)">
                        ${filteredParts.map((part, index) => `<option value="${itemParts.indexOf(part)}" ${partData.part === part ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
                </div>
                <div id="partContent-${partIndex}">
                    ${generatePartContent(partIndex, partData.part)}
                </div>
                <button class="delete-button" onclick="removeItemPart(${partIndex})">Delete</button>
            `;
            itemPartsContainer.appendChild(itemPartSection);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        const addItemPartButton = document.getElementById("addItemPartButton");
        if (addItemPartButton) addItemPartButton.addEventListener("click", addWeaponPart);
    
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
    });

    function addShieldPart() {
        const partIndex = selectedItemParts.length;
        selectedItemParts.push({ part: itemParts.filter(part => part.type === 'Shield')[0], opt1Level: 0, opt2Level: 0 });

        renderItemParts();
        updateTotalCosts();
    }

    function addArmorPart() {
        const partIndex = selectedItemParts.length;
        selectedItemParts.push({ part: itemParts.filter(part => part.type === 'Armor')[0], opt1Level: 0, opt2Level: 0 });

        renderItemParts();
        updateTotalCosts();
    }

// Expose functions to global scope for inline event handlers
window.updateSelectedPart = updateSelectedPart;
window.changeOptionLevel = changeOptionLevel;
window.changeRange = changeRange;
window.removeItemPart = removeItemPart;
window.updateTotalCosts = updateTotalCosts;
window.updateDamageType = updateDamageType;
window.addDamageRow = addDamageRow;
window.removeDamageRow = removeDamageRow;
window.addShieldPart = addShieldPart;
window.addArmorPart = addArmorPart;
window.changeHandedness = changeHandedness;

})();