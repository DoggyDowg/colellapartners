// VaultRE API utility functions via Google Cloud Run proxy

// Use direct Cloud Run URL in all environments
const API_PROXY_URL = 'https://vaultre-api-proxy-405946437810.australia-southeast2.run.app';

/**
 * Make a request to the VaultRE API via the Google Cloud Run proxy
 * @param {string} path - API path to call (without leading slash)
 * @param {Object} options - Fetch options including method, body, etc.
 * @returns {Promise<Object>} API response
 */
export async function fetchVaultRE(path, options = {}) {
  if (!path) {
    throw new Error('API path is required');
  }
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
  
  try {
    // Use direct Cloud Run URL for all environments
    const endpoint = path.startsWith('/') ? path.substring(1) : path;
    const url = `${API_PROXY_URL}/${endpoint}`;
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`VaultRE API error for path ${path}:`, errorData);
      throw new Error(errorData.details || response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`VaultRE API error for path ${path}:`, error);
    throw error;
  }
}

/**
 * Helper function to fetch contacts from VaultRE
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Contacts data
 */
export async function fetchContacts(params = {}) {
  // For development, pass params directly to fetchVaultRE which will handle them
  if (isDevelopment) {
    const queryParams = new URLSearchParams(params);
    return fetchVaultRE(`contacts${queryParams.toString() ? `&${queryParams.toString()}` : ''}`);
  }
  
  // For production, convert params to URL query string
  const queryString = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryString.append(key, value);
  });
  
  const queryPart = queryString.toString() ? `?${queryString.toString()}` : '';
  return fetchVaultRE(`contacts${queryPart}`);
}

/**
 * Helper function to fetch properties from VaultRE
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Properties data
 */
export async function fetchProperties(params = {}) {
  // Default parameters for properties
  const defaultParams = {
    pagesize: 50,
    published: true,
    sort: 'inserted',
    sortOrder: 'desc',
    ...params
  };
  
  // Convert params to query string
  const queryParams = new URLSearchParams();
  Object.entries(defaultParams).forEach(([key, value]) => {
    queryParams.append(key, value);
  });
  
  const queryPart = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return fetchVaultRE(`properties/sale${queryPart}`);
}

/**
 * Helper function to fetch a single contact by ID
 * @param {string|number} contactId - Contact ID
 * @returns {Promise<Object>} Contact data
 */
export async function fetchContactById(contactId) {
  if (!contactId) {
    throw new Error('Contact ID is required');
  }
  return fetchVaultRE(`contacts/${contactId}`);
}

/**
 * Helper function to fetch a single property by ID
 * @param {string|number} propertyId - Property ID
 * @returns {Promise<Object>} Property data
 */
export async function fetchPropertyById(propertyId) {
  if (!propertyId) {
    throw new Error('Property ID is required');
  }
  return fetchVaultRE(`properties/${propertyId}`);
} 