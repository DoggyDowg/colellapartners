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
  displayAddress?: string;
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
  type?: { id: number; name: string; propertyClass?: unknown; };
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
  dateModified?: string;
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
  pagesize?: number;
  categoryId?: string;
  categories?: string[] | number[];
  statuses?: string[] | number[];
}

// Status mapping for display purposes
export const statusDisplayMap: Record<string, string> = {
  'listing': 'For Sale',
  'conditional': 'Under Offer',
  'unconditional': 'Sold',
};

// GET Properties from URL (e.g. /api/properties?page=1&pageSize=10)
export async function getProperties(params: PropertyListParams = {}): Promise<Property[]> {
  try {
    // Create a copy of params to modify
    const apiParams: Record<string, unknown> = {
      pagesize: params.pagesize || 10,
      page: params.page || 1,
      sort: params.sort || 'dateModified',
      sortOrder: params.sortOrder || 'desc',
      ...params,
    };
    
    // Handle the special case of categories parameter
    if (params.categoryId && !params.categories) {
      // Convert legacy categoryId to categories array for backward compatibility
      apiParams.categories = [params.categoryId];
      delete apiParams.categoryId; // Remove the old parameter
    }
    
    // Ensure categories is properly formatted if present
    if (apiParams.categories && Array.isArray(apiParams.categories)) {
      // The API expects a single value for categories parameter: categories=2044500
      // For multiple values, they should be comma-separated
      if (apiParams.categories.length === 1) {
        // Single category - set directly
        apiParams.categories = apiParams.categories[0];
      } else if (apiParams.categories.length > 1) {
        // Multiple categories - join with commas
        apiParams.categories = apiParams.categories.join(',');
      } else {
        // Empty array - remove the parameter
        delete apiParams.categories;
      }
    }
    
    // Handle statuses parameter (similar to categories)
    if (apiParams.statuses && Array.isArray(apiParams.statuses)) {
      if (apiParams.statuses.length === 1) {
        apiParams.statuses = apiParams.statuses[0];
      } else if (apiParams.statuses.length > 1) {
        apiParams.statuses = apiParams.statuses.join(',');
      } else {
        delete apiParams.statuses;
      }
    }
    
    // Construct URL params for logging
    const urlParams = new URLSearchParams();
    Object.entries(apiParams).forEach(([key, value]) => {
      urlParams.append(key, String(value));
    });
    
    const response = await vaultREClient.get('/properties', { params: apiParams });
    
    if (response.status === 200 && response.data) {
      return Array.isArray(response.data) 
        ? response.data as Property[]
        : (response.data.items || response.data.properties || response.data.data || []) as Property[];
    }
    
    return [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve properties: ${error.message}`);
    }
    throw new Error('Unable to retrieve properties at this time.');
  }
}

// GET Property by ID from URL (e.g. /api/properties/123456)
export async function getPropertyById(propertyId: string | number): Promise<Property | null> {
  try {
    // Ensure propertyId is a string
    const id = propertyId?.toString();
    
    // Handle empty or invalid ID
    if (!id || id === 'undefined' || id === 'null') {
      throw new Error('Property ID is required');
    }
    
    const response = await vaultREClient.get(`/properties/${id}`);
    
    if (response.status === 200 && response.data) {
      // API can return different response formats, handle them here
      let propertyData: Record<string, unknown> | null = null;
      
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        // A single object was returned
        propertyData = response.data as Record<string, unknown>;
        
        // Check if property is wrapped in a 'property' field
        if (propertyData.property && typeof propertyData.property === 'object') {
          propertyData = propertyData.property as Record<string, unknown>;
        }
        
        // Check if result has expected property data (id or propertyId)
        if (propertyData.id || propertyData.propertyId) {
          return propertyData as unknown as Property;
        }
      }
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        // An array was returned, use the first item
        return response.data[0] as Property;
      }
    }
    
    // No valid property found in the response
    return null;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve property: ${error.message}`);
    }
    throw new Error('Unable to retrieve property at this time.');
  }
}

// GET property categories
export const getPropertyCategories = async (): Promise<PropertyCategory[]> => {
  try {
    const response = await vaultREClient.get('/categories/property');
    
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
          return values as PropertyCategory[];
        }
      }
    }
    
    // Fallback to original logic
    return response.data?.items || [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve property categories: ${error.message}`);
    }
    throw new Error('Unable to retrieve property categories at this time.');
  }
};

// GET property statuses (e.g., For Sale, Sold, Under Contract)
export const getPropertyStatuses = async (): Promise<{id: string; name: string}[]> => {
  try {
    const response = await vaultREClient.get('/properties/statuses');
    
    if (response.status === 200 && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data.data) {
        return response.data.data;
      }
      
      return [];
    }
    return [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve property statuses: ${error.message}`);
    }
    throw new Error('Unable to retrieve property statuses at this time.');
  }
};

