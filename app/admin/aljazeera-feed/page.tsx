'use client';

import { useState } from 'react';

export default function AlJazeeraFeedManager() {
  const [fetching, setFetching] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    setFetching(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/aljazeera/fetch', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Al Jazeera videos');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
          Al Jazeera Feed Manager
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Fetch the latest videos from Al Jazeera NewsFeed (last 7 days)
        </p>

        {/* Fetch Button */}
        <div className="mb-8">
          <button
            onClick={handleFetch}
            disabled={fetching}
            className="bg-[#0000ff] text-white px-6 py-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {fetching ? 'Fetching...' : 'Fetch Al Jazeera Videos'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Success Display */}
        {result && (
          <div className="mb-6 p-4 bg-green-50 border border-green-300">
            <h2 className="font-bold mb-2 text-sm">✅ Success!</h2>
            <div className="text-xs text-gray-700 space-y-1">
              <div>Total videos in feed: {result.total}</div>
              <div>New videos added: {result.new}</div>
            </div>
          </div>
        )}

        {/* Videos List */}
        {result && result.videos && result.videos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Videos in Feed ({result.videos.length})</h2>
            <div className="space-y-4">
              {result.videos.map((video: any) => (
                <div
                  key={video.id}
                  className="border border-black p-4 flex gap-4"
                >
                  {/* Thumbnail */}
                  {video.thumbnailUrl && (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-40 h-24 object-cover flex-shrink-0"
                    />
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1 text-sm">{video.title}</h3>
                    <div className="flex gap-4 text-xs text-gray-700 mb-2">
                      <span>Duration: {video.duration}</span>
                      <span>
                        {new Date(video.datePublished).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0000ff] text-xs underline"
                    >
                      View on Al Jazeera
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-gray-100 border border-gray-300">
          <h2 className="font-bold mb-2 text-sm">How it works:</h2>
          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-700">
            <li>Click "Fetch Al Jazeera Videos" to scrape the latest NewsFeed videos</li>
            <li>Videos from the last 7 days will be fetched and stored</li>
            <li>Older videos are automatically removed from the feed</li>
            <li>Videos appear in your main feed mixed with YouTube videos</li>
            <li>Run this daily to keep the feed fresh</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Al Jazeera videos will have the same autoplay behavior as YouTube videos
              (manual play required on iOS Safari).
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4 text-sm">
          <a href="/admin" className="text-[#0000ff] underline">
            ← Back to Admin
          </a>
          <a href="/" className="text-[#0000ff] underline">
            View Library
          </a>
        </div>
      </div>
    </div>
  );
}


