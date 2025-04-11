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
    console.log("API getContacts called with params:", params);
    
    // Create a copy of params to modify
    const apiParams: Record<string, any> = {
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
    
    console.log("Actual API params being sent:", apiParams);
    
    // Log the URL that would be constructed (for debugging purposes)
    const urlParams = new URLSearchParams();
    Object.entries(apiParams).forEach(([key, value]) => {
      urlParams.append(key, value as string);
    });
    console.log("API URL that will be called:", `/contacts?${urlParams.toString()}`);
    
    const response = await vaultREClient.get('/contacts', { params: apiParams });
    
    if (response.status === 200 && response.data) {
      console.log("Contacts endpoint success, data structure:", Object.keys(response.data));
      
      // Convert response to array based on format
      let contactsArray: any[] = [];
      
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
        let email: string | undefined = contact.email;
        if (!email && contact.emails && Array.isArray(contact.emails) && contact.emails.length > 0) {
          // Get the first email in the array
          email = contact.emails[0].address || contact.emails[0].email || contact.emails[0];
        }
        
        // Extract phones from phoneNumbers array if it exists
        let mobilePhone: string | undefined = contact.mobilePhone;
        let workPhone: string | undefined = contact.workPhone;
        let homePhone: string | undefined = contact.homePhone;
        
        if (contact.phoneNumbers && Array.isArray(contact.phoneNumbers)) {
          // Process each phone number based on type
          contact.phoneNumbers.forEach((phone: any) => {
            const number = phone.number || phone;
            const type = phone.type || phone.typeCode || '';
            
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
      
      console.log("Processed contacts, sample email/phone:", 
        processedContacts.length > 0 ? 
          { email: processedContacts[0].email, phone: processedContacts[0].mobilePhone } : 
          'No contacts');
      
      return processedContacts as Contact[];
    }
    
    console.log("Contacts endpoint returned no data");
    return [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    if (error instanceof AxiosError) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
    throw new Error('Unable to retrieve contacts at this time.');
  }
}

// GET contact categories to find the category ID for "Colella Partner"
export async function getContactCategories(): Promise<any[]> {
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
    console.error('Error fetching contact categories:', error);
    throw error;
  }
}

// GET contacts with "Colella Partner" category
export async function getColellaPartnerContacts(categoryIds?: string[]): Promise<Contact[]> {
  try {
    // Use provided category IDs or fall back to the default
    const partnerCategoryIds = categoryIds?.length 
      ? categoryIds 
      : ["2044500"]; // Default to original hardcoded Colella Partner ID
      
    console.log(`Starting search for partner contacts with category IDs: ${partnerCategoryIds.join(', ')}`);
    
    // Use the categories parameter to filter by the specific categories
    // This will be formatted correctly in getContacts as categories=id1,id2,id3
    const contacts = await getContacts({ 
      categories: partnerCategoryIds 
    });
    
    console.log(`Retrieved ${contacts.length} contacts from API with partner category IDs`);
    
    // Log the first contact for debugging
    if (contacts.length > 0) {
      console.log("Sample contact structure:", JSON.stringify(contacts[0], null, 2));
    }
    
    // IMPORTANT: The API already filters by category but doesn't include the categories 
    // in the response. We should NOT try to filter again client-side.
    // Simply return all contacts that the API returned.
    
    return contacts;
  } catch (error) {
    console.error('Error fetching partner contacts:', error);
    throw error;
  }
}

// Additional functions can be added as needed based on the API capabilities 