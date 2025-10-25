import powerPartsData from './powerPartsData.js';
import damageTypeValues from './damageTypesData.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

(() => {
    const powerParts = powerPartsData;

    const selectedPowerParts = [];
    let range = 0; // Internal default value
    let area = 1;
    let duration = 1;
    let areaEffectLevel = 1; // Initialize areaEffectLevel to 1
    let durationType = 'rounds'; // Default duration type
    let tpSources = []; // New global array to track TP sources

    const areaEffectDescriptions = {
        none: "Area of Effect is one target or one space.",
        sphere: "+25% EN: Add a sphere of effect with a 1-space radius centered on yourself or a point within range that you can see. The power affects all targets within this area. +25% EN: Increase the radius by +1. Roll one attack against all targets' relevant defense.",
        cylinder: "+25% EN: Add a cylinder of effect with a 1-space radius and a 2 space height centered on yourself or a point within range that you can see. The power affects all targets within this area. +25% EN: Increase the radius by +1 or to increase the height by 4. Roll one attack against all targets' relevant defense.",
        cone: "+12.5% EN: Create a 45-degree angle cone that goes directly out from yourself for 2 spaces. +12.5% EN: Increase this effect by +1 space. Roll one attack against all targets' relevant defense.",
        line: "+25% EN: Each creature occupying a space directly between you and the power's target is affected by this power. Roll attack and damage once and apply it to all creatures affected.",
        space: "+25% EN: Each space directly between you and this power's target is affected for the power's duration. A creature that begins its turn in one of these spaces must roll the relevant defense against your potency or become affected.",
        additionalTarget: "+12.5% EN: When you affect a target with this power, you may choose a new target within half of the power's range and make an attack roll against that target. +12.5% EN: Increase the number of creatures this power can jump to by 1 (base is 1 jump).",
        expanding: "+50% EN: At the end of your turn after the round in which power was used its area of effect increases 1 space in all directions.",
        targetOnly: "-25% EN: When you first use this power and at the beginning of the turn the power was used you can choose one creature within its area of effect to target with the power. The power can only target and affect creatures in this way. You don't need to see a target to make it the target of the power."
    };

    const actionTypeDescriptions = {
        basic: "Basic Action",
        free: "+50% EN: This power uses a free action to activate instead of a basic action.",
        quick: "+25% EN: This power uses a quick action to activate instead of a basic action.",
        long3: "-12.5% EN: This power takes 1 more AP to perform (cannot be added to a quick or free action power).",
        long4: "-12.5% EN: For each additional 1 AP required. This type of power can only be used with this reduced cost if used inside combat and does not linger longer than 1 minute (10 rounds).",
        reaction: "+25% EN: This power uses a basic reaction instead of a basic action."
    };

    function addPowerPart() {
        const partIndex = selectedPowerParts.length;
        selectedPowerParts.push({ part: powerParts.filter(part => part.type === 'base')[0], opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });

        renderPowerParts();
        updateTotalCosts();
    }

    function generatePartContent(partIndex, part) {
        return `
            <h3>${part.name} <span class="small-text">Energy: <span id="baseEnergy-${partIndex}">${part.baseEnergy}</span></span> <span class="small-text">Training Points: <span id="baseTP-${partIndex}">${part.baseTP}</span></span></h3>
            <p>Part EN: <span id="totalEnergy-${partIndex}">${part.baseEnergy}</span> Part TP: <span id="totalTP-${partIndex}">${part.baseTP}</span></p>
            <p>${part.description}</p>
            
            ${part.opt1Cost !== undefined || part.opt1Description ? `
            <div class="option-container">
                ${part.opt1Cost !== undefined || part.opt1Description ? `
                <div class="option-box">
                    <h4>Energy: ${part.opt1Cost >= 0 ? '+' : ''}${part.opt1Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="opt1Level-${partIndex}">${selectedPowerParts[partIndex].opt1Level}</span></span>
                    <p>${part.opt1Description}</p>
                </div>` : ''}
                
                ${part.opt2Cost !== undefined || part.opt2Description ? `
                <div class="option-box">
                    <h4>Energy: ${part.opt2Cost >= 0 ? '+' : ''}${part.opt2Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="opt2Level-${partIndex}">${selectedPowerParts[partIndex].opt2Level}</span></span>
                    <p>${part.opt2Description}</p>
                </div>` : ''}
    
                ${part.opt3Cost !== undefined || part.opt3Description ? `
                <div class="option-box">
                    <h4>Energy: ${part.opt3Cost >= 0 ? '+' : ''}${part.opt3Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt3', -1)">-</button>
                    <span>Level: <span id="opt3Level-${partIndex}">${selectedPowerParts[partIndex].opt3Level}</span></span>
                    <p>${part.opt3Description}</p>
                </div>` : ''}
            </div>` : ''}
    
            ${part.altBaseEnergy !== undefined || part.altTP !== undefined ? `
            <div class="option-box">
                <h4>Alternate Base Energy: ${part.altBaseEnergy}</h4>
                <button id="altEnergyButton-${partIndex}" class="alt-energy-button" onclick="toggleAltEnergy(${partIndex})">Toggle</button>
                <p>${part.altEnergyDescription}</p>
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
        selectedPowerParts[index].useAltCost = false;

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

    function toggleAltEnergy(partIndex) {
        const partData = selectedPowerParts[partIndex];
        partData.useAltCost = !partData.useAltCost;

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
            days: [1, 7, 14],
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
            if (part.type === "base") {
                baseEnergyParts.push(partData);
                if (document.getElementById(`lingerCheckbox-${partIndex}`)?.checked) {
                    lingerParts.push(partData);
                }
            } else if (part.type === "increase") {
                if (document.getElementById(`lingerCheckbox-${partIndex}`)?.checked) {
                    lingerIncreaseParts.push(partData);
                } 
                increaseParts.push(partData);
            } else if (part.type === "decrease") {
                if (document.getElementById(`lingerCheckbox-${partIndex}`)?.checked) {
                    lingerDecreaseParts.push(partData);
                }
                decreaseParts.push(partData);
            }
        });
    
        console.log("Base energy parts:", baseEnergyParts);
        console.log("Linger parts:", lingerParts);
    
        // Step 1: Calculate base energy parts
        baseEnergyParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = partData.useAltCost ? part.altBaseEnergy : part.baseEnergy;
            let partTP = part.baseTP;
            partEnergy += (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += (part.opt3Cost || 0) * partData.opt3Level;
            sumBaseEnergy += partEnergy;
            totalTP += partTP;
            if (partTP > 0) {
                tpSources.push(`${partTP} TP: ${part.name}`);
            }
            // Add TP from options
            const opt1TP = (part.TPIncreaseOpt1 || 0) * partData.opt1Level;
            const opt2TP = (part.TPIncreaseOpt2 || 0) * partData.opt2Level;
            const opt3TP = (part.TPIncreaseOpt3 || 0) * partData.opt3Level;
            totalTP += opt1TP + opt2TP + opt3TP;
            if (opt1TP > 0) tpSources.push(`${opt1TP} TP: ${part.name} Option 1 (Level ${partData.opt1Level})`);
            if (opt2TP > 0) tpSources.push(`${opt2TP} TP: ${part.name} Option 2 (Level ${partData.opt2Level})`);
            if (opt3TP > 0) tpSources.push(`${opt3TP} TP: ${part.name} Option 3 (Level ${partData.opt3Level})`);
        });
    
        console.log("Sum base energy after base parts:", sumBaseEnergy);
    
        // Apply range cost before any increases or decreases
        const rangeCost = (range) * 0.5;
        sumBaseEnergy += rangeCost;
        const tpRange = Math.ceil(range / 4);
        totalTP += tpRange;
        if (tpRange > 0) {
            const displayRange = range === 0 ? 1 : range * 3;
            tpSources.push(`${tpRange} TP: Range ${displayRange}`);
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
            tpSources.push(`${tp1} TP: ${dieAmount1}d${dieSize1} ${damageType1} damage`);
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            const totalValue2 = dieAmount2 * dieSize2;
            const tp2 = Math.ceil(totalValue2 / 6);
            totalTP += tp2;
            tpSources.push(`${tp2} TP: ${dieAmount2}d${dieSize2} ${damageType2} damage`);
        }
    
        console.log("Sum base energy after damage cost:", sumBaseEnergy);
    
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
    
        console.log("Increased energy after increase parts:", increasedEnergy);
    
        // Apply area effect cost
        const areaEffect = document.getElementById('areaEffect').value;
        const areaEffectCost = {
            none: 0,
            sphere: 0.25,
            cylinder: 0.25,
            cone: 0.125,
            line: 0.25,
            space: 0.25,
            additionalTarget: 0.125,
            expanding: 0.5,
            targetOnly: -0.25
        }[areaEffect];
        increasedEnergy *= 1 + (areaEffectLevel * areaEffectCost);
    
        console.log("Increased energy after area effect cost:", increasedEnergy);
    
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
    
        console.log("Increased energy after action type cost:", increasedEnergy);
    
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
    
        console.log("Decreased energy after decrease parts:", decreasedEnergy);
    
        // Apply action type cost (only decreases)
        if (actionTypeCost < 0) {
            decreasedEnergy *= 1 + actionTypeCost;
        }
    
        console.log("Decreased energy after action type cost:", decreasedEnergy);
    
        // Step 4: Calculate duration energy
        const durationValue = parseInt(document.getElementById('durationValue').value, 10);
        let durationEnergy = calculateDurationEnergy(lingerParts, lingerIncreaseParts, lingerDecreaseParts, durationValue);
    
        console.log("Duration energy:", durationEnergy);
    
        // Final energy calculation
        const finalEnergy = decreasedEnergy + durationEnergy;
    
        console.log("Final energy:", finalEnergy);
    
        document.getElementById("totalEnergy").textContent = finalEnergy.toFixed(2);
        document.getElementById("totalTP").textContent = totalTP;
    
        updatePowerSummary();
    }
    
    function calculateDurationEnergy(lingerParts, lingerIncreaseParts, lingerDecreaseParts, duration) {
        console.log("calculateDurationEnergy called with duration:", duration);
        let baseDurationEnergy = 0;
    
        // Step 1: Calculate base energy parts that linger
        lingerParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = partData.useAltCost ? part.altBaseEnergy : part.baseEnergy;
            partEnergy += (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += (part.opt3Cost || 0) * partData.opt3Level;
            baseDurationEnergy += partEnergy;
        });
    
        console.log("Base duration energy after base parts:", baseDurationEnergy);
    
        const areaLingerCheckbox = document.getElementById('areaLingerCheckbox');
        if (areaLingerCheckbox && areaLingerCheckbox.checked) {
            const areaEffect = document.getElementById('areaEffect').value;
            const areaEffectCost = {
                none: 0,
                sphere: 0.25,
                cylinder: 0.25,
                cone: 0.125,
                line: 0.25,
                space: 0.25,
                additionalTarget: 0.125,
                expanding: 0.5,
                targetOnly: -0.25
            }[areaEffect];
            baseDurationEnergy *= 1 + (areaEffectLevel * areaEffectCost);
        }
    
        console.log("Base duration energy after area effect cost:", baseDurationEnergy);
    
        // Step 2: Apply increase parts that linger
        let increasedDurationEnergy = baseDurationEnergy;
        lingerIncreaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = increasedDurationEnergy * part.baseEnergy;
            partEnergy += increasedDurationEnergy * (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += increasedDurationEnergy * (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += increasedDurationEnergy * (part.opt3Cost || 0) * partData.opt3Level;
            increasedDurationEnergy += partEnergy;
        });
    
        console.log("Increased duration energy after increase parts:", increasedDurationEnergy);
    
        // Step 3: Apply decrease parts that linger
        let decreasedDurationEnergy = increasedDurationEnergy;
        lingerDecreaseParts.forEach((partData) => {
            const part = partData.part;
            let partEnergy = decreasedDurationEnergy * part.baseEnergy;
            partEnergy += decreasedDurationEnergy * (part.opt1Cost || 0) * partData.opt1Level;
            partEnergy += decreasedDurationEnergy * (part.opt2Cost || 0) * partData.opt2Level;
            partEnergy += decreasedDurationEnergy * (part.opt3Cost || 0) * partData.opt3Level;
            decreasedDurationEnergy += partEnergy;
        });
    
        console.log("Decreased duration energy after decrease parts:", decreasedDurationEnergy);
    
        // Step 4: Apply duration multiplier based on the altered total energy value
        const focusChecked = document.getElementById('focusCheckbox').checked;
        const noHarmChecked = document.getElementById('noHarmCheckbox').checked;
        const endsOnceChecked = document.getElementById('endsOnceCheckbox').checked;
    
        const durationType = document.getElementById('durationType').value;
        const durationMultipliers = {
            rounds: 0.125,
            minutes: 0.75,
            hours: 2.5,
            days: 8,
            permanent: 25
        };
    
        let durationMultiplier = durationMultipliers[durationType];
        if (focusChecked) durationMultiplier /= 2;
        if (noHarmChecked) durationMultiplier /= 2;
        if (endsOnceChecked) durationMultiplier /= 2;
    
        const sustainValue = parseInt(document.getElementById('sustainValue').value, 10);
        let sustainReduction = 1 - (0.25 + (sustainValue - 1) * 0.125);
        if (sustainValue === 0) sustainReduction = 1;
    
        console.log("durationMultiplier:", durationMultiplier);
        console.log("sustainReduction:", sustainReduction);
    
        // Apply duration - 1 adjustment only if using rounds
        const adjustedDuration = durationType === 'rounds' ? duration - 1 : duration;
    
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
                <p>Energy: ${part.baseEnergy}</p>
                <p>Training Points: ${part.baseTP}</p>
                <p>${part.description}</p>
                ${part.opt1Description ? `<p>Option 1: ${part.opt1Description} (Level: ${partData.opt1Level})</p>` : ''}
                ${part.opt2Description ? `<p>Option 2: ${part.opt2Description} (Level: ${partData.opt2Level})</p>` : ''}
                ${part.opt3Description ? `<p>Option 3: ${part.opt3Description} (Level: ${partData.opt3Level})</p>` : ''}
                ${part.altEnergyDescription ? `<p>Alternate Energy: ${part.altEnergyDescription}</p>` : ''}
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
            if (partData.part.type === 'base') {
                filteredParts = powerParts.filter(part => part.type === 'base');
            } else if (partData.part.type === 'increase') {
                filteredParts = powerParts.filter(part => part.type === 'increase');
            } else if (partData.part.type === 'decrease') {
                filteredParts = powerParts.filter(part => part.type === 'decrease');
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
        selectedPowerParts[partIndex].category = category;

        let filteredParts = [];
        const partType = selectedPowerParts[partIndex].part.type;
    
        if (partType === 'base') {
            filteredParts = powerParts.filter(part => part.type === 'base');
        } else if (partType === 'increase') {
            filteredParts = powerParts.filter(part => part.type === 'increase');
        } else if (partType === 'decrease') {
            filteredParts = powerParts.filter(part => part.type === 'decrease');
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
        const partIndex = selectedPowerParts.length;
        selectedPowerParts.push({ part: powerParts.filter(part => part.type === 'decrease')[0], opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });

        renderPowerParts();
        updateTotalCosts();
    }

    function addIncreasePart() {
        const partIndex = selectedPowerParts.length;
        selectedPowerParts.push({ part: powerParts.filter(part => part.type === 'increase')[0], opt1Level: 0, opt2Level: 0, opt3Level: 0, useAltCost: false });

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
            useAltCost: partData.useAltCost,
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
                opt3Level: partData.opt3Level,
                useAltCost: partData.useAltCost
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
        fetch('/__/firebase/init.json').then(response => response.json()).then(firebaseConfig => {
            firebaseConfig.authDomain = 'realmsroleplaygame.com';
            const app = initializeApp(firebaseConfig);

            const appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
                isTokenAutoRefreshEnabled: true
            });

            const auth = getAuth(app);
            const functions = getFunctions(app);

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
window.toggleAltEnergy = toggleAltEnergy;
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
