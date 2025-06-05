// test-unkey.js
const { unkey } = require('./unkey');

async function testUnkey() {
  try {
    console.log('Testing Unkey connection...');
    
    // Try to verify a test key
    const result = await unkey.keys.verify({
      key: 'development-key'
    });
    
    console.log('Verification result:', result);
    console.log('Unkey is working!');
  } catch (error) {
    console.error('Unkey test failed:', error);
  }
}

testUnkey();