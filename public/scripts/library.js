import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";

function openTab(event, tabName) {
    const tabContents = document.querySelectorAll(".tab-content");
    tabContents.forEach(content => content.classList.remove("active-tab"));

    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach(button => button.classList.remove("active"));

    document.getElementById(tabName).classList.add("active-tab");
    event.currentTarget.classList.add("active");
}

// Expose the function to the global scope
window.openTab = openTab;

async function showSavedPowers(db, userId) {
    const powersList = document.getElementById('powersList');
    powersList.innerHTML = ''; // Clear existing list

    const table = document.createElement('table');
    table.classList.add('powers-table');

    const headerRow = document.createElement('tr');
    const headers = ['Name', 'Energy', 'Action', 'Duration', 'Range', 'Area of Effect', 'Defence Targeted', 'Damage'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
        querySnapshot.forEach((docSnapshot) => {
            const power = docSnapshot.data();
            const rowGroup = document.createElement('tbody'); // Create a tbody to group summary and expanded rows

            const row = document.createElement('tr');
            row.classList.add('power-row');
            row.addEventListener('click', () => toggleExpand(row));

            const nameCell = document.createElement('td');
            nameCell.textContent = power.name;
            row.appendChild(nameCell);

            const valueCell = document.createElement('td');
            const energy = Math.ceil(power.totalEnergy) || 1;
            valueCell.textContent = energy;
            row.appendChild(valueCell);

            const actionTypeCell = document.createElement('td');
            actionTypeCell.textContent = formatActionType(power.actionType, power.reactionChecked);
            row.appendChild(actionTypeCell);

            const durationCell = document.createElement('td');
            durationCell.textContent = power.duration ? `${power.duration} ${capitalize(power.durationType)}` : '1 round';
            row.appendChild(durationCell);

            const rangeCell = document.createElement('td');
            rangeCell.textContent = power.range;
            row.appendChild(rangeCell);

            const areaEffectCell = document.createElement('td');
            areaEffectCell.textContent = power.areaEffect === 'none (1)' ? '1 target/space' : capitalize(`${power.areaEffect} (${power.areaEffectLevel})`);
            row.appendChild(areaEffectCell);

            const targetsCell = document.createElement('td');
            targetsCell.textContent = power.targets;
            row.appendChild(targetsCell);

            const damageCell = document.createElement('td');
            damageCell.innerHTML = formatDamage(power.damage);
            row.appendChild(damageCell);

            rowGroup.appendChild(row); // Append summary row to tbody

            const expandedRow = document.createElement('tr');
            expandedRow.classList.add('expanded-row');
            const expandedCell = document.createElement('td');
            expandedCell.colSpan = headers.length;

            const details = document.createElement('div');
            details.classList.add('details');
            details.innerHTML = `
                <p><strong>Building Points:</strong> ${power.totalBP}</p>
                ${power.focusChecked ? '<p><strong>Requires Focus</strong></p>' : ''}
                ${power.sustainValue > 0 ? `<p><strong>Sustain:</strong> ${power.sustainValue} Action Points</p>` : ''}
            `;

            const powerParts = document.createElement('div');
            powerParts.classList.add('power-parts');
            power.powerParts.sort((a, b) => a.part.localeCompare(b.part)).forEach(part => {
                const partDiv = document.createElement('div');
                partDiv.textContent = part.part;
                if (part.opt1Level) partDiv.textContent += ` Opt 1: (${part.opt1Level})`;
                if (part.opt2Level) partDiv.textContent += ` Opt 2: (${part.opt2Level})`;
                if (part.opt3Level) partDiv.textContent += ` Opt 3: (${part.opt3Level})`;
                powerParts.appendChild(partDiv);
            });

            const description = document.createElement('div');
            description.classList.add('description');
            description.textContent = power.description;

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Power';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to say goodbye to ${power.name}?`)) {
                    try {
                        await deleteDoc(doc(db, 'users', userId, 'library', docSnapshot.id));
                        rowGroup.remove();
                    } catch (error) {
                        console.error('Error deleting power: ', error);
                        alert('Error deleting power');
                    }
                }
            });

            expandedCell.appendChild(details);
            expandedCell.appendChild(powerParts);
            expandedCell.appendChild(description);
            expandedCell.appendChild(deleteButton);
            expandedRow.appendChild(expandedCell);
            rowGroup.appendChild(expandedRow); // Append expanded row to tbody

            table.appendChild(rowGroup); // Append tbody to table
        });
    } catch (e) {
        console.error('Error fetching saved powers: ', e);
        alert('Error fetching saved powers');
    }

    powersList.appendChild(table);
}

