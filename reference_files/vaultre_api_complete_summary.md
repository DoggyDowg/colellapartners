# VaultRE API Documentation - Properties/getPropertiesLifeSale

## Introduction

This document provides a comprehensive summary of the VaultRE API endpoint for retrieving property sale listings. The documentation is structured to be easily understood by Large Language Models (LLMs) and developers integrating with the VaultRE system.

## Endpoint Details

- **Endpoint:** `/properties/sale`
- **HTTP Method:** GET
- **Description:** Retrieve a list of sale properties
- **Response Format:** JSON (application/json)
- **Success Response Code:** 200 (Properties retrieved)

## Authentication

The API requires authentication, as indicated by the authorization button in the documentation. Authentication details should be provided in the request headers.

## Endpoint Purpose

This endpoint allows users to retrieve property listings for sale from the VaultRE system. It provides extensive filtering capabilities to narrow down property searches based on various criteria such as modification dates, price ranges, property features, location, and more.

## Query Parameters

The endpoint supports a wide range of query parameters to filter and customize the property search results. All parameters are optional and can be combined to create highly specific queries.

### Time-Based Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| modifiedSince | string(date-time) | Filter results modified since this datetime |
| modifiedBefore | string(date-time) | Filter results modified before this datetime |
| priceReducedSince | string(date-time) | Filter results by price reductions since this datetime |
| priceReducedBefore | string(date-time) | Filter results by price reductions before this datetime |

### Pagination Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer(int64) | Page number of results |
| pagesize | integer(int64) | Number of records to be returned in each page (Default: 50) |

### Publication Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| published | boolean | Filter properties published to at least one web portal |
| publishedOnPortals | array[integer] | Filter properties published to at least one of these office portal IDs |

### Sorting Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| sort | string | Field by which to sort the results |
|  |  | Available values: inserted, modified, suburb, searchPrice, landArea, floorArea, publishedToWeb |
| sortOrder | string | Order by which to sort the results. Used in conjunction with sort parameter |
|  |  | Available values: asc, desc |

### Access Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| accessBy | array[integer] | Filter properties by these user IDs |
|  |  | NOTE - Use the ID "-1" to filter properties which are accessible by Everyone |

### Location Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| suburbs | array[integer] | Filter properties in these suburb IDs |
| precincts | array[integer] | Filter properties belonging to at least one of these precincts IDs |
| customRegions | array[integer] | Filter properties belonging to at least one of these custom regions IDs |
| branches | array[integer] | Filter properties in these account branch IDs |

### Property Type Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| types | array[integer] | Filter properties with these property type IDs |
| contactStaff | array[integer] | Filter properties with contactStaff containing this user ID |
| status | array[string] | Filter by a list of statuses |
|  |  | Available values: prospect, appraisal, listing, conditional, listingOrConditional, unconditional, management |
| portalStatus | array[string] | Filter by a list of portal statuses |
|  |  | Available values: prospect, appraisal, listing, conditional, listingOrConditional, unconditional, management |
| propertyClass | array[string] | Filter by a list of property classes |
|  |  | Available values: residential, commercial, business, rural, holidayRental, land |

### Commercial Property Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| availableOnly | boolean | Only used if propertyClass equals 'commercial' |
| tenantedInvestmentOnly | boolean | Only used if propertyClass equals 'commercial' |

### Property Feature Filters

| Parameter | Type | Description |
|-----------|------|-------------|
| minBed | integer(int64) | Filter properties greater than or equal to min beds |
| minBath | integer(int64) | Filter properties greater than or equal to min baths |
| minCar | integer(int64) | Filter properties greater than or equal to min car spaces |
| minPricePerSqm | number(float) | Filter properties greater than or equal to min price per sqm |
| maxPricePerSqm | number(float) | Filter properties less than or equal to max price per sqm |
| minPrice | number(float) | Filter properties greater than or equal to min price |
| maxPrice | number(float) | Filter properties less than or equal to max price |
| minLand | number(float) | Filter properties greater than or equal to min land. Must supply an area type. |
| maxLand | number(float) | Filter properties less than or equal to max land. Must supply an area type. |
| areaType | string | Specify the units for minLand, maxLand filters |
|  |  | Available values: sqm, acre, hectare |
| minFloor | number(float) | Filter properties greater than or equal to min floor |
| maxFloor | number(float) | Filter properties less than or equal to max floor |

