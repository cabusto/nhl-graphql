// filepath: /Users/jwarren/projects/nhl-graphql/nhl-graphql-api/firebase.js
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require('fs');
const path = require('path');
dotenv.config();

// Enhanced private key fixing function
function fixPrivateKey(key) {
    if (!key) return key;

    // Handle various formats that might be problematic
    let fixedKey = key;

    // If the key starts and ends with quotes, remove them
    fixedKey = fixedKey.replace(/^"(.*)"$/, '$1');

    // Replace literal "\n" with actual newlines
    fixedKey = fixedKey.replace(/\\n/g, '\n');

    // Check if it's a valid PEM format
    if (!fixedKey.includes('-----BEGIN PRIVATE KEY-----') ||
        !fixedKey.includes('-----END PRIVATE KEY-----')) {
        console.error('Private key is not in valid PEM format');
    }

    console.log('Private key format check:',
        fixedKey.includes('-----BEGIN PRIVATE KEY-----') ? 'Has BEGIN marker' : 'Missing BEGIN marker',
        fixedKey.includes('-----END PRIVATE KEY-----') ? 'Has END marker' : 'Missing END marker');

    return fixedKey;
}

// Try to use a local service account file first if available
let firebaseConfig = null;
try {
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
        console.log('Using service account file from:', serviceAccountPath);
        firebaseConfig = require('./firebase-service-account.json');
    }
} catch (error) {
    console.log('No service account file found, will use environment variables');
}

// Create Firebase mock for development if needed
const createMockFirebase = () => {
    console.log('Creating mock Firebase database for development');
    return {
        collection: (name) => ({
            doc: (id) => ({
                get: async () => ({
                    exists: id === 'development-key' || id === 'test-key',
                    data: () => ({
                        name: id === 'development-key' ? 'Developer' : 'Test User',
                        plan: id === 'development-key' ? 'unlimited' : 'basic',
                        active: true
                    })
                })
            })
        })
    };
};

// Main initialization
let db;
try {
    // Use service account if available, otherwise use environment variables
    if (firebaseConfig) {
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(firebaseConfig)
            });
        }
    } else {
        console.log('Using environment variables for Firebase credentials');
        console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('Client Email:', process.env.FIREBASE_CLIENT_EMAIL);

        // Fix private key
        const privateKey = fixPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

        // Initialize Firebase with environment variables
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey
                }),
            });
        }
    }

    console.log('Firebase initialized successfully');
    db = admin.firestore();
} catch (error) {
    console.error('Firebase initialization error:', error);
    console.log('Falling back to mock database');
    db = createMockFirebase();
}

module.exports = { db };