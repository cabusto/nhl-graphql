// filepath: /Users/jwarren/projects/nhl-graphql/nhl-graphql-api/firebase.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

// Fix for the private key format issue
function fixPrivateKey(key) {
    if (!key) return key;
    // Remove any comments or quotes around the key
    key = key.replace(/^"/, '').replace(/"$/, '');
    // Make sure newlines are properly processed
    return key.replace(/\\n/g, '\n');
}

try {
    console.log('Initializing Firebase...');
    const privateKey = fixPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey
            }),
        });
        console.log('Firebase initialized successfully');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const db = admin.firestore();
module.exports = { db };