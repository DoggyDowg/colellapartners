// Get Page Access Token Script
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.development file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

console.log('📄 Page Access Token Setup');
console.log('==========================');

// Get the current long-lived user token
const userToken = process.env.INSTAGRAM_ACCESS_TOKEN;
const appId = process.env.FACEBOOK_APP_ID;
const appSecret = process.env.FACEBOOK_APP_SECRET;

if (!userToken || !appId || !appSecret) {
  console.log('❌ Missing required environment variables!');
  console.log('Make sure you have:');
  console.log('- INSTAGRAM_ACCESS_TOKEN');
  console.log('- FACEBOOK_APP_ID');
  console.log('- FACEBOOK_APP_SECRET');
  process.exit(1);
}

async function getPageTokens() {
  try {
    console.log('🔍 Getting your Facebook pages...');
    
    // Get user's pages with their access tokens
    const pagesUrl = `https://graph.facebook.com/v22.0/me/accounts?access_token=${userToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();
    
    if (!pagesResponse.ok) {
      console.log('❌ Error getting pages:', pagesData);
      return;
    }
    
    console.log(`Found ${pagesData.data.length} Facebook pages:`);
    
    // Find the Colella page
    let colellaPage = null;
    for (const page of pagesData.data) {
      console.log(`  📄 ${page.name} (ID: ${page.id})`);
      
      if (page.name.toLowerCase().includes('colella') || page.id === '1925278484399655') {
        colellaPage = page;
        console.log(`  ✅ Found Colella page: ${page.name}`);
      }
    }
    
    if (!colellaPage) {
      console.log('❌ Could not find Colella page. Available pages:');
      pagesData.data.forEach(page => {
        console.log(`  - ${page.name} (ID: ${page.id})`);
      });
      return;
    }
    
    console.log('\n🔄 Converting page token to long-lived (never expires)...');
    
    // Exchange the page token for a long-lived page token
    const exchangeUrl = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${colellaPage.access_token}`;
    
    const exchangeResponse = await fetch(exchangeUrl);
    const exchangeData = await exchangeResponse.json();
    
    if (!exchangeResponse.ok) {
      console.log('❌ Error exchanging page token:', exchangeData);
      return;
    }
    
    console.log('✅ Successfully got long-lived page token!');
    
    // Check if it expires
    if (exchangeData.expires_in) {
      console.log(`Token expires in: ${exchangeData.expires_in} seconds (${Math.round(exchangeData.expires_in / 86400)} days)`);
    } else {
      console.log('🎉 Token never expires!');
    }
    
    // Get Instagram Business Account ID for this page
    console.log('\n🔍 Getting Instagram Business Account for this page...');
    const instagramUrl = `https://graph.facebook.com/v22.0/${colellaPage.id}?fields=instagram_business_account&access_token=${exchangeData.access_token}`;
    const instagramResponse = await fetch(instagramUrl);
    const instagramData = await instagramResponse.json();
    
    if (instagramData.instagram_business_account) {
      console.log(`✅ Instagram Business Account ID: ${instagramData.instagram_business_account.id}`);
    } else {
      console.log('⚠️  No Instagram Business Account found for this page');
    }
    
    console.log('\n📋 YOUR NEW CONFIGURATION:');
    console.log('==========================');
    console.log(`INSTAGRAM_ACCESS_TOKEN=${exchangeData.access_token}`);
    if (instagramData.instagram_business_account) {
      console.log(`INSTAGRAM_BUSINESS_ACCOUNT_ID=${instagramData.instagram_business_account.id}`);
    }
    
    console.log('\n💡 This page token should never expire!');
    console.log('Add these to your .env.development file to complete the setup.');
    
    return {
      pageToken: exchangeData.access_token,
      pageId: colellaPage.id,
      pageName: colellaPage.name,
      instagramAccountId: instagramData.instagram_business_account?.id,
      expiresIn: exchangeData.expires_in
    };
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

getPageTokens().catch(error => {
  console.error('Script error:', error);
}); 