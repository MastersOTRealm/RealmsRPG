/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const logger = require("firebase-functions/logger");
const cors = require('cors')({ origin: true });

const FIREBASE_API_KEY = defineSecret('FIREBASE_API_KEY');
const FIREBASE_APP_ID = defineSecret('FIREBASE_APP_ID');
const FIREBASE_AUTH_DOMAIN = defineSecret('FIREBASE_AUTH_DOMAIN');
const FIREBASE_DATABASE_URL = defineSecret('FIREBASE_DATABASE_URL');
const FIREBASE_MEASUREMENT_ID = defineSecret('FIREBASE_MEASUREMENT_ID');
const FIREBASE_MESSAGING_SENDER_ID = defineSecret('FIREBASE_MESSAGING_SENDER_ID');
const FIREBASE_PROJECT_ID = defineSecret('FIREBASE_PROJECT_ID');
const FIREBASE_STORAGE_BUCKET = defineSecret('FIREBASE_STORAGE_BUCKET');
const RECAPTCHA_SECRET_KEY = defineSecret('RECAPTCHA_SECRET_KEY');
const RECAPTCHA_SITE_KEY = defineSecret('RECAPTCHA_SITE_KEY');

admin.initializeApp();

exports.registerUser = onCall(
  { secrets: [FIREBASE_API_KEY, FIREBASE_APP_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, FIREBASE_MEASUREMENT_ID, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, RECAPTCHA_SECRET_KEY, RECAPTCHA_SITE_KEY] },
  async (data, context) => {
    const { username, email, password } = data;
    try {
      const userRecord = await admin.auth().createUser({ email, password });
      const db = getFirestore();
      await db.collection('users').doc(userRecord.uid).set({ username });
      await db.collection('usernames').doc(username).set({ uid: userRecord.uid });
      return { message: 'User registered successfully' };
    } catch (error) {
      console.error('Error registering user:', error);
      throw new HttpsError('internal', 'Error registering user');
    }
  }
);

exports.updateUserEmail = onCall(async (data, context) => {
  const { newEmail } = data;
  const uid = context.auth.uid;

  if (!uid) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {
    await admin.auth().updateUser(uid, { email: newEmail });
    const emailVerificationLink = await admin.auth().generateEmailVerificationLink(newEmail);
    return { message: 'Email updated successfully. Please verify your new email.', emailVerificationLink };
  } catch (error) {
    console.error('Error updating email:', error);
    throw new HttpsError('internal', 'Error updating email');
  }
});

exports.savePowerToLibrary = onCall(async (data, context) => {
    const { powerName, powerDescription, totalEnergy, totalTP, range, areaEffect, areaEffectLevel, duration, durationType, actionType, reactionChecked, focusChecked, sustainValue, noHarmChecked, endsOnceChecked, damage, powerParts } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    if (!(typeof powerName === "string") || powerName.length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'powerName'.");
    }

    try {
        const db = getFirestore();
        const docRef = await db.collection('users').doc(uid).collection('library').add({
            name: powerName,
            description: powerDescription,
            totalEnergy,
            totalTP,
            range,
            areaEffect,
            areaEffectLevel,
            duration,
            durationType,
            actionType,
            reactionChecked,
            focusChecked,
            sustainValue,
            noHarmChecked,
            endsOnceChecked,
            damage,
            powerParts,
            timestamp: new Date()
        });
        logger.info('Document written with ID: ', docRef.id);
        return { message: 'Power saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error adding document: ', error);
        throw new HttpsError('internal', 'Error saving power to library');
    }
});

