import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconHome, IconArrowRight } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

interface Property {
  id: string;
  address: {
    displayAddress: string;
  };
  photos: {
    thumbnails: {
      thumb_180: string;
    };
  }[];
  displayPrice: string;
  heading: string;
  type: {
    name: string;
  };
}

export function PropertyOverview() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from the VaultRE API
    // For now, we'll use mock data
    fetchMockProperties();
  }, []);

  const fetchMockProperties = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const mockData: Property[] = [
        {
          id: '1',
          address: {
            displayAddress: '123 Beach Road, Bondi NSW 2026',
          },
          photos: [
            {
              thumbnails: {
                thumb_180: 'https://placehold.co/180x120/png',
              },
            },
          ],
          displayPrice: '$1,250,000',
          heading: 'Stunning Beachfront Apartment with Ocean Views',
          type: {
            name: 'Apartment',
          },
        },
        {
          id: '2',
          address: {
            displayAddress: '45 Mountain View, Leura NSW 2780',
          },
          photos: [
            {
              thumbnails: {
                thumb_180: 'https://placehold.co/180x120/png',
              },
            },
          ],
          displayPrice: '$850,000',
          heading: 'Charming Mountain Retreat with Garden',
          type: {
            name: 'House',
          },
        },
      ];

      setProperties(mockData);
      setLoading(false);
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Featured Properties</CardTitle>
        <CardDescription>Latest properties that might interest your clients</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <p>Loading properties...</p>
          </div>
        ) : properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map((property) => (
              <div key={property.id} className="flex border rounded-md overflow-hidden">
                <div className="flex-shrink-0 w-[120px] h-[80px] bg-muted">
                  {property.photos && property.photos[0] ? (
                    <img
                      src={property.photos[0].thumbnails.thumb_180}
                      alt={property.heading}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <IconHome className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-sm line-clamp-1">{property.heading}</h3>
                    <Badge variant="outline" className="ml-2 flex-shrink-0">
                      {property.type.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{property.address.displayAddress}</p>
                  <p className="text-sm font-medium">{property.displayPrice}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-center">
            <p className="text-muted-foreground">No featured properties available at this time.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link to="/for-sale">
            View All Properties
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
} 