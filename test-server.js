// Test script for server's Instagram hashtag endpoint
import fetch from 'node-fetch';

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

// Test with popular hashtags that are likely to have content
const tagsToTest = ['instagram', 'travel', 'realestate'];

async function runTests() {
  for (const tag of tagsToTest) {
    await testHashtagEndpoint(tag);
  }
  
  console.log('\n🔍 Testing complete! Check results above.');
}

runTests().catch(error => {
  console.error('Test script error:', error);
}); 