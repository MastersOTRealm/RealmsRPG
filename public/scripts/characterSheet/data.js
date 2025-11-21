import { auth, db } from './firebase-config.js';

export async function getCharacterData(charId) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const docRef = db.collection('users').doc(user.uid).collection('character').doc(charId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
        throw new Error('Character not found');
    }
    
    return { id: charId, ...docSnap.data() };
}

export async function saveCharacterData(charId, data) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    // Remove the id field before saving
    const { id, ...dataToSave } = data;
    
    const docRef = db.collection('users').doc(user.uid).collection('character').doc(charId);
    await docRef.set(dataToSave, { merge: true });
}
