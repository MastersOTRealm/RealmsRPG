let firebaseInitialized = false;
let auth, db;

export async function initializeFirebase() {
    if (firebaseInitialized) return { auth, db };
    
    return new Promise((resolve, reject) => {
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined') {
                clearInterval(checkFirebase);
                
                auth = firebase.auth();
                db = firebase.firestore();
                
                // NEW: Activate App Check BEFORE waiting for auth
                let appCheckReady = Promise.resolve();
                if (firebase.appCheck) {
                    appCheckReady = new Promise((resolveAppCheck) => {
                        try {
                            firebase.appCheck().activate(
                                '6Ld4CaAqAAAAAMXFsM-yr1eNlQGV2itSASCC7SmA',
                                true
                            );
                            console.log('[CharacterSheet] App Check activated');
                            // Wait a moment for token generation
                            setTimeout(resolveAppCheck, 500);
                        } catch (err) {
                            console.warn('[CharacterSheet] App Check activation failed:', err);
                            resolveAppCheck();
                        }
                    });
                }
                
                // Wait for both App Check AND auth state
                appCheckReady.then(() => {
                    firebase.auth().onAuthStateChanged((user) => {
                        firebaseInitialized = true;
                        resolve({ auth, db, user });
                    });
                });
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkFirebase);
            reject(new Error('Firebase initialization timeout'));
        }, 10000);
    });
}

export function waitForAuth() {
    return new Promise((resolve) => {
        if (!auth) {
            resolve(null);
            return;
        }
        const u = auth.currentUser;
        if (u) {
            resolve(u);
        } else {
            const unsub = auth.onAuthStateChanged(user => {
                unsub();
                resolve(user);
            });
        }
    });
}

export { auth, db };
