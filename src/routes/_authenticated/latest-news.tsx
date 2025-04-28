import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import Masonry from 'react-masonry-css'
import '@/styles/masonry.css' // Import our custom masonry styles

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
            <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
              </svg>
            </div>
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
            <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
              </svg>
            </div>
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
              {isReel && (
                <div className="absolute bottom-2 left-2 bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
                  REEL
                </div>
              )}
            </div>
          ) : (
            <div className="w-full min-h-[180px] flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">
                {isReel ? 'Reel' : 'Video'} thumbnail unavailable
              </p>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
            </svg>
          </div>
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
      <img 
        src={post.media_url} 
        alt={post.caption || 'Instagram post'} 
        className="w-full object-contain"
      />
    );
  };

  return (
    <>
      <Header title="Latest News" />
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <h1 className="text-3xl font-bold">What's Happening at Colella</h1>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
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
                    <div key={post.id} className="relative group bg-white rounded-lg shadow-md overflow-hidden dark:bg-card flex flex-col masonry-item">
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-4 pt-3 pb-1 group-hover:opacity-0 transition-opacity duration-300">
                        {formatRelativeTime(post.timestamp)}
                      </p>
                      <div className="w-full group-hover:opacity-50 transition-opacity duration-300">
                        {renderMedia(post)}
                      </div>
                      <div className="p-4 flex flex-col flex-grow">
                        <p className="text-gray-700 text-sm mb-4 dark:text-gray-300 line-clamp-8 group-hover:opacity-0 transition-opacity duration-300">
                          {post.caption || 'No caption provided'}
                        </p>
                        <div className="flex-grow"></div>
                        <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700 group-hover:opacity-0 transition-opacity duration-300">
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
                      {post.caption && (
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg p-4 flex flex-col pointer-events-none">
                          <div className="overflow-y-auto h-full pointer-events-auto pr-2">
                            <p className="text-white text-sm">
                              {post.caption}
                            </p>
                          </div>
                          <div className="pt-2 mt-auto text-right pointer-events-auto">
                            <a
                              href={post.permalink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-300 text-sm hover:underline font-semibold"
                            >
                              View on Instagram
                            </a>
                          </div>
                        </div>
                      )}
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