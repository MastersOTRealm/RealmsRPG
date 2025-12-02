import creatureFeatsData from './creatureFeatsData.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-check.js";
//import skills from '../scripts/skillsData.js';
//import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-functions.js";

// Import from modules
import * as creatureState from './creatureState.js';
import * as creatureInteractions from './creatureInteractions.js';
import * as creatureModals from './creatureModals.js';
import * as creatureSaveLoad from './creatureSaveLoad.js';
import * as creatureSkillInteractions from './creatureSkillInteractions.js';

// --- Firebase Initialization (v11 compat, global) ---
let firebaseApp, firebaseAuth, firebaseDb, currentUser, firebaseRTDB;
let authReadyPromise = new Promise(resolve => {
    document.addEventListener('DOMContentLoaded', async function() {
        const response = await fetch('/__/firebase/init.json');
        const firebaseConfig = await response.json();
        firebaseConfig.authDomain = 'realmsroleplaygame.com';
        firebaseApp = initializeApp(firebaseConfig);

        initializeAppCheck(firebaseApp, {
            provider: new ReCaptchaV3Provider('6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA'),
            isTokenAutoRefreshEnabled: true
        });

        firebaseAuth = getAuth(firebaseApp);
        firebaseDb = getFirestore(firebaseApp);

        // Add Realtime Database
        const { getDatabase } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js");
        firebaseRTDB = getDatabase(firebaseApp);

        onAuthStateChanged(firebaseAuth, (user) => {
            currentUser = user;
            resolve();
        });
    });
});

// --- Skills Loader ---
async function loadSkillsFromFirebase() {
    if (!firebaseRTDB) return [];
    const { get, ref } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js");
    try {
        const snapshot = await get(ref(firebaseRTDB, 'skills'));
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        }
    } catch (e) {
        console.error("Failed to load skills from Firebase:", e);
    }
    return [];
}

// --- Main Entry Point: Delegate all UI/event logic to modules ---
document.addEventListener('DOMContentLoaded', async () => {
    await authReadyPromise;
    // Load skills from Firebase RTDB before initializing UI
    const skills = await loadSkillsFromFirebase();
    // Provide skills to modules via dependency injection
    if (creatureSaveLoad && typeof creatureSaveLoad.setSkills === 'function') {
        creatureSaveLoad.setSkills(skills);
    }
    if (creatureInteractions && typeof creatureInteractions.initCreatureCreator === 'function') {
        creatureInteractions.initCreatureCreator({
            firebaseApp,
            firebaseAuth,
            firebaseDb,
            firebaseRTDB,
            currentUser,
            authReadyPromise,
            skills,
            creatureFeatsData,
            ...creatureState,
            ...creatureModals,
            ...creatureSaveLoad
        });
    }
    // --- Initialize skill interactions ---
    if (creatureSkillInteractions && typeof creatureSkillInteractions.initCreatureSkills === 'function') {
        creatureSkillInteractions.initCreatureSkills({
            skills,
            updateDefensesUI: creatureInteractions.updateDefensesUI,
            updateSummary: creatureInteractions.updateSummary
        });
    }
    // If the modules do not provide an init function, ensure all UI/event logic is handled in those modules.
});

// Expose Firebase/auth for modules if needed
export { firebaseApp, firebaseAuth, firebaseDb, firebaseRTDB, currentUser, authReadyPromise };
