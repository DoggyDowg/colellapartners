// Test script for company-specific hashtags
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fetch from 'node-fetch';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.development file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

async function testHashtagEndpoint(tag) {
  console.log(`\n🧪 Testing local server with hashtag: #${tag}`);
  
  try {
    const url = `http://localhost:3001/api/instagram-feed?type=hashtag&tag=${encodeURIComponent(tag)}`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ Success!');
      
      if (data.data && data.data.length > 0) {
        console.log(`Total posts: ${data.data.length}`);
        
        // Count by media type
        const mediaTypes = data.data.map(post => post.media_type);
        const countByType = mediaTypes.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        console.log(`Media types: ${JSON.stringify(countByType)}`);
        
        // Check for first post details
        const firstPost = data.data[0];
        console.log('\nSample first post:');
        console.log(`- ID: ${firstPost.id}`);
        console.log(`- Type: ${firstPost.media_type}`);
        console.log(`- Has caption: ${Boolean(firstPost.caption)}`);
        console.log(`- Has permalink: ${Boolean(firstPost.permalink)}`);
        console.log(`- Has media_url: ${Boolean(firstPost.media_url)}`);
        console.log(`- Has timestamp: ${Boolean(firstPost.timestamp)}`);
        
        // Show a snippet of the first post caption
        if (firstPost.caption) {
          const captionPreview = firstPost.caption.length > 100 
            ? firstPost.caption.substring(0, 100) + '...' 
            : firstPost.caption;
          console.log(`- Caption preview: "${captionPreview}"`);
        }
      } else {
        console.log('No posts found.');
      }
    } else {
      console.log('❌ Error:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log('❌ Test Error:');
    console.log(error.message);
  }
}

// Test with all possible variations of the company hashtag
const tagsToTest = [
  'colellapartners',
  'colellaproperty', 
  'colella',
  'ColellaPartners',
  'ColellaProperty',
  'Colella'
];

async function runTests() {
  for (const tag of tagsToTest) {
    await testHashtagEndpoint(tag);
  }
  
  console.log('\n🔍 Testing complete! Check results above.');
}

runTests().catch(error => {
  console.error('Test script error:', error);
}); 