import fetch from 'node-fetch'; // Use node-fetch with ESM import

// Helper function to handle API responses
async function handleIGApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    console.error('Instagram API Error:', errorData);
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Define the fields we want for each media item
const igMediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url},media_product_type';

// Helper function to enrich carousel posts with media URLs
async function enrichPostWithMedia(post, accessToken, accountId) {
  // Skip if we already have media URLs
  if (post.media_url && post.media_type !== 'VIDEO') {
    return post;
  }
  
  // We need to fetch the media directly using the Media ID endpoint
  console.log(`[IG API] Enriching ${post.media_type} post ID: ${post.id}`);

  try {
    const baseUrl = 'https://graph.facebook.com/v22.0';
    
    // Direct API call to get all fields for this specific media ID
    const mediaUrl = `${baseUrl}/${post.id}?fields=${igMediaFields}&access_token=${accessToken}`;
    console.log(`[IG API] Fetching full media data: ${mediaUrl}`);
    
    const mediaResponse = await fetch(mediaUrl);
    
    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.log(`[IG API] Failed to enrich post ${post.id}: ${mediaResponse.status}, Error: ${errorText}`);
      return post;
    }
    
    const mediaData = await mediaResponse.json();
    console.log(`[IG API] Successfully retrieved full media data for post ${post.id}, type: ${mediaData.media_type}`);
    
    if (mediaData.media_type === 'VIDEO') {
      console.log(`[IG API] Enriched VIDEO post with media_url: ${Boolean(mediaData.media_url)}, thumbnail_url: ${Boolean(mediaData.thumbnail_url)}`);
      // Check if this is a reel
      if (mediaData.media_product_type === 'REELS') {
        console.log(`[IG API] This is a REEL (product type: ${mediaData.media_product_type})`);
      }
    }
    
    // Update the post with media data
    return {
      ...post,
      media_url: mediaData.media_url,
      thumbnail_url: mediaData.thumbnail_url,
      children: mediaData.children,
      media_product_type: mediaData.media_product_type
    };
  } catch (error) {
    console.log(`[IG API] Error enriching post ${post.id}: ${error.message}`);
    return post;
  }
}

