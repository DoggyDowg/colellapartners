// Simple Express server to handle API routes in development
import express from 'express';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env.development') });

// Create Express server
const app = express();
const PORT = process.env.API_PORT || 3001;

// Enable CORS for all requests
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Import API handlers (dynamic imports for ES modules)
const apiHandlers = await Promise.all([
  import('./api/mock.js').then(module => module.default),
  import('./api/status.js').then(module => module.default),
  import('./api/properties.js').then(module => module.default),
  import('./api/property.js').then(module => module.default),
  import('./api/categories.js').then(module => module.default),
  import('./api/properties-sale.js').then(module => module.default),
]);

const [mockHandler, statusHandler, propertiesHandler, propertyHandler, categoriesHandler, propertiesSaleHandler] = apiHandlers;

// Mock API routes
app.all('/api/mock', (req, res) => {
  mockHandler(req, res);
});

// Status API route
app.all('/api/status', (req, res) => {
  statusHandler(req, res);
});

// Properties API route
app.all('/api/properties', (req, res) => {
  propertiesHandler(req, res);
});

// Properties Sale API route
app.all('/api/properties/sale', (req, res) => {
  propertiesSaleHandler(req, res);
});

// Categories API route
app.all('/api/categories', (req, res) => {
  categoriesHandler(req, res);
});

// Property API route (with ID parameter)
app.all('/api/property/:id', (req, res) => {
  // Copy the ID from params to query params for compatibility
  req.query.id = req.params.id;
  propertyHandler(req, res);
});

// Start the server
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  - GET /api/status');
  console.log('  - GET /api/mock');
  console.log('  - GET /api/properties');
  console.log('  - GET /api/properties/sale');
  console.log('  - GET /api/categories');
  console.log('  - GET /api/property/:id');
}); 