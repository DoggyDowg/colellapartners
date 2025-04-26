import fetch from 'node-fetch'; // Use node-fetch with ESM import

// Helper function to handle API responses
async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
    console.error('Instagram API Error:', errorData);
    throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Define the fields we want for each media item
const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type,media_url,thumbnail_url}';

// Default export for the serverless function handler
export default async function handler(req, res) {
  // --- Security Check: Ensure this is not run client-side (basic check) ---
  if (typeof window !== 'undefined') {
    return res.status(403).json({ error: 'This endpoint is server-side only.' });
  }

  // --- Read Credentials --- 
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    console.error('Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID environment variables.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  // --- Determine Request Type --- 
  const { type, tag } = req.query; // Get params like ?type=feed or ?type=hashtag&tag=...

  try {
    let posts = [];
    const baseUrl = 'https://graph.facebook.com/v19.0'; // Use a recent API version

    if (type === 'feed') {
      // --- Fetch Account Feed --- 
      const url = `${baseUrl}/${accountId}/media?fields=${mediaFields}&access_token=${accessToken}`;
      console.log(`[IG API] Fetching account feed: ${baseUrl}/${accountId}/media?fields=...`);
      const response = await fetch(url);
      const data = await handleResponse(response);
      posts = data.data || []; // The posts are usually in the 'data' array
      console.log(`[IG API] Fetched ${posts.length} posts from account feed.`);

    } else if (type === 'hashtag') {
      // --- Fetch Hashtag Posts --- 
      if (!tag) {
        return res.status(400).json({ error: 'Missing \'tag\' query parameter for hashtag search.' });
      }
      console.log(`[IG API] Hashtag search requested for: #${tag}`);

      // 1. Get Hashtag ID
      const searchUrl = `${baseUrl}/ig_hashtag_search?user_id=${accountId}&q=${encodeURIComponent(tag)}&access_token=${accessToken}`;
      console.log(`[IG API] Fetching hashtag ID: ${baseUrl}/ig_hashtag_search?user_id=...&q=${tag}`);
      const searchResponse = await fetch(searchUrl);
      const searchData = await handleResponse(searchResponse);

      if (!searchData.data || searchData.data.length === 0) {
        console.log(`[IG API] Hashtag '#${tag}' not found or no ID returned.`);
        posts = []; // No ID found, so no posts
      } else {
        const hashtagId = searchData.data[0].id;
        console.log(`[IG API] Found Hashtag ID for '#${tag}': ${hashtagId}`);

        // 2. Get Top Media for Hashtag ID
        const mediaUrl = `${baseUrl}/${hashtagId}/top_media?user_id=${accountId}&fields=${mediaFields}&access_token=${accessToken}`;
        console.log(`[IG API] Fetching top media for hashtag ID ${hashtagId}: ${baseUrl}/${hashtagId}/top_media?user_id=...&fields=...`);
        const mediaResponse = await fetch(mediaUrl);
        const mediaData = await handleResponse(mediaResponse);
        posts = mediaData.data || [];
        console.log(`[IG API] Fetched ${posts.length} posts for hashtag '#${tag}'.`);
      }

    } else {
      return res.status(400).json({ error: 'Invalid or missing 'type' query parameter. Use 'feed' or 'hashtag'.' });
    }

    // --- Send Response --- 
    res.status(200).json({ data: posts });

  } catch (error) {
    console.error('[IG API] Error fetching Instagram data:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Instagram data.' });
  }
}; 