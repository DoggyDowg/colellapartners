// This is a Vercel API route that checks VaultRE API status
export default function handler(req, res) {
  // Set up API configuration
  const VAULT_RE_API_URL = process.env.VAULTRE_API_URL;
  const API_TOKEN = process.env.VAULTRE_API_TOKEN;
  const API_KEY = process.env.VAULTRE_API_KEY;

  if (!VAULT_RE_API_URL || !API_TOKEN || !API_KEY) {
    return res.status(500).json({
      status: 'error',
      message: 'Missing API configuration',
      details: {
        apiUrl: !!VAULT_RE_API_URL,
        apiToken: !!API_TOKEN,
        apiKey: !!API_KEY
      }
    });
  }

  try {
    // Use the properties endpoint to check API status (we know we have permission for this)
    fetch(`${VAULT_RE_API_URL}/properties?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      }
    })
    .then(response => {
      const status = response.ok ? 'online' : 'error';
      
      return response.text()
        .catch(() => null)
        .then(data => {
          let parsedData = null;
          try {
            parsedData = data ? JSON.parse(data) : null;
          } catch (e) {
            // If response isn't JSON, use text
            parsedData = data;
          }
          
          res.status(200).json({
            status,
            connected: response.ok,
            statusCode: response.status,
            responseBody: parsedData,
            vaultreApiUrl: VAULT_RE_API_URL,
            env: process.env.NODE_ENV
          });
        });
    })
    .catch(error => {
      console.error('Error checking VaultRE status:', error);
      res.status(200).json({
        status: 'error',
        connected: false,
        message: error.message,
        vaultreApiUrl: VAULT_RE_API_URL,
        env: process.env.NODE_ENV
      });
    });
  } catch (error) {
    console.error('Error checking VaultRE status:', error);
    return res.status(200).json({
      status: 'error',
      connected: false,
      message: error.message,
      vaultreApiUrl: VAULT_RE_API_URL,
      env: process.env.NODE_ENV
    });
  }
} 