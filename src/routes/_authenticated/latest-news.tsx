import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import Masonry from 'react-masonry-css'
import '@/styles/masonry.css' // Import our custom masonry styles
import { InstagramPostSkeleton } from '@/components/dashboard/InstagramPostSkeleton'; // Import the skeleton component

// Define the structure of an Instagram post based on the API fields
interface InstagramMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
}

interface InstagramPost {
  id: string;
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_product_type?: 'REELS' | 'FEED';
  thumbnail_url?: string; // Primarily for videos
  children?: { // For CAROUSEL_ALBUM
    data: InstagramMedia[];
  };
}

// Define the structure of the API response we expect
interface InstagramApiResponse {
  data: InstagramPost[];
}

export const Route = createFileRoute('/_authenticated/latest-news')({
  component: LatestNewsComponent,
})

// Helper function to format relative time
function formatRelativeTime(timestampString: string): string {
  const now = new Date();
  const past = new Date(timestampString);
  if (isNaN(past.getTime())) return ''; // Handle invalid date

  const diffInSeconds = Math.round((now.getTime() - past.getTime()) / 1000);
  const diffInMinutes = Math.round(diffInSeconds / 60);
  const diffInHours = Math.round(diffInMinutes / 60);
  const diffInDays = Math.round(diffInHours / 24);
  const diffInWeeks = Math.round(diffInDays / 7);
  const diffInMonths = Math.round(diffInDays / 30.44); // Approximate
  const diffInYears = Math.round(diffInDays / 365.25); // Approximate

  if (diffInSeconds < 5) return 'Just now';
  if (diffInMinutes < 1) return `${diffInSeconds} seconds ago`;
  if (diffInHours < 1) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  if (diffInDays < 1) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  // Simple check for yesterday (approx 24-48 hours)
  if (diffInDays === 1) return 'Yesterday'; 
  if (diffInWeeks < 1) return `${diffInDays} days ago`; 
  if (diffInMonths < 1) return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  if (diffInYears < 1) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
}

function LatestNewsComponent() {
  // State variables
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Breakpoints for the masonry layout
  const breakpointColumnsObj = {
    default: 3, // 3 columns on desktop
    1200: 3,    // 3 columns on large screens
    900: 2,     // 2 columns on medium screens
    600: 1      // 1 column on small screens
  };

  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Frontend no longer needs to know the tag

        // Call the backend endpoint without any query parameters
        const apiUrl = `/api/instagram-feed`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const result: InstagramApiResponse = await response.json();
        // console.log(`[Instagram] Received ${result.data?.length || 0} posts from API`); // Removed for linting

        // Process posts without logging
        setPosts(result.data || []); // Ensure data is always an array
      } catch (err) {
        // console.error('[Instagram] Error fetching posts:', err); // Keep error logging if desired, or remove
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const renderMedia = (post: InstagramPost) => {
    // For carousel albums, show the first image
    if (post.media_type === 'CAROUSEL_ALBUM') {
      // If we have children data, use the first child's media
      if (post.children?.data && post.children.data.length > 0 && post.children.data[0]?.media_url) {
        return (
          <div className="relative w-full">
            <img 
              src={post.children.data[0].media_url} 
              alt={post.caption || 'Instagram album'} 
              className="w-full object-contain"
            />
          </div>
        );
      }
      
      // If no children but we have media_url, use that
      if (post.media_url) {
        return (
          <div className="relative w-full">
            <img 
              src={post.media_url} 
              alt={post.caption || 'Instagram album'} 
              className="w-full object-contain"
            />
          </div>
        );
      }
    }
    
    // For videos, show with thumbnail as fallback
    if (post.media_type === 'VIDEO') {
      // Check if it's a Reel
      const isReel = post.media_product_type === 'REELS';
      
      if (!post.media_url && !post.thumbnail_url) {
        // Display a placeholder with text and link to Instagram
        return (
          <div className="relative w-full min-h-[180px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <p className="text-gray-500 dark:text-gray-400">
              {isReel ? 'Instagram Reel' : 'Video'} currently unavailable
            </p>
            {post.permalink && (
              <a 
                href={post.permalink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="absolute bottom-2 right-2 text-primary text-xs hover:underline"
              >
                View on Instagram
              </a>
            )}
          </div>
        );
      }
      
      return (
        <div className="relative w-full">
          {post.media_url ? (
            <video 
              src={post.media_url} 
              poster={post.thumbnail_url} 
              muted 
              controls 
              className="w-full"
            ></video>
          ) : post.thumbnail_url ? (
            <div className="relative">
              <img 
                src={post.thumbnail_url} 
                alt={post.caption || `Instagram ${isReel ? 'Reel' : 'video'} thumbnail`}
                className="w-full object-contain"
              />
              <a 
                href={post.permalink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className={`bg-primary/70 rounded-full p-3`}>
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </a>
            </div>
          ) : (
            <div className="w-full min-h-[180px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                {isReel ? 'Reel' : 'Video'} thumbnail unavailable
              </p>
            </div>
          )}
        </div>
      );
    }
    
    // For regular images
    if (!post.media_url) {
      // Display a placeholder with text
      return (
        <div className="relative w-full min-h-[180px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <p className="text-gray-500 dark:text-gray-400">Image currently unavailable</p>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <img 
          src={post.media_url} 
          alt={post.caption || 'Instagram post'} 
          className="w-full object-contain"
        />
      </div>
    );
  };

  return (
    <>
      <Header title="Latest News" />
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <h1 className="text-3xl font-bold">What's Happening at Colella</h1>
        </div>

        {/* Loading State - Use Skeletons */}
        {isLoading && (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid-column"
          >
            {/* Render multiple skeleton loaders */}
            {Array.from({ length: 6 }).map((_, index) => (
              <InstagramPostSkeleton key={index} />
            ))}
          </Masonry>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center text-red-600 bg-red-100 border border-red-400 p-4 rounded-md dark:bg-red-900/20 dark:border-red-800">
            <p className="font-semibold">Failed to load posts:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Success State - Display Posts */}
        {!isLoading && !error && (
          <div>
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground">No posts found.</p>
            ) : (
              <div className="mb-8">
                {/* Masonry Layout */}
                <Masonry
                  breakpointCols={breakpointColumnsObj}
                  className="my-masonry-grid"
                  columnClassName="my-masonry-grid-column"
                >
                  {posts.map((post) => (
                    <div key={post.id} className="relative group bg-white rounded-lg shadow-md overflow-hidden dark:bg-card dark:border dark:border-gray-800 flex flex-col masonry-item">
                      <div className="w-full relative">
                        {renderMedia(post)}
                        <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/50 to-transparent">
                          <p className="text-xs text-white drop-shadow-sm font-medium px-2 py-1">
                            {formatRelativeTime(post.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <div className="caption-wrapper mb-4">
                          <p className="text-gray-700 text-sm dark:text-gray-300 custom-line-clamp-8">
                            {post.caption || 'No caption provided'}
                          </p>
                        </div>
                        <div className="flex-grow"></div>
                        <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
                          <span className="text-gray-500 text-xs dark:text-gray-400">
                            {new Date(post.timestamp).toLocaleDateString()}
                          </span>
                          <a 
                            href={post.permalink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary text-sm hover:underline"
                          >
                            View on Instagram
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </Masonry>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
} 