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
    const { powerName, powerDescription, totalEnergy, totalBP, range, areaEffect, areaEffectLevel, duration, durationType, actionType, reactionChecked, focusChecked, sustainValue, noHarmChecked, endsOnceChecked, damage, powerParts } = data;
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
            totalBP,
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
        const { powerName, powerDescription, totalEnergy, totalBP, range, areaEffect, areaEffectLevel, duration, durationType, actionType, reactionChecked, focusChecked, sustainValue, noHarmChecked, endsOnceChecked, damage, powerParts } = req.body;
        
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
                totalBP,
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
