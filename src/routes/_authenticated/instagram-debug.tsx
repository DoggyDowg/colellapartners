import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Header } from '@/components/layout/header'

// Define interface for the API response
interface DirectMedia {
  id?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  media_product_type?: string;
}

interface DebugResult {
  results: {
    directMedia?: DirectMedia;
    directMediaError?: {
      status?: number;
      error?: string;
    };
  };
}

// Note: The path here should be relative to the parent route ('/_authenticated')
export const Route = createFileRoute('/_authenticated/instagram-debug')({
  component: InstagramDebugComponent,
})

export function InstagramDebugComponent() {
  // Restore the original component logic
  const [videoId, setVideoId] = useState<string>('');
  const [result, setResult] = useState<DebugResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchVideo = async () => {
    if (!videoId) {
      setError('Please enter a video ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Use our dedicated debug server on port 3002
      const response = await fetch(`http://localhost:3002/api/instagram-debug-video?videoId=${encodeURIComponent(videoId)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Instagram Debug" />
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
          <h1 className="text-3xl font-bold">Instagram Video Debug</h1>
        </div>

        <div className="bg-white dark:bg-card p-6 rounded-lg shadow-md mb-6">
          <div className="mb-4">
            <label htmlFor="videoId" className="block text-sm font-medium mb-1 dark:text-gray-300">
              Instagram Video ID
            </label>
            <div className="flex gap-2">
              <input
                id="videoId"
                type="text"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="Enter Instagram Video ID"
                className="flex-1 border rounded-md p-2 dark:bg-gray-800 dark:border-gray-700"
              />
              <button
                onClick={handleFetchVideo}
                disabled={loading}
                className="bg-primary text-white rounded-md px-4 py-2 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Fetch Video'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
              Enter an Instagram video ID to test API access
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-2 dark:text-gray-300">Results</h2>
              
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto max-h-96">
                <pre className="text-sm whitespace-pre-wrap dark:text-gray-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>

              {result.results.directMedia && result.results.directMedia.media_url && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Video Preview</h3>
                  <video 
                    src={result.results.directMedia.media_url} 
                    controls 
                    className="max-w-full h-auto rounded"
                  ></video>
                </div>
              )}

              {result.results.directMedia && result.results.directMedia.thumbnail_url && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 dark:text-gray-300">Thumbnail Preview</h3>
                  <img 
                    src={result.results.directMedia.thumbnail_url} 
                    alt="Video thumbnail" 
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 