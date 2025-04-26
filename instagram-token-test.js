// Instagram Token Test Script
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.development file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Load Instagram credentials
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

// Validate environment variables
if (!accessToken || !accountId) {
  console.error('Error: Missing required environment variables:');
  if (!accessToken) console.error('- INSTAGRAM_ACCESS_TOKEN');
  if (!accountId) console.error('- INSTAGRAM_BUSINESS_ACCOUNT_ID');
  process.exit(1);
}

console.log('Instagram Token Test Script');
console.log('==========================');
console.log(`Using Account ID: ${accountId}`);
console.log(`Access Token (first 10 chars): ${accessToken.substring(0, 10)}...`);

async function testEndpoint(name, url) {
  console.log(`\n📡 Testing: ${name}`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const status = response.status;
    const data = await response.json();
    
    console.log(`Status: ${status}`);
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error:');
      console.log(JSON.stringify(data, null, 2));
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log('❌ Fetch Error:');
    console.log(error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  // 1. Test token debug info
  await testEndpoint(
    'Debug Token Info',
    `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
  );
  
  // 2. Test business account info
  await testEndpoint(
    'Business Account Info',
    `https://graph.facebook.com/v21.0/${accountId}?fields=id,username,name&access_token=${accessToken}`
  );
  
  // 3. Test hashtag search with minimal permissions
  const testHashtag = 'instagram';
  await testEndpoint(
    `Hashtag Search (${testHashtag})`,
    `https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${accountId}&q=${testHashtag}&access_token=${accessToken}`
  );
  
  // 4. Test user's media (should work even with limited permissions)
  await testEndpoint(
    'User Media',
    `https://graph.facebook.com/v21.0/${accountId}/media?fields=id,caption&access_token=${accessToken}`
  );
}

runTests().catch(error => {
  console.error('Test script error:', error);
}); 