## Response Structure

The response is returned in JSON format with the content type `application/json`. It contains a collection of property items with detailed information about each property.

### Top-Level Structure

```json
{
  "items": [
    {
      // Property object 1
    },
    {
      // Property object 2
    }
    // Additional property objects...
  ]
}
```

### Property Object Structure

Each property object in the items array contains the following key information:

1. **Basic Property Information**
   - `id`: Unique identifier for the property
   - `building`: Information about the building (id, name)
   - `class`: Property class information (id, name, internalName)
   - `type`: Property type information with nested propertyClass

2. **Address Information**
   - `address`: Comprehensive address details including:
     - Basic address components (level, unitNumber, streetNumber, street)
     - Suburb details with state information
     - State information
     - Country information with GST rate
     - Additional address formats (royalMail, customAddress) for different regions
   - `displayAddress`: Formatted address for display purposes
   - `addressVisibility`: Controls how much of the address is visible (e.g., "streetAndSuburb")

3. **Property Identifiers**
   - `referenceID`: Reference identifier for the property
   - `lotNumber`: Lot number
   - `certificateOfTitle`: Title certificate information
   - `volumeNumber`: Volume number
   - `folioNumber`: Folio number
   - `corelogicId`: CoreLogic identifier
   - `legalDescription`: Legal description of the property
   - `rpdp`: RPDP information

4. **Media**
   - `photos`: Array of photo objects with:
     - Basic metadata (id, inserted, modified, filesize, dimensions)
     - Caption and type
     - URL and filename information
     - Thumbnail URLs
     - Publication status

5. **Pricing Information**
   - `searchPrice`: Numeric price for search purposes
   - `displayPrice`: Formatted price string for display purposes

6. **Property Descriptions**
   - `heading`: Property heading/title
   - `description`: Main property description
   - `brochureDescription`: Description for brochures
   - `windowCardDescription`: Description for window cards

7. **Property Measurements**
   - `landArea`: Land area with value and units
   - `frontage`: Frontage measurement
   - `yearBuilt`: Year the property was built

8. **Timestamps**
   - `inserted`: When the property was added to the system
   - `modified`: When the property was last modified
   - `saleLifeId`: Sale life cycle identifier
   - `leaseLifeId`: Lease life cycle identifier

9. **Geolocation**
   - `geolocation`: Geographic coordinates with accuracy information

10. **Commercial Information**
    - `commercialListingType`: Type of commercial listing

11. **Features**
    - `features`: Array of feature objects with id, name, and category information

## Example Response Object (Simplified)

