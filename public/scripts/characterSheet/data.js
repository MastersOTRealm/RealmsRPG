import { auth, db, waitForAuth } from './firebase-config.js';

async function fetchAllCharacters(user) {
    const colRef = db.collection('users').doc(user.uid).collection('character');
    const snap = await colRef.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getCharacterData(charId) {
    const user = await waitForAuth();
    if (!user) throw new Error('User not authenticated');
    if (!charId || !String(charId).trim()) throw new Error('Invalid character id');
    const cleanId = String(charId).trim();
    try {
        const docRef = db.collection('users').doc(user.uid).collection('character').doc(cleanId);
        const docSnap = await docRef.get();
        if (docSnap.exists) return { id: cleanId, ...docSnap.data() };
        // Fallback: list collection and try alternative matches
        const all = await fetchAllCharacters(user);
        const direct = all.find(c => c.id === cleanId);
        if (direct) return direct;
        const ci = all.find(c => c.id.toLowerCase() === cleanId.toLowerCase());
        if (ci) return ci;
        const byName = all.find(c => (c.name || '').toLowerCase() === cleanId.toLowerCase());
        if (byName) return byName;
        throw new Error('Character not found');
    } catch (e) {
        if (e.code === 'permission-denied') throw new Error('PERMISSION_DENIED');
        throw e;
    }
}

export async function saveCharacterData(charId, data) {
    const user = await waitForAuth();
    if (!user) throw new Error('User not authenticated');
    if (!charId || !String(charId).trim()) throw new Error('Invalid character id');
    const { id, ...dataToSave } = data;
    try {
        const docRef = db.collection('users').doc(user.uid).collection('character').doc(String(charId).trim());
        await docRef.set(dataToSave, { merge: true });
    } catch (e) {
        if (e.code === 'permission-denied') throw new Error('PERMISSION_DENIED');
        throw e;
    }
}
