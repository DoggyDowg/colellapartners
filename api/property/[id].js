// This is a Vercel API route that proxies requests to VaultRE API for a specific property
export default async function handler(req, res) {
  // Get the property ID from the route parameter
  const { id } = req.query;
  
  // Set up API configuration
  const VAULT_RE_API_URL = process.env.VAULTRE_API_URL;
  const API_TOKEN = process.env.VAULTRE_API_TOKEN;
  const API_KEY = process.env.VAULTRE_API_KEY;
  
  if (!VAULT_RE_API_URL || !API_TOKEN || !API_KEY) {
    return res.status(500).json({
      error: 'Missing API configuration',
      details: 'Please check that environment variables are set correctly'
    });
  }
  
  try {
    // Make the request to VaultRE API
    const response = await fetch(`${VAULT_RE_API_URL}/properties/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      }
    });
    
    // Check if request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return res.status(response.status).json({
        error: `VaultRE API responded with status ${response.status}`,
        details: errorData || response.statusText
      });
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Return the data from VaultRE API
    return res.status(200).json(data);
  } catch (error) {
    console.error(`Error proxying to VaultRE for property ${id}:`, error);
    return res.status(500).json({
      error: `Failed to fetch property ${id} from VaultRE API`,
      details: error.message
    });
  }
} 