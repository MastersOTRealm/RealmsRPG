import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
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
        querySnapshot.forEach((doc) => {
            const power = doc.data();
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

            table.appendChild(row);

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

            expandedCell.appendChild(details);
            expandedCell.appendChild(powerParts);
            expandedCell.appendChild(description);
            expandedRow.appendChild(expandedCell);
            table.appendChild(expandedRow);
        });
    } catch (e) {
        console.error('Error fetching saved powers: ', e);
        alert('Error fetching saved powers');
    }

    powersList.appendChild(table);
}

function toggleExpand(row) {
    const expandedRow = row.nextElementSibling;
    if (expandedRow && expandedRow.classList.contains('expanded-row')) {
        expandedRow.style.display = expandedRow.style.display === 'table-row' ? 'none' : 'table-row';
    }
}

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
        } else {
            console.log('No user is signed in');
        }
    });
});