async function showSavedItems(db, userId) {
    const armamentsList = document.getElementById('armamentsList');
    armamentsList.innerHTML = ''; // Clear existing list

    const table = document.createElement('table');
    table.classList.add('powers-table');

    // Top row: name, rarity, gold cost, building point cost, range, damage
    const headers = [
        'Name', 'Rarity', 'Gold Cost', 'Building Points', 'Range', 'Damage'
    ];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'itemLibrary'));
        querySnapshot.forEach((docSnapshot) => {
            const item = docSnapshot.data();
            const rowGroup = document.createElement('tbody');

            // Top row: name, rarity, gold cost, building points, range, damage
            const row = document.createElement('tr');
            row.classList.add('power-row');
            row.addEventListener('click', () => toggleExpand(row));

            // Name
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name;
            row.appendChild(nameCell);

            // Rarity
            const rarityCell = document.createElement('td');
            rarityCell.textContent = item.rarity || '';
            row.appendChild(rarityCell);

            // Gold Cost
            const gpCell = document.createElement('td');
            gpCell.textContent = item.totalGP !== undefined ? item.totalGP : '';
            row.appendChild(gpCell);

            // Building Points
            const bpCell = document.createElement('td');
            bpCell.textContent = item.totalBP !== undefined ? item.totalBP : '';
            row.appendChild(bpCell);

            // Range
            const rangeCell = document.createElement('td');
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
            rangeCell.textContent = rangeStr;
            row.appendChild(rangeCell);

            // Damage
            const dmgCell = document.createElement('td');
            let damageStr = "";
            if (item.damage && Array.isArray(item.damage)) {
                damageStr = item.damage
                    .filter(d => d && d.amount && d.size && d.type && d.type !== 'none')
                    .map(d => `${d.amount}d${d.size} ${d.type}`)
                    .join(', ');
            }
            dmgCell.textContent = damageStr;
            row.appendChild(dmgCell);

            rowGroup.appendChild(row);

            // Expanded row: item parts (with hover descriptions), description, delete button
            const expandedRow = document.createElement('tr');
            expandedRow.classList.add('expanded-row');
            const expandedCell = document.createElement('td');
            expandedCell.colSpan = headers.length;

            const details = document.createElement('div');
            details.classList.add('details');
            details.innerHTML = `
                <p><strong>Description:</strong> ${item.description || ''}</p>
                <p><strong>Saved:</strong> ${item.timestamp ? new Date(item.timestamp.seconds ? item.timestamp.seconds * 1000 : item.timestamp).toLocaleString() : ''}</p>
            `;

            // Parts with hover descriptions
            const itemPartsDiv = document.createElement('div');
            itemPartsDiv.classList.add('power-parts');
            if (item.itemParts && item.itemParts.length > 0) {
                item.itemParts.forEach(part => {
                    const partDiv = document.createElement('div');
                    partDiv.textContent = part.part;
                    partDiv.style.display = 'inline-block';
                    partDiv.style.marginRight = '10px';
                    partDiv.style.cursor = 'help';
                    if (window.itemPartsData) {
                        const found = window.itemPartsData.find(p => p.name === part.part);
                        if (found && found.description) {
                            partDiv.title = found.description;
                        }
                    }
                    if (part.opt1Level) partDiv.textContent += ` Opt 1: (${part.opt1Level})`;
                    if (part.opt2Level) partDiv.textContent += ` Opt 2: (${part.opt2Level})`;
                    itemPartsDiv.appendChild(partDiv);
                });
            }

            // Damage (optional, if you want to show it in expanded)
            if (item.damage && Array.isArray(item.damage)) {
                const dmgDiv = document.createElement('div');
                dmgDiv.innerHTML = `<strong>Damage:</strong> ${damageStr}`;
                itemPartsDiv.appendChild(dmgDiv);
            }

            // Delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Item';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                    try {
                        await deleteDoc(doc(db, 'users', userId, 'itemLibrary', docSnapshot.id));
                        rowGroup.remove();
                    } catch (error) {
                        console.error('Error deleting item: ', error);
                        alert('Error deleting item');
                    }
                }
            });

            expandedCell.appendChild(details);
            expandedCell.appendChild(itemPartsDiv);
            expandedCell.appendChild(deleteButton);
            expandedRow.appendChild(expandedCell);
            rowGroup.appendChild(expandedRow);

            table.appendChild(rowGroup);
        });
    } catch (e) {
        console.error('Error fetching saved items: ', e);
        alert('Error fetching saved items');
    }

    armamentsList.appendChild(table);
}