exports.savePowerToLibrary = onRequest((req, res) => {
    cors(req, res, async () => {
        const { powerName, powerDescription, totalEnergy, totalTP, range, areaEffect, areaEffectLevel, duration, durationType, actionType, reactionChecked, focusChecked, sustainValue, noHarmChecked, endsOnceChecked, damage, powerParts } = req.body;
        
        // Verify the ID token from the Authorization header
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            if (!(typeof powerName === "string") || powerName.length === 0) {
                res.status(400).json({ error: "The function must be called with a valid 'powerName'." });
                return;
            }

            const db = getFirestore();
            const docRef = await db.collection('users').doc(uid).collection('library').add({
                name: powerName,
                description: powerDescription,
                totalEnergy,
                totalTP,
                range,
                areaEffect,
                areaEffectLevel,
                duration,
                durationType,
                actionType,
                reactionChecked,
                focusChecked,
                sustainValue,
                noHarmChecked,
                endsOnceChecked,
                damage,
                powerParts,
                timestamp: new Date()
            });
            logger.info('Document written with ID: ', docRef.id);
            res.status(200).json({ message: 'Power saved to library', docId: docRef.id });
        } catch (error) {
            logger.error('Error adding document: ', error);
            res.status(500).json({ error: 'Error saving power to library' });
        }
    });
});

exports.deletePowerFromLibrary = onCall(async (data, context) => {
    const { powerId } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        const db = getFirestore();
        await db.collection('users').doc(uid).collection('library').doc(powerId).delete();
        return { message: 'Power deleted successfully' };
    } catch (error) {
        console.error('Error deleting power: ', error);
        throw new HttpsError('internal', 'Error deleting power');
    }
});

exports.saveItemToLibrary = onCall(async (data, context) => {
    // Robust check for authentication
    if (!context.auth) {
        logger.error('Unauthenticated request: context.auth is undefined');
        throw new HttpsError('unauthenticated', 'You must be authenticated to save an item.');
    }

    const {
        itemName,
        itemDescription,
        armamentType,
        properties
    } = data;
    const uid = context.auth.uid;

    if (!(typeof itemName === "string") || itemName.length === 0) {
        logger.error('Invalid itemName:', itemName);
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'itemName'.");
    }

    // Validate armamentType
    if (!armamentType || !['Weapon', 'Armor', 'Shield'].includes(armamentType)) {
        logger.error('Invalid armamentType:', armamentType);
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'armamentType' (Weapon, Armor, or Shield).");
    }

    // Validate properties array
    if (!Array.isArray(properties)) {
        logger.error('properties is not an array:', properties);
        throw new HttpsError("invalid-argument", "properties must be an array.");
    }

    try {
        const db = getFirestore();
        const docRef = await db.collection('users').doc(uid).collection('itemLibrary').add({
            name: itemName,
            description: itemDescription || "",
            armamentType,
            properties,
            timestamp: new Date()
        });
        logger.info('Item document written with ID: ', docRef.id);
        return { message: 'Item saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error adding item document: ', error, data);
        throw new HttpsError('internal', 'Error saving item to library: ' + error.message);
    }
});

// --- Technique Library Functions (copies of power library functions, adapted) ---

exports.saveTechniqueToLibrary = onCall(async (data, context) => {
    const { techniqueName, techniqueDescription, totalEnergy, totalTP, actionType, reactionChecked, damage, techniqueParts, weapon } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    // Validate required fields
    if (!(typeof techniqueName === "string") || techniqueName.trim().length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'techniqueName'.");
    }
    if (typeof totalEnergy === "undefined" || totalEnergy === null || totalEnergy === "") {
        throw new HttpsError("invalid-argument", "Missing required 'totalEnergy'.");
    }
    if (typeof totalTP === "undefined" || totalTP === null || totalTP === "") {
        throw new HttpsError("invalid-argument", "Missing required 'totalTP'.");
    }
    if (!Array.isArray(damage)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'damage' array.");
    }
    if (!Array.isArray(techniqueParts)) {
        throw new HttpsError("invalid-argument", "Missing or invalid 'techniqueParts' array.");
    }

    try {
        const db = getFirestore();
        const docRef = await db.collection('users').doc(uid).collection('techniqueLibrary').add({
            name: techniqueName,
            description: techniqueDescription || "",
            totalEnergy,
            totalTP,
            actionType,
            reactionChecked,
            damage,
            techniqueParts,
            weapon: weapon || { name: "Unarmed Prowess", tp: 0, id: null },
            timestamp: new Date()
        });
        logger.info('Technique document written with ID: ', docRef.id);
        return { message: 'Technique saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error adding technique document: ', error);
        throw new HttpsError('internal', 'Error saving technique to library');
    }
});

