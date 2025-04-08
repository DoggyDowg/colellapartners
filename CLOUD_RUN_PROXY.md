# Using the VaultRE API with Google Cloud Run Proxy

This document explains how to use the VaultRE API through the Google Cloud Run proxy service.

## Overview

Instead of managing API keys and tokens directly in our application, we're using a Google Cloud Run proxy service that handles authentication with the VaultRE API. This simplifies our implementation and improves security.

## Proxy URL

```
https://vaultre-api-proxy-405946437810.us-central1.run.app
```

## Development Environment

Due to CORS restrictions, direct browser requests to the Google Cloud Run proxy are not allowed in development. To solve this, we've implemented a local development proxy:

1. **Local Proxy**: The app uses `/api/proxy` in development to forward requests to the Google Cloud Run service
2. **Environment Detection**: The utility functions automatically detect if you're in development or production and route accordingly
3. **No Configuration Needed**: This happens automatically when running in localhost

## How to Use

The `lib/vaultre.js` utility file has been updated to use the Google Cloud Run proxy. You can use the same helper functions as before:

```javascript
import { fetchProperties, fetchPropertyById } from 'lib/vaultre';

// Get all properties
const properties = await fetchProperties();

// Get a specific property
const property = await fetchPropertyById('123456');
```

## Available Endpoints

The proxy supports all VaultRE API endpoints. The most common ones are:

1. **Properties**
   - `properties/lifesale`: Get property lifecycle sale data
   - `properties/{id}`: Get a specific property

2. **Contacts**
   - `contacts`: Get all contacts
   - `contacts/{id}`: Get a specific contact

3. **Categories**
   - `categories`: Get all categories

## Query Parameters

Query parameters can be passed as an object to the helper functions:

```javascript
// Example: Get properties with filters
const properties = await fetchProperties({
  page: 1,
  limit: 10,
  status: 'For Sale'
});
```

## Error Handling

Error handling remains the same as before. The helper functions will throw errors when requests fail, so use try/catch blocks:

```javascript
try {
  const data = await fetchProperties();
  // Handle successful response
} catch (error) {
  // Handle error
  console.error('API error:', error.message);
}
```

## Migration Notes

1. We've removed the need for:
   - Vercel serverless functions for VaultRE API proxying
   - Environment variables for VaultRE API credentials
   - Token authentication and refresh logic

2. The Google Cloud Run proxy handles:
   - Authentication with VaultRE
   - Error handling
   - Proper response formatting

3. Our utility functions now:
   - Make direct HTTP requests to the proxy URL (in production)
   - Use a local proxy in development to avoid CORS issues
   - Convert parameters to URL query strings
   - Handle responses and errors

## Security Notes

1. The proxy securely manages VaultRE credentials, so we never need to handle them in our application.

2. Any sensitive data retrieved through the API should still be handled securely in your application.

3. The proxy URL itself does not require authentication in the current configuration, so it should be treated as sensitive information. In a production environment, you may want to consider additional security measures.

## Troubleshooting

If you encounter issues with the API proxy:

1. Check that you're using the correct endpoint path
2. Verify that the proxy service is running (HTTP 503 indicates it may be scaling or down)
3. For detailed error messages, look at the response body when requests fail
4. Contact the system administrator if the proxy service is consistently unavailable

### Development-specific Issues

If you're having issues in development:
1. Make sure the `/api/proxy.js` file exists and is correctly implemented
2. Check browser console for any errors related to the local proxy
3. Verify that the Google Cloud Run proxy is accessible from your development machine 