// Main serverless function handler
export default async function handler(req, res) {
  // Set CORS headers for serverless function
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Read Credentials from environment variables
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    console.error('Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // Determine Request Type
  const { type, tag } = req.query;

  try {
    let posts = [];
    const baseUrl = 'https://graph.facebook.com/v22.0'; // Use a recent API version

    if (type === 'hashtag') {
      if (!tag) {
        return res.status(400).json({ error: 'Missing \'tag\' query parameter for hashtag search.' });
      }
      console.log(`[IG API] Hashtag search requested for: #${tag}`);
      
      // 1. Get Hashtag ID (add business_id parameter which is sometimes needed in newer API versions)
      const searchUrl = `${baseUrl}/ig_hashtag_search?user_id=${accountId}&business_id=${accountId}&q=${encodeURIComponent(tag)}&access_token=${accessToken}`;
      console.log(`[IG API] Fetching hashtag ID: ${searchUrl}`);
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json().catch(e => ({ parseError: e.message }));
      console.log('[IG API] Hashtag Search Response Status:', searchResponse.status);
      console.log('[IG API] Hashtag Search Response Body:', JSON.stringify(searchData));

      if (!searchResponse.ok || !searchData.data || searchData.data.length === 0) {
        const errorMsg = searchData?.error?.message || `Failed to find hashtag ID (Status: ${searchResponse.status})`;
        console.error('[IG API] Hashtag ID Error:', errorMsg);
        if (!searchResponse.ok) throw new Error(errorMsg);
        // If response was ok but no data, return empty array
        posts = []; 
      } else {
        const hashtagId = searchData.data[0].id;
        console.log(`[IG API] Found Hashtag ID for '#${tag}': ${hashtagId}`);

        // 2. Get Media for Hashtag ID
        // IMPORTANT: For hashtag media, we can only request limited fields
        // Instagram API restricts the fields we can request (media_url and thumbnail_url are NOT allowed)
        // We can only use: id, caption, media_type, permalink, timestamp
        const hashtagMediaFields = 'id,caption,media_type,permalink,timestamp,media_product_type';
        
        // Get ALL available media by combining both recent_media and top_media
        let allPosts = [];
        
        // Try recent_media first
        const recentMediaUrl = `${baseUrl}/${hashtagId}/recent_media?user_id=${accountId}&business_id=${accountId}&fields=${hashtagMediaFields}&access_token=${accessToken}`;
        console.log(`[IG API] Fetching recent media for hashtag ID ${hashtagId}: ${recentMediaUrl}`);
        let recentMediaResponse = await fetch(recentMediaUrl);
        let recentMediaData = await recentMediaResponse.json().catch(e => ({ parseError: e.message }));
        
        console.log('[IG API] Recent Media Response Status:', recentMediaResponse.status);
        if (recentMediaResponse.ok && recentMediaData.data) {
          console.log(`[IG API] Found ${recentMediaData.data.length} recent media posts`);
          allPosts = [...recentMediaData.data];
        } else {
          console.log('[IG API] No recent media found or error fetching recent media');
        }
        
        // Then try top_media
        const topMediaUrl = `${baseUrl}/${hashtagId}/top_media?user_id=${accountId}&business_id=${accountId}&fields=${hashtagMediaFields}&access_token=${accessToken}`;
        console.log(`[IG API] Fetching top media for hashtag ID ${hashtagId}: ${topMediaUrl}`);
        let topMediaResponse = await fetch(topMediaUrl);
        let topMediaData = await topMediaResponse.json().catch(e => ({ parseError: e.message }));
        
        console.log('[IG API] Top Media Response Status:', topMediaResponse.status);
        if (topMediaResponse.ok && topMediaData.data) {
          console.log(`[IG API] Found ${topMediaData.data.length} top media posts`);
          
          // Add top media posts that aren't already in the allPosts array (avoid duplicates)
          const existingIds = new Set(allPosts.map(post => post.id));
          const uniqueTopPosts = topMediaData.data.filter(post => !existingIds.has(post.id));
          allPosts = [...allPosts, ...uniqueTopPosts];
        } else {
          console.log('[IG API] No top media found or error fetching top media');
        }
        
        // Use combined set of posts
        posts = allPosts;
        console.log(`[IG API] Total unique posts found for hashtag '#${tag}': ${posts.length}`);
        
        // Try to explicitly request videos for this hashtag using a special parameter
        try {
          const videoMediaUrl = `${baseUrl}/${hashtagId}/top_media?user_id=${accountId}&business_id=${accountId}&fields=${hashtagMediaFields}&media_type=VIDEO&access_token=${accessToken}`;
          console.log(`[IG API] Explicitly fetching video media: ${videoMediaUrl}`);
          const videoMediaResponse = await fetch(videoMediaUrl);
          
          if (videoMediaResponse.ok) {
            const videoMediaData = await videoMediaResponse.json();
            if (videoMediaData.data && videoMediaData.data.length > 0) {
              console.log(`[IG API] Found ${videoMediaData.data.length} videos with explicit search`);
              
              // Add videos that aren't already in the posts array
              const existingIds = new Set(posts.map(post => post.id));
              const uniqueVideos = videoMediaData.data.filter(post => !existingIds.has(post.id));
              
              if (uniqueVideos.length > 0) {
                console.log(`[IG API] Adding ${uniqueVideos.length} new videos to posts`);
                posts = [...posts, ...uniqueVideos];
              }
            } else {
              console.log(`[IG API] No videos found with explicit search`);
            }
          } else {
            const errorText = await videoMediaResponse.text();
            console.log(`[IG API] Video media search failed: ${videoMediaResponse.status}, ${errorText}`);
          }
        } catch (error) {
          console.log(`[IG API] Error in explicit video search: ${error.message}`);
        }
        
        // Enrich posts with media_url and other fields
        console.log('[IG API] Enriching posts - before enrichment:');
        posts.forEach(post => {
          console.log(`  - Post ID ${post.id} (${post.media_type}): Has media_url: ${Boolean(post.media_url)}`);
        });
        
        // For each post, we need to make an additional API call to get the media_url
        const enrichedPosts = [];
        for (const post of posts) {
          console.log(`[IG API] Post ${post.id} (${post.media_type}) needs enrichment, attempting to enrich`);
          const enrichedPost = await enrichPostWithMedia(post, accessToken, accountId);
          enrichedPosts.push(enrichedPost);
        }
        
        posts = enrichedPosts;
        
        console.log('[IG API] Media retrieval summary (after enrichment):');
        posts.forEach(post => {
          console.log(`  - Post ID ${post.id} (${post.media_type}): Has media_url: ${Boolean(post.media_url)}`);
          if (post.media_type === 'CAROUSEL_ALBUM' && post.children) {
            console.log(`    Has ${post.children.data?.length || 0} children items`);
          }
        });
      }
    } else if (type === 'feed') {
      // --- Fetch Account Feed --- 
      const url = `${baseUrl}/${accountId}/media?fields=${igMediaFields}&access_token=${accessToken}`;
      console.log(`[IG API] Fetching account feed: ${baseUrl}/${accountId}/media?fields=...`);
      const response = await fetch(url);
      const data = await handleIGApiResponse(response);
      posts = data.data || []; // The posts are usually in the 'data' array
      console.log(`[IG API] Fetched ${posts.length} posts from account feed.`);
    } else {
      return res.status(400).json({ error: 'Invalid or missing \'type\' query parameter. Use \'feed\' or \'hashtag\'.' });
    }
    
    // Count videos for logging
    const videoCount = posts.filter(p => p.media_type === 'VIDEO').length;
    console.log(`[IG API - Final] Videos in final response: ${videoCount}`);
    console.log(`[IG API - Final] Sending ${posts.length} posts to frontend`);
    
    // Count media types
    const mediaTypes = posts.reduce((acc, post) => {
      acc[post.media_type] = (acc[post.media_type] || 0) + 1;
      return acc;
    }, {});
    console.log(`[IG API - Final] Media types breakdown:`, mediaTypes);

    // --- Send Response --- 
    res.status(200).json({ data: posts });

  } catch (error) {
    console.error('[IG API] Error fetching Instagram data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Instagram data.' });
  }
} 