// GET property types (e.g., House, Apartment, Land)
export const getPropertyTypes = async () => {
  try {
    const response = await vaultREClient.get('/property-types');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve property types: ${error.message}`);
    }
    throw new Error('Unable to retrieve property types at this time.');
  }
};

// GET property images for a specific property
export const getPropertyImages = async (propertyId: string): Promise<PropertyImage[]> => {
  try {
    const response = await vaultREClient.get(`/properties/${propertyId}/images`);
    
    if (response.status === 200 && response.data) {
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      if (response.data.data) {
        return response.data.data;
      }
      
      return [];
    }
    return [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve property images: ${error.message}`);
    }
    throw new Error('Unable to retrieve property images at this time.');
  }
};

// GET agents (if available with the API token scope)
export const getAgents = async () => {
  try {
    const response = await vaultREClient.get('/agents');
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve agents: ${error.message}`);
    }
    throw new Error('Unable to retrieve agents at this time.');
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
    if (error instanceof AxiosError) {
      throw new Error(`Error searching properties with term "${searchTerm}": ${error.message}`);
    }
    throw new Error(`Error searching properties with term "${searchTerm}"`);
  }
};

// Contact interface based on VaultRE API
export interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  mobilePhone?: string;
  workPhone?: string;
  homePhone?: string;
  address?: {
    fullAddress?: string;
    street?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
  };
  postalAddress?: {
    unitNumber?: string;
    streetNumber?: string;
    street?: string;
    suburb?: {
      id?: number;
      name?: string;
      postcode?: string;
      state?: {
        id?: number;
        name?: string;
        abbreviation?: string;
      };
    };
    addressType?: string;
    streetType?: string;
    state?: string;
    postcode?: string;
    fullAddress?: string;
    displayAddress?: string;
  };
  categories?: Array<{
    id: string;
    name: string;
  }>;
  notes?: string;
  dateCreated?: string;
  dateModified?: string;
}

export interface ContactListParams {
  pagesize?: number;
  page?: number;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  modifiedSince?: string;
  modifiedBefore?: string;
  categoryName?: string;
  categoryId?: string; // Keeping for backward compatibility
  categories?: number[] | string[]; // API expects array of category IDs
}

// GET contacts with optional filters
export async function getContacts(params: ContactListParams = {}): Promise<Contact[]> {
  try {
    // Create a copy of params to modify
    const apiParams: Record<string, unknown> = {
      pagesize: params.pagesize || 50,
      sort: params.sort || 'dateModified',
      sortOrder: params.sortOrder || 'desc',
      ...params
    };
    
    // Handle the special case of categories parameter
    if (params.categoryId && !params.categories) {
      // Convert legacy categoryId to categories array for backward compatibility
      apiParams.categories = [params.categoryId];
      delete apiParams.categoryId; // Remove the old parameter
    }
    
    // Ensure categories is properly formatted if present
    if (apiParams.categories && Array.isArray(apiParams.categories)) {
      // The API expects a single value for categories parameter: categories=2044500
      // For multiple values, they should be comma-separated
      if (apiParams.categories.length === 1) {
        // Single category - set directly
        apiParams.categories = apiParams.categories[0];
      } else if (apiParams.categories.length > 1) {
        // Multiple categories - join with commas
        apiParams.categories = apiParams.categories.join(',');
      } else {
        // Empty array - remove the parameter
        delete apiParams.categories;
      }
    }
    
    // Construct URL params for logging
    const urlParams = new URLSearchParams();
    Object.entries(apiParams).forEach(([key, value]) => {
      urlParams.append(key, String(value));
    });
    
    const response = await vaultREClient.get('/contacts', { params: apiParams });
    
    if (response.status === 200 && response.data) {
      // Convert response to array based on format
      let contactsArray: Record<string, unknown>[] = [];
      
      if (Array.isArray(response.data)) {
        contactsArray = response.data;
      } else if (response.data.items) {
        contactsArray = response.data.items;
      } else if (response.data.contacts) {
        contactsArray = response.data.contacts;
      } else if (response.data.data) {
        contactsArray = response.data.data;
      } else if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Try to convert numeric keys object to array
        contactsArray = Object.values(response.data);
      }
      
      // Process contacts to extract nested email and phone values
      const processedContacts = contactsArray.map(contact => {
        // Extract email from emails array if it exists
        let email: string | undefined = contact.email as string;
        if (!email && contact.emails && Array.isArray(contact.emails) && contact.emails.length > 0) {
          // Get the first email in the array
          const firstEmail = contact.emails[0];
          email = (firstEmail as Record<string, string>).address || 
                 (firstEmail as Record<string, string>).email || 
                 firstEmail as string;
        }
        
        // Extract phones from phoneNumbers array if it exists
        let mobilePhone: string | undefined = contact.mobilePhone as string;
        let workPhone: string | undefined = contact.workPhone as string;
        let homePhone: string | undefined = contact.homePhone as string;
        
        if (contact.phoneNumbers && Array.isArray(contact.phoneNumbers)) {
          // Process each phone number based on type
          contact.phoneNumbers.forEach((phone: string | Record<string, string>) => {
            const number = typeof phone === 'string' ? phone : phone.number || '';
            const type = typeof phone === 'string' ? '' : phone.type || phone.typeCode || '';
            
            if (type.toLowerCase() === 'mobile' || type === 'M') {
              mobilePhone = number;
            } else if (type.toLowerCase() === 'work' || type === 'W' || type === 'B') {
              workPhone = number;
            } else if (type.toLowerCase() === 'home' || type === 'H') {
              homePhone = number;
            }
          });
        }
        
        // Return the contact with extracted values
        return {
          ...contact,
          email,
          mobilePhone,
          workPhone,
          homePhone
        };
      });
      
      return processedContacts as Contact[];
    }
    
    return [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve contacts: ${error.message}`);
    }
    throw new Error('Unable to retrieve contacts at this time.');
  }
}