exports.saveTechniqueToLibrary = onRequest((req, res) => {
    cors(req, res, async () => {
        const { techniqueName, techniqueDescription, totalEnergy, totalTP, actionType, reactionChecked, damage, techniqueParts, weapon } = req.body;
        
        // Verify the ID token from the Authorization header
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
            res.status(401).json({ error: 'Unauthorized: No ID token provided.' });
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const uid = decodedToken.uid;

            // Validate required fields
            if (!(typeof techniqueName === "string") || techniqueName.trim().length === 0) {
                res.status(400).json({ error: "The function must be called with a valid 'techniqueName'." });
                return;
            }
            if (typeof totalEnergy === "undefined" || totalEnergy === null || totalEnergy === "") {
                res.status(400).json({ error: "Missing required 'totalEnergy'." });
                return;
            }
            if (typeof totalTP === "undefined" || totalTP === null || totalTP === "") {
                res.status(400).json({ error: "Missing required 'totalTP'." });
                return;
            }
            if (!Array.isArray(damage)) {
                res.status(400).json({ error: "Missing or invalid 'damage' array." });
                return;
            }
            if (!Array.isArray(techniqueParts)) {
                res.status(400).json({ error: "Missing or invalid 'techniqueParts' array." });
                return;
            }

            const db = getFirestore();
            const docRef = await db.collection('users').doc(uid).collection('techniqueLibrary').add({
                name: techniqueName,
                description: techniqueDescription || "",
                totalEnergy,
                totalTP,
                actionType,
                reactionChecked,
                damage,
                techniqueParts,
                weapon: weapon || { name: "Unarmed Prowess", tp: 0, id: null },
                timestamp: new Date()
            });
            logger.info('Technique document written with ID: ', docRef.id);
            res.status(200).json({ message: 'Technique saved to library', docId: docRef.id });
        } catch (error) {
            logger.error('Error adding technique document: ', error);
            res.status(500).json({ error: 'Error saving technique to library' });
        }
    });
});

exports.deleteTechniqueFromLibrary = onCall(async (data, context) => {
    const { techniqueId } = data;
    const uid = context.auth.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    try {
        const db = getFirestore();
        await db.collection('users').doc(uid).collection('techniqueLibrary').doc(techniqueId).delete();
        return { message: 'Technique deleted successfully' };
    } catch (error) {
        console.error('Error deleting technique: ', error);
        throw new HttpsError('internal', 'Error deleting technique');
    }
});

exports.saveCreatureToLibrary = onCall(async (data, context) => {
    const { creatureName, creatureData } = data;
    const uid = context.auth?.uid;

    if (!uid) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    if (!(typeof creatureName === "string") || creatureName.length === 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a valid 'creatureName'.");
    }
    if (!creatureData || typeof creatureData !== "object") {
        throw new HttpsError("invalid-argument", "Missing or invalid 'creatureData' object.");
    }

    try {
        const db = getFirestore();
        const docRef = await db.collection('users').doc(uid).collection('creatureLibrary').add({
            name: creatureName,
            ...creatureData,
            timestamp: new Date()
        });
        logger.info('Creature document written with ID: ', docRef.id);
        return { message: 'Creature saved to library', docId: docRef.id };
    } catch (error) {
        logger.error('Error saving creature document: ', error);
        throw new HttpsError('internal', 'Error saving creature to library');
    }
});
