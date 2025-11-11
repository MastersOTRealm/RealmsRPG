import damageTypeValues from './damageTypesData.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { areaEffectDescriptions, actionTypeDescriptions, areaEffectCosts, durationMultipliers, actionTypeCosts, rangeCostPerUnit, sustainBaseReduction, sustainStepReduction, reactionCost } from './powerMechanics.js';

(() => {
    // const powerParts = powerPartsData;
    let powerParts = [];
    let durationParts = {}; // New global variable to store duration parts

    const selectedPowerParts = [];
    let range = 0; // Internal default value
    let area = 1;
    let duration = 1;
    let areaEffectLevel = 1; // Initialize areaEffectLevel to 1
    let durationType = 'rounds'; // Default duration type
    let tpSources = []; // New global array to track TP sources

    async function fetchPowerParts(database) {
        const powerPartsRef = ref(database, 'parts');
        const snapshot = await get(powerPartsRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            powerParts = Object.entries(data)
                .filter(([id, part]) => part.type && part.type.toLowerCase() === 'power')
                .map(([id, part]) => ({
                    id: id,
                    name: part.name || '',
                    description: part.description || '',
                    category: part.category || '',
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
                    type: part.type || 'power',
                    mechanic: part.mechanic === 'true' || part.mechanic === true,
                    percentage: part.percentage === 'true' || part.percentage === true
                }));
            
            // Fetch duration parts
            durationParts = {
                rounds: Object.values(data).find(part => part.name === 'Duration (Round)'),
                minutes: Object.values(data).find(part => part.name === 'Duration (Minute)'),
                hours: Object.values(data).find(part => part.name === 'Duration (Hour)'),
                days: Object.values(data).find(part => part.name === 'Duration (Days)'),
                permanent: Object.values(data).find(part => part.name === 'Duration (Permanent)')
            };
        } else {
            console.log("No power parts data available");
        }
    }

    function addPowerPart() {
        if (powerParts.length === 0) return; // Wait for data to load
        const partIndex = selectedPowerParts.length;
        selectedPowerParts.push({ part: powerParts.filter(part => !part.percentage)[0], opt1Level: 0, opt2Level: 0, opt3Level: 0 });

        renderPowerParts();
        updateTotalCosts();
    }

    function generatePartContent(partIndex, part) {
		function hasOption(p, n) {
			const desc = p[`op_${n}_desc`];
			const en = p[`op_${n}_en`];
			const tp = p[`op_${n}_tp`];
			return (desc && String(desc).trim() !== '') || (en !== undefined && Number(en) !== 0) || (tp !== undefined && Number(tp) !== 0);
		}

		const anyOption = hasOption(part, 1) || hasOption(part, 2) || hasOption(part, 3);

		return `
            <h3>${part.name} <span class="small-text">Energy: <span id="baseEnergy-${partIndex}">${part.base_en}</span></span> <span class="small-text">Training Points: <span id="baseTP-${partIndex}">${part.base_tp}</span></span></h3>
            <p>Part EN: <span id="totalEnergy-${partIndex}">${part.base_en}</span> Part TP: <span id="totalTP-${partIndex}">${part.base_tp}</span></p>
            <p>${part.description}</p>
            
            ${anyOption ? `
            <div class="option-container">
                ${hasOption(part,1) ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_1_en >= 0 ? '+' : ''}${part.op_1_en}     Training Points: ${part.op_1_tp >= 0 ? '+' : ''}${part.op_1_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="opt1Level-${partIndex}">${selectedPowerParts[partIndex].opt1Level}</span></span>
                    <p>${part.op_1_desc}</p>
                </div>` : ''}
                
                ${hasOption(part,2) ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_2_en >= 0 ? '+' : ''}${part.op_2_en}     Training Points: ${part.op_2_tp >= 0 ? '+' : ''}${part.op_2_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="opt2Level-${partIndex}">${selectedPowerParts[partIndex].opt2Level}</span></span>
                    <p>${part.op_2_desc}</p>
                </div>` : ''}

                ${hasOption(part,3) ? `
                <div class="option-box">
                    <h4>Energy: ${part.op_3_en >= 0 ? '+' : ''}${part.op_3_en}     Training Points: ${part.op_3_tp >= 0 ? '+' : ''}${part.op_3_tp}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', -1)">-</button>
                    <span>Level: <span id="opt3Level-${partIndex}">${selectedPowerParts[partIndex].opt3Level}</span></span>
                    <p>${part.op_3_desc}</p>
                </div>` : ''}
            </div>` : ''}
    
            <div class="linger-container">
                <label><input type="checkbox" id="lingerCheckbox-${partIndex}" onclick="updateTotalCosts()"> Does Linger</label>
            </div>
        `;
    }

    function updateSelectedPart(index, selectedValue) {
        const selectedPart = powerParts[selectedValue];
        selectedPowerParts[index].part = selectedPart;
        selectedPowerParts[index].opt1Level = 0;
        selectedPowerParts[index].opt2Level = 0;
        selectedPowerParts[index].opt3Level = 0;

        // Preserve the selected category
        const selectedCategory = selectedPowerParts[index].category || 'any';
        filterPartsByCategory(index, selectedCategory);

        renderPowerParts();
        updateTotalCosts();
    }

    function changeOptionLevel(index, option, delta) {
        const part = selectedPowerParts[index];
        const levelKey = `${option}Level`;
        const energyIncreaseKey = `${option}Cost`;

        part[levelKey] = Math.max(0, part[levelKey] + delta);

        // Update the level indicator in the DOM
        document.getElementById(`${levelKey}-${index}`).textContent = part[levelKey];

        renderPowerParts();
        updateTotalCosts();
    }

    function changeRange(delta) {
        range = Math.max(0, range + delta);
        const displayRange = range === 0 ? 1 : range * 3;
        document.getElementById('rangeValue').textContent = displayRange;
        document.getElementById('rangeValue').nextSibling.textContent = displayRange > 1 ? ' spaces' : ' space';
        updateTotalCosts();
    }

    function changeArea(delta) {
        area = Math.max(1, area + delta);
        document.getElementById('areaValue').textContent = area;
        document.getElementById('areaValue').nextSibling.textContent = area > 1 ? ' spaces' : ' space';
        updateTotalCosts();
    }

    function changeDuration(delta) {
        const durationType = document.getElementById('durationType').value;
        const durationValues = {
            rounds: [1, 2, 3, 4, 5, 6],
            minutes: [1, 10, 30],
            hours: [1, 6, 12],
            days: [1, 10, 20, 30],
            permanent: [1]
        };

        const maxDuration = durationValues[durationType].length;
        duration = Math.max(1, Math.min(maxDuration, duration + delta));
        document.getElementById('durationValue').value = duration;

        updateTotalCosts();
    }

    function changeDurationType() {
        const durationType = document.getElementById('durationType').value;
        const durationValues = {
            rounds: [1, 2, 3, 4, 5, 6],
            minutes: [1, 10, 30],
            hours: [1, 6, 12],
            days: [1, 7, 14],
            permanent: [1]
        };

        const durationValueSelect = document.getElementById('durationValue');
        durationValueSelect.innerHTML = durationValues[durationType].map((value, index) => `<option value="${index + 1}">${value}</option>`).join('');
        durationValueSelect.disabled = durationType === 'permanent';

        // Reset duration to the first value of the new type
        duration = 1;
        durationValueSelect.value = duration;

        updateTotalCosts();
    }

    function removePowerPart(index) {
        selectedPowerParts.splice(index, 1);
        renderPowerParts();
        updateTotalCosts();
    }

    function updateAreaEffect() {
        const areaEffect = document.getElementById('areaEffect').value;
        const description = areaEffectDescriptions[areaEffect];
        document.getElementById('areaEffectDescription').textContent = description;
        updateTotalCosts();
    }

    function changeAreaEffectLevel(delta) {
        areaEffectLevel = Math.max(0, areaEffectLevel + delta);
        document.getElementById('areaEffectLevelValue').textContent = areaEffectLevel;
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
        const damageType1 = document.getElementById('damageType1').value;

        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== "none") {
            const { dieBase: dieBase1, dieIncrease: dieIncrease1 } = damageTypeValues[damageType1];
            totalDamageEnergy += (((dieAmount1 * dieSize1) / 2) - 1) * dieIncrease1 + dieBase1;
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            const { dieBase: dieBase2, dieIncrease: dieIncrease2 } = damageTypeValues[damageType2];
            totalDamageEnergy += (((dieAmount2 * dieSize2) / 2) - 1) * dieIncrease2 + dieBase2;
        }

        return totalDamageEnergy;
    }

    function calculateDurationMultiplier(durationType, durationValue) {
        const durationPart = durationParts[durationType];
        if (!durationPart) {
            console.warn(`No duration part found for type: ${durationType}`);
            return 0;
        }

        const durationValues = {
            rounds: [1, 2, 3, 4, 5, 6],
            minutes: [1, 10, 30],
            hours: [1, 6, 12],
            days: [1, 7, 14],
            permanent: [1]
        };

        const selectedIndex = durationValue - 1; // Convert to 0-based index
        let multiplier = parseFloat(durationPart.base_en) || 0;

        console.log(`Calculating duration multiplier for ${durationType}, index ${selectedIndex}`);
        console.log(`Base multiplier: ${multiplier}`);

        // For index 0: just base_en
        // For index 1: base_en + op_1_en * 1
        // For index 2: base_en + op_1_en * 1 + op_2_en * 1
        // etc.

        if (selectedIndex >= 1 && durationPart.op_1_en !== undefined) {
            multiplier += parseFloat(durationPart.op_1_en) || 0;
            console.log(`Added op_1_en: ${durationPart.op_1_en}, new multiplier: ${multiplier}`);
        }
        
        if (selectedIndex >= 2 && durationPart.op_2_en !== undefined) {
            const op2Levels = selectedIndex - 1; // How many times to add op_2_en
            const op2Cost = (parseFloat(durationPart.op_2_en) || 0) * op2Levels;
            multiplier += op2Cost;
            console.log(`Added op_2_en * ${op2Levels}: ${op2Cost}, new multiplier: ${multiplier}`);
        }

        console.log(`Final duration multiplier: ${multiplier}`);
        return multiplier;
    }

    function updateTotalCosts() {
        console.log("updateTotalCosts called");
        let sumBaseEnergy = 0;
        let totalTP = 0;
        tpSources = []; // Reset the array each time
    
        // Separate power parts by type
        const baseEnergyParts = [];
        const increaseParts = [];
        const decreaseParts = [];
        const lingerParts = [];
        const lingerIncreaseParts = [];
        const lingerDecreaseParts = [];
    
        selectedPowerParts.forEach((partData, partIndex) => {
            const part = partData.part;
            if (!part.percentage) {
                baseEnergyParts.push(partData);
                if (document.getElementById(`lingerCheckbox-${partIndex}`)?.checked) {
                    lingerParts.push(partData);
                }
            } else if (part.percentage && part.base_en > 1) {
                increaseParts.push(partData);
                if (document.getElementById(`lingerCheckbox-${partIndex}`)?.checked) {
                    lingerIncreaseParts.push(partData);
                } 
            } else if (part.percentage && part.base_en < 1) {
                decreaseParts.push(partData);
                if (document.getElementById(`lingerCheckbox-${partIndex}`)?.checked) {
                    lingerDecreaseParts.push(partData);
                }
            }
        });
    
        console.log("Base energy parts:", baseEnergyParts);
        console.log("Linger parts:", lingerParts);
    
        // Step 1: Calculate base energy parts
        baseEnergyParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = part.base_en;
            let partTP = part.base_tp;
            partEnergy += (part.op_1_en || 0) * partData.opt1Level;
            partEnergy += (part.op_2_en || 0) * partData.opt2Level;
            partEnergy += (part.op_3_en || 0) * partData.opt3Level;
            sumBaseEnergy += partEnergy;
            totalTP += partTP;
            // Add TP from options
            const opt1TP = (part.op_1_tp || 0) * partData.opt1Level;
            const opt2TP = (part.op_2_tp || 0) * partData.opt2Level;
            const opt3TP = (part.op_3_tp || 0) * partData.opt3Level;
            totalTP += opt1TP + opt2TP + opt3TP;
            if (partTP > 0 || opt1TP > 0 || opt2TP > 0 || opt3TP > 0) {
                let partSource = `${partTP} TP: ${part.name}`;
                if (opt1TP > 0) partSource += ` (Option 1 Level ${partData.opt1Level}: ${opt1TP} TP)`;
                if (opt2TP > 0) partSource += ` (Option 2 Level ${partData.opt2Level}: ${opt2TP} TP)`;
                if (opt3TP > 0) partSource += ` (Option 3 Level ${partData.opt3Level}: ${opt3TP} TP)`;
                tpSources.push(partSource);
            }
        });
    
        console.log("Sum base energy after base parts:", sumBaseEnergy);
    
        // Apply range cost before any increases or decreases
        const rangeCost = range * rangeCostPerUnit;
        sumBaseEnergy += rangeCost;
        const tpRange = Math.ceil(range / 4);
        totalTP += tpRange;
        if (tpRange > 0) {
            const displayRange = range === 0 ? 1 : range * 3;
            tpSources.push(`${tpRange} TP: Range ${tpRange * 12}`);
        }
    
        console.log("Sum base energy after range cost:", sumBaseEnergy);
    
        // Calculate damage energy cost
        sumBaseEnergy += calculateDamageEnergyCost();
    
        // Increase TP if damage type has dice, size, and type selected
        // Increase TP based on damage dice total value (dieAmount * dieSize / 6, rounded up)
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== "none") {
            const totalValue1 = dieAmount1 * dieSize1;
            const tp1 = Math.ceil(totalValue1 / 6);
            totalTP += tp1;
            let display1 = '';
            if (tp1 === 1) {
                display1 = `1d6 ${damageType1}`;
            } else if (tp1 % 2 === 0) {
                const y = tp1 / 2;
                display1 = `${y}d12 ${damageType1}`;
            } else {
                const x = (tp1 - 1) / 2;
                display1 = `${x}d12 & 1d6 ${damageType1}`;
            }
            tpSources.push(`${tp1} TP: ${display1}`);
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            const totalValue2 = dieAmount2 * dieSize2;
            const tp2 = Math.ceil(totalValue2 / 6);
            totalTP += tp2;
            let display2 = '';
            if (tp2 === 1) {
                display2 = `1d6 ${damageType2}`;
            } else if (tp2 % 2 === 0) {
                const y = tp2 / 2;
                display2 = `${y}d12 ${damageType2}`;
            } else {
                const x = (tp2 - 1) / 2;
                display2 = `${x}d12 & 1d6 ${damageType2}`;
            }
            tpSources.push(`${tp2} TP: ${display2}`);
        }
    
        console.log("Sum base energy after damage cost:", sumBaseEnergy);
    
        // Step 2: Apply increase parts
        let increasedEnergy = sumBaseEnergy;
        increaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = increasedEnergy * part.base_en;
            partEnergy += increasedEnergy * (part.op_1_en || 0) * partData.opt1Level;
            partEnergy += increasedEnergy * (part.op_2_en || 0) * partData.opt2Level;
            partEnergy += increasedEnergy * (part.op_3_en || 0) * partData.opt3Level;
            increasedEnergy += partEnergy;
        });
    
        console.log("Increased energy after increase parts:", increasedEnergy);
    
        // Apply area effect cost
        const areaEffect = document.getElementById('areaEffect').value;
        const areaEffectCost = areaEffectCosts[areaEffect] || 0;
        increasedEnergy *= 1 + (areaEffectLevel * areaEffectCost);
    
        console.log("Increased energy after area effect cost:", increasedEnergy);
    
        // Apply action type cost (only increases)
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const actionTypeCost = actionTypeCosts[actionType] || 0;
        if (actionTypeCost > 0) {
            increasedEnergy *= 1 + actionTypeCost;
        }
        if (reactionChecked) {
            increasedEnergy *= 1 + reactionCost;
        }
    
        console.log("Increased energy after action type cost:", increasedEnergy);
    
        // Step 3: Apply decrease parts
        let decreasedEnergy = increasedEnergy;
        decreaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = decreasedEnergy * part.base_en;
            partEnergy += decreasedEnergy * (part.op_1_en || 0) * partData.opt1Level;
            partEnergy += decreasedEnergy * (part.op_2_en || 0) * partData.opt2Level;
            partEnergy += decreasedEnergy * (part.op_3_en || 0) * partData.opt3Level;
            decreasedEnergy += partEnergy;
        });
    
        console.log("Decreased energy after decrease parts:", decreasedEnergy);
    
        // Apply action type cost (only decreases)
        if (actionTypeCost < 0) {
            decreasedEnergy *= 1 + actionTypeCost;
        }
    
        console.log("Decreased energy after action type cost:", decreasedEnergy);
    
        // Step 4: Apply duration multiplier based on the altered total energy value
        const focusChecked = document.getElementById('focusCheckbox').checked;
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked;
    
        const durationType = document.getElementById('durationType').value;
        const durationValue = parseInt(document.getElementById('durationValue').value, 10);
        let durationMultiplier = calculateDurationMultiplier(durationType, durationValue);
        
        if (focusChecked) durationMultiplier /= 2;
        if (noHarmChecked) durationMultiplier /= 2;
        if (endsOnceChecked) durationMultiplier /= 2;
    
        const sustainValue = parseInt(document.getElementById('sustainValue').value, 10);
        let sustainReduction = 1 - (sustainBaseReduction + (sustainValue - 1) * sustainStepReduction);
        if (sustainValue === 0) sustainReduction = 1;
    
        console.log("durationMultiplier:", durationMultiplier);
        console.log("sustainReduction:", sustainReduction);
    
        // Apply duration - 1 adjustment only if using rounds
        const adjustedDuration = durationType === 'rounds' ? durationValue - 1 : durationValue;
    
        const durationEnergy = (((((adjustedDuration) * durationMultiplier) * sustainReduction) + 1) * decreasedEnergy) - decreasedEnergy;
    
        console.log("Final duration energy:", durationEnergy);
    
        // Final energy calculation
        const finalEnergy = decreasedEnergy + durationEnergy;
    
        console.log("Final energy:", finalEnergy);
    
        document.getElementById("totalEnergy").textContent = finalEnergy.toFixed(2);
        document.getElementById("totalTP").textContent = totalTP;
    
        updatePowerSummary();
    }
    
    function calculateDurationEnergy(lingerParts, lingerIncreaseParts, lingerDecreaseParts, durationValue) {
        console.log("calculateDurationEnergy called with duration:", durationValue);
        let baseDurationEnergy = 0;
    
        // Step 1: Calculate base energy parts that linger
        lingerParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = part.base_en;
            partEnergy += (part.op_1_en || 0) * partData.opt1Level;
            partEnergy += (part.op_2_en || 0) * partData.opt2Level;
            partEnergy += (part.op_3_en || 0) * partData.opt3Level;
            baseDurationEnergy += partEnergy;
        });
    
        console.log("Base duration energy after base parts:", baseDurationEnergy);
    
        const areaLingerCheckbox = document.getElementById('areaLingerCheckbox');
        if (areaLingerCheckbox && areaLingerCheckbox.checked) {
            const areaEffect = document.getElementById('areaEffect').value;
            const areaEffectCost = areaEffectCosts[areaEffect] || 0;
            baseDurationEnergy *= 1 + (areaEffectLevel * areaEffectCost);
        }
    
        console.log("Base duration energy after area effect cost:", baseDurationEnergy);
    
        // Step 2: Apply increase parts that linger
        let increasedDurationEnergy = baseDurationEnergy;
        lingerIncreaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = increasedDurationEnergy * part.base_en;
            partEnergy += increasedDurationEnergy * (part.op_1_en || 0) * partData.opt1Level;
            partEnergy += increasedDurationEnergy * (part.op_2_en || 0) * partData.opt2Level;
            partEnergy += increasedDurationEnergy * (part.op_3_en || 0) * partData.opt3Level;
            increasedDurationEnergy += partEnergy;
        });
    
        console.log("Increased duration energy after increase parts:", increasedDurationEnergy);
    
        // Step 3: Apply decrease parts that linger
        let decreasedDurationEnergy = increasedDurationEnergy;
        lingerDecreaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = decreasedDurationEnergy * part.base_en;
            partEnergy += decreasedDurationEnergy * (part.op_1_en || 0) * partData.opt1Level;
            partEnergy += decreasedDurationEnergy * (part.op_2_en || 0) * partData.opt2Level;
            partEnergy += decreasedDurationEnergy * (part.op_3_en || 0) * partData.opt3Level;
            decreasedDurationEnergy += partEnergy;
        });
    
        console.log("Decreased duration energy after decrease parts:", decreasedDurationEnergy);
    
        // Step 4: Apply duration multiplier based on the altered total energy value
        const focusChecked = document.getElementById('focusCheckbox').checked;
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked;
    
        const durationType = document.getElementById('durationType').value;
        let durationMultiplier = calculateDurationMultiplier(durationType, durationValue);
        
        if (focusChecked) durationMultiplier /= 2;
        if (noHarmChecked) durationMultiplier /= 2;
        if (endsOnceChecked) durationMultiplier /= 2;
    
        const sustainValue = parseInt(document.getElementById('sustainValue').value, 10);
        let sustainReduction = 1 - (sustainBaseReduction + (sustainValue - 1) * sustainStepReduction);
        if (sustainValue === 0) sustainReduction = 1;
    
        console.log("durationMultiplier:", durationMultiplier);
        console.log("sustainReduction:", sustainReduction);
    
        // Apply duration - 1 adjustment only if using rounds
        const adjustedDuration = durationType === 'rounds' ? durationValue - 1 : durationValue;
    
        const durationEnergy = (((((adjustedDuration) * durationMultiplier) * sustainReduction) + 1) * decreasedDurationEnergy) - decreasedDurationEnergy;
    
        console.log("Final duration energy:", durationEnergy);
    
        return durationEnergy;
    }

    function updatePowerSummary() {
        const powerName = document.getElementById('powerName').value;
        const summaryEnergy = document.getElementById('totalEnergy').textContent;
        const summaryTP = document.getElementById('totalTP').textContent;
        const summaryRange = range === 0 ? 1 : range * 3;
        const summaryDuration = duration;
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
        const actionTypeText = reactionChecked ? `${capitalize(actionType)} Reaction` : `${capitalize(actionType)} Action`;
        const focusChecked = document.getElementById('focusCheckbox').checked;
        const sustainValue = parseInt(document.getElementById('sustainValue').value, 10);
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked;

        document.getElementById('summaryEnergy').textContent = summaryEnergy;
        document.getElementById('summaryTP').textContent = summaryTP;
        document.getElementById('summaryRange').textContent = `${summaryRange} ${summaryRange > 1 ? 'Spaces' : 'Space'}`;
        document.getElementById('summaryDuration').textContent = `${summaryDuration} ${summaryDuration > 1 ? 'Rounds' : 'Round'}`;
        document.getElementById('summaryActionType').textContent = actionTypeText;

        document.getElementById('summaryFocus').style.display = focusChecked ? 'block' : 'none';
        document.getElementById('summarySustain').style.display = sustainValue > 0 ? 'block' : 'none';
        document.getElementById('summarySustainValue').textContent = sustainValue;

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        let damageText = '';
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== 'none') {
            damageText += `${dieAmount1}d${dieSize1} ${damageType1}`;
        }
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== 'none') {
            damageText += `, ${dieAmount2}d${dieSize2} ${damageType2}`;
        }
        document.getElementById('summaryDamage').textContent = damageText;
        document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';

        // Update the summary parts
        const summaryPartsContainer = document.getElementById('summaryParts');
        summaryPartsContainer.innerHTML = '';
        selectedPowerParts.forEach((partData, partIndex) => {
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
            `;
            summaryPartsContainer.appendChild(partElement);
        });

        // New: Update the summary proficiencies
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

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("addPowerPartButton").addEventListener("click", addPowerPart);
        document.getElementById('dieAmount1').addEventListener('input', updateTotalCosts);
        document.getElementById('dieSize1').addEventListener('change', updateTotalCosts);
        document.getElementById('damageType1').addEventListener('change', updateDamageType);

        const totalCostsArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (totalCostsArrow) totalCostsArrow.addEventListener('click', toggleTotalCosts);

        document.getElementById("addDecreasePartButton").addEventListener("click", addDecreasePart);
        document.getElementById("addIncreasePartButton").addEventListener("click", addIncreasePart);
        document.getElementById('durationType').addEventListener('change', changeDurationType);
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
                    <option value="magic">Magic</option>
                    <option value="fire">Fire</option>
                    <option value="ice">Ice</option>
                    <option value="lightning">Lightning</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="sonic">Sonic</option>
                    <option value="poison">Poison</option>
                    <option value="necrotic">Necrotic</option>
                    <option value="acid">Acid</option>
                    <option value="psychic">Psychic</option>
                    <option value="blunt">Blunt</option>
                    <option value="piercing">Piercing</option>
                    <option value="slashing">Slashing</option>
                </select>
                <button id="removeDamageRowButton" class="medium-button red-button" onclick="removeDamageRow()">-</button>
            </h4>
        `;
        document.getElementById('addDamageRowButton').style.display = 'none';
    }

    function removeDamageRow() {
        const additionalDamageRow = document.getElementById('additionalDamageRow');
        additionalDamageRow.innerHTML = '';
        document.getElementById('addDamageRowButton').style.display = 'inline-block';
    }

    function renderPowerParts() {
        const powerPartsContainer = document.getElementById("powerPartsContainer");
        powerPartsContainer.innerHTML = "";
    
        selectedPowerParts.forEach((partData, partIndex) => {
            const powerPartSection = document.createElement("div");
            powerPartSection.id = `powerPart-${partIndex}`;
            powerPartSection.classList.add("power-part-section");

            let filteredParts = [];
            if (!partData.part.percentage) {
                filteredParts = powerParts.filter(part => !part.percentage);
            } else if (partData.part.percentage && partData.part.base_en > 1) {
                filteredParts = powerParts.filter(part => part.percentage && part.base_en > 1);
            } else if (partData.part.percentage && partData.part.base_en < 1) {
                filteredParts = powerParts.filter(part => part.percentage && part.base_en < 1);
            }

            const selectedCategory = partData.category || 'any';
            if (selectedCategory !== 'any') {
                filteredParts = filteredParts.filter(part => part.category === selectedCategory);
            }

            filteredParts.sort((a, b) => a.name.localeCompare(b.name));

            const categories = [...new Set(powerParts.map(part => part.category))].sort();
            const categoryOptions = categories.map(category => `<option value="${category}" ${selectedCategory === category ? 'selected' : ''}>${category}</option>`).join('');

            powerPartSection.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <select onchange="updateSelectedPart(${partIndex}, this.value)">
                        ${filteredParts.map((part, index) => `<option value="${powerParts.indexOf(part)}" ${partData.part === part ? 'selected' : ''}>${part.name}</option>`).join('')}
                    </select>
                    <select id="categorySelect-${partIndex}" onchange="filterPartsByCategory(${partIndex}, this.value)">
                        <option value="any" ${selectedCategory === 'any' ? 'selected' : ''}>Any</option>
                        ${categoryOptions}
                    </select>
                </div>
                <div id="partContent-${partIndex}">
                    ${generatePartContent(partIndex, partData.part)}
                </div>
                <button class="delete-button" onclick="removePowerPart(${partIndex})">Delete</button>
            `;
            powerPartsContainer.appendChild(powerPartSection);
        });
    }

    function filterPartsByCategory(partIndex, category) {
        let filteredParts = [];
        const part = selectedPowerParts[partIndex].part;
    
        if (!part.percentage) {
            filteredParts = powerParts.filter(p => !p.percentage);
        } else if (part.percentage && part.base_en > 1) {
            filteredParts = powerParts.filter(p => p.percentage && p.base_en > 1);
        } else if (part.percentage && part.base_en < 1) {
            filteredParts = powerParts.filter(p => p.percentage && p.base_en < 1);
        }
    
        if (category !== 'any') {
            filteredParts = filteredParts.filter(part => part.category === category);
        }

        filteredParts.sort((a, b) => a.name.localeCompare(b.name));

        const selectElement = document.querySelector(`#powerPart-${partIndex} select`);
        selectElement.innerHTML = filteredParts.map((part, index) => `<option value="${powerParts.indexOf(part)}" ${selectedPowerParts[partIndex].part === part ? 'selected' : ''}>${part.name}</option>`).join('');
    }
    
    document.addEventListener("DOMContentLoaded", () => {
        const addPowerPartButton = document.getElementById("addPowerPartButton");
        if (addPowerPartButton) addPowerPartButton.addEventListener("click", addPowerPart);
    
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
    
        const focusCheckbox = document.getElementById('focusCheckbox');
        const sustainValue = document.getElementById('sustainValue');
        const noHarmCheckbox = document.getElementById('noHarmCheckbox');
        const endsOnceCheckbox = document.getElementById('endsOnceCheckbox');
        const actionType = document.getElementById('actionType');
        const reactionCheckbox = document.getElementById('reactionCheckbox');
    
        if (focusCheckbox) focusCheckbox.addEventListener('change', updatePowerSummary);
        if (sustainValue) sustainValue.addEventListener('change', updatePowerSummary);
        if (noHarmCheckbox) noHarmCheckbox.addEventListener('change', updatePowerSummary);
        if (endsOnceCheckbox) endsOnceCheckbox.addEventListener('change', updatePowerSummary);
        if (actionType) actionType.addEventListener('change', updatePowerSummary);
        if (reactionCheckbox) reactionCheckbox.addEventListener('change', updatePowerSummary);
    
        const powerName = document.getElementById('powerName');
        if (powerName) powerName.addEventListener('input', updatePowerSummary);
    });

    function addDecreasePart() {
        if (powerParts.length === 0) return; // Wait for data to load
        const partIndex = selectedPowerParts.length;
        selectedPowerParts.push({ part: powerParts.filter(part => part.percentage && part.base_en < 1)[0], opt1Level: 0, opt2Level: 0, opt3Level: 0 });

        renderPowerParts();
        updateTotalCosts();
    }

    function addIncreasePart() {
        if (powerParts.length === 0) return; // Wait for data to load
        const partIndex = selectedPowerParts.length;
        selectedPowerParts.push({ part: powerParts.filter(part => part.percentage && part.base_en > 1)[0], opt1Level: 0, opt2Level: 0, opt3Level: 0 });

        renderPowerParts();
        updateTotalCosts();
    }

    async function savePowerToLibrary(functions, userId) {
        const powerName = document.getElementById('powerName').value || '';
        const powerDescription = document.getElementById('powerDescription').value || '';
        const totalEnergy = document.getElementById('totalEnergy').textContent || '0';
        const totalTP = document.getElementById('totalTP').textContent || '0';
        const range = document.getElementById('rangeValue').textContent || '1';
        const areaEffect = document.getElementById('areaEffect').value || 'none';
        const areaEffectLevel = document.getElementById('areaEffectLevelValue').textContent || '1';
        const duration = document.getElementById('durationValue').value || '1';
        const durationType = document.getElementById('durationType').value || 'rounds';
        const actionType = document.getElementById('actionType').value || 'basic';
        const reactionChecked = document.getElementById('reactionCheckbox').checked || false;
        const focusChecked = document.getElementById('focusCheckbox').checked || false;
        const sustainValue = document.getElementById('sustainValue').value || '0';
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked || false;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked || false;
        const damageType1 = document.getElementById('damageType1').value || 'none';
        const dieAmount1 = document.getElementById('dieAmount1').value || '0';
        const dieSize1 = document.getElementById('dieSize1').value || '0';
        const damageType2 = document.getElementById('damageType2')?.value || 'none';
        const dieAmount2 = document.getElementById('dieAmount2')?.value || '0';
        const dieSize2 = document.getElementById('dieSize2')?.value || '0';

        const powerParts = selectedPowerParts.map(partData => ({
            part: partData.part.name,
            opt1Level: partData.opt1Level,
            opt2Level: partData.opt2Level,
            opt3Level: partData.opt3Level,
            linger: document.getElementById(`lingerCheckbox-${selectedPowerParts.indexOf(partData)}`)?.checked || false
        }));

        try {
            const idToken = await getAuth().currentUser.getIdToken();
            const db = getFirestore();
            const powersRef = collection(db, 'users', userId, 'library');
            const q = query(powersRef, where('name', '==', powerName));
            const querySnapshot = await getDocs(q);

            let docRef;
            if (!querySnapshot.empty) {
                docRef = doc(db, 'users', userId, 'library', querySnapshot.docs[0].id);
            } else {
                docRef = doc(powersRef);
            }

            await setDoc(docRef, {
                name: powerName,
                description: powerDescription,
                totalEnergy,
                totalTP,
                range,
                areaEffect,
                areaEffectLevel,
                duration,
                durationType,
                actionType,
                reactionChecked,
                focusChecked,
                sustainValue,
                noHarmChecked,
                endsOnceChecked,
                damage: [
                    { type: damageType1, amount: dieAmount1, size: dieSize1 },
                    { type: damageType2, amount: dieAmount2, size: dieSize2 }
                ],
                powerParts,
                timestamp: new Date()
            });

            alert('Power saved to library');
        } catch (e) {
            console.error('Error adding document: ', e);
            alert('Error saving power to library');
        }
    }

    async function loadSavedPowers(db, userId) {
        const savedPowersList = document.getElementById('savedPowersList');
        savedPowersList.innerHTML = ''; // Clear existing list
    
        try {
            const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
            querySnapshot.forEach((docSnapshot) => {
                const power = docSnapshot.data();
                const listItem = document.createElement('li');
                listItem.textContent = power.name;
    
                const loadButton = document.createElement('button');
                loadButton.textContent = 'Load';
                loadButton.addEventListener('click', () => {
                    loadPower(power);
                    closeModal();
                });
    
                listItem.appendChild(loadButton);
                savedPowersList.appendChild(listItem);
            });
        } catch (e) {
            console.error('Error fetching saved powers: ', e);
            alert('Error fetching saved powers');
        }
    }
    
    function loadPower(power) {
        document.getElementById('powerName').value = power.name;
        document.getElementById('powerDescription').value = power.description;
        document.getElementById('totalEnergy').textContent = power.totalEnergy;
        document.getElementById('totalTP').textContent = power.totalTP;
        document.getElementById('rangeValue').textContent = power.range;
        document.getElementById('areaEffect').value = power.areaEffect;
        document.getElementById('areaEffectLevelValue').textContent = power.areaEffectLevel;
        document.getElementById('durationValue').value = power.duration;
        document.getElementById('durationType').value = power.durationType;
        document.getElementById('actionType').value = power.actionType;
        document.getElementById('reactionCheckbox').checked = power.reactionChecked;
        document.getElementById('focusCheckbox').checked = power.focusChecked;
        document.getElementById('sustainValue').value = power.sustainValue;
        document.getElementById('noHarmCheckbox').checked = power.noHarmChecked;
        document.getElementById('endsOnceCheckbox').checked = power.endsOnceChecked;
    
        // Load damage values
        document.getElementById('damageType1').value = power.damage[0].type;
        document.getElementById('dieAmount1').value = power.damage[0].amount;
        document.getElementById('dieSize1').value = power.damage[0].size;
        if (power.damage[1]) {
            addDamageRow();
            document.getElementById('damageType2').value = power.damage[1].type;
            document.getElementById('dieAmount2').value = power.damage[1].amount;
            document.getElementById('dieSize2').value = power.damage[1].size;
        }
    
        // Load power parts
        selectedPowerParts.length = 0; // Clear existing parts
        power.powerParts.forEach(partData => {
            const part = powerParts.find(p => p.name === partData.part);
            selectedPowerParts.push({
                part,
                opt1Level: partData.opt1Level,
                opt2Level: partData.opt2Level,
                opt3Level: partData.opt3Level
            });
        });
    
        renderPowerParts();
        updateTotalCosts();
    }
    
    function openModal() {
        document.getElementById('loadPowerModal').style.display = 'block';
    }
    
    function closeModal() {
        document.getElementById('loadPowerModal').style.display = 'none';
    }
    
    document.addEventListener('DOMContentLoaded', function() {
        const loadPowerButton = document.getElementById('loadPowerButton');
        const closeButton = document.querySelector('.close-button');
    
        loadPowerButton.addEventListener('click', () => {
            const auth = getAuth();
            const user = auth.currentUser;
            if (user) {
                const db = getFirestore();
                loadSavedPowers(db, user.uid);
                openModal();
            } else {
                alert('Please login to load saved powers.');
            }
        });
    
        closeButton.addEventListener('click', closeModal);
    
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('loadPowerModal')) {
                closeModal();
            }
        });
    });

    document.addEventListener('DOMContentLoaded', function() {
        fetch('/__/firebase/init.json').then(response => response.json()).then(async firebaseConfig => {
            firebaseConfig.authDomain = 'realmsroleplaygame.com';
            const app = initializeApp(firebaseConfig);

            const appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
                isTokenAutoRefreshEnabled: true
            });

            const auth = getAuth(app);
            const functions = getFunctions(app);
            const db = getFirestore(app);
            const database = getDatabase(app);

            // Fetch power parts from Realtime Database
            await fetchPowerParts(database);

            onAuthStateChanged(auth, (user) => {
                const savePowerButton = document.getElementById('savePowerButton');
                if (user) {
                    console.log('User is signed in:', user);
                    savePowerButton.textContent = 'Save Power';
                    savePowerButton.addEventListener('click', () => savePowerToLibrary(functions, user.uid));
                } else {
                    console.log('No user is signed in');
                    savePowerButton.textContent = 'Login to Save Powers';
                    savePowerButton.addEventListener('click', () => {
                        window.location.href = '/login.html';
                    });
                }
            });
        }).catch(error => {
            console.error('Error fetching Firebase config:', error);
        });
    });

// Expose functions to global scope for inline event handlers
window.updateSelectedPart = updateSelectedPart;
window.changeOptionLevel = changeOptionLevel;
window.changeRange = changeRange;
window.changeArea = changeArea;
window.changeDuration = changeDuration;
window.changeDurationType = changeDurationType;
window.removePowerPart = removePowerPart;
window.updateTotalCosts = updateTotalCosts;
window.updateAreaEffect = updateAreaEffect;
window.changeAreaEffectLevel = changeAreaEffectLevel;
window.updateActionType = updateActionType;
window.updateDamageType = updateDamageType;
window.addDamageRow = addDamageRow;
window.removeDamageRow = removeDamageRow;
window.addDecreasePart = addDecreasePart;
window.addIncreasePart = addIncreasePart;
window.filterPartsByCategory = filterPartsByCategory;
window.toggleTotalCosts = toggleTotalCosts;
window.loadSavedPowers = loadSavedPowers;
window.loadPower = loadPower;
window.openModal = openModal;
window.closeModal = closeModal;

})();
