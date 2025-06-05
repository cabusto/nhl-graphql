const { Unkey } = require('@unkey/api');
const dotenv = require('dotenv');
dotenv.config();

// Initialize Unkey client
const unkey = new Unkey({
    apiId: process.env.UNKEY_ID,
    apiKey: process.env.UNKEY_API_KEY
});

console.log('Unkey client initialized');

module.exports = { unkey };