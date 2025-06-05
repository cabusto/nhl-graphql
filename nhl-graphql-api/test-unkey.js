// test-unkey.js
const { unkey } = require('./unkey');

async function testValidateKey() {

  console.log('Testing ValidateKey...');

  // Try to verify a test key
  const { result, error } = await unkey.keys.verify({
    key: process.env.TEST_KEY,
    apiId: process.env.UNKEY_ID
  });

  console.log('Verification result:', result);

  if (error) {
    console.error('Error verifying key:', error);
  } else {
    console.log('Key is valid:', result.valid);
    console.log('Enabled:', result.enabled);
  }
}

async function testGetKey() {
  console.log('Testing Unkey key retrieval...');

  // Try to get a test key
  const { result, error } = await unkey.keys.get({
    keyId: process.env.TEST_KEY_ID,
    apiId: process.env.UNKEY_ID
  });

  if (error) {
    console.error('Error retrieving key:', error);
  } else {
    console.log('Retrieved key:', result);
  }
}

// Not the best way to test, but good enough for now
//testGetKey()
testValidateKey();