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

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

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
        } else {
            console.log('No user is signed in');
        }
    });
});
