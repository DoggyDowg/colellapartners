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
  // Read Credentials
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
    const baseUrl = 'https://graph.facebook.com/v22.0'; // Update to v22.0 to match token

    if (type === 'hashtag') {
      if (!tag) {
        return res.status(400).json({ error: 'Missing \'tag\' query parameter for hashtag search.' });
      }
      console.log(`[IG API - Inline] Hashtag search requested for: #${tag}`);
      
      // 1. Get Hashtag ID (add business_id parameter which is sometimes needed in newer API versions)
      const searchUrl = `${baseUrl}/ig_hashtag_search?user_id=${accountId}&business_id=${accountId}&q=${encodeURIComponent(tag)}&access_token=${accessToken}`;
      console.log(`[IG API - Inline] Fetching hashtag ID: ${searchUrl}`);
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json().catch(e => ({ parseError: e.message }));
      console.log('[IG API - Inline] Hashtag Search Response Status:', searchResponse.status);
      console.log('[IG API - Inline] Hashtag Search Response Body:', JSON.stringify(searchData));

      if (!searchResponse.ok || !searchData.data || searchData.data.length === 0) {
        const errorMsg = searchData?.error?.message || `Failed to find hashtag ID (Status: ${searchResponse.status})`;
        console.error('[IG API - Inline] Hashtag ID Error:', errorMsg);
        if (!searchResponse.ok) throw new Error(errorMsg);
        // If response was ok but no data, return empty array
        posts = []; 
      } else {
        const hashtagId = searchData.data[0].id;
        console.log(`[IG API - Inline] Found Hashtag ID for '#${tag}': ${hashtagId}`);

        // 2. Get Media for Hashtag ID
        // IMPORTANT: For hashtag media, we can only request limited fields
        // Instagram API restricts the fields we can request (media_url and thumbnail_url are NOT allowed)
        // We can only use: id, caption, media_type, permalink, timestamp
        const hashtagMediaFields = 'id,caption,media_type,permalink,timestamp,media_product_type';
        
        // Get ALL available media by combining both recent_media and top_media
        let allPosts = [];
        
        // Try recent_media first
        const recentMediaUrl = `${baseUrl}/${hashtagId}/recent_media?user_id=${accountId}&business_id=${accountId}&fields=${hashtagMediaFields}&access_token=${accessToken}`;
        console.log(`[IG API - Inline] Fetching recent media for hashtag ID ${hashtagId}: ${recentMediaUrl}`);
        let recentMediaResponse = await fetch(recentMediaUrl);
        let recentMediaData = await recentMediaResponse.json().catch(e => ({ parseError: e.message }));
        
        console.log('[IG API - Inline] Recent Media Response Status:', recentMediaResponse.status);
        if (recentMediaResponse.ok && recentMediaData.data) {
          console.log(`[IG API - Inline] Found ${recentMediaData.data.length} recent media posts`);
          
          // Log media types from recent media
          if (recentMediaData.data.length > 0) {
            const mediaTypes = recentMediaData.data.map(post => post.media_type);
            console.log(`[IG API - Inline] Recent media types: ${JSON.stringify(mediaTypes)}`);
            
            // Log if we found any videos
            const videoCount = mediaTypes.filter(type => type === 'VIDEO').length;
            console.log(`[IG API - Inline] Number of videos in recent media: ${videoCount}`);
            
            if (videoCount > 0) {
              console.log('[IG API - Inline] Found videos in recent media:');
              recentMediaData.data
                .filter(post => post.media_type === 'VIDEO')
                .forEach(video => {
                  console.log(`  - Video ID: ${video.id}`);
                  console.log(`    Has permalink: ${Boolean(video.permalink)}`);
                });
            }
          }
          
          allPosts = [...recentMediaData.data];
        } else {
          console.log('[IG API - Inline] No recent media found or error fetching recent media');
        }
        
        // Then try top_media
        const topMediaUrl = `${baseUrl}/${hashtagId}/top_media?user_id=${accountId}&business_id=${accountId}&fields=${hashtagMediaFields}&access_token=${accessToken}`;
        console.log(`[IG API - Inline] Fetching top media for hashtag ID ${hashtagId}: ${topMediaUrl}`);
        let topMediaResponse = await fetch(topMediaUrl);
        let topMediaData = await topMediaResponse.json().catch(e => ({ parseError: e.message }));
        
        console.log('[IG API - Inline] Top Media Response Status:', topMediaResponse.status);
        if (topMediaResponse.ok && topMediaData.data) {
          console.log(`[IG API - Inline] Found ${topMediaData.data.length} top media posts`);
          
          // Log media types from top media
          if (topMediaData.data.length > 0) {
            const mediaTypes = topMediaData.data.map(post => post.media_type);
            console.log(`[IG API - Inline] Top media types: ${JSON.stringify(mediaTypes)}`);
            
            // Log if we found any videos
            const videoCount = mediaTypes.filter(type => type === 'VIDEO').length;
            console.log(`[IG API - Inline] Number of videos in top media: ${videoCount}`);
            
            if (videoCount > 0) {
              console.log('[IG API - Inline] Found videos in top media:');
              topMediaData.data
                .filter(post => post.media_type === 'VIDEO')
                .forEach(video => {
                  console.log(`  - Video ID: ${video.id}`);
                  console.log(`    Has permalink: ${Boolean(video.permalink)}`);
                });
            }
          }
          
          // Add top media posts that aren't already in the allPosts array (avoid duplicates)
          const existingIds = new Set(allPosts.map(post => post.id));
          const uniqueTopPosts = topMediaData.data.filter(post => !existingIds.has(post.id));
          allPosts = [...allPosts, ...uniqueTopPosts];
        } else {
          console.log('[IG API - Inline] No top media found or error fetching top media');
        }
        
        // Use combined set of posts
        posts = allPosts;
        console.log(`[IG API - Inline] Total unique posts found for hashtag '#${tag}': ${posts.length}`);
        
        // Try to explicitly request videos for this hashtag using a special parameter
        try {
          const videoMediaUrl = `${baseUrl}/${hashtagId}/top_media?user_id=${accountId}&business_id=${accountId}&fields=${hashtagMediaFields}&media_type=VIDEO&access_token=${accessToken}`;
          console.log(`[IG API - Inline] Explicitly fetching video media: ${videoMediaUrl}`);
          const videoMediaResponse = await fetch(videoMediaUrl);
          
          if (videoMediaResponse.ok) {
            const videoMediaData = await videoMediaResponse.json();
            if (videoMediaData.data && videoMediaData.data.length > 0) {
              console.log(`[IG API - Inline] Found ${videoMediaData.data.length} videos with explicit search`);
              
              // Add videos that aren't already in the posts array
              const existingIds = new Set(posts.map(post => post.id));
              const uniqueVideos = videoMediaData.data.filter(post => !existingIds.has(post.id));
              
              if (uniqueVideos.length > 0) {
                console.log(`[IG API - Inline] Adding ${uniqueVideos.length} new videos to posts`);
                posts = [...posts, ...uniqueVideos];
              }
            } else {
              console.log(`[IG API - Inline] No videos found with explicit search`);
            }
          } else {
            const errorText = await videoMediaResponse.text();
            console.log(`[IG API - Inline] Video media search failed: ${videoMediaResponse.status}, ${errorText}`);
          }
        } catch (error) {
          console.log(`[IG API - Inline] Error in explicit video search: ${error.message}`);
        }
        
        // For hashtag searches, the Instagram API doesn't provide media_url for videos
        // Process posts to ensure proper frontend rendering
        posts = posts.map(post => {
          // Make sure all posts explicitly preserve their media type
          const originalType = post.media_type;
          
          if (originalType === 'VIDEO') {
            console.log(`[IG API - Inline] Processing VIDEO post: ${post.id}`);
            // For videos, we need to ensure they have the right format
            return {
              ...post,
              media_type: 'VIDEO', // Explicitly set to ensure it's passed through correctly
              // Don't set media_url to undefined, let enrichment add it
            };
          } else if (originalType === 'CAROUSEL_ALBUM') {
            console.log(`[IG API - Inline] Processing CAROUSEL_ALBUM post: ${post.id}`);
            // For carousels, we preserve original format
            return {
              ...post,
              media_type: 'CAROUSEL_ALBUM', // Ensure type is preserved
            };
          } else {
            console.log(`[IG API - Inline] Processing IMAGE post: ${post.id}`);
            // For images, we preserve original format
            return {
              ...post,
              media_type: originalType || 'IMAGE', // Default to IMAGE if type is missing
            };
          }
        });
        
        // Log media types to verify we're receiving videos
        if (posts.length > 0) {
          const mediaTypes = posts.map(post => post.media_type);
          const countByType = mediaTypes.reduce((acc, type) => {
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          const videoCount = mediaTypes.filter(type => type === 'VIDEO').length;
          
          console.log(`[IG API - Inline] Media types in final response: ${JSON.stringify(mediaTypes)}`);
          console.log(`[IG API - Inline] Media types count in final response: ${JSON.stringify(countByType)}`);
          console.log(`[IG API - Inline] Number of videos in final response: ${videoCount}`);
          
          // Debug first few posts if available
          if (posts.length > 0) {
            console.log('[IG API - Inline] First post details:');
            const firstPost = posts[0];
            console.log(`  ID: ${firstPost.id}`);
            console.log(`  Type: ${firstPost.media_type}`);
            console.log(`  Has permalink: ${Boolean(firstPost.permalink)}`);
            console.log(`  Has media_url: ${Boolean(firstPost.media_url)}`);
          }
          
          // If we have any videos, log their details
          if (videoCount > 0) {
            console.log('[IG API - Inline] Video posts details:');
            posts
              .filter(post => post.media_type === 'VIDEO')
              .forEach((video, index) => {
                console.log(`  Video #${index + 1}:`);
                console.log(`    ID: ${video.id}`);
                console.log(`    Has permalink: ${Boolean(video.permalink)}`);
                console.log(`    Has media_url: ${Boolean(video.media_url)}`);
              });
          }
        }

        // After processing posts, enrich carousel posts with media data
        const enrichedPosts = [];
        console.log('[IG API - Inline] Enriching posts - before enrichment:');
        posts.forEach(post => {
          console.log(`  - Post ID ${post.id} (${post.media_type}): Has media_url: ${Boolean(post.media_url)}`);
        });
        
        for (const post of posts) {
          // Enrich any post that doesn't have a media_url or is a VIDEO (videos need special handling)
          if (!post.media_url || post.media_type === 'VIDEO') {
            console.log(`[IG API - Inline] Post ${post.id} (${post.media_type}) needs enrichment, attempting to enrich`);
            const enrichedPost = await enrichPostWithMedia(post, accessToken, accountId);
            enrichedPosts.push(enrichedPost);
          } else {
            enrichedPosts.push(post);
          }
        }
        
        // Replace posts with enriched version
        posts = enrichedPosts;
        
        // Log additional info about enriched posts
        if (posts.length > 0) {
          console.log('[IG API - Inline] Media retrieval summary (after enrichment):');
          posts.forEach(post => {
            console.log(`  - Post ID ${post.id} (${post.media_type}): Has media_url: ${Boolean(post.media_url)}`);
            if (post.children?.data) {
              console.log(`    Has ${post.children.data.length} children items`);
            }
          });
          
          // Final count of videos with actual usable data
          const finalVideos = posts.filter(post => post.media_type === 'VIDEO');
          console.log(`[IG API - Final] Videos in final response: ${finalVideos.length}`);
          if (finalVideos.length > 0) {
            console.log('[IG API - Final] Video posts in final response:');
            finalVideos.forEach((video, index) => {
              console.log(`  Video #${index + 1}:`);
              console.log(`    ID: ${video.id}`);
              console.log(`    Has permalink: ${Boolean(video.permalink)}`);
              console.log(`    Has media_url: ${Boolean(video.media_url)}`);
              console.log(`    Has thumbnail_url: ${Boolean(video.thumbnail_url)}`);
            });
          }
        }
      }
    } else {
      // Only handle hashtag for now
      return res.status(400).json({ error: 'Invalid or missing \'type\' query parameter. Only \'hashtag\' is supported currently.' });
    }

    // Log final payload for frontend
    console.log(`[IG API - Final] Sending ${posts.length} posts to frontend`);
    console.log(`[IG API - Final] Media types breakdown:`, 
      posts.reduce((acc, post) => {
        acc[post.media_type] = (acc[post.media_type] || 0) + 1;
        return acc;
      }, {})
    );

    res.status(200).json({ data: posts });

  } catch (error) {
    console.error('[IG API - Inline] Error fetching Instagram data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Instagram data.' });
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

// Debug endpoint to test video fetching directly by ID
app.get('/api/instagram-debug-video', async (req, res) => {
  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Missing videoId parameter' });
    }
    
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
    
    if (!accessToken || !accountId) {
      return res.status(500).json({ error: 'Missing Instagram credentials in environment variables' });
    }
    
    // Try different methods to fetch video content
    const baseUrl = 'https://graph.facebook.com/v22.0';
    const results = {};
    
    // Method 1: Direct media endpoint
    try {
      const fields = 'id,media_type,media_url,thumbnail_url,permalink,media_product_type';
      const mediaUrl = `${baseUrl}/${videoId}?fields=${fields}&access_token=${accessToken}`;
      console.log(`[Debug] Trying direct media fetch: ${mediaUrl}`);
      
      const mediaResponse = await fetch(mediaUrl);
      if (mediaResponse.ok) {
        results.directMedia = await mediaResponse.json();
        console.log(`[Debug] Direct media success:`, results.directMedia);
      } else {
        const errorText = await mediaResponse.text();
        results.directMediaError = {
          status: mediaResponse.status,
          error: errorText
        };
        console.log(`[Debug] Direct media failed: ${mediaResponse.status}, ${errorText}`);
      }
    } catch (error) {
      results.directMediaError = { error: error.message };
      console.log(`[Debug] Direct media exception: ${error.message}`);
    }
    
    // Method 2: Media Content endpoint
    try {
      const contentUrl = `${baseUrl}/${videoId}/media?access_token=${accessToken}`;
      console.log(`[Debug] Trying media content fetch: ${contentUrl}`);
      
      const contentResponse = await fetch(contentUrl);
      if (contentResponse.ok) {
        results.mediaContent = await contentResponse.json();
        console.log(`[Debug] Media content success:`, results.mediaContent);
      } else {
        const errorText = await contentResponse.text();
        results.mediaContentError = {
          status: contentResponse.status,
          error: errorText
        };
        console.log(`[Debug] Media content failed: ${contentResponse.status}, ${errorText}`);
      }
    } catch (error) {
      results.mediaContentError = { error: error.message };
      console.log(`[Debug] Media content exception: ${error.message}`);
    }
    
    // Method 3: Children endpoint (in case it's part of a carousel)
    try {
      const childrenUrl = `${baseUrl}/${videoId}/children?fields=id,media_type,media_url,thumbnail_url&access_token=${accessToken}`;
      console.log(`[Debug] Trying children fetch: ${childrenUrl}`);
      
      const childrenResponse = await fetch(childrenUrl);
      if (childrenResponse.ok) {
        results.children = await childrenResponse.json();
        console.log(`[Debug] Children success:`, results.children);
      } else {
        const errorText = await childrenResponse.text();
        results.childrenError = {
          status: childrenResponse.status,
          error: errorText
        };
        console.log(`[Debug] Children failed: ${childrenResponse.status}, ${errorText}`);
      }
    } catch (error) {
      results.childrenError = { error: error.message };
      console.log(`[Debug] Children exception: ${error.message}`);
    }
    
    // Return all results
    return res.status(200).json({ 
      videoId,
      results 
    });
    
  } catch (error) {
    console.error('[Debug] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to debug video',
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