import axios, { AxiosError } from 'axios';

// API Client configuration - always use direct Cloud Run proxy
const vaultREClient = axios.create({
  baseURL: 'https://vaultre-api-proxy-405946437810.australia-southeast2.run.app',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Types
export interface PropertyImage {
  url: string;
  id: string;
  isPrimary?: boolean;
}

export interface PropertyAddress {
  fullAddress?: string;
  street?: string;
  suburb?: string | { name: string; postcode: string; state: { abbreviation: string; }; };
  state?: string;
  postcode?: string;
  unitNumber?: string;
  streetNumber?: string;
}

export interface Property {
  id: string;
  title?: string;
  status?: string;
  apiStatus?: string;
  price?: number;
  priceText?: string;
  displayPrice?: string;
  searchPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  bed?: number;
  bath?: number;
  garages?: number;
  carports?: number;
  openSpaces?: number;
  propertyType?: string;
  type?: { id: number; name: string; propertyClass?: any; };
  landSize?: number;
  landUnit?: string;
  description?: string;
  heading?: string;
  features?: string[];
  address?: PropertyAddress;
  displayAddress?: string;
  images?: PropertyImage[];
  photos?: PropertyImage[];
  listedDate?: string;
  inspectionTimes?: string[];
  agent?: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
  };
  externalLinks?: Array<{
    id: number;
    url: string;
    modified: string;
    type: {
      id: number;
      name: string;
    };
  }>;
}

export interface PropertyCategory {
  id: string;
  name: string;
  type?: string;
}

export interface PropertyListParams {
  status?: string | string[];
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  suburb?: string;
  page?: number;
  limit?: number;
  published?: boolean;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
}

// Status mapping for display purposes
export const statusDisplayMap: Record<string, string> = {
  'listing': 'For Sale',
  'conditional': 'Under Offer',
  'unconditional': 'Sold',
};

// GET all properties/listings with optional filters
export async function getProperties(params: PropertyListParams = {}): Promise<Property[]> {
  try {
    console.log("API getProperties called with params:", params);
    
    // Default parameters
    const apiParams = {
      pagesize: 50,
      published: true,
      sort: params.sort || 'inserted',
      sortOrder: params.sortOrder || 'desc',
      ...params
    };
    
    console.log("Actual API params being sent:", apiParams);
    
    // Use the properties/sale endpoint
    try {
      console.log("Trying /properties/sale endpoint");
      const response = await vaultREClient.get('/properties/sale', { params: apiParams });
      
      if (response.status === 200 && response.data) {
        console.log("Properties/sale success, data structure:", Object.keys(response.data));
        
        // Check for different possible response formats from the API
        if (Array.isArray(response.data)) {
          console.log("Response is an array with length:", response.data.length);
          return response.data;
        }
        
        if (response.data.items) {
          console.log("Response has items array with length:", response.data.items.length);
          return response.data.items;
        }
        
        if (response.data.properties) {
          console.log("Response has properties array with length:", response.data.properties.length);
          return response.data.properties;
        }
        
        if (response.data.data) {
          console.log("Response has data array with length:", response.data.data.length);
          return response.data.data;
        }
        
        // If we get here, log the structure to help debug
        console.log("Unknown response structure, data sample:", 
          JSON.stringify(response.data).substring(0, 200) + "...");
        
        // Try to convert numeric keys object to array if that's what we got
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          const values = Object.values(response.data);
          if (values.length > 0) {
            console.log("Converting object with numeric keys to array, length:", values.length);
            return values as Property[];
          }
        }
        
        return [];
      }
      console.log("Properties/sale returned no data");
      return [];
    } catch (saleError: any) {
      console.error("Error with /properties/sale endpoint:", saleError);
      
      // If 404, try the regular properties endpoint
      if (saleError.response && saleError.response.status === 404) {
        console.log('Properties/sale endpoint not available, falling back to properties endpoint');
        const response = await vaultREClient.get('/properties', { params: apiParams });
        if (response.status === 200 && response.data) {
          console.log("Regular properties endpoint success");
          
          // Apply the same response format detection logic
          if (Array.isArray(response.data)) {
            return response.data;
          }
          
          if (response.data.items) {
            return response.data.items;
          }
          
          if (response.data.properties) {
            return response.data.properties;
          }
          
          if (response.data.data) {
            return response.data.data;
          }
          
          // Try to convert numeric keys object to array
          if (typeof response.data === 'object' && !Array.isArray(response.data)) {
            const values = Object.values(response.data);
            if (values.length > 0) {
              return values as Property[];
            }
          }
          
          return [];
        }
      }
      // If not a 404 or properties endpoint fails, throw the error
      throw saleError;
    }
  } catch (error) {
    console.error('Error fetching properties:', error);
    if (error instanceof AxiosError) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    throw new Error('Unable to retrieve property listings at this time.');
  }
}

// GET a single property by ID
export const getPropertyById = async (propertyId: string) => {
  try {
    const response = await vaultREClient.get(`/property/${propertyId}`);
    
    // Handle different response formats
    if (response.data) {
      // If the data is the property object directly
      if (response.data.id) {
        return response.data;
      }
      
      // If data is wrapped in a 'data' property
      if (response.data.data && response.data.data.id) {
        return response.data.data;
      }
      
      // If data is wrapped in a 'property' property
      if (response.data.property && response.data.property.id) {
        return response.data.property;
      }
      
      console.log("Unknown property response structure:", 
        JSON.stringify(response.data).substring(0, 200) + "...");
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    throw error;
  }
};

// GET property categories
export const getPropertyCategories = async () => {
  try {
    const response = await vaultREClient.get('/categories');
    
    // Handle different response formats
    if (response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data.items) {
        return response.data.items;
      }
      
      if (response.data.categories) {
        return response.data.categories;
      }
      
      if (response.data.data) {
        return response.data.data;
      }
      
      // Try to convert numeric keys object to array
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        const values = Object.values(response.data);
        if (values.length > 0) {
          return values;
        }
      }
    }
    
    // Fallback to original logic
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching property categories:', error);
    throw error;
  }
};

// GET property statuses (e.g., For Sale, Sold, Under Contract)
export const getPropertyStatuses = async () => {
  try {
    const response = await vaultREClient.get('/property-statuses');
    return response.data;
  } catch (error) {
    console.error('Error fetching property statuses:', error);
    throw error;
  }
};

// GET property types (e.g., House, Apartment, Land)
export const getPropertyTypes = async () => {
  try {
    const response = await vaultREClient.get('/property-types');
    return response.data;
  } catch (error) {
    console.error('Error fetching property types:', error);
    throw error;
  }
};

// GET property images for a specific property
export const getPropertyImages = async (propertyId: string) => {
  try {
    const response = await vaultREClient.get(`/property/${propertyId}/images`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching images for property ${propertyId}:`, error);
    throw error;
  }
};

// GET agents (if available with the API token scope)
export const getAgents = async () => {
  try {
    const response = await vaultREClient.get('/agents');
    return response.data;
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
};

// Search properties by address or keyword
export const searchProperties = async (searchTerm: string) => {
  try {
    const response = await vaultREClient.get('/properties/search', { 
      params: { q: searchTerm } 
    });
    return response.data;
  } catch (error) {
    console.error(`Error searching properties with term "${searchTerm}":`, error);
    throw error;
  }
};

// Additional functions can be added as needed based on the API capabilities 