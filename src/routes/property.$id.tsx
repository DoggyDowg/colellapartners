import { useState, useEffect } from 'react';
import { getPropertyById, Property } from '@/lib/vault-re-api';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { IconArrowLeft, IconMapPin } from '@tabler/icons-react';

export const Route = createFileRoute('/property/$id')({
  component: PropertyDetail,
});

export default function PropertyDetail() {
  const { id } = Route.useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPropertyDetails() {
      setLoading(true);
      setError(null);
      
      try {
        const propertyData = await getPropertyById(id);
        setProperty(propertyData);
      } catch (err) {
        console.error('Error fetching property details:', err);
        setError('Unable to load property details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyDetails();
  }, [id]);

  const handleGoBack = () => {
    navigate({ to: '/for-sale' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to listings
        </Button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Skeleton className="aspect-video w-full rounded-lg mb-4" />
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-video w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-10 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-6" />
            <Skeleton className="h-8 w-1/3 mb-8" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to listings
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-6">
        <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back to listings
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground mb-4">Property not found</p>
            <Button variant="outline" onClick={handleGoBack}>Return to listings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract suburb and street address from fullAddress
  let suburb = '';
  let streetDisplay = '';
  
  if (property.address?.fullAddress) {
    // Split at the first comma to separate street address from suburb+state
    const addressParts = property.address.fullAddress.split(',');
    if (addressParts.length > 0) {
      // The part before the comma is the street address
      streetDisplay = addressParts[0].trim();
      
      // If there's a second part, it contains the suburb (first word)
      if (addressParts.length > 1) {
        const locationPart = addressParts[1].trim();
        // Extract suburb (first word or words before state abbreviation)
        const suburbMatch = locationPart.match(/^(.*?)\s+[A-Z]{2,3}/);
        if (suburbMatch && suburbMatch[1]) {
          suburb = suburbMatch[1].trim();
        } else {
          suburb = locationPart; // Just use the whole thing if we can't parse it
        }
      }
    }
  }
  
  // Convert suburb to title case (first letter of each word capitalized)
  suburb = suburb.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="container mx-auto py-6">
      <Button variant="ghost" className="mb-6" onClick={handleGoBack}>
        <IconArrowLeft className="mr-2 h-4 w-4" />
        Back to listings
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {/* Main image */}
          <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
            {property.images && property.images.length > 0 ? (
              <img 
                src={property.images[0].url} 
                alt={property.address?.fullAddress || 'Property'} 
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnail gallery */}
          {property.images && property.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {property.images.slice(1, 5).map((image) => (
                <div key={image.id} className="aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={image.url} 
                    alt={property.address?.fullAddress || 'Property'} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {/* Property details */}
          <div className="mb-4 flex items-center gap-2">
            <Badge>{property.status || 'Not specified'}</Badge>
            {property.propertyType && (
              <Badge variant="outline">{property.propertyType}</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">{suburb}</h1>
          <p className="text-xl text-muted-foreground mb-6 flex items-center">
            <IconMapPin className="h-5 w-5 mr-1" />
            {streetDisplay}
          </p>

          <p className="text-3xl font-bold mb-8">
            {property.price 
              ? `$${property.price.toLocaleString()}` 
              : property.priceText || 'Price on application'}
          </p>

          <div className="flex gap-8 mb-8">
            {property.bedrooms !== undefined && (
              <div className="flex flex-col items-center">
                <span className="font-semibold text-2xl">{property.bedrooms}</span>
                <span className="text-muted-foreground">Bedrooms</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex flex-col items-center">
                <span className="font-semibold text-2xl">{property.bathrooms}</span>
                <span className="text-muted-foreground">Bathrooms</span>
              </div>
            )}
            {property.carSpaces !== undefined && (
              <div className="flex flex-col items-center">
                <span className="font-semibold text-2xl">{property.carSpaces}</span>
                <span className="text-muted-foreground">Car Spaces</span>
              </div>
            )}
            {property.landSize !== undefined && (
              <div className="flex flex-col items-center">
                <span className="font-semibold text-2xl">{property.landSize}</span>
                <span className="text-muted-foreground">{property.landUnit || 'm²'}</span>
              </div>
            )}
          </div>

          {property.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Property Description</h2>
              <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {property.features && property.features.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Features</h2>
              <ul className="grid grid-cols-2 gap-2">
                {property.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Agent info if available */}
          {property.agent && (
            <div className="border rounded-lg p-4 flex items-center">
              {property.agent.photoUrl ? (
                <img 
                  src={property.agent.photoUrl} 
                  alt={property.agent.name} 
                  className="h-16 w-16 rounded-full object-cover mr-4"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mr-4">
                  <span className="text-muted-foreground text-lg font-semibold">
                    {property.agent.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold">{property.agent.name}</p>
                {property.agent.phone && <p>{property.agent.phone}</p>}
                {property.agent.email && <p>{property.agent.email}</p>}
              </div>
              <Button className="ml-auto">Contact Agent</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 