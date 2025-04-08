// Vercel API route for proxying VaultRE API properties/sale endpoint
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Extract query parameters
    const { 
      status, propertyType, minPrice, maxPrice, minBedrooms, minBathrooms, 
      suburb, page, limit, published, sort, sortOrder 
    } = req.query;
    
    // Get API credentials from environment variables
    const VAULT_RE_API_URL = 'https://ap-southeast-2.api.vaultre.com.au/api/v1.3';
    const API_TOKEN = process.env.VAULTRE_API_TOKEN;
    const API_KEY = process.env.VAULTRE_API_KEY;

    if (!API_TOKEN || !API_KEY) {
      console.error('Missing API credentials');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API credentials not available'
      });
    }
    
    // Build URL with query parameters
    const url = new URL(`${VAULT_RE_API_URL}/properties/sale`);
    
    // Add query parameters if they exist
    if (status) url.searchParams.append('status', status);
    if (propertyType) url.searchParams.append('propertyType', propertyType);
    if (minPrice) url.searchParams.append('minPrice', minPrice);
    if (maxPrice) url.searchParams.append('maxPrice', maxPrice);
    if (minBedrooms) url.searchParams.append('minBedrooms', minBedrooms);
    if (minBathrooms) url.searchParams.append('minBathrooms', minBathrooms);
    if (suburb) url.searchParams.append('suburb', suburb);
    
    // Handle pagination
    url.searchParams.append('pagesize', limit || '50');
    if (page) url.searchParams.append('page', page);
    
    // Add other parameters
    url.searchParams.append('published', published !== undefined ? published : 'true');
    if (sort) url.searchParams.append('sort', sort);
    if (sortOrder) url.searchParams.append('sortOrder', sortOrder);
    
    // Default status if not provided
    if (!status) {
      url.searchParams.append('status', 'listing,conditional,unconditional');
    }
    
    // Call VaultRE API with proper authentication
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });
    
    // Handle API response
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error(`VaultRE API error: ${response.status}`, errorData);
      
      return res.status(response.status).json({
        error: `External API error: ${response.statusText}`,
        status: response.status,
        details: errorData
      });
    }
    
    // Parse and transform the response
    const data = await response.json();
    
    // Transform the response to match what the frontend expects
    const transformedData = {
      properties: data.items || [],
      totalItems: data.totalItems || 0,
      totalPages: data.totalPages || 0,
      urls: data.urls || {}
    };
    
    // Set cache headers (cache for 5 minutes)
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    
    // Return the transformed data
    return res.status(200).json(transformedData);
    
  } catch (error) {
    console.error('API proxy error:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
} 