async function showSavedTechniques(db, userId) {
    const techniquesList = document.getElementById('techniquesList');
    if (!techniquesList) return;
    techniquesList.innerHTML = '';

    const table = document.createElement('table');
    table.classList.add('powers-table');

    const headers = ['Name', 'Energy', 'BP', 'Action', 'Weapon', 'Damage'];
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'techniqueLibrary'));
        querySnapshot.forEach((docSnapshot) => {
            const technique = docSnapshot.data();
            const rowGroup = document.createElement('tbody');

            const row = document.createElement('tr');
            row.classList.add('power-row');
            row.addEventListener('click', () => toggleExpand(row));

            // Name
            const nameCell = document.createElement('td');
            nameCell.textContent = technique.name;
            row.appendChild(nameCell);

            // Energy
            const energyCell = document.createElement('td');
            energyCell.textContent = technique.totalEnergy;
            row.appendChild(energyCell);

            // BP
            const bpCell = document.createElement('td');
            bpCell.textContent = technique.totalBP;
            row.appendChild(bpCell);

            // Action
            const actionCell = document.createElement('td');
            actionCell.textContent = formatActionType(technique.actionType, technique.reactionChecked);
            row.appendChild(actionCell);

            // Weapon
            const weaponCell = document.createElement('td');
            weaponCell.textContent = technique.weapon && technique.weapon.name ? technique.weapon.name : "Unarmed Prowess";
            row.appendChild(weaponCell);

            // Damage
            const dmgCell = document.createElement('td');
            let damageStr = "";
            if (technique.damage && Array.isArray(technique.damage)) {
                damageStr = technique.damage
                    .filter(d => d && d.amount && d.size && d.amount !== '0' && d.size !== '0')
                    .map(d => `Increased Damage: ${d.amount}d${d.size}`)
                    .join(', ');
            }
            dmgCell.textContent = damageStr;
            row.appendChild(dmgCell);

            rowGroup.appendChild(row);

            // Expanded row
            const expandedRow = document.createElement('tr');
            expandedRow.classList.add('expanded-row');
            const expandedCell = document.createElement('td');
            expandedCell.colSpan = headers.length;

            const details = document.createElement('div');
            details.classList.add('details');
            details.innerHTML = `
                <p><strong>Description:</strong> ${technique.description || ''}</p>
                <p><strong>Saved:</strong> ${technique.timestamp ? new Date(technique.timestamp.seconds ? technique.timestamp.seconds * 1000 : technique.timestamp).toLocaleString() : ''}</p>
            `;

            // Technique parts
            const partsDiv = document.createElement('div');
            partsDiv.classList.add('power-parts');
            if (technique.techniqueParts && technique.techniqueParts.length > 0) {
                technique.techniqueParts.forEach(part => {
                    const partDiv = document.createElement('div');
                    partDiv.textContent = part.part;
                    if (part.opt1Level) partDiv.textContent += ` Opt 1: (${part.opt1Level})`;
                    if (part.opt2Level) partDiv.textContent += ` Opt 2: (${part.opt2Level})`;
                    if (part.opt3Level) partDiv.textContent += ` Opt 3: (${part.opt3Level})`;
                    partsDiv.appendChild(partDiv);
                });
            }

            // Delete button (optional, if you want to allow deletion)
            // ...add delete logic if desired...

            expandedCell.appendChild(details);
            expandedCell.appendChild(partsDiv);
            expandedRow.appendChild(expandedCell);
            rowGroup.appendChild(expandedRow);

            table.appendChild(rowGroup);
        });
    } catch (e) {
        console.error('Error fetching saved techniques: ', e);
        alert('Error fetching saved techniques');
    }

    techniquesList.appendChild(table);
}

