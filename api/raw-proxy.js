// Development direct proxy for VaultRE API requests - returns raw data
export default async function handler(req, res) {
  const PROXY_URL = 'https://vaultre-api-proxy-405946437810.australia-southeast2.run.app';
  let targetPath = req.query.path || '';
  
  try {
    // Remove any leading slashes to prevent double slashes in URL
    targetPath = targetPath.replace(/^\/+/, '');
    
    // Log the target path for debugging
    console.log(`[RAW PROXY] Original target path: ${targetPath}`);
    
    // Copy query parameters except 'path'
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path') queryParams.append(key, value);
    });
    
    // Build the target URL
    const queryString = queryParams.toString();
    const url = `${PROXY_URL}/${targetPath}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`[RAW PROXY] Proxying request to: ${url}`);
    
    // Forward the request with the same method and headers
    const proxyRes = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...(req.method !== 'GET' && { body: JSON.stringify(req.body) }),
    });
    
    // Check if response is OK
    if (!proxyRes.ok) {
      console.error(`[RAW PROXY] Error from proxy: ${proxyRes.status} ${proxyRes.statusText}`);
      return res.status(proxyRes.status).json({
        error: `Proxy returned status ${proxyRes.status}`,
        details: proxyRes.statusText
      });
    }
    
    // Get content type and set same in response
    const contentType = proxyRes.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Handle different response types
    if (contentType && contentType.includes('application/json')) {
      // JSON response
      const data = await proxyRes.json();
      console.log(`[RAW PROXY] Received JSON data with keys: ${Object.keys(data).join(', ')}`);
      
      // Return raw data without transformation
      return res.status(proxyRes.status).json(data);
    } else {
      // Text or other response
      const text = await proxyRes.text();
      console.log(`[RAW PROXY] Received non-JSON response (${contentType}), length: ${text.length}`);
      console.log(`[RAW PROXY] First 200 chars: ${text.substring(0, 200)}`);
      
      // Return raw text
      return res.status(proxyRes.status).send(text);
    }
  } catch (error) {
    console.error('[RAW PROXY] Proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to proxy request', 
      details: error.message 
    });
  }
} 