// Simple Express server to handle API routes in development
import express from 'express';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import fetch from 'node-fetch'; // Import fetch here directly

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Create Express server
const app = express();
const PORT = process.env.API_PORT || 3001;

// Enable CORS for all requests
app.use(cors());

// Parse JSON request body
app.use(express.json());

// --- Instagram Feed Logic Inlined --- 

// Helper function to handle API responses (moved inline)
async function handleIGApiResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    console.error('Instagram API Error:', errorData);
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Define the fields we want for each media item (moved inline)
const igMediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url},media_product_type';

// Helper function to enrich carousel posts with media URLs
async function enrichPostWithMedia(post, accessToken, accountId) {
  // Skip if we already have media URLs
  if (post.media_url && post.media_type !== 'VIDEO') {
    return post;
  }
  
  // We need to fetch the media directly using the Media ID endpoint
  console.log(`[IG API - Inline] Enriching ${post.media_type} post ID: ${post.id}`);

  try {
    const baseUrl = 'https://graph.facebook.com/v22.0';
    
    // Direct API call to get all fields for this specific media ID
    const mediaUrl = `${baseUrl}/${post.id}?fields=${igMediaFields}&access_token=${accessToken}`;
    console.log(`[IG API - Inline] Fetching full media data: ${mediaUrl}`);
    
    const mediaResponse = await fetch(mediaUrl);
    
    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      console.log(`[IG API - Inline] Failed to enrich post ${post.id}: ${mediaResponse.status}, Error: ${errorText}`);
      return post;
    }
    
    const mediaData = await mediaResponse.json();
    console.log(`[IG API - Inline] Successfully retrieved full media data for post ${post.id}, type: ${mediaData.media_type}`);
    
    if (mediaData.media_type === 'VIDEO') {
      console.log(`[IG API - Inline] Enriched VIDEO post with media_url: ${Boolean(mediaData.media_url)}, thumbnail_url: ${Boolean(mediaData.thumbnail_url)}`);
      // Check if this is a reel
      if (mediaData.media_product_type === 'REELS') {
        console.log(`[IG API - Inline] This is a REEL (product type: ${mediaData.media_product_type})`);
      }
      
      // Log more details about this video
      if (mediaData.media_url) {
        console.log(`[IG API - Inline] Video URL format: ${mediaData.media_url.substring(0, 50)}...`);
      } else {
        console.log(`[IG API - Inline] Video has NO media_url. This may be due to API limitations.`);
        
        // Try an alternative method for videos
        try {
          // For videos without media_url, try to get the media itself
          const videoMediaUrl = `${baseUrl}/${post.id}/media?access_token=${accessToken}`;
          console.log(`[IG API - Inline] Attempting alternative video URL fetch: ${videoMediaUrl}`);
          
          const videoResponse = await fetch(videoMediaUrl);
          if (videoResponse.ok) {
            const videoMediaData = await videoResponse.json();
            console.log(`[IG API - Inline] Alternative video URL response:`, videoMediaData);
            
            // If we got a URL, use it
            if (videoMediaData.media_url) {
              mediaData.media_url = videoMediaData.media_url;
              console.log(`[IG API - Inline] Successfully retrieved alternative video URL`);
            }
          } else {
            console.log(`[IG API - Inline] Failed to fetch alternative video URL: ${videoResponse.status}`);
          }
        } catch (videoError) {
          console.log(`[IG API - Inline] Error fetching alternative video URL: ${videoError.message}`);
        }
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
    console.log(`[IG API - Inline] Error enriching post ${post.id}: ${error.message}`);
    return post;
  }
}

// Instagram Feed API route (Handler logic now inline)
app.all('/api/instagram-feed', async (req, res) => {
  console.log("[IG API - Inline] Request received for Instagram feed (Refactored: Feed + Filter)");

  // We only support GET now
  if (req.method !== 'GET') {
    console.log(`[IG API - Inline] Method Not Allowed: ${req.method}`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  // Read Credentials
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  
  // Use the standard backend environment variable name
  const filterTag = process.env.INSTAGRAM_FILTER_HASHTAG || '#ColellaPartners';
  // Make sure we don't have leading or trailing whitespace
  const cleanFilterTag = filterTag.trim();
  // Updated log to reflect the source (env or default)
  console.log(`[IG API - Inline] Using filter tag: "${cleanFilterTag}" (from ${process.env.INSTAGRAM_FILTER_HASHTAG ? 'environment' : 'default'})`);

  if (!accessToken || !accountId) {
    console.error('[IG API - Inline] Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID environment variables.');
    return res.status(500).json({ error: 'Server configuration error: Missing Instagram credentials' });
  }

  console.log(`[IG API - Inline] Using Account ID: ${accountId ? 'Provided' : 'MISSING'}, Filter Tag: "${cleanFilterTag}"`);

  try {
    let posts = [];
    const baseUrl = 'https://graph.facebook.com/v22.0'; // Use a recent API version
    const fetchLimit = 50; // How many recent posts to fetch initially

    // --- Fetch Account Feed Directly ---
    console.log(`[IG API - Inline] Fetching account feed (limit: ${fetchLimit})`);
    const url = `${baseUrl}/${accountId}/media?fields=${igMediaFields}&limit=${fetchLimit}&access_token=${accessToken}`;
    console.log(`[IG API - Inline] Fetch URL: ${baseUrl}/${accountId}/media?fields=...&limit=${fetchLimit}&access_token=...`);

    const response = await fetch(url);
    const data = await handleIGApiResponse(response); // Throws on error
    const fetchedPosts = data.data || [];
    console.log(`[IG API - Inline] Fetched ${fetchedPosts.length} posts directly from account feed.`);

    // --> ADD THIS LOGGING <--
    console.log('[IG API - Inline] Captions from initial fetch (first 50):');
    fetchedPosts.forEach((post, index) => {
        // Log caption safely, checking if it exists
        const captionText = post.caption ? `Caption -> "${post.caption}"` : "Caption -> null/undefined";
        console.log(`  Inline Post ${index + 1} (${post.id}, Type: ${post.media_type}): ${captionText}`);
    });
    // --> END LOGGING <--

    // --- Filter Posts by Hashtag in Caption ---
    // Log the actual filter tag being used
    console.log(`[IG API - Inline] Filtering posts by caption containing: "${cleanFilterTag}"`);
    
    // Use a case-insensitive filter to improve matching
    const filteredPosts = fetchedPosts.filter(post => {
      if (!post.caption) return false;
      
      // Convert both to lowercase for case-insensitive comparison
      const caption = post.caption.toLowerCase();
      const tagToFind = cleanFilterTag.toLowerCase();
      
      return caption.includes(tagToFind);
    });
    
    console.log(`[IG API - Inline] Filtered down to ${filteredPosts.length} posts.`);

    // --- Enrich Filtered Posts (If Necessary) ---
    console.log(`[IG API - Inline] Starting enrichment process for ${filteredPosts.length} filtered posts.`);
    const enrichmentPromises = filteredPosts.map(post => {
      console.log(`[IG API - Inline] Preparing to enrich post ${post.id} (Type: ${post.media_type})`);
      // Note: enrichPostWithMedia is defined earlier in server.js
      return enrichPostWithMedia(post, accessToken, accountId)
        .catch(enrichError => {
           console.error(`[IG API - Inline Enrich] FATAL Error during enrichment for post ${post.id}:`, enrichError);
           return post; // Return original post if enrichment promise rejects fatally
        });
    });

    const settledPosts = await Promise.all(enrichmentPromises);
    posts = settledPosts;

    console.log(`[IG API - Inline] Enrichment complete. Total posts after enrichment: ${posts.length}`);

    // --- Final Logging & Response ---
    const finalVideoCount = posts.filter(p => p.media_type === 'VIDEO').length;
    const finalReelCount = posts.filter(p => p.media_product_type === 'REELS').length;
    console.log(`[IG API - Inline - Final] Total posts: ${posts.length}, Videos: ${finalVideoCount}, Reels: ${finalReelCount}`);

    const mediaTypes = posts.reduce((acc, post) => {
      const type = post.media_type + (post.media_product_type === 'REELS' ? '_REEL' : '');
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
    console.log(`[IG API - Inline - Final] Media types breakdown:`, JSON.stringify(mediaTypes));

    // Log details if needed for debugging
    // posts.forEach((post, index) => {
    //   console.log(`[IG API - Inline - Final Post ${index + 1}] ID: ${post.id}, Type: ${post.media_type}, Product: ${post.media_product_type || 'N/A'}, Has media_url: ${!!post.media_url}, Has thumbnail_url: ${!!post.thumbnail_url}`);
    // });

    return res.status(200).json({ data: posts });

  } catch (error) {
    console.error('[IG API - Inline] Error fetching or processing Instagram feed:', error.message, error.stack);
    return res.status(500).json({ error: 'Failed to fetch or process Instagram feed.' });
  }
});

// Instagram oEmbed API endpoint
app.get('/api/instagram-oembed', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'Missing URL parameter' });
    }
    
    // Instagram oEmbed API endpoint
    const oEmbedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&maxwidth=640&hidecaption=true&omitscript=true`;
    
    const response = await fetch(oEmbedUrl);
    
    if (!response.ok) {
      // If direct oEmbed fails, try the graph API with permalink instead
      // This is a workaround since the public oEmbed API might have restrictions
      const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
      const graphApiUrl = `https://graph.facebook.com/v22.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${accessToken}`;
      
      const graphResponse = await fetch(graphApiUrl);
      
      if (!graphResponse.ok) {
        return res.status(response.status).json({ 
          error: 'Failed to fetch oEmbed data',
          originalStatus: response.status 
        });
      }
      
      const data = await graphResponse.json();
      return res.status(200).json(data);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch oEmbed data',
      message: error.message 
    });
  }
});

// Add a catch-all for other /api routes 
app.all('/api/*', (req, res) => {
  res.status(501).json({ error: `API route ${req.path} not implemented in this development server (server.js).` });
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server (Inlined IG Handler) running at http://localhost:${PORT}`);
  console.log('Currently handling:');
  console.log('  - GET /api/instagram-feed?type=feed');
  console.log('  - GET /api/instagram-feed?type=hashtag&tag=YOUR_HASHTAG');
  console.log('NOTE: Other API routes are disabled in this simplified server.js');
}); 