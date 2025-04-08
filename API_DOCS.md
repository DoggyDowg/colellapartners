# VaultRE API Integration Documentation

This document outlines how to use the VaultRE API integration in this application.

## API Proxy

The application uses a serverless API proxy for VaultRE, which handles:

1. Authentication with VaultRE API
2. Making requests to VaultRE endpoints
3. Caching responses when appropriate
4. Error handling

## Using the API Utilities

### Basic Usage

```javascript
import { fetchVaultRE, fetchProperties, fetchPropertyById } from 'lib/vaultre';

// Example: Get all properties
const getPropertyListings = async () => {
  try {
    const properties = await fetchProperties();
    return properties;
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
};

// Example: Get a specific property
const getProperty = async (id) => {
  try {
    const property = await fetchPropertyById(id);
    return property;
  } catch (error) {
    console.error(`Error fetching property ${id}:`, error);
    return null;
  }
};

// Example: Custom API call
const getCustomData = async () => {
  try {
    const data = await fetchVaultRE('/custom/endpoint', {
      method: 'POST',
      body: JSON.stringify({ 
        param1: 'value1',
        param2: 'value2'
      })
    });
    return data;
  } catch (error) {
    console.error('Error fetching custom data:', error);
    return null;
  }
};
```

### Available Helper Functions

The following helper functions are available in `lib/vaultre.js`:

- `fetchVaultRE(path, options)`: Main function to call any VaultRE API endpoint
- `fetchContacts(params)`: Fetch contacts with optional filtering
- `fetchProperties(params)`: Fetch properties with optional filtering  
- `fetchContactById(contactId)`: Fetch a specific contact by ID
- `fetchPropertyById(propertyId)`: Fetch a specific property by ID

## API Endpoints Available

Based on the provided API key scopes, you have access to:

1. **View Contacts**: Access to contact/lead data
   - `/contacts` - List contacts
   - `/contacts/{id}` - Get a specific contact

2. **View Categories**: Access to property categories
   - `/categories` - List all categories

3. **View Properties**: Access to property listings
   - `/properties` - List all properties
   - `/properties/sale` - List sale properties
   - `/properties/{id}` - Get a specific property
   - `/properties/{id}/images` - Get images for a property

## Error Handling

All helper functions will throw errors when API requests fail. It's recommended to use try/catch blocks when calling these functions:

```javascript
try {
  const data = await fetchProperties();
  // Handle successful response
} catch (error) {
  // Handle error
  console.error('API error:', error.message);
}
```

## Environment Configuration

The API integration requires the following environment variables:

- `VAULTRE_API_URL`: The base URL for the VaultRE API
- `VAULTRE_API_KEY`: Your VaultRE API key
- `VAULTRE_API_TOKEN`: Your VaultRE API token

In development, set these in your `.env.local` file. For production, they should be configured in your hosting environment (e.g., Vercel). 