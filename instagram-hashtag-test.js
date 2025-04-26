// Instagram Hashtag Test Script
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

console.log('Instagram Hashtag Media Test');
console.log('===========================');

// Different hashtags to test
const hashtagsToTest = ['instagram', 'sydney', 'travel'];
// Different field sets to test (from more to fewer fields)
const fieldSetsToTest = [
  'id,caption,media_type,media_url,permalink,timestamp,thumbnail_url',
  'id,caption,media_type,permalink,timestamp',
  'id,media_type,permalink',
];

async function testHashtagMedia(hashtag, fields) {
  console.log(`\n📡 Testing hashtag #${hashtag} with fields: ${fields}`);
  
  try {
    // Step 1: Get hashtag ID
    const searchUrl = `https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${accountId}&q=${hashtag}&access_token=${accessToken}`;
    console.log(`Fetching hashtag ID: ${searchUrl}`);
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchResponse.ok || !searchData.data || searchData.data.length === 0) {
      console.log(`❌ Failed to find hashtag ID for #${hashtag}`);
      console.log(JSON.stringify(searchData, null, 2));
      return;
    }
    
    const hashtagId = searchData.data[0].id;
    console.log(`✅ Found hashtag ID for #${hashtag}: ${hashtagId}`);
    
    // Step 2: Test both recent_media and top_media endpoints
    const endpoints = ['recent_media', 'top_media'];
    
    for (const endpoint of endpoints) {
      const mediaUrl = `https://graph.facebook.com/v21.0/${hashtagId}/${endpoint}?user_id=${accountId}&fields=${fields}&access_token=${accessToken}`;
      console.log(`\nTesting ${endpoint}:`);
      
      const mediaResponse = await fetch(mediaUrl);
      const mediaData = await mediaResponse.json();
      
      console.log(`Status: ${mediaResponse.status}`);
      
      if (mediaResponse.ok) {
        console.log('✅ Success!');
        
        // Count media types
        if (mediaData.data && mediaData.data.length > 0) {
          const mediaTypes = mediaData.data.map(post => post.media_type);
          const countByType = mediaTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          
          const videoCount = mediaTypes.filter(type => type === 'VIDEO').length;
          const videosWithUrl = mediaData.data.filter(post => 
            post.media_type === 'VIDEO' && post.media_url
          ).length;
          const videosWithoutUrl = mediaData.data.filter(post => 
            post.media_type === 'VIDEO' && !post.media_url
          ).length;
          
          console.log(`Total posts: ${mediaData.data.length}`);
          console.log(`Media type counts: ${JSON.stringify(countByType)}`);
          console.log(`Videos: ${videoCount} (${videosWithUrl} with URL, ${videosWithoutUrl} without URL)`);
        } else {
          console.log('No posts found for this hashtag with this endpoint');
        }
      } else {
        console.log('❌ Error:');
        console.log(JSON.stringify(mediaData, null, 2));
      }
    }
  } catch (error) {
    console.log('❌ Test Error:');
    console.log(error.message);
  }
}

async function runTests() {
  for (const hashtag of hashtagsToTest) {
    for (const fields of fieldSetsToTest) {
      await testHashtagMedia(hashtag, fields);
    }
  }
}

runTests().catch(error => {
  console.error('Test script error:', error);
}); 