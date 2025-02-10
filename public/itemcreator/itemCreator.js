import itemPartsData from './itemPartsData.js';
// import { app, auth, appCheck } from '../scripts/firebaseConfig.js';

(() => {
    const itemParts = itemPartsData;

    const selectedItemParts = [];
    let range = 0; // Internal default value
    let handedness = "One-Handed"; // Default handedness

    function addWeaponPart() {
        const part = itemParts.find(part => part.type === 'Weapon');
        if (part) {
            selectedItemParts.push({ part, opt1Level: 0, opt2Level: 0 });
            renderItemParts();
            updateTotalCosts();
        }
    }

    function addShieldPart() {
        const part = itemParts.find(part => part.type === 'Shield');
        if (part) {
            selectedItemParts.push({ part, opt1Level: 0, opt2Level: 0 });
            renderItemParts();
            updateTotalCosts();
        }
    }

    function addArmorPart() {
        const part = itemParts.find(part => part.type === 'Armor');
        if (part) {
            selectedItemParts.push({ part, opt1Level: 0, opt2Level: 0 });
            renderItemParts();
            updateTotalCosts();
        }
    }

    function generatePartContent(partIndex, part) {
        return `
            <h3>${part.name} <span class="small-text">Item Points: <span id="baseIP-${partIndex}">${part.baseItemPoint}</span></span> <span class="small-text">Building Points: <span id="baseBP-${partIndex}">${part.baseBP}</span></span> <span class="small-text">Gold Points: <span id="baseGP-${partIndex}">${part.baseGoldPoint}</span></span></h3>
            <p>Part IP: <span id="totalIP-${partIndex}">${part.baseItemPoint}</span> Part BP: <span id="totalBP-${partIndex}">${part.baseBP}</span> Part GP: <span id="totalGP-${partIndex}">${part.baseGoldPoint}</span></p>
            <p>${part.description}</p>
            
            ${part.opt1Cost !== undefined || part.opt1Description ? `
            <div class="option-container">
                ${part.opt1Cost !== undefined || part.opt1Description ? `
                <div class="option-box">
                    <h4>Item Points: ${part.opt1Cost >= 0 ? '+' : ''}${part.opt1Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt1', -1)">-</button>
                    <span>Level: <span id="opt1Level-${partIndex}">${selectedItemParts[partIndex].opt1Level}</span></span>
                    <p>${part.opt1Description}</p>
                </div>` : ''}
                
                ${part.opt2Cost !== undefined || part.opt2Description ? `
                <div class="option-box">
                    <h4>Item Points: ${part.opt2Cost >= 0 ? '+' : ''}${part.opt2Cost}</h4>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', 1)">+</button>
                    <button onclick="changeOptionLevel(${partIndex}, 'opt2', -1)">-</button>
                    <span>Level: <span id="opt2Level-${partIndex}">${selectedItemParts[partIndex].opt2Level}</span></span>
                    <p>${part.opt2Description}</p>
                </div>` : ''}
            </div>` : ''}
        `;
    }

    function updateSelectedPart(index, selectedValue) {
        const selectedPart = itemParts[selectedValue];
        selectedItemParts[index].part = selectedPart;
        selectedItemParts[index].opt1Level = 0;
        selectedItemParts[index].opt2Level = 0;

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

    function calculateDamageIPCost() {
        let totalDamageIP = 0;
        let totalDamageBP = 0;
        let totalDamageGP = 0;

        const dieAmount1 = parseInt(document.getElementById('dieAmount1').value, 10);
        const dieSize1 = parseInt(document.getElementById('dieSize1').value, 10);
        const damageType1 = document.getElementById('damageType1').value;

        if (!isNaN(dieAmount1) && !isNaN(dieSize1) && damageType1 !== "none") {
            const damageValue1 = dieAmount1 * dieSize1;
            totalDamageIP += damageValue1 / 2;
            totalDamageBP += damageValue1 / 4 - 1;
            totalDamageGP += damageValue1 / 2;
        }

        const dieAmount2 = parseInt(document.getElementById('dieAmount2')?.value, 10);
        const dieSize2 = parseInt(document.getElementById('dieSize2')?.value, 10);
        const damageType2 = document.getElementById('damageType2')?.value;

        if (!isNaN(dieAmount2) && !isNaN(dieSize2) && damageType2 !== "none") {
            const damageValue2 = dieAmount2 * dieSize2;
            totalDamageIP += damageValue2 / 2;
            totalDamageBP += damageValue2 / 4 - 1;
            totalDamageGP += damageValue2 / 2;
        }

        return { totalDamageIP, totalDamageBP, totalDamageGP };
    }

    function calculateGoldCost(totalGP, totalIP) {
        let goldCost = 0;
        let rarity = 'Common';
        
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
            if (totalIP >= bracket.ipLow && totalIP <= bracket.ipHigh) {
                rarity = bracket.name;
                goldCost = bracket.low * (1 + 0.125 * totalGP);
                break;
            }
        }
        
        return { goldCost, rarity };
    }

    function updateTotalCosts() {
        let sumBaseIP = 0;
        let totalBP = 0;
        let totalGP = 0;
        let hasArmorPart = false;
        let hasWeaponPart = false;
    
        selectedItemParts.forEach((partData) => {
            const part = partData.part;
            let partIP = part.baseItemPoint;
            let partBP = part.baseBP;
            let partGP = part.baseGoldPoint;
            partIP += (part.opt1Cost || 0) * partData.opt1Level;
            partIP += (part.opt2Cost || 0) * partData.opt2Level;
            partBP += (part.BPIncreaseOpt1 || 0) * partData.opt1Level;
            partBP += (part.BPIncreaseOpt2 || 0) * partData.opt2Level;
            partGP += (part.GPIncreaseOpt1 || 0) * partData.opt1Level;
            partGP += (part.GPIncreaseOpt2 || 0) * partData.opt2Level;
            sumBaseIP += partIP;
            totalBP += partBP;
            totalGP += partGP;

            if (part.type === 'Armor') {
                hasArmorPart = true;
            }
            if (part.type === 'Weapon') {
                hasWeaponPart = true;
            }
        });
    
        // Apply range cost before any increases or decreases
        if (range > 0) {
            const rangeCost = 2 + (range - 1) * 1;
            const rangeBP = 0.5 + (range - 1) * 0.25;
            const rangeGP = 1 + (range - 1) * 1;
            sumBaseIP += rangeCost;
            totalBP += rangeBP;
            totalGP += rangeGP;
        }

        // Apply handedness cost
        if (handedness === "Two-Handed") {
            sumBaseIP -= 2;
            totalBP += 0.5;
            totalGP += 1;
        }

        // Apply armor part cost
        if (hasArmorPart) {
            sumBaseIP += 2;
        }

        // Calculate damage IP cost
        const { totalDamageIP, totalDamageBP, totalDamageGP } = calculateDamageIPCost();
        sumBaseIP += totalDamageIP;
        totalBP += totalDamageBP;
        totalGP += totalDamageGP;
    
        // Calculate gold cost and rarity
        const { goldCost, rarity } = calculateGoldCost(totalGP, sumBaseIP);
    
        // Final IP calculation
        const finalIP = sumBaseIP;
    
        const totalIPElement = document.getElementById("totalIP");
        const totalBPElement = document.getElementById("totalBP");
        const totalGPElement = document.getElementById("totalGP");
        const totalRarityElement = document.getElementById("totalRarity");
    
        if (totalIPElement) totalIPElement.textContent = finalIP.toFixed(2);
        if (totalBPElement) totalBPElement.textContent = totalBP;
        if (totalGPElement) totalGPElement.textContent = goldCost.toFixed(2);
        if (totalRarityElement) totalRarityElement.textContent = rarity;
    
        updateItemSummary(finalIP, rarity);
    }

    function updateItemSummary(totalIP, rarity) {
        const itemName = document.getElementById('itemName').value;
        const summaryIP = document.getElementById('totalIP')?.textContent;
        const summaryBP = document.getElementById('totalBP')?.textContent;
        const summaryGP = document.getElementById('totalGP')?.textContent;
        const summaryRange = range === 0 ? 'Melee' : `${range * 8} Spaces`;

        if (document.getElementById('summaryIP')) document.getElementById('summaryIP').textContent = summaryIP;
        if (document.getElementById('summaryBP')) document.getElementById('summaryBP').textContent = summaryBP;
        if (document.getElementById('summaryGP')) document.getElementById('summaryGP').textContent = summaryGP;
        if (document.getElementById('summaryRange')) document.getElementById('summaryRange').textContent = summaryRange;

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
        if (document.getElementById('summaryDamage')) {
            document.getElementById('summaryDamage').textContent = damageText;
            document.getElementById('summaryDamage').style.display = damageText ? 'block' : 'none';
        }

        // Update the summary parts
        const summaryPartsContainer = document.getElementById('summaryParts');
        if (summaryPartsContainer) {
            summaryPartsContainer.innerHTML = '';
            selectedItemParts.forEach((partData, partIndex) => {
                const part = partData.part;
                const partElement = document.createElement('div');
                partElement.innerHTML = `
                    <h4>${part.name}</h4>
                    <p>Item Points: ${part.baseItemPoint}</p>
                    <p>Building Points: ${part.baseBP}</p>
                    <p>Gold Points: ${part.baseGoldPoint}</p>
                    <p>${part.description}</p>
                    ${part.opt1Description ? `<p>Option 1: ${part.opt1Description} (Level: ${partData.opt1Level})</p>` : ''}
                    ${part.opt2Description ? `<p>Option 2: ${part.opt2Description} (Level: ${partData.opt2Level})</p>` : ''}
                `;
                summaryPartsContainer.appendChild(partElement);
            });
        }

        // Update rarity based on total IP and gold cost
        if (document.getElementById('summaryRarity')) document.getElementById('summaryRarity').textContent = rarity;
    }

    function toggleTotalCosts() {
        const totalCosts = document.getElementById('totalCosts');
        totalCosts.classList.toggle('collapsed');
        const arrow = document.querySelector('#totalCosts .toggle-arrow');
        arrow.textContent = totalCosts.classList.contains('collapsed') ? '>' : '<';
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

        const addShieldPartButton = document.getElementById("addShieldPartButton");
        if (addShieldPartButton) addShieldPartButton.addEventListener("click", addShieldPart);

        const addArmorPartButton = document.getElementById("addArmorPartButton");
        if (addArmorPartButton) addArmorPartButton.addEventListener("click", addArmorPart);

        const handednessSelect = document.getElementById("handedness");
        if (handednessSelect) handednessSelect.addEventListener("change", (event) => changeHandedness(event.target.value));

        const toggleArrow = document.querySelector('#totalCosts .toggle-arrow');
        if (toggleArrow) toggleArrow.addEventListener('click', toggleTotalCosts);
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

            let filteredParts = itemParts.filter(part => part.type === partData.part.type);

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