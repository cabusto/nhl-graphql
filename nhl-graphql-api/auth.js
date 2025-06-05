// This module handles API key authentication and rate limiting using Unkey
// and provides fallback development keys for non-production environments.

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

console.log('Loading auth.js with Unkey integration');

async function getCustomerByApiKey(apiKey) {
    console.log(`Validating API key: ${apiKey.substring(0, 4)}...`);

    // Always accept development keys in non-production
    if (devApiKeys[apiKey] && process.env.NODE_ENV !== 'production') {
        console.log('Using static development key');
        return devApiKeys[apiKey];
    }

    try {
        console.log('Verifying key with Unkey...');
        const { valid, error, meta, remaining } = await unkey.keys.verify({ key: apiKey });

        if (!valid) {
            console.log('API key verification failed:', error || 'Invalid key');

            // Try fallback to development key if in non-production
            if (process.env.NODE_ENV !== 'production') {
                console.log('Using fallback development key');
                return devApiKeys['development-key'];
            }

            return null;
        }

        console.log('API key verified successfully');

        // Construct customer object from metadata
        const customer = {
            name: meta?.name || 'Unknown User',
            plan: meta?.plan || 'free',
            active: meta?.active !== false, // Default to active if not specified
            ownerId: meta?.ownerId,
            remaining: remaining
        };

        console.log('Retrieved customer data:', JSON.stringify(customer, null, 2));

        if (!customer.active) {
            console.log('API key is inactive');
            return null;
        }

        return customer;
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

    // If using Unkey's built-in rate limiting
    if (customer.remaining !== undefined) {
        console.log(`Rate limit from Unkey: ${customer.remaining} requests remaining`);
        return customer.remaining > 0;
    }

    // Fallback to plan-based limits
    const plan = customer.plan || 'free';
    const limit = planLimits[plan] || planLimits.free;

    console.log(`Rate limit check for ${customer.name} on ${plan} plan: ${limit.requestsPerDay} per day`);
    return true; // Simple implementation for now
}

module.exports = { getCustomerByApiKey, checkRateLimit };