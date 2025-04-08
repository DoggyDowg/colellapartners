# VaultRE API Proxy Documentation

## Overview

This documentation describes how to use the VaultRE API proxy deployed on Google Cloud Run. This proxy service handles authentication with VaultRE's API, allowing client applications to make requests without directly managing API keys or tokens.

## Base URL

https://vaultre-api-proxy-405946437810.us-central1.run.app

## Authentication

Authentication to the proxy service depends on your configuration:

- If you configured the service with "Allow unauthenticated invocations," no authentication is required to call the proxy.
- If you configured the service with "Require authentication," you'll need to include authentication headers in your requests to the proxy.

For authenticated access to the proxy, you'll need to use Google Cloud authentication. This can be done with:
- A service account key and JWT
- Identity tokens
- Google Cloud client libraries that handle authentication automatically

The proxy itself handles authentication to the VaultRE API using the stored credentials.

## Endpoints

The proxy passes all requests through to the corresponding VaultRE API endpoints. The main endpoints available are:

### Properties Lifecycle Data

```
GET /properties/lifesale
```

Retrieves property lifecycle sale data from VaultRE.

### Other VaultRE Endpoints

The proxy forwards requests to any VaultRE endpoint based on the path provided:

```
GET /{endpoint-path}
```

## Making Requests

### HTTP Methods

The proxy supports the following HTTP methods:
- GET (for retrieving data)
- POST (for creating or updating data)

### Headers

Always include:
```
Content-Type: application/json
```

If the proxy requires authentication:
```
Authorization: Bearer {your-auth-token}
```

### Query Parameters

Query parameters are passed through to the VaultRE API. For example:

```
GET /properties/lifesale?page=1&limit=10
```

## Response Format

Responses from the proxy are returned in the same format as the VaultRE API, typically JSON. The proxy does not modify the response data.

Example response:
```json
{
  "data": [
    {
      "id": "123456",
      "address": "123 Main St",
      "price": 750000,
      "status": "For Sale"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_records": 47
  }
}
```

## Error Handling

The proxy returns errors in the following format:

```json
{
  "error": "Error from VaultRE API",
  "details": {
    // Original error from VaultRE API
  }
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Examples

### JavaScript/Fetch Example

```javascript
fetch('https://vaultre-api-proxy-405946437810.us-central1.run.app/properties/lifesale', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
    // Add authentication if required
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return response.json();
})
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Python/Requests Example

```python
import requests

url = "https://vaultre-api-proxy-405946437810.us-central1.run.app/properties/lifesale"
headers = {
    "Content-Type": "application/json"
    // Add authentication if required
}

response = requests.get(url, headers=headers)
response.raise_for_status()  // Raise exception for error status codes
data = response.json()
print(data)
```

### Node.js/Axios Example

```javascript
const axios = require('axios');

async function getProperties() {
  try {
    const response = await axios.get(
      'https://vaultre-api-proxy-405946437810.us-central1.run.app/properties/lifesale',
      {
        headers: {
          'Content-Type': 'application/json'
          // Add authentication if required
        }
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error.response?.data || error.message);
    throw error;
  }
}
```

## Security Considerations

1. **Credentials**: The proxy securely manages VaultRE credentials. Never attempt to pass VaultRE credentials directly.

2. **Data Handling**: Any sensitive data retrieved through the API should be handled securely in your application.

3. **Access Control**: If working with a team, ensure proper access controls are in place for the proxy service.

## Rate Limiting

The proxy itself does not implement rate limiting, but VaultRE's API may have rate limits. Excessive requests may result in temporary blocks from VaultRE.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: If you receive 401 or 403 errors, check your authentication configuration.

2. **Service Unavailable**: If the proxy returns 503 errors, it may be scaling up or experiencing high load.

3. **Endpoint Not Found**: Ensure you're using the correct endpoint path for your VaultRE API request.

### Logging

If you encounter issues, check the Cloud Run logs for the service in Google Cloud Console. These logs may provide more detailed error information.

## Contact

For issues with the proxy service, contact your system administrator.

For questions about VaultRE API data structure or capabilities, refer to the official VaultRE API documentation or contact VaultRE support.



GET /properties/lifesale


## Making Requests

### HTTP Methods

The proxy supports the following HTTP methods:
- GET (for retrieving data)
- POST (for creating or updating data)

### Headers

Always include:
Content-Type: application/json


If the proxy requires authentication:
Authorization: Bearer {your-auth-token}

### Query Parameters

Query parameters are passed through to the VaultRE API. For example:
GET /properties/lifesale?page=1&limit=10

## Response Format

Responses from the proxy are returned in the same format as the VaultRE API, typically JSON. The proxy does not modify the response data.

Example response:
```json
{
  "data": [
    {
      "id": "123456",
      "address": "123 Main St",
      "price": 750000,
      "status": "For Sale"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_records": 47
  }
}
```

## Error Handling

The proxy returns errors in the following format:

```json
{
  "error": "Error from VaultRE API",
  "details": {
    // Original error from VaultRE API
  }
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Examples

### JavaScript/Fetch Example

```javascript
fetch('https://vaultre-api-proxy-405946437810.us-central1.run.app/properties/lifesale', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
    // Add authentication if required
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }
  return response.json();
})
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Python/Requests Example

```python
import requests

url = "https://vaultre-api-proxy-405946437810.us-central1.run.app/properties/lifesale"
headers = {
    "Content-Type": "application/json"
    # Add authentication if required
}

response = requests.get(url, headers=headers)
response.raise_for_status()  # Raise exception for error status codes
data = response.json()
print(data)
```

### Node.js/Axios Example

```javascript
const axios = require('axios');

async function getProperties() {
  try {
    const response = await axios.get(
      'https://vaultre-api-proxy-405946437810.us-central1.run.app/properties/lifesale',
      {
        headers: {
          'Content-Type': 'application/json'
          // Add authentication if required
        }
      }
    );
    console.log(response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching properties:', error.response?.data || error.message);
    throw error;
  }
}
```

## Security Considerations

1. **Credentials**: The proxy securely manages VaultRE credentials. Never attempt to pass VaultRE credentials directly.

2. **Data Handling**: Any sensitive data retrieved through the API should be handled securely in your application.

3. **Access Control**: If working with a team, ensure proper access controls are in place for the proxy service.

## Rate Limiting

The proxy itself does not implement rate limiting, but VaultRE's API may have rate limits. Excessive requests may result in temporary blocks from VaultRE.

## Troubleshooting

### Common Issues

1. **Authentication Errors**: If you receive 401 or 403 errors, check your authentication configuration.

2. **Service Unavailable**: If the proxy returns 503 errors, it may be scaling up or experiencing high load.

3. **Endpoint Not Found**: Ensure you're using the correct endpoint path for your VaultRE API request.

### Logging

If you encounter issues, check the Cloud Run logs for the service in Google Cloud Console. These logs may provide more detailed error information.

## Contact

For issues with the proxy service, contact your system administrator.

For questions about VaultRE API data structure or capabilities, refer to the official VaultRE API documentation or contact VaultRE support.