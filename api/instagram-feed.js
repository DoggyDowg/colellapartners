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
  // Skip if we already have media URLs and it's not a VIDEO (videos might still need enrichment)
  // Or if it's a carousel which always needs enrichment for children
  if (post.media_url && post.media_type !== 'VIDEO' && post.media_type !== 'CAROUSEL_ALBUM') {
    return post;
  }

  // Skip if we already have children data for a carousel
  if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.length > 0) {
     // Even if carousel has children, let's re-fetch to ensure all fields are present
     // return post; // Keeping enrichment for carousels for now
  }

  // We need to fetch the media directly using the Media ID endpoint
  // Add more detail to logging
  console.log(`[IG API Enrich] Enriching post ID: ${post.id} (Type: ${post.media_type}, Product Type: ${post.media_product_type || 'N/A'})`);

  try {
    const baseUrl = 'https://graph.facebook.com/v22.0';

    // Direct API call to get all fields for this specific media ID
    const mediaUrl = `${baseUrl}/${post.id}?fields=${igMediaFields}&access_token=${accessToken}`;
    // Log carefully - don't log the full URL with token in production environments ideally
    console.log(`[IG API Enrich] Fetching full media data: ${baseUrl}/${post.id}?fields=...`);

    const mediaResponse = await fetch(mediaUrl);

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.error(`[IG API Enrich] Failed to enrich post ${post.id}: ${mediaResponse.status}, Error: ${errorText}`);
      // Return the original post data if enrichment fails
      return post;
    }

    const mediaData = await mediaResponse.json();
    console.log(`[IG API Enrich] Successfully retrieved full media data for post ${post.id}, type: ${mediaData.media_type}`);

    if (mediaData.media_type === 'VIDEO') {
      console.log(`[IG API Enrich] Enriched VIDEO post ${post.id}. Has media_url: ${Boolean(mediaData.media_url)}, Has thumbnail_url: ${Boolean(mediaData.thumbnail_url)}`);
      if (mediaData.media_product_type === 'REELS') {
        console.log(`[IG API Enrich] Post ${post.id} is a REEL.`);
      }
       // If media_url is missing for a video, log it clearly
      if (!mediaData.media_url) {
        console.warn(`[IG API Enrich] Video/Reel ${post.id} enrichment completed BUT media_url is missing. Permalink: ${mediaData.permalink}`);
      }
    } else if (mediaData.media_type === 'CAROUSEL_ALBUM') {
        console.log(`[IG API Enrich] Enriched CAROUSEL_ALBUM post ${post.id}. Children count: ${mediaData.children?.data?.length || 0}`);
    }

    // Update the post with enriched media data
    // Ensure we merge correctly, keeping original fields if enrichment didn't provide them
    return {
      ...post, // Keep original data
      ...mediaData // Overwrite with enriched data (id, caption might be duplicated but harmless)
    };
  } catch (error) {
    // Log the error with stack trace if possible
    console.error(`[IG API Enrich] Error enriching post ${post.id}: ${error.message}`, error.stack);
    // Return the original post data in case of error
    return post;
  }
}

