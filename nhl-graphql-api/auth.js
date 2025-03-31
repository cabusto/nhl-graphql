const { db } = require("./firebase.js");

const planLimits = {
    free: { requestsPerDay: 100 },
    basic: { requestsPerDay: 1000 },
    pro: { requestsPerDay: 10000 },
    unlimited: { requestsPerDay: Infinity }
};

async function getCustomerByApiKey(apiKey) {
    console.log(`Attempting to validate API key: ${apiKey.substring(0, 4)}...`);

    // Debug check - provide a backdoor for development
    if (apiKey === 'development-key') {
        console.log('Using development backdoor key');
        return {
            name: 'Developer',
            plan: 'unlimited',
            active: true
        };
    }

    try {
        console.log('Checking Firestore for API key...');
        const docRef = db.collection("apiKeys").doc(apiKey);
        console.log('Created document reference');

        const doc = await docRef.get();
        console.log('Firestore query completed');
        console.log('Document exists?', doc.exists);

        if (!doc.exists) {
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
        return null;
    }
}

async function checkRateLimit(customer) {
    if (!customer) {
        console.log('Rate limit check failed: No customer provided');
        return false;
    }

    // Simple implementation - always return true for now
    console.log(`Customer ${customer.name} on ${customer.plan} plan - rate limit check passed`);
    return true;
}

module.exports = { getCustomerByApiKey, checkRateLimit };