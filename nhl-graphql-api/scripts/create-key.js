const { unkey } = require('../unkey');
const dotenv = require('dotenv');
dotenv.config();

async function createApiKey(name, plan = 'free', ownerId = null) {
  try {
    const { key, error } = await unkey.keys.create({
      apiId: process.env.UNKEY_ID,
      name: `NHL GraphQL API Key - ${name}`,
      meta: {
        name,
        plan,
        active: true,
        ownerId,
        createdAt: new Date().toISOString()
      },
      ratelimit: plan === 'unlimited' ? null : {
        type: 'fast',
        limit: planLimits[plan]?.requestsPerDay || 100,
        refillRate: planLimits[plan]?.requestsPerDay || 100,
        refillInterval: 86400 // 24 hours in seconds
      }
    });

    if (error) {
      console.error('Error creating key:', error);
      return null;
    }

    console.log(`Created API key for ${name} with ${plan} plan`);
    return key;
  } catch (err) {
    console.error('Unexpected error creating key:', err);
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  const [name, plan, ownerId] = process.argv.slice(2);
  
  if (!name) {
    console.error('Usage: node create-key.js <name> [plan] [ownerId]');
    process.exit(1);
  }
  
  createApiKey(name, plan || 'free', ownerId)
    .then(key => {
      if (key) {
        console.log('Generated key:', key);
      } else {
        console.error('Failed to generate key');
        process.exit(1);
      }
    });
}

module.exports = { createApiKey };