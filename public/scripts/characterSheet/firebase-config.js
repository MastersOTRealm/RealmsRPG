let firebaseInitialized = false;
let auth, db;

export async function initializeFirebase() {
    if (firebaseInitialized) return { auth, db };
    
    // Wait for Firebase to be loaded
    return new Promise((resolve, reject) => {
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined') {
                clearInterval(checkFirebase);
                
                auth = firebase.auth();
                db = firebase.firestore();
                
                // Wait for auth state
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        firebaseInitialized = true;
                        resolve({ auth, db });
                    } else {
                        reject(new Error('User not authenticated'));
                    }
                });
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkFirebase);
            reject(new Error('Firebase initialization timeout'));
        }, 10000);
    });
}

export { auth, db };
