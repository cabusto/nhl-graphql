const { Unkey } = require('@unkey/api');
const dotenv = require('dotenv');
dotenv.config();

// Load environment variables with fallbacks to hardcoded values
const UNKEY_ID = process.env.UNKEY_ID;
const UNKEY_API_KEY = process.env.UNKEY_API_KEY;

console.log('Unkey configuration:', {
    id: UNKEY_ID ? `${UNKEY_ID.substring(0, 6)}...` : 'Missing',
    key: UNKEY_API_KEY ? 'Present' : 'Missing'
});

if (!UNKEY_API_KEY) {
    console.error('ERROR: Unkey API key is missing!');
}

// Initialize Unkey client
const unkey = new Unkey({
    rootKey: UNKEY_API_KEY,
    apiId: UNKEY_ID
});

console.log('Unkey client initialized');

module.exports = { unkey };