// GET contact categories to find the category ID for "Colella Partner"
export async function getContactCategories(): Promise<Record<string, unknown>[]> {
  try {
    const response = await vaultREClient.get('/categories/contact');
    
    if (response.status === 200 && response.data) {
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
      
      return [];
    }
    
    return [];
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve contact categories: ${error.message}`);
    }
    throw new Error('Unable to retrieve contact categories at this time.');
  }
}

// GET contacts with "Colella Partner" category
export async function getColellaPartnerContacts(categoryIds?: string[]): Promise<Contact[]> {
  try {
    // Use provided category IDs or fall back to the default
    const partnerCategoryIds = categoryIds?.length 
      ? categoryIds 
      : ["2044500"]; // Default to original hardcoded Colella Partner ID
      
    // Use the categories parameter to filter by the specific categories
    // This will be formatted correctly in getContacts as categories=id1,id2,id3
    const contacts = await getContacts({ 
      categories: partnerCategoryIds 
    });
    
    // IMPORTANT: The API already filters by category but doesn't include the categories 
    // in the response. We should NOT try to filter again client-side.
    // Simply return all contacts that the API returned.
    
    return contacts;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve partner contacts: ${error.message}`);
    }
    throw new Error('Unable to retrieve partner contacts at this time.');
  }
}

// GET properties suitable for linking to referrals
export async function getLinkableProperties(): Promise<Property[]> {
  const params = {
    pagesize: 50,
    published: true, // Assuming we only want published properties
    sort: 'modified',
    sortOrder: 'desc',
    status: 'prospect,appraisal,listing,management'
  };
  
  try {
    const response = await vaultREClient.get('/properties/sale', { params });
    
    if (response.status === 200 && response.data) {
      // Handle different response formats
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
      // Try converting object with numeric keys
      if (typeof response.data === 'object' && !Array.isArray(response.data)) {
        const values = Object.values(response.data);
        if (values.length > 0) {
          return values as Property[];
        }
      }
    }
    return []; // Return empty array if no data or wrong format
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve linkable properties: ${error.message}`);
    }
    throw new Error('Unable to retrieve linkable properties at this time.');
  }
}

// GET contact by ID
export async function getContactById(contactId: string): Promise<Record<string, unknown> | null> {
  try {
    const response = await vaultREClient.get(`/contacts/${contactId}`);
    
    if (response.status === 200 && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(`Unable to retrieve contact details: ${error.message}`);
    }
    throw new Error('Unable to retrieve contact details at this time.');
  }
}

// Additional functions can be added as needed based on the API capabilities 