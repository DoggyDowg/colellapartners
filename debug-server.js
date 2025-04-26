// Simple Express server to handle the debug endpoint
import express from 'express';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import fetch from 'node-fetch';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Create Express server
const app = express();
const PORT = 3002; // Use a different port from the main server

// Enable CORS for all requests
app.use(cors());

// Parse JSON request body
app.use(express.json());

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

// Start the server
app.listen(PORT, () => {
  console.log(`Debug server running at http://localhost:${PORT}`);
  console.log('Currently handling:');
  console.log('  - GET /api/instagram-debug-video');
}); 