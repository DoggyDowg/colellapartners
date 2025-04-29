import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a skeleton placeholder for an Instagram post card.
 * This mimics the structure and general appearance of a loaded post
 * card while content is being fetched.
 */
export function InstagramPostSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden dark:bg-card dark:border dark:border-gray-800 flex flex-col masonry-item">
      {/* Media Placeholder */}
      <Skeleton className="w-full h-64" /> {/* Adjust height as needed */}
      
      <div className="p-4 flex flex-col flex-grow">
        {/* Caption Placeholder */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Footer Placeholder */}
        <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    </div>
  );
} 