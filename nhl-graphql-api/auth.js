const { db } = require("./firebase.js");

// Development API keys that always work
const devApiKeys = {
    'development-key': { name: 'Developer', plan: 'unlimited', active: true },
    'test-key': { name: 'Test User', plan: 'basic', active: true }
};

const planLimits = {
    free: { requestsPerDay: 100 },
    basic: { requestsPerDay: 1000 },
    pro: { requestsPerDay: 10000 },
    unlimited: { requestsPerDay: Infinity }
};

async function getCustomerByApiKey(apiKey) {
    console.log(`Validating API key: ${apiKey.substring(0, 4)}...`);

    // Always accept development keys
    if (devApiKeys[apiKey]) {
        console.log('Using static development key');
        return devApiKeys[apiKey];
    }

    try {
        console.log('Checking Firestore for API key...');
        const docRef = db.collection("apiKeys").doc(apiKey);
        console.log('Created document reference');

        // Add timeout for Firestore query to avoid hanging
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Firestore query timeout')), 5000);
        });

        // Race the Firestore query against a timeout
        const doc = await Promise.race([
            docRef.get(),
            timeoutPromise
        ]);

        console.log('Firestore query completed');
        console.log('Document exists?', doc.exists);

        if (!doc.exists) {
            // Try fallback to development key if in non-production
            if (process.env.NODE_ENV !== 'production') {
                console.log('API key not found, using fallback development key');
                return devApiKeys['development-key'];
            }

            console.log('API key not found in database');
            return null;
        }

        const data = doc.data();
        console.log('Retrieved customer data:', JSON.stringify(data, null, 2));

        if (!data.active) {
            console.log('API key is inactive');
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getCustomerByApiKey:', error);

        // In non-production, use development key as fallback
        if (process.env.NODE_ENV !== 'production') {
            console.log('Error occurred, using fallback development key');
            return devApiKeys['development-key'];
        }

        return null;
    }
}

async function checkRateLimit(customer) {
    if (!customer) return false;

    // Simple implementation for now
    console.log(`Rate limit check for ${customer.name} on ${customer.plan} plan`);
    return true;
}

module.exports = { getCustomerByApiKey, checkRateLimit };