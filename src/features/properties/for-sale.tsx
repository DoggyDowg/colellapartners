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
import { Link } from '@tanstack/react-router';
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
import { Header } from '@/components/layout/header';
import { ThemeSwitch } from '@/components/theme-switch';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { SearchProvider } from '@/context/search-context';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';

export default function ForSalePageContent() {
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
      
      console.log("Fetching properties with params:", apiParams);
      
      // Call the API to get properties
      const fetchedProperties = await getProperties(apiParams);
      
      // Add verbose debugging for property data
      if (!fetchedProperties || !Array.isArray(fetchedProperties)) {
        console.error("Invalid properties response: not an array", fetchedProperties);
        setProperties([]);
        setError("Unable to retrieve property listings. Received invalid data format.");
        return;
      }
      
      console.log("Fetched properties:", fetchedProperties.length);
      
      if (fetchedProperties.length > 0) {
        // Log an example property for debugging
        console.log("Example property structure:", 
          JSON.stringify(fetchedProperties[0]).substring(0, 500) + "...");
      }
      
      // Filter properties locally based on user preferences
      const filteredProperties = fetchedProperties.filter(property => {
        // Check for valid title in either heading or title
        const hasValidTitle = Boolean(property.heading) || 
          (property.title && property.title !== "Unnamed Property");
        
        // Check for images in either images or photos array
        const hasImages = Boolean(
          (property.images && property.images.length > 0) || 
          (property.photos && property.photos.length > 0)
        );
        
        return hasValidTitle && hasImages;
      });
      
      console.log("Filtered properties:", filteredProperties.length);
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
        (property.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.heading?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.displayAddress?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.address?.fullAddress?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.address?.suburb && typeof property.address.suburb === 'string' && 
          property.address.suburb.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.address?.suburb && typeof property.address.suburb === 'object' && 
          property.address.suburb.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.type?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.propertyType?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (property.description?.toLowerCase().includes(searchTerm.toLowerCase()))
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

  // Setup layout components
  const defaultOpen = Cookies.get('sidebar:state') !== 'false';

  const mainContent = (
    <>
      <Header title="Properties For Sale">
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      
      <div className="container py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <h1 className="text-3xl font-bold">Properties For Sale</h1>
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
                  <div className="flex justify-between w-full">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <SheetClose asChild>
                      <Button onClick={applyFilters}>Apply Filters</Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            
            <Button variant="default" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>

        {/* Status filter tabs */}
        <Tabs 
          value={activeTab} 
          onValueChange={handleStatusChange}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="listing">For Sale</TabsTrigger>
            <TabsTrigger value="conditional">Under Offer</TabsTrigger>
            <TabsTrigger value="unconditional">Sold</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Error message display */}
        {error && (
          <Card className="border-destructive/50 shadow-md">
            <CardHeader className="bg-destructive/10 border-b border-destructive/20">
              <CardTitle className="text-destructive">Unable to load properties</CardTitle>
              <CardDescription>
                We're experiencing difficulties connecting to our property database.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">Unable to retrieve property listings at this time. Please try again later or contact support if the issue persists.</p>
              <Button 
                onClick={() => fetchProperties(filters)} 
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-64 bg-muted" />
                <CardContent className="mt-5">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <div className="flex justify-between mt-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-5 w-1/3" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">No properties found</h3>
                <p className="mt-2">Try changing your filters or check back later.</p>
                {searchTerm && (
                  <Button onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <SearchProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <div
          id='content'
          className={cn(
            'ml-auto w-full max-w-full',
            'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] duration-200 ease-linear',
            'flex h-svh flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
          )}
        >
          {mainContent}
        </div>
      </SidebarProvider>
    </SearchProvider>
  );
}

function PropertyCard({ property }: { property: Property }) {
  // Extract suburb and street address from fullAddress or displayAddress
  let suburb = '';
  let streetDisplay = '';
  
  if (property.address?.suburb && typeof property.address.suburb === 'object' && 'name' in property.address.suburb) {
    // If we have structured data, use it
    suburb = property.address.suburb.name || '';
    
    // Create street display from structured data
    const parts = [];
    if (property.address.unitNumber) parts.push(property.address.unitNumber);
    if (property.address.streetNumber) parts.push(property.address.streetNumber);
    if (property.address.street) parts.push(property.address.street);
    
    streetDisplay = parts.join(' ');
  } else if (property.address?.fullAddress || property.displayAddress) {
    // Fall back to parsing from full address string
    const addressStr = property.displayAddress || property.address?.fullAddress || '';
    
    // Split at the first comma to separate street address from suburb+state
    const addressParts = addressStr.split(',');
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
  } else if (typeof property.address?.suburb === 'string') {
    suburb = property.address.suburb;
  }
  
  // Convert suburb to title case (first letter of each word capitalized)
  suburb = suburb ? suburb.toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Location not available';
  
  // Get the first image URL
  const imageUrl = (property.photos && property.photos[0]?.url) || 
                  (property.images && property.images[0]?.url) || '';

  // Format status display
  const statusDisplay = property.status === 'listing' ? 'For Sale' : 
                       property.status === 'conditional' ? 'Under Offer' : 
                       property.status === 'unconditional' ? 'Sold' : 
                       property.status || 'Not specified';
  
  // Format price display
  const priceDisplay = property.displayPrice || 
                      (property.searchPrice 
                        ? `$${property.searchPrice.toLocaleString()}` 
                        : property.price 
                          ? `$${property.price.toLocaleString()}` 
                          : property.priceText || 'Price on application');
  
  // Get property type
  const propertyType = property.type?.name || property.propertyType || 'Property';
  
  // Get external link URL if available
  const externalUrl = property.externalLinks && property.externalLinks.length > 0 
    ? property.externalLinks[0].url 
    : null;
                      
  return (
    // Use external URL if available, otherwise link to internal property page
    externalUrl 
      ? (
        <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
          <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
            <div className="aspect-video w-full overflow-hidden relative">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={property.displayAddress || property.address?.fullAddress || 'Property'} 
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              {/* Status badge positioned over image */}
              <Badge className="absolute top-2 right-2">{statusDisplay}</Badge>
            </div>
            
            <CardHeader>
              <div>
                <CardTitle className="line-clamp-1 pb-[2px]">
                  {suburb}
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  {streetDisplay || 'Address not available'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="flex-grow">
              <div className="flex gap-4 mb-4">
                {(property.bedrooms !== undefined || property.bed !== undefined) && (
                  <div className="flex items-center">
                    <span className="font-semibold">{property.bed || property.bedrooms || 0}</span>
                    <span className="ml-1 text-muted-foreground">Bed</span>
                  </div>
                )}
                {(property.bathrooms !== undefined || property.bath !== undefined) && (
                  <div className="flex items-center">
                    <span className="font-semibold">{property.bath || property.bathrooms || 0}</span>
                    <span className="ml-1 text-muted-foreground">Bath</span>
                  </div>
                )}
                {(property.carSpaces !== undefined || property.garages !== undefined || property.carports !== undefined) && (
                  <div className="flex items-center">
                    <span className="font-semibold">
                      {((property.carSpaces || 0) + (property.garages || 0) + (property.carports || 0))}
                    </span>
                    <span className="ml-1 text-muted-foreground">Car</span>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <p className="font-bold text-xl">
                  {priceDisplay}
                </p>
                <p className="text-sm text-muted-foreground">
                  {propertyType}
                </p>
              </div>
            </CardContent>
          </Card>
        </a>
      ) 
      : (
        <Link to={`/property/${property.id}`} className="block h-full">
          <Card className="overflow-hidden h-full flex flex-col hover:shadow-md transition-shadow">
            <div className="aspect-video w-full overflow-hidden relative">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={property.displayAddress || property.address?.fullAddress || 'Property'} 
                  className="h-full w-full object-cover transition-transform hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
              {/* Status badge positioned over image */}
              <Badge className="absolute top-2 right-2">{statusDisplay}</Badge>
            </div>
            
            <CardHeader>
              <div>
                <CardTitle className="line-clamp-1 pb-[2px]">
                  {suburb}
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  {streetDisplay || 'Address not available'}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="flex-grow">
              <div className="flex gap-4 mb-4">
                {(property.bedrooms !== undefined || property.bed !== undefined) && (
                  <div className="flex items-center">
                    <span className="font-semibold">{property.bed || property.bedrooms || 0}</span>
                    <span className="ml-1 text-muted-foreground">Bed</span>
                  </div>
                )}
                {(property.bathrooms !== undefined || property.bath !== undefined) && (
                  <div className="flex items-center">
                    <span className="font-semibold">{property.bath || property.bathrooms || 0}</span>
                    <span className="ml-1 text-muted-foreground">Bath</span>
                  </div>
                )}
                {(property.carSpaces !== undefined || property.garages !== undefined || property.carports !== undefined) && (
                  <div className="flex items-center">
                    <span className="font-semibold">
                      {((property.carSpaces || 0) + (property.garages || 0) + (property.carports || 0))}
                    </span>
                    <span className="ml-1 text-muted-foreground">Car</span>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <p className="font-bold text-xl">
                  {priceDisplay}
                </p>
                <p className="text-sm text-muted-foreground">
                  {propertyType}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )
  );
} 