// Main serverless function handler
export default async function handler(req, res) {
  console.log("[IG API] Request received for Instagram feed (Refactored: Feed + Filter)");

  // Set CORS headers for serverless function
  res.setHeader('Access-Control-Allow-Credentials', true);
  // Adjust origin in production if needed, '*' is permissive for dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS'); // Only GET is needed now
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("[IG API] Responding to OPTIONS request");
    res.status(200).end();
    return;
  }

  // We only support GET now
  if (req.method !== 'GET') {
    console.log(`[IG API] Method Not Allowed: ${req.method}`);
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }


  // Read Credentials from environment variables
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  
  // Use the standard backend environment variable name
  const filterTag = process.env.INSTAGRAM_FILTER_HASHTAG || '#ColellaPartners';
  // Make sure we don't have leading or trailing whitespace
  const cleanFilterTag = filterTag.trim();
  // Updated log to reflect the source (env or default)
  console.log(`[IG API] Using filter tag: "${cleanFilterTag}" (from ${process.env.INSTAGRAM_FILTER_HASHTAG ? 'environment' : 'default'})`);

  if (!accessToken || !accountId) {
    console.error('[IG API] Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Missing Instagram credentials' });
  }

  console.log(`[IG API] Using Account ID: ${accountId ? 'Provided' : 'MISSING'}, Filter Tag: "${cleanFilterTag}"`);


  try {
    let posts = [];
    const baseUrl = 'https://graph.facebook.com/v22.0'; // Use a recent API version
    const fetchLimit = 50; // How many recent posts to fetch initially

    // --- Fetch Account Feed Directly ---
    console.log(`[IG API] Fetching account feed (limit: ${fetchLimit})`);
    const url = `${baseUrl}/${accountId}/media?fields=${igMediaFields}&limit=${fetchLimit}&access_token=${accessToken}`;
    // Log carefully in production
    console.log(`[IG API] Fetch URL: ${baseUrl}/${accountId}/media?fields=...&limit=${fetchLimit}&access_token=...`);

    const response = await fetch(url);
    const data = await handleIGApiResponse(response); // Throws on error
    const fetchedPosts = data.data || []; // The posts are usually in the 'data' array
    console.log(`[IG API] Fetched ${fetchedPosts.length} posts directly from account feed.`);

    // --> ADD THIS LOGGING <--
    console.log('[IG API] Captions from initial fetch (first 50):');
    fetchedPosts.forEach((post, index) => {
        // Log caption safely, checking if it exists
        const captionText = post.caption ? `Caption -> "${post.caption}"` : "Caption -> null/undefined";
        console.log(`  Post ${index + 1} (${post.id}, Type: ${post.media_type}): ${captionText}`);
    });
    // --> END LOGGING <--

    // --- Filter Posts by Hashtag in Caption ---
    // Log the actual filter tag being used
    console.log(`[IG API] Filtering posts by caption containing: "${cleanFilterTag}"`);
    
    // Use a case-insensitive filter to improve matching
    const filteredPosts = fetchedPosts.filter(post => {
      if (!post.caption) return false;
      
      // Convert both to lowercase for case-insensitive comparison
      const caption = post.caption.toLowerCase();
      const tagToFind = cleanFilterTag.toLowerCase();
      
      return caption.includes(tagToFind);
    });
    
    console.log(`[IG API] Filtered down to ${filteredPosts.length} posts.`);

    // --- Enrich Filtered Posts (If Necessary) ---
    // Enrichment is still useful for carousels and potentially videos missing URLs
    console.log(`[IG API] Starting enrichment process for ${filteredPosts.length} filtered posts.`);
    const enrichedPosts = [];
    // Use Promise.all for potentially faster concurrent enrichment
    const enrichmentPromises = filteredPosts.map(post => {
      // Log before attempting enrichment on a specific post
      console.log(`[IG API] Preparing to enrich post ${post.id} (Type: ${post.media_type})`);
      return enrichPostWithMedia(post, accessToken, accountId)
        .catch(enrichError => {
           // Catch errors from individual enrichment calls
           console.error(`[IG API Enrich] FATAL Error during enrichment for post ${post.id}:`, enrichError);
           return post; // Return original post if enrichment promise rejects fatally
        });
    });

    // Wait for all enrichment promises to settle
    const settledPosts = await Promise.all(enrichmentPromises);
    posts = settledPosts; // Assign the results (enriched or original if failed)

    console.log(`[IG API] Enrichment complete. Total posts after enrichment: ${posts.length}`);


    // --- Final Logging & Response ---
    const finalVideoCount = posts.filter(p => p.media_type === 'VIDEO').length;
    const finalReelCount = posts.filter(p => p.media_product_type === 'REELS').length;
    console.log(`[IG API - Final] Total posts: ${posts.length}, Videos: ${finalVideoCount}, Reels: ${finalReelCount}`);

    // Log counts of media types
    const mediaTypes = posts.reduce((acc, post) => {
      const type = post.media_type + (post.media_product_type === 'REELS' ? '_REEL' : '');
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    console.log(`[IG API - Final] Media types breakdown:`, JSON.stringify(mediaTypes));

    // Log details if needed for debugging, be mindful of log volume
    // posts.forEach((post, index) => {
    //   console.log(`[IG API - Final Post ${index + 1}] ID: ${post.id}, Type: ${post.media_type}, Product: ${post.media_product_type || 'N/A'}, Has media_url: ${!!post.media_url}, Has thumbnail_url: ${!!post.thumbnail_url}`);
    // });

    return res.status(200).json({ data: posts });

  } catch (error) {
    // Catch errors from handleIGApiResponse or other issues
    console.error('[IG API] Error fetching or processing Instagram feed:', error.message, error.stack);
    // Provide a more generic error message to the client
    return res.status(500).json({ error: 'Failed to fetch or process Instagram feed.' });
  }
} 