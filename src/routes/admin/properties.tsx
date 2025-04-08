import { useState, useEffect } from 'react';
import { getProperties, Property, PropertyListParams } from '@/lib/vault-re-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSearch, IconFilter } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';

export const Route = createFileRoute('/admin/properties')({
  component: PropertiesPage,
});

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PropertyListParams>({ status: 'listing' });
  const [activeTab, setActiveTab] = useState('listing'); // Default to 'For Sale'

  const fetchProperties = async (filterParams: PropertyListParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Apply any additional params needed for the API
      const apiParams: PropertyListParams = { 
        ...filterParams,
        sort: 'inserted',
        sortOrder: 'desc',
      };
      
      // Call the API to get properties
      const fetchedProperties = await getProperties(apiParams);
      
      // Filter properties locally to remove "Unnamed Property" and properties with 0-1 images
      const filteredProperties = fetchedProperties.filter(property => {
        const hasValidTitle = property.title !== "Unnamed Property";
        const hasMultipleImages = property.images && property.images.length > 1;
        return hasValidTitle && hasMultipleImages;
      });
      
      setProperties(filteredProperties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      setError(typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Unable to retrieve property listings at this time.'));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(filters);
  }, []);

  const handleSearch = () => {
    const params: PropertyListParams = {
      ...filters
    };
    
    if (searchTerm) {
      // Here we might need to adjust how search is implemented based on the API
      // This is a simple example assuming the API has a search parameter
      fetchProperties({ ...params });
    } else {
      fetchProperties(params);
    }
  };

  const handleFilterChange = (newFilters: Partial<PropertyListParams>) => {
    if (newFilters.status !== undefined) {
      setActiveTab(newFilters.status.toString() || 'all');
    }
    
    setFilters({...filters, ...newFilters});
  };

  const applyFilters = () => {
    fetchProperties(filters);
  };

  const clearFilters = () => {
    setFilters({ status: 'listing' });
    setActiveTab('listing');
    fetchProperties({ status: 'listing' });
  };

  // Filter displayed properties by search term locally
  const filteredProperties = searchTerm && Array.isArray(properties)
    ? properties.filter(property => 
        property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.propertyType?.toLowerCase().includes(searchTerm.toLowerCase())
      ) 
    : properties;

  // Handle status tab changes
  const handleStatusChange = (status: string) => {
    setActiveTab(status);
    
    if (status === 'all') {
      // For "All", explicitly include all statuses (listing, conditional, unconditional)
      const newFilters = { 
        ...filters, 
        status: 'listing,conditional,unconditional' 
      };
      setFilters(newFilters);
      fetchProperties(newFilters);
    } else {
      // Otherwise, apply the selected status
      const newFilters = { ...filters, status };
      setFilters(newFilters);
      fetchProperties(newFilters);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <h1 className="text-3xl font-bold">Property Listings</h1>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 md:w-64">
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <IconFilter className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filter Properties</SheetTitle>
                <SheetDescription>
                  Adjust filters to narrow down property listings
                </SheetDescription>
              </SheetHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Property Status</Label>
                  <Select 
                    value={filters.status?.toString() || ''} 
                    onValueChange={(value) => handleFilterChange({ status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      <SelectItem value="listing">For Sale</SelectItem>
                      <SelectItem value="conditional">Under Offer</SelectItem>
                      <SelectItem value="unconditional">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select 
                    value={filters.propertyType || ''} 
                    onValueChange={(value) => handleFilterChange({ propertyType: value })}
                  >
                    <SelectTrigger id="propertyType">
                      <SelectValue placeholder="Any type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any type</SelectItem>
                      <SelectItem value="House">House</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Townhouse">Townhouse</SelectItem>
                      <SelectItem value="Land">Land</SelectItem>
                      <SelectItem value="Rural">Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minBedrooms">Minimum Bedrooms</Label>
                  <Select 
                    value={filters.minBedrooms?.toString() || ''} 
                    onValueChange={(value) => handleFilterChange({ minBedrooms: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger id="minBedrooms">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                      <SelectItem value="5">5+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="minBathrooms">Minimum Bathrooms</Label>
                  <Select 
                    value={filters.minBathrooms?.toString() || ''} 
                    onValueChange={(value) => handleFilterChange({ minBathrooms: value ? parseInt(value) : undefined })}
                  >
                    <SelectTrigger id="minBathrooms">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice">Min Price</Label>
                    <Select 
                      value={filters.minPrice?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange({ minPrice: value ? parseInt(value) : undefined })}
                    >
                      <SelectTrigger id="minPrice">
                        <SelectValue placeholder="No min" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No min</SelectItem>
                        <SelectItem value="300000">$300,000</SelectItem>
                        <SelectItem value="500000">$500,000</SelectItem>
                        <SelectItem value="750000">$750,000</SelectItem>
                        <SelectItem value="1000000">$1,000,000</SelectItem>
                        <SelectItem value="1500000">$1,500,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice">Max Price</Label>
                    <Select 
                      value={filters.maxPrice?.toString() || ''} 
                      onValueChange={(value) => handleFilterChange({ maxPrice: value ? parseInt(value) : undefined })}
                    >
                      <SelectTrigger id="maxPrice">
                        <SelectValue placeholder="No max" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No max</SelectItem>
                        <SelectItem value="500000">$500,000</SelectItem>
                        <SelectItem value="750000">$750,000</SelectItem>
                        <SelectItem value="1000000">$1,000,000</SelectItem>
                        <SelectItem value="1500000">$1,500,000</SelectItem>
                        <SelectItem value="2000000">$2,000,000</SelectItem>
                        <SelectItem value="3000000">$3,000,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button onClick={applyFilters}>Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          
          <Button variant="default" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <Tabs value={activeTab} className="mb-6">
        <TabsList className="justify-start">
          <TabsTrigger value="listing" onClick={() => handleStatusChange('listing')}>
            For Sale
          </TabsTrigger>
          <TabsTrigger value="conditional" onClick={() => handleStatusChange('conditional')}>
            Under Offer
          </TabsTrigger>
          <TabsTrigger value="unconditional" onClick={() => handleStatusChange('unconditional')}>
            Sold
          </TabsTrigger>
          <TabsTrigger value="all" onClick={() => handleStatusChange('all')}>
            All
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Error message display */}
      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive rounded-md p-4 my-4">
          <p className="font-medium">Unable to load properties</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video w-full overflow-hidden">
                <Skeleton className="h-full w-full" />
              </div>
              <CardHeader>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-3 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-3 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-muted/40 rounded-md mt-4">
          <p className="text-muted-foreground text-lg mb-2">No properties found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
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
  
  // Get external link URL if available
  const externalUrl = property.externalLinks && property.externalLinks.length > 0 
    ? property.externalLinks[0].url 
    : null;
  
  return (
    <Link to={`/admin/property/${property.id}`} className="block h-full">
      <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
        <div className="aspect-video w-full overflow-hidden relative">
          {property.images && property.images.length > 0 ? (
            <img 
              src={property.images[0].url} 
              alt={property.address?.fullAddress || 'Property'} 
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}
          {/* Status badge positioned over image */}
          <Badge className="absolute top-2 right-2">{property.status || 'Not specified'}</Badge>
          
          {/* External link badge if available */}
          {externalUrl && (
            <a 
              href={externalUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs hover:bg-primary/90 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              External
            </a>
          )}
        </div>
        
        <CardHeader>
          <div>
            <CardTitle className="line-clamp-1 pb-[2px]">
              {suburb || 'Location not available'}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {streetDisplay || 'Address not available'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex-grow">
          <div className="flex gap-4 mb-4">
            {property.bedrooms !== undefined && (
              <div className="flex items-center">
                <span className="font-semibold">{property.bedrooms}</span>
                <span className="ml-1 text-muted-foreground">Bed</span>
              </div>
            )}
            {property.bathrooms !== undefined && (
              <div className="flex items-center">
                <span className="font-semibold">{property.bathrooms}</span>
                <span className="ml-1 text-muted-foreground">Bath</span>
              </div>
            )}
            {property.carSpaces !== undefined && (
              <div className="flex items-center">
                <span className="font-semibold">{property.carSpaces}</span>
                <span className="ml-1 text-muted-foreground">Car</span>
              </div>
            )}
          </div>

          <div className="mt-auto">
            <p className="font-bold text-xl">
              {property.price 
                ? `$${property.price.toLocaleString()}` 
                : property.priceText || 'Price on application'}
            </p>
            <p className="text-sm text-muted-foreground">
              {property.propertyType || 'Property'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 