// --- Creature Library Tab Logic ---

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

async function showSavedCreatures(db, userId) {
    const creaturesTable = document.querySelector('#creatures .creature-table tbody');
    if (!creaturesTable) return;
    creaturesTable.innerHTML = ''; // Clear existing

    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'creatureLibrary'));
        if (querySnapshot.empty) {
            creaturesTable.innerHTML = `<tr><td colspan="4" style="text-align:center;">No saved creatures found.</td></tr>`;
            return;
        }

        querySnapshot.forEach(docSnap => {
            const creature = docSnap.data();

            // --- Summary Row ---
            const summaryRow = document.createElement('tr');
            summaryRow.className = 'creature-summary-row';
            summaryRow.onclick = function() { toggleCreatureExpand(this); };

            // Name, Level, Type, Archetype
            summaryRow.innerHTML = `
                <td>${creature.name || '-'}</td>
                <td>Level ${creature.level || '-'}</td>
                <td>${creature.type || '-'}</td>
                <td>${creature.archetype || '-'}</td>
            `;

            // --- Expanded Row ---
            const expandedRow = document.createElement('tr');
            expandedRow.className = 'creature-expanded-row';
            expandedRow.style.display = 'none';
            const expandedCell = document.createElement('td');
            expandedCell.colSpan = 4;

            // --- Abilities Table ---
            function abilityCell(val) {
                if (typeof val === 'number' && val >= 0) return `+${val}`;
                return val;
            }
            const ab = creature.abilities || {};
            const abilitiesTable = `
                <table>
                    <tr>
                        <th>STR</th><th>VIT</th><th>AGG</th>
                    </tr>
                    <tr>
                        <td>${abilityCell(ab.strength)}</td>
                        <td>${abilityCell(ab.vitality)}</td>
                        <td>${abilityCell(ab.agility)}</td>
                    </tr>
                    <tr>
                        <th>ACU</th><th>INT</th><th>CHA</th>
                    </tr>
                    <tr>
                        <td>${abilityCell(ab.acuity)}</td>
                        <td>${abilityCell(ab.intelligence)}</td>
                        <td>${abilityCell(ab.charisma)}</td>
                    </tr>
                </table>
            `;

            // --- Defenses Table ---
            const df = creature.defenses || {};
            const defensesTable = `
                <table>
                    <tr>
                        <th>MGT</th><th>FRT</th><th>RFX</th>
                    </tr>
                    <tr>
                        <td>${df.might ?? ''}</td>
                        <td>${df.fortitude ?? ''}</td>
                        <td>${df.reflex ?? ''}</td>
                    </tr>
                    <tr>
                        <th>DSC</th><th>MFT</th><th>RSL</th>
                    </tr>
                    <tr>
                        <td>${df.discernment ?? ''}</td>
                        <td>${df.mentalFortitude ?? ''}</td>
                        <td>${df.resolve ?? ''}</td>
                    </tr>
                </table>
            `;

            // --- Details Box ---
            function arrStr(arr, descMap) {
                if (!arr || !arr.length) return 'None';
                // If descMap is provided, add title for hover
                return arr.map(val => {
                    if (descMap && descMap[val]) {
                        return `<span title="${descMap[val]}">${val}</span>`;
                    }
                    return val;
                }).join(', ');
            }
            const detailsBox = `
                <h4>Details</h4>
                <div class="creature-details-group">
                    <div><strong>Resistances:</strong> ${arrStr(creature.resistances)}</div>
                    <div><strong>Weaknesses:</strong> ${arrStr(creature.weaknesses)}</div>
                    <div><strong>Senses:</strong> ${arrStr(creature.senses, SENSES_DESCRIPTIONS)}</div>
                    <div><strong>Languages:</strong> ${arrStr(creature.languages)}</div>
                    <div><strong>Immunities:</strong> ${arrStr(creature.immunities)}</div>
                    <div><strong>Movement:</strong> ${arrStr(creature.movement, MOVEMENT_DESCRIPTIONS)}</div>
                    <div><strong>Skills:</strong> ${
                        (creature.skills && creature.skills.length)
                        ? creature.skills.map(s => `${s.name} ${s.bonus >= 0 ? '+' : ''}${s.bonus}`).join(', ')
                        : 'None'
                    }</div>
                </div>
            `;

            // --- Feats Box ---
            const featsBox = `
                <h4>Feats</h4>
                <div>
                    ${
                        (creature.feats && creature.feats.length)
                        ? creature.feats.map(f => {
                            // f is now always { name, description }
                            const featName = typeof f === "string" ? f : (f && f.name ? f.name : "");
                            const desc = f && f.description ? f.description : "";
                            if (!featName) return "";
                            return `<strong>${featName}:</strong> <span style="font-style:italic;">${desc || "(No description found)"}</span>`;
                        }).filter(Boolean).join('<br>')
                        : 'None'
                    }
                </div>
            `;

            // --- Attacks (Armaments) Box ---
            function formatAttack(item, ab, prof) {
                // To hit: STR + proficiency
                const str = ab.strength ?? 0;
                const toHit = str + prof;
                let rangeStr = "Melee";
                if (item.range !== undefined && item.range !== null && item.range !== "") {
                    if (typeof item.range === "number" && item.range > 0) rangeStr = `${item.range}`;
                    else if (typeof item.range === "string" && item.range.trim() !== "") rangeStr = item.range;
                }
                let dmgStr = "";
                if (item.damage && Array.isArray(item.damage)) {
                    const dmg = item.damage.find(d => d && d.amount && d.size && d.type && d.type !== 'none');
                    if (dmg) dmgStr = `${dmg.amount}d${dmg.size} ${dmg.type}`;
                }
                let propsStr = "";
                if (Array.isArray(item.itemParts) && item.itemParts.length > 0) {
                    propsStr = item.itemParts.map(part => {
                        let prop = part.part || "";
                        let opts = [];
                        if (part.opt1Level) opts.push(`Opt 1 +${part.opt1Level}`);
                        if (part.opt2Level) opts.push(`Opt 2 +${part.opt2Level}`);
                        if (part.opt3Level) opts.push(`Opt 3 +${part.opt3Level}`);
                        if (opts.length > 0) prop += " (" + opts.join(", ") + ")";
                        return prop;
                    }).join(", ");
                    if (propsStr) propsStr = " " + propsStr;
                }
                let descStr = item.description ? ` ${item.description}` : "";
                return `<strong>${item.name}:</strong> ${rangeStr} range attack. +${toHit} to hit. ${dmgStr} damage.${propsStr}${descStr}`;
            }
            let prof = 2 + Math.floor((creature.level || 1) / 5);
            const attacksBox = `
                <h4>Attacks</h4>
                <div>
                    ${
                        (creature.armaments && creature.armaments.length)
                        ? creature.armaments.map(item => formatAttack(item, ab, prof)).join('<br>')
                        : 'None'
                    }
                </div>
            `;

            // --- Techniques Box ---
            function formatTechnique(tech, ab, prof) {
                let rangeStr = "Melee";
                if (tech.weapon && tech.weapon.range !== undefined && tech.weapon.range !== null && tech.weapon.range !== "") {
                    if (typeof tech.weapon.range === "number" && tech.weapon.range > 0) rangeStr = `${tech.weapon.range}`;
                    else if (typeof tech.weapon.range === "string" && tech.weapon.range.trim() !== "") rangeStr = tech.weapon.range;
                }
                const str = ab.strength ?? 0;
                const toHit = str + prof;
                let dmgStr = "";
                if (Array.isArray(tech.damage)) {
                    const dmg = tech.damage.find(d => d && d.amount && d.size && d.amount !== '0' && d.size !== '0');
                    if (dmg) dmgStr = `${dmg.amount}d${dmg.size}`;
                }
                let propsStr = "";
                if (tech.weapon && Array.isArray(tech.weapon.itemParts) && tech.weapon.itemParts.length > 0) {
                    propsStr = tech.weapon.itemParts.map(part => {
                        let prop = part.part || "";
                        let opts = [];
                        if (part.opt1Level) opts.push(`Opt 1 +${part.opt1Level}`);
                        if (part.opt2Level) opts.push(`Opt 2 +${part.opt2Level}`);
                        if (part.opt3Level) opts.push(`Opt 3 +${part.opt3Level}`);
                        if (opts.length > 0) prop += " (" + opts.join(", ") + ")";
                        return prop;
                    }).join(", ");
                    if (propsStr) propsStr = " " + propsStr;
                }
                const energy = tech.totalEnergy !== undefined ? tech.totalEnergy : (tech.energy !== undefined ? tech.energy : "-");
                let action = tech.actionType ? capitalize(tech.actionType) : '-';
                if (tech.reactionChecked) action += " Reaction";
                else if (action !== '-') action += " Action";
                const desc = tech.description ? ` ${tech.description}` : "";
                let attackStr = `<strong>${tech.name}:</strong> ${rangeStr} range attack. +${toHit} to hit.`;
                if (dmgStr) attackStr += ` ${dmgStr} damage.`;
                else attackStr += " ";
                attackStr += `${propsStr} (Energy: ${energy}, Action: ${action}).${desc}`;
                return attackStr.trim();
            }
            const techniquesBox = `
                <h4>Techniques</h4>
                <div>
                    ${
                        (creature.techniques && creature.techniques.length)
                        ? creature.techniques.map(tech => formatTechnique(tech, ab, prof)).join('<br>')
                        : 'None'
                    }
                </div>
            `;

            // --- Powers Box ---
            function formatPower(power) {
                const name = power.name || "";
                let energy = 0;
                if (power.totalEnergy !== undefined && !isNaN(power.totalEnergy)) energy = Math.ceil(Number(power.totalEnergy));
                else if (power.energy !== undefined && !isNaN(power.energy)) energy = Math.ceil(Number(power.energy));
                let action = (power.action && power.action !== "-") ? power.action : (power.actionType && power.actionType !== "-") ? capitalize(power.actionType) : "Basic Action";
                if (!action || action === "-") action = "Basic Action";
                let range = 1;
                if (power.range !== undefined && power.range !== null && power.range !== "") {
                    if (!isNaN(power.range)) range = Number(power.range);
                    else if (typeof power.range === "string" && power.range.trim() !== "") {
                        const parsed = parseInt(power.range, 10);
                        if (!isNaN(parsed)) range = parsed;
                    }
                }
                let rangeStr = `${range} ${range === 1 ? "space" : "spaces"} Range`;
                const desc = power.description ? `Description: ${power.description}` : "";
                return `<strong>${name}:</strong> ${energy} EN, ${action}, ${rangeStr}. ${desc}`.replace(/\s+\./g, '.').replace(/\s+$/, '');
            }
            const powersBox = `
                <h4>Powers</h4>
                <div>
                    ${
                        (creature.powers && creature.powers.length)
                        ? creature.powers.map(power => formatPower(power)).join('<br>')
                        : 'None'
                    }
                </div>
            `;

            // --- Other Details Box ---
            const otherBox = `
                <h4>Other Details</h4>
                <div style="margin-top:10px;"><strong>Description:</strong> ${creature.description || ''}</div>
            `;

            // --- Compose Expanded Content ---
            expandedCell.innerHTML = `
                <div class="creature-expanded-content" style="flex-wrap:wrap;">
                    <div style="display:flex;flex-direction:column;gap:10px;min-width:200px;max-width:250px;">
                        <div style="display:flex;gap:10px;">
                            <div class="creature-abilities-box">
                                <div class="creature-abilities">${abilitiesTable}</div>
                            </div>
                            <div class="creature-defenses-box">
                                <div class="creature-defenses">${defensesTable}</div>
                            </div>
                        </div>
                        <div class="creature-other-box">${otherBox}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:10px;min-width:220px;max-width:260px;flex:1 1 220px;">
                        <div class="creature-details-box">${detailsBox}</div>
                        <div class="creature-feats-box">${featsBox}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:10px;min-width:220px;max-width:260px;flex:1 1 220px;">
                        <div class="creature-attacks-box">${attacksBox}</div>
                        <div class="creature-powers-box">${powersBox}${techniquesBox}</div>
                    </div>
                </div>
            `;
            expandedRow.appendChild(expandedCell);

            creaturesTable.appendChild(summaryRow);
            creaturesTable.appendChild(expandedRow);
        });
    } catch (e) {
        creaturesTable.innerHTML = `<tr><td colspan="4" style="text-align:center;">Error loading creatures.</td></tr>`;
        console.error('Error fetching saved creatures: ', e);
    }
}