```json
{
  "items": [
    {
      "id": 12345,
      "building": {
        "id": 789,
        "name": "Oceanview Apartments"
      },
      "class": {
        "id": 1,
        "name": "Residential",
        "internalName": "residential"
      },
      "type": {
        "id": 3,
        "name": "Apartment",
        "propertyClass": {
          "id": 1,
          "name": "Residential",
          "internalName": "residential"
        }
      },
      "address": {
        "level": "5",
        "unitNumber": "501",
        "streetNumber": "123",
        "street": "Beach Road",
        "suburb": {
          "id": 456,
          "name": "Bondi",
          "postcode": "2026",
          "state": {
            "id": 2,
            "name": "New South Wales",
            "abbreviation": "NSW"
          },
          "isPoBox": false
        },
        "state": {
          "id": 2,
          "name": "New South Wales",
          "abbreviation": "NSW"
        },
        "country": {
          "id": 1,
          "name": "Australia",
          "isocode": "AU",
          "gstRate": 10
        }
      },
      "displayAddress": "501/123 Beach Road, Bondi NSW 2026",
      "addressVisibility": "streetAndSuburb",
      "referenceID": "BOND501",
      "photos": [
        {
          "id": 1001,
          "inserted": "2025-01-15T10:30:00.000Z",
          "modified": "2025-01-15T10:30:00.000Z",
          "filesize": 2048000,
          "width": 1920,
          "height": 1080,
          "caption": "Living Room with Ocean Views",
          "type": "Photograph",
          "url": "https://example.com/photos/property12345/living-room.jpg",
          "filename": "living-room.jpg",
          "userFilename": "living-room-ocean-view.jpg",
          "thumbnails": {
            "thumb_180": "https://example.com/photos/property12345/thumbnails/living-room_180.jpg",
            "thumb_1024": "https://example.com/photos/property12345/thumbnails/living-room_1024.jpg"
          },
          "published": true
        }
      ],
      "searchPrice": 1250000,
      "displayPrice": "$1,250,000",
      "heading": "Stunning Beachfront Apartment with Panoramic Ocean Views",
      "description": "This luxurious 2-bedroom apartment offers breathtaking ocean views from every room...",
      "brochureDescription": "Luxury beachfront living at its finest...",
      "windowCardDescription": "Beachfront luxury with panoramic views",
      "landArea": {
        "value": 120,
        "units": "sqm"
      },
      "frontage": 15,
      "yearBuilt": 2018,
      "inserted": "2025-01-10T09:15:00.000Z",
      "modified": "2025-03-20T14:45:00.000Z",
      "saleLifeId": 7890,
      "geolocation": {
        "latitude": -33.8901,
        "longitude": 151.2745,
        "accuracy": "USERDEFINED"
      },
      "features": [
        {
          "id": 101,
          "name": "Air Conditioning",
          "category": {
            "id": 5,
            "name": "Climate Control"
          }
        },
        {
          "id": 203,
          "name": "Swimming Pool",
          "category": {
            "id": 8,
            "name": "Outdoor Features"
          }
        }
      ]
    }
  ]
}
```

## Usage Examples

### Basic Request

```
GET /properties/sale
```

Returns the first page of all sale properties (default 50 per page).

### Filtered Request

```
GET /properties/sale?minBed=2&minBath=2&suburbs=456&minPrice=1000000&maxPrice=1500000&propertyClass=residential&sort=searchPrice&sortOrder=asc&page=1&pagesize=20
```

Returns the first page of 20 residential properties in suburb ID 456 with at least 2 bedrooms and 2 bathrooms, priced between $1,000,000 and $1,500,000, sorted by price in ascending order.

### Recently Modified Properties

```
GET /properties/sale?modifiedSince=2025-01-01T00:00:00Z&published=true
```

Returns properties that have been modified since January 1, 2025, and are published to at least one web portal.

## Integration Considerations

1. **Pagination**: For large result sets, implement pagination by using the `page` and `pagesize` parameters.

2. **Filtering Strategy**: Combine multiple filters to narrow down results efficiently.

3. **Error Handling**: The documentation doesn't explicitly list error responses, but standard HTTP error codes should be expected for invalid requests.

4. **Date Formats**: Date-time parameters should be provided in ISO 8601 format (e.g., `2025-04-08T04:15:54.874Z`).

5. **Performance**: To optimize performance, use specific filters rather than retrieving large datasets and filtering client-side.

6. **Commercial Properties**: Special filters (`availableOnly` and `tenantedInvestmentOnly`) are only applicable when `propertyClass` equals 'commercial'.

7. **Land Area Filters**: When using `minLand` or `maxLand` filters, you must also specify the `areaType` parameter.

## Conclusion

The VaultRE Properties/getPropertiesLifeSale endpoint provides a powerful and flexible way to retrieve property sale listings with extensive filtering capabilities. This documentation summary provides a comprehensive overview of the endpoint's functionality, parameters, and response structure to facilitate integration with the VaultRE API.
