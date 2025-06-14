// Instagram Token Refresh Script
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.development file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

console.log('Instagram Token Refresh Script');
console.log('==============================');
console.log('');
console.log('This script will help you get a new long-lived Instagram access token.');
console.log('');
console.log('STEPS TO FOLLOW:');
console.log('1. Go to: https://developers.facebook.com/tools/explorer/');
console.log('2. Select your Facebook App');
console.log('3. Generate a User Access Token with permissions:');
console.log('   - instagram_basic');
console.log('   - pages_show_list');
console.log('   - pages_read_engagement');
console.log('4. Copy the short-lived token and run this script with it');
console.log('');

// Check if a short-lived token was provided as argument
const shortLivedToken = process.argv[2];

if (!shortLivedToken) {
  console.log('❌ No token provided!');
  console.log('');
  console.log('Usage: node refresh-instagram-token.js YOUR_SHORT_LIVED_TOKEN');
  console.log('');
  console.log('Get your short-lived token from: https://developers.facebook.com/tools/explorer/');
  process.exit(1);
}

// You'll need your Facebook App ID and App Secret for this
const appId = process.env.FACEBOOK_APP_ID;
const appSecret = process.env.FACEBOOK_APP_SECRET;

if (!appId || !appSecret) {
  console.log('❌ Missing Facebook App credentials!');
  console.log('');
  console.log('Please add these to your .env.development file:');
  console.log('FACEBOOK_APP_ID=your_app_id');
  console.log('FACEBOOK_APP_SECRET=your_app_secret');
  console.log('');
  console.log('You can find these in your Facebook App settings at:');
  console.log('https://developers.facebook.com/apps/');
  process.exit(1);
}

async function exchangeForLongLivedToken() {
  try {
    console.log('🔄 Exchanging short-lived token for long-lived token...');
    
    const url = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ Error exchanging token:');
      console.log(JSON.stringify(data, null, 2));
      return null;
    }
    
    console.log('✅ Successfully got long-lived token!');
    console.log(`Token expires in: ${data.expires_in} seconds (${Math.round(data.expires_in / 86400)} days)`);
    
    return data.access_token;
    
  } catch (error) {
    console.log('❌ Error exchanging token:', error.message);
    return null;
  }
}

async function getInstagramBusinessAccounts(longLivedToken) {
  try {
    console.log('🔍 Finding Instagram Business Accounts...');
    
    // Get user's pages
    const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?access_token=${longLivedToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();
    
    if (!pagesResponse.ok) {
      console.log('❌ Error getting pages:', pagesData);
      return;
    }
    
    console.log(`Found ${pagesData.data.length} Facebook pages`);
    
    // Check each page for Instagram business account
    for (const page of pagesData.data) {
      try {
        const instagramUrl = `https://graph.facebook.com/v22.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`;
        const instagramResponse = await fetch(instagramUrl);
        const instagramData = await instagramResponse.json();
        
        if (instagramData.instagram_business_account) {
          console.log(`✅ Found Instagram Business Account for page "${page.name}"`);
          console.log(`   Page ID: ${page.id}`);
          console.log(`   Instagram Business Account ID: ${instagramData.instagram_business_account.id}`);
          console.log(`   Page Access Token: ${page.access_token.substring(0, 20)}...`);
        }
      } catch (error) {
        console.log(`   Error checking page ${page.name}:`, error.message);
      }
    }
    
  } catch (error) {
    console.log('❌ Error getting Instagram accounts:', error.message);
  }
}

async function main() {
  const longLivedToken = await exchangeForLongLivedToken();
  
  if (longLivedToken) {
    console.log('');
    console.log('📋 Your new long-lived access token:');
    console.log(longLivedToken);
    console.log('');
    console.log('💡 Update your .env.development file with:');
    console.log(`INSTAGRAM_ACCESS_TOKEN=${longLivedToken}`);
    console.log('');
    
    await getInstagramBusinessAccounts(longLivedToken);
  }
}

main().catch(error => {
  console.error('Script error:', error);
}); 