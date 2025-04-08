// Development proxy for VaultRE API requests
export default async function handler(req, res) {
  const PROXY_URL = 'https://vaultre-api-proxy-405946437810.australia-southeast2.run.app';
  let targetPath = req.query.path || '';
  
  try {
    // Remove any leading slashes to prevent double slashes in URL
    targetPath = targetPath.replace(/^\/+/, '');
    
    // Log the target path for debugging
    console.log(`Original target path: ${targetPath}`);
    
    // Copy query parameters except 'path'
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (key !== 'path') queryParams.append(key, value);
    });
    
    // Build the target URL
    const queryString = queryParams.toString();
    const url = `${PROXY_URL}/${targetPath}${queryString ? `?${queryString}` : ''}`;
    
    console.log(`Proxying request to: ${url}`);
    
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
      console.error(`Error from proxy: ${proxyRes.status} ${proxyRes.statusText}`);
      return res.status(proxyRes.status).json({
        error: `Proxy returned status ${proxyRes.status}`,
        details: proxyRes.statusText
      });
    }
    
    // Check content type to ensure we're getting JSON
    const contentType = proxyRes.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Unexpected content type: ${contentType}`);
      // Try to get response text for debugging
      const textResponse = await proxyRes.text();
      console.log(`Raw response (first 500 chars): ${textResponse.substring(0, 500)}`);
      
      return res.status(500).json({
        error: 'Proxy did not return JSON',
        details: `Content type: ${contentType}`,
        sample: textResponse.substring(0, 100) + '...'
      });
    }
    
    // Get the response data
    const data = await proxyRes.json();
    
    // Log response structure to help debug
    console.log(`Proxy response status: ${proxyRes.status}`);
    console.log(`Response data type: ${typeof data}`);
    
    // Return empty array if data is not what we expect
    if (typeof data !== 'object' || data === null) {
      console.error('Invalid data format from proxy - not an object');
      return res.status(200).json([]);
    }
    
    if (typeof data === 'object') {
      console.log(`Response data keys: ${Object.keys(data).join(', ')}`);
      
      // Log if it's an array
      if (Array.isArray(data)) {
        console.log(`Response is an array with ${data.length} items`);
        return res.status(proxyRes.status).json(data);
      }
      
      // Standard VaultRE API format with items array
      if (data.items && Array.isArray(data.items)) {
        console.log(`Response has 'items' array with ${data.items.length} items`);
        return res.status(proxyRes.status).json({
          properties: data.items,
          totalItems: data.items.length
        });
      }
      
      // If data has a properties array
      if (data.properties && Array.isArray(data.properties)) {
        console.log(`Response has 'properties' array with ${data.properties.length} items`);
        return res.status(proxyRes.status).json(data);
      }
      
      // If data has a data array
      if (data.data && Array.isArray(data.data)) {
        console.log(`Response has 'data' array with ${data.data.length} items`);
        return res.status(proxyRes.status).json({
          properties: data.data,
          totalItems: data.data.length
        });
      }
      
      // Check for numeric keys (object that should be an array)
      if (Object.keys(data).length > 0 && Object.keys(data).every(key => !isNaN(parseInt(key)))) {
        console.log(`Response appears to be an object with numeric keys, converting to array with ${Object.keys(data).length} items`);
        const dataArray = Object.values(data);
        return res.status(proxyRes.status).json({
          properties: dataArray,
          totalItems: dataArray.length
        });
      }
    }
    
    // If we get here, just return the data as-is
    console.log("Returning raw data from proxy");
    return res.status(proxyRes.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Failed to proxy request', 
      details: error.message 
    });
  }
} 