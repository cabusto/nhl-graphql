// filepath: /Users/jwarren/projects/nhl-graphql/nhl-graphql-api/firebase.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();

// Add debug logging
console.log('Firebase config loaded:', {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Don't log the actual private key, just check if it exists
    privateKeyExists: !!process.env.FIREBASE_PRIVATE_KEY
});

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
        });
        console.log('Firebase initialized successfully');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

const db = admin.firestore();
module.exports = { db };