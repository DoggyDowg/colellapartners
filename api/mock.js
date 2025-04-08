// This is a mock API endpoint for development testing
export default function handler(req, res) {
  // Return mock properties data
  return res.status(200).json({
    properties: [
      {
        id: '1001',
        title: 'Modern Beachfront Villa',
        status: 'For Sale',
        price: 2500000,
        bedrooms: 4,
        bathrooms: 3,
        carSpaces: 2,
        propertyType: 'House',
        address: {
          street: '123 Beach Road',
          suburb: 'Bondi',
          state: 'NSW',
          postcode: '2026'
        }
      },
      {
        id: '1002',
        title: 'City Apartment with Views',
        status: 'For Sale',
        price: 1200000,
        bedrooms: 2,
        bathrooms: 2,
        carSpaces: 1,
        propertyType: 'Apartment',
        address: {
          street: '42 Park Avenue, Unit 1505',
          suburb: 'Sydney',
          state: 'NSW',
          postcode: '2000'
        }
      }
    ]
  });
} 