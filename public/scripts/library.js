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
    try {
        const querySnapshot = await getDocs(collection(db, 'users', userId, 'library'));
        console.log('Fetched powers:', querySnapshot.size); // Debugging log
        querySnapshot.forEach((doc) => {
            const power = doc.data();
            console.log('Power data:', power); // Debugging log
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <h4>${power.name}</h4>
                <p><strong>Energy:</strong> ${power.totalEnergy}</p>
                <p><strong>Building Points:</strong> ${power.totalBP}</p>
                <p><strong>Range:</strong> ${power.range}</p>
                <p><strong>Duration:</strong> ${power.duration} ${capitalize(power.durationType)}</p>
                <p><strong>Action Type:</strong> ${formatActionType(power.actionType, power.reactionChecked)}</p>
                <p><strong>Power Parts:</strong> ${power.powerParts.map(part => part.part).join(', ')}</p>
                ${formatDamage(power.damage)}
                <p><strong>Area of Effect:</strong> ${power.areaEffect} (${power.areaEffectLevel})</p>
                <p><strong>Description:</strong> ${power.description}</p>
            `;
            powersList.appendChild(listItem);
        });
    } catch (e) {
        console.error('Error fetching saved powers: ', e);
        alert('Error fetching saved powers');
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatActionType(actionType, reactionChecked) {
    const formattedActionType = capitalize(actionType).replace('Action', 'Reaction');
    return reactionChecked ? formattedActionType : capitalize(actionType);
}

function formatDamage(damageArray) {
    return damageArray.map(damage => {
        if (damage.amount && damage.size && damage.type !== 'none') {
            return `<p><strong>Damage:</strong> ${damage.amount}d${damage.size} ${damage.type}</p>`;
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