// Helper: Get feat description by name (from creatureFeatsData if available)
function getFeatDescription(name) {
    // Try window.creatureFeatsData (loaded in browser) or import if available
    let featsArr = [];
    if (window.creatureFeatsData && Array.isArray(window.creatureFeatsData)) {
        featsArr = window.creatureFeatsData;
    } else if (window.default && Array.isArray(window.default)) {
        featsArr = window.default;
    }
    // Try to find by name (case-insensitive)
    const feat = featsArr.find(f => f.name && f.name.toLowerCase() === name.toLowerCase());
    return feat ? feat.description : '';
}

// Helper: Capitalize
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function toggleExpand(row) {
    const expandedRow = row.nextElementSibling;
    if (expandedRow && expandedRow.classList.contains('expanded-row')) {
        expandedRow.style.display = expandedRow.style.display === 'table-row' ? 'none' : 'table-row';
    }
}

// Creature stat block expand/collapse
window.toggleCreatureExpand = function(row) {
    const expanded = row.nextElementSibling;
    if (expanded && expanded.classList.contains('creature-expanded-row')) {
        expanded.style.display = expanded.style.display === 'table-row' ? 'none' : 'table-row';
    }
};

function formatActionType(actionType, reactionChecked) {
    const formattedActionType = capitalize(actionType);
    return reactionChecked ? `${formattedActionType} Reaction` : `${formattedActionType} Action`;
}

function formatDamage(damageArray) {
    return damageArray.map(damage => {
        if (damage.amount && damage.size && damage.type !== 'none') {
            return `${damage.amount}d${damage.size} ${damage.type}`;
        }
        return '';
    }).join('');
}

function formatItemDamage(damageArray) {
    if (!Array.isArray(damageArray)) return '';
    return damageArray
        .filter(dmg => dmg && dmg.amount && dmg.size && dmg.type && dmg.type !== 'none')
        .map(dmg => `${dmg.amount}d${dmg.size} ${dmg.type}`)
        .join(', ');
}

document.addEventListener('DOMContentLoaded', async function() {
    const response = await fetch('/__/firebase/init.json');
    const firebaseConfig = await response.json();
    firebaseConfig.authDomain = 'realmsroleplaygame.com';
    const app = initializeApp(firebaseConfig);

    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
        isTokenAutoRefreshEnabled: true
    });

    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log('User is signed in:', user); // Debugging log
            showSavedPowers(db, user.uid);
            showSavedItems(db, user.uid); // <-- Load armaments
            showSavedTechniques(db, user.uid); // <-- Load techniques
            showSavedCreatures(db, user.uid); // <-- Load creatures into the tab
        } else {
            console.log('No user is signed in');
        }
    });
});
