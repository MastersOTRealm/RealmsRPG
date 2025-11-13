import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
import { getFirestore, getDocs, collection, query, where, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { durationMultipliers, rangeCostPerUnit, sustainBaseReduction, sustainStepReduction } from './powerMechanics.js';

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
        selectedPowerParts.push({ part: powerParts[0], opt1Level: 0, opt2Level: 0, opt3Level: 0 });

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
        `;
    }

    function updateSelectedPart(index, selectedValue) {
        const selectedPart = powerParts[selectedValue];
        selectedPowerParts[index].part = selectedPart;
        selectedPowerParts[index].opt1Level = 0;
        selectedPowerParts[index].opt2Level = 0;
        selectedPowerParts[index].opt3Level = 0;

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
        const descElement = document.getElementById('areaEffectDescription');
        
        let partName = '';
        if (areaEffect === 'sphere') partName = 'Sphere of Effect';
        else if (areaEffect === 'cylinder') partName = 'Cylinder of Effect';
        else if (areaEffect === 'cone') partName = 'Cone of Effect';
        else if (areaEffect === 'line') partName = 'Line of Effect';
        
        if (partName) {
            const part = powerParts.find(p => p.name === partName && p.mechanic);
            if (part) {
                const opt1Level = areaEffectLevel - 1;
                descElement.textContent = part.description + (opt1Level > 0 ? ' ' + part.op_1_desc : '');
            } else {
                descElement.textContent = "Area of Effect is one target or one space.";
            }
        } else {
            descElement.textContent = "Area of Effect is one target or one space.";
        }
        
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
        const descElement = document.getElementById('actionTypeDescription');
        
        let descriptions = [];
        
        // Add action type description
        if (actionType === 'quick') {
            const quickFreePart = powerParts.find(p => p.name === 'Power Quick or Free Action' && p.mechanic);
            if (quickFreePart && quickFreePart.description) {
                descriptions.push(quickFreePart.description);
            }
        } else if (actionType === 'free') {
            const quickFreePart = powerParts.find(p => p.name === 'Power Quick or Free Action' && p.mechanic);
            if (quickFreePart && quickFreePart.op_1_desc) {
                descriptions.push(quickFreePart.op_1_desc);
            }
        } else if (actionType === 'long3') {
            const longPart = powerParts.find(p => p.name === 'Power Long Action' && p.mechanic);
            if (longPart && longPart.description) {
                descriptions.push(longPart.description);
            }
        } else if (actionType === 'long4') {
            const longPart = powerParts.find(p => p.name === 'Power Long Action' && p.mechanic);
            if (longPart && longPart.op_1_desc) {
                descriptions.push(longPart.op_1_desc);
            }
        }
        
        // Add reaction description if checked
        if (reactionChecked) {
            const reactionPart = powerParts.find(p => p.name === 'Power Reaction' && p.mechanic);
            if (reactionPart && reactionPart.description) {
                descriptions.push(reactionPart.description);
            }
        }
        
        // Set combined description
        if (descElement) {
            descElement.textContent = descriptions.join(' ');
        }
        
        updateTotalCosts();
    }

    function updateDamageType() {
        updateTotalCosts();
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
        let sumNonPercentage = 0;
        let productPercentage = 1;
        let totalTP = 0;
        tpSources = []; // Reset the array each time
    
        // Build mechanic parts based on selections
        let mechanicParts = [];
        const actionType = document.getElementById('actionType').value;
        const reactionChecked = document.getElementById('reactionCheckbox').checked;
    
        if (reactionChecked) {
            const reactionPart = powerParts.find(p => p.name === 'Power Reaction' && p.mechanic);
            if (reactionPart) {
                mechanicParts.push({ part: reactionPart, opt1Level: 0, opt2Level: 0, opt3Level: 0 });
            }
        }
    
        if (actionType === 'quick') {
            const quickFreePart = powerParts.find(p => p.name === 'Power Quick or Free Action' && p.mechanic);
            if (quickFreePart) {
                mechanicParts.push({ part: quickFreePart, opt1Level: 0, opt2Level: 0, opt3Level: 0 });
            }
        } else if (actionType === 'free') {
            const quickFreePart = powerParts.find(p => p.name === 'Power Quick or Free Action' && p.mechanic);
            if (quickFreePart) {
                mechanicParts.push({ part: quickFreePart, opt1Level: 1, opt2Level: 0, opt3Level: 0 });
            }
        } else if (actionType === 'long3') {
            const longPart = powerParts.find(p => p.name === 'Power Long Action' && p.mechanic);
            if (longPart) {
                mechanicParts.push({ part: longPart, opt1Level: 0, opt2Level: 0, opt3Level: 0 });
            }
        } else if (actionType === 'long4') {
            const longPart = powerParts.find(p => p.name === 'Power Long Action' && p.mechanic);
            if (longPart) {
                mechanicParts.push({ part: longPart, opt1Level: 1, opt2Level: 0, opt3Level: 0 });
            }
        }
    
        // Area effect mechanic parts
        const areaEffect = document.getElementById('areaEffect').value;
        let areaPartName = '';
        if (areaEffect === 'sphere') areaPartName = 'Sphere of Effect';
        else if (areaEffect === 'cylinder') areaPartName = 'Cylinder of Effect';
        else if (areaEffect === 'cone') areaPartName = 'Cone of Effect';
        else if (areaEffect === 'line') areaPartName = 'Line of Effect';
        else if (areaEffect === 'space') areaPartName = 'Trail of Effect';
        
        if (areaPartName) {
            const areaPart = powerParts.find(p => p.name === areaPartName && p.mechanic);
            if (areaPart) {
                mechanicParts.push({ part: areaPart, opt1Level: areaEffectLevel - 1, opt2Level: 0, opt3Level: 0 });
            }
        }
    
        // Damage mechanic parts - updated logic
        const addDamagePart = (damageType, dieAmount, dieSize) => {
            let partName = '';
            if (damageType === 'magic') partName = 'Magic Damage';
            else if (damageType === 'light') partName = 'Light Damage';
            else if (['fire', 'ice', 'acid', 'lightning'].includes(damageType)) partName = 'Elemental Damage';
            else if (['poison', 'necrotic'].includes(damageType)) partName = 'Poison or Necrotic Damage';
            else if (damageType === 'sonic') partName = 'Sonic Damage';
            else if (damageType === 'spiritual') partName = 'Spiritual Damage';
            else if (damageType === 'psychic') partName = 'Psychic Damage';
            else if (['blunt', 'piercing', 'slashing'].includes(damageType)) partName = 'Physical Damage';

            if (partName) {
                const damagePart = powerParts.find(p => p.name === partName && p.mechanic);
                if (damagePart) {
                    const totalDamage = dieAmount * dieSize;
                    const opt1Level = Math.floor((totalDamage - 4) / 2);
                    mechanicParts.push({ part: damagePart, opt1Level: Math.max(0, opt1Level), opt2Level: 0, opt3Level: 0 });
                }
            }
        };

        // First damage row
        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;
        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== "none") {
            addDamagePart(damageType1, dieAmount1, dieSize1);
        }

        // Second damage row
        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;
        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            addDamagePart(damageType2, dieAmount2, dieSize2);
        }

        const allParts = [...selectedPowerParts, ...mechanicParts];
    
        allParts.forEach((partData, partIndex) => {
            const part = partData.part;
            let partContribution = part.base_en;
            partContribution += (part.op_1_en || 0) * partData.opt1Level;
            partContribution += (part.op_2_en || 0) * partData.opt2Level;
            partContribution += (part.op_3_en || 0) * partData.opt3Level;
            if (part.percentage) {
                productPercentage *= partContribution;
            } else {
                sumNonPercentage += partContribution;
            }
            // TP calculation
            let partTP = part.base_tp;
            totalTP += partTP;
            const opt1TP = (part.op_1_tp || 0) * partData.opt1Level;
            const opt2TP = (part.op_2_tp || 0) * partData.opt2Level;
            const opt3TP = (part.op_3_tp || 0) * partData.opt3Level;
            totalTP += opt1TP + opt2TP + opt3TP;
            // Round down total TP for this part
            const totalPartTP = Math.floor(partTP + opt1TP + opt2TP + opt3TP);
            totalTP = totalTP - (partTP + opt1TP + opt2TP + opt3TP) + totalPartTP; // Adjust to floored value
            if (totalPartTP > 0) {
                let partSource = `${totalPartTP} TP: ${part.name}`;
                if (opt1TP > 0) partSource += ` (Option 1 Level ${partData.opt1Level}: ${opt1TP} TP)`;
                if (opt2TP > 0) partSource += ` (Option 2 Level ${partData.opt2Level}: ${opt2TP} TP)`;
                if (opt3TP > 0) partSource += ` (Option 3 Level ${partData.opt3Level}: ${opt3TP} TP)`;
                tpSources.push(partSource);
            }
        });
    
        console.log("Sum non-percentage after parts:", sumNonPercentage);
    
        // Apply range cost
        const rangeCost = range * rangeCostPerUnit;
        sumNonPercentage += rangeCost;
        const tpRange = Math.ceil(range / 4);
        totalTP += tpRange;
        if (tpRange > 0) {
            const displayRange = range === 0 ? 1 : range * 3;
            tpSources.push(`${tpRange} TP: Range ${displayRange}`);
        }
    
        console.log("Sum non-percentage after range cost:", sumNonPercentage);
    
        console.log("Product percentage after area effect:", productPercentage);
    
        // Calculate total before duration
        const totalBeforeDuration = sumNonPercentage * productPercentage;
    
        console.log("Total before duration:", totalBeforeDuration);
    
        // Apply duration multiplier
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
    
        const durationEnergy = (((((adjustedDuration) * durationMultiplier) * sustainReduction) + 1) * totalBeforeDuration) - totalBeforeDuration;
    
        console.log("Final duration energy:", durationEnergy);
    
        // Final energy calculation
        const finalEnergy = totalBeforeDuration + durationEnergy;
    
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

            const sortedParts = [...powerParts].sort((a, b) => a.name.localeCompare(b.name));

            powerPartSection.innerHTML = `
                <select onchange="updateSelectedPart(${partIndex}, this.value)">
                    ${sortedParts.map((part, index) => `<option value="${powerParts.indexOf(part)}" ${partData.part === part ? 'selected' : ''}>${part.name}</option>`).join('')}
                </select>
                <div id="partContent-${partIndex}">
                    ${generatePartContent(partIndex, partData.part)}
                </div>
                <button class="delete-button" onclick="removePowerPart(${partIndex})">Delete</button>
            `;
            powerPartsContainer.appendChild(powerPartSection);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.getElementById("addPowerPartButton").addEventListener("click", addPowerPart);
        document.getElementById('dieAmount1').addEventListener('input', updateTotalCosts);
        document.getElementById('dieSize1').addEventListener('change', updateTotalCosts);
        document.getElementById('damageType1').addEventListener('change', updateDamageType);

        const totalCostsArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (totalCostsArrow) totalCostsArrow.addEventListener('click', toggleTotalCosts);
    });

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
            opt3Level: partData.opt3Level
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
window.toggleTotalCosts = toggleTotalCosts;
window.loadSavedPowers = loadSavedPowers;
window.loadPower = loadPower;
window.openModal = openModal;
window.closeModal = closeModal;

})();
