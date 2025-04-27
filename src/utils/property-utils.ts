import { Property } from '@/lib/vault-re-api';

/**
 * Utility functions and types for handling property data
 */

// Define interfaces for types
export interface PropertyDetails {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  parcel_id: string;
}

/**
 * Helper function to format property address
 * @param property The property details object
 * @returns Formatted address string
 */
export const extractPropertyAddressData = (property: PropertyDetails): string => {
  const addressParts = [];
  if (property.address) addressParts.push(property.address);
  if (property.city) addressParts.push(property.city);
  if (property.state) {
    if (property.zip) {
      addressParts.push(`${property.state} ${property.zip}`);
    } else {
      addressParts.push(property.state);
    }
  } else if (property.zip) {
    addressParts.push(property.zip);
  }
  return addressParts.join(', ');
};

/**
 * Helper function to extract address data from VaultRE Property object
 */
export const extractPropertyAddressDataFromVaultRE = (property: Property) => {
  if (!property || !property.address) return null;

  const addr = property.address;

  // Construct address components
  let streetAddress = addr.street || '';
  if (addr.streetNumber) {
    streetAddress = `${addr.streetNumber} ${streetAddress}`;
  }
  if (addr.unitNumber) {
    streetAddress = `Unit ${addr.unitNumber}, ${streetAddress}`;
  }

  // Handle potentially nested suburb object or simple string
  let suburbName = '';
  let postcode = addr.postcode || '';
  let stateAbbr = addr.state || '';

  if (typeof addr.suburb === 'object' && addr.suburb !== null) {
    suburbName = addr.suburb.name || '';
    postcode = addr.suburb.postcode || postcode;
    stateAbbr = addr.suburb.state?.abbreviation || stateAbbr;
  } else if (typeof addr.suburb === 'string') {
    suburbName = addr.suburb;
  }

  // Create formatted addresses
  const postalAddressString = [
    streetAddress,
    suburbName,
    stateAbbr,
    postcode
  ].filter(Boolean).join(', ');

  const displayAddress = addr.displayAddress || [
    streetAddress,
    suburbName
  ].filter(Boolean).join(' ');

  return {
    street_address: streetAddress.trim() || null,
    suburb: suburbName || null,
    state: stateAbbr || null,
    post_code: postcode || null,
    postal_address: postalAddressString || null,
    display_address: displayAddress || null
  };
}; 