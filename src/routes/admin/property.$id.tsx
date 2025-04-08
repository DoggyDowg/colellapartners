import { useState, useEffect } from 'react';
import { useParams, Link, createFileRoute } from '@tanstack/react-router';
import { getPropertyById, Property } from '@/lib/vault-re-api';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { IconArrowLeft, IconBed, IconBath, IconCar, IconRuler, IconMapPin } from '@tabler/icons-react';

export const Route = createFileRoute('/admin/property/$id')({
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { id } = useParams({ from: '/admin/property/$id' });
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        const data = await getPropertyById(id);
        setProperty(data);
        
        // Set first image as active if available
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0].url);
        }
        
        setError(null);
      } catch (err) {
        console.error(`Failed to fetch property ${id}:`, err);
        setError('Failed to load property details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link to="/admin/properties" className="flex items-center text-muted-foreground hover:text-foreground mr-4">
            <IconArrowLeft className="mr-1 h-4 w-4" />
            Back to Properties
          </Link>
          <Skeleton className="h-8 w-1/3" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-20 rounded-md flex-shrink-0" />
              ))}
            </div>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto py-6">
        <Link to="/admin/properties" className="flex items-center text-muted-foreground hover:text-foreground mb-6">
          <IconArrowLeft className="mr-1 h-4 w-4" />
          Back to Properties
        </Link>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error || 'Property not found'}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="flex items-center mb-2 sm:mb-0">
          <Link to="/admin/properties" className="flex items-center text-muted-foreground hover:text-foreground mr-4">
            <IconArrowLeft className="mr-1 h-4 w-4" />
            Back to Properties
          </Link>
          <h1 className="text-2xl font-bold">{property.title || 'Unnamed Property'}</h1>
        </div>
        <Badge className="text-sm">{property.status || 'Not specified'}</Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Main Image */}
          <div className="overflow-hidden rounded-lg">
            {activeImage ? (
              <img 
                src={activeImage} 
                alt={property.title || 'Property'} 
                className="h-full w-full object-cover aspect-video"
              />
            ) : (
              <div className="aspect-video w-full bg-muted flex items-center justify-center rounded-lg">
                <span className="text-muted-foreground">No image available</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery */}
          {property.images && property.images.length > 0 && (
            <div className="flex mt-4 space-x-2 overflow-x-auto pb-2">
              {property.images.map((image) => (
                <div 
                  key={image.id} 
                  className={`h-20 w-20 rounded-md overflow-hidden cursor-pointer flex-shrink-0 border-2 ${
                    activeImage === image.url ? 'border-primary' : 'border-transparent'
                  }`}
                  onClick={() => setActiveImage(image.url)}
                >
                  <img 
                    src={image.url} 
                    alt={property.title || 'Property'} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Property Details */}
          <Tabs defaultValue="details" className="mt-6">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {property.bedrooms !== undefined && (
                      <div className="flex items-center">
                        <IconBed className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{property.bedrooms}</p>
                          <p className="text-sm text-muted-foreground">Bedrooms</p>
                        </div>
                      </div>
                    )}
                    
                    {property.bathrooms !== undefined && (
                      <div className="flex items-center">
                        <IconBath className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{property.bathrooms}</p>
                          <p className="text-sm text-muted-foreground">Bathrooms</p>
                        </div>
                      </div>
                    )}
                    
                    {property.carSpaces !== undefined && (
                      <div className="flex items-center">
                        <IconCar className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{property.carSpaces}</p>
                          <p className="text-sm text-muted-foreground">Parking</p>
                        </div>
                      </div>
                    )}
                    
                    {property.landSize !== undefined && (
                      <div className="flex items-center">
                        <IconRuler className="h-5 w-5 mr-2 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {property.landSize} {property.landUnit || 'm²'}
                          </p>
                          <p className="text-sm text-muted-foreground">Land Size</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <IconMapPin className="h-5 w-5 mr-2 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{property.propertyType || 'Property'}</p>
                        <p className="text-sm text-muted-foreground">Property Type</p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="font-medium mb-2">Location</h3>
                    <p className="text-muted-foreground">{property.address?.fullAddress || 'Address not available'}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="description" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {property.description ? (
                    <div className="prose dark:prose-invert max-w-none">
                      <p>{property.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No description available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="features" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  {property.features && property.features.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {property.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="h-2 w-2 bg-primary rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No features listed</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Sidebar */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                {property.price 
                  ? `$${property.price.toLocaleString()}` 
                  : property.priceText || 'Price on application'}
              </CardTitle>
              <CardDescription>
                {typeof property.address?.suburb === 'object' 
                  ? property.address?.suburb.name 
                  : property.address?.suburb} {property.address?.state} {property.address?.postcode}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {property.agent && (
                <div>
                  <h3 className="font-medium mb-2">Listing Agent</h3>
                  <div className="flex items-center">
                    {property.agent.photoUrl ? (
                      <img 
                        src={property.agent.photoUrl} 
                        alt={property.agent.name}
                        className="h-12 w-12 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted mr-3 flex items-center justify-center">
                        <span className="text-lg font-medium">
                          {property.agent.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{property.agent.name}</p>
                      {property.agent.email && (
                        <p className="text-sm text-muted-foreground">{property.agent.email}</p>
                      )}
                      {property.agent.phone && (
                        <p className="text-sm">{property.agent.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {property.inspectionTimes && property.inspectionTimes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Inspection Times</h3>
                  <ul className="space-y-1">
                    {property.inspectionTimes.map((time, index) => (
                      <li key={index} className="text-sm">{time}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button className="w-full">Contact Agent</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default PropertyDetailPage; 