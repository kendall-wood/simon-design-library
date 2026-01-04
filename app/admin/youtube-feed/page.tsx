'use client';

import { useState, useEffect } from 'react';
import { YouTubeFeedItem } from '@/types/media';

export default function YouTubeFeedManager() {
  const [url, setUrl] = useState('');
  const [processing, setProcessing] = useState(false);
  const [highlights, setHighlights] = useState<YouTubeFeedItem[]>([]);
  const [error, setError] = useState('');
  const [processingStatus, setProcessingStatus] = useState('');
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaylist, setIsPlaylist] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');
    
    // Check if it's a playlist or channel
    const isPlaylistUrl = url.includes('list=');
    const isChannelUrl = url.includes('youtube.com/@') || url.includes('youtube.com/channel/') || url.includes('youtube.com/c/') || url.includes('youtube.com/user/');
    setIsPlaylist(isPlaylistUrl || isChannelUrl);
    
    // Estimate time: Single video ~18s, Playlist ~8s per video + 10s overhead
    // Channels are limited to 75 videos: 75 videos * 8s + 10s = 610s (~10 minutes)
    // Playlists: estimate based on 50 videos max (API limit per request) = 410s
    const estimated = isChannelUrl ? 610 : (isPlaylistUrl ? 410 : 18);
    setEstimatedTime(estimated);
    setTimeRemaining(estimated);
    setProcessingStatus(
      isChannelUrl ? 'Analyzing channel...' : 
      isPlaylistUrl ? 'Analyzing playlist...' : 
      'Analyzing video...'
    );

    try {
      const response = await fetch('/api/youtube/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();
      setHighlights(prev => [...prev, ...data.highlights]);
      setUrl('');
      setProcessingStatus('');
      setTimeRemaining(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProcessingStatus('');
      setTimeRemaining(0);
    } finally {
      setProcessing(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (processing && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [processing, timeRemaining]);

  const handleSaveToFeed = async () => {
    try {
      const response = await fetch('/api/youtube/save-feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlights }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Feed saved successfully! Added ${data.added} new items. Total: ${data.count}`);
        setHighlights([]);
      } else {
        throw new Error('Failed to save');
      }
    } catch (err) {
      alert('Failed to save feed');
    }
  };

  const removeHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="w-full min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
          YouTube Feed Manager
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Add engaging video clips to your feed. AI will automatically find the most stimulating 30+ second segments.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL, Playlist, or Channel URL..."
              className="flex-1 border border-black px-4 py-2 text-sm"
              disabled={processing}
            />
            <button
              type="submit"
              disabled={processing || !url}
              className="bg-[#0000ff] text-white px-6 py-2 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {processing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          {error && (
            <p className="text-red-600 mt-2 text-sm border border-red-300 bg-red-50 p-2">
              {error}
            </p>
          )}
        </form>

        {/* Processing Status */}
        {processing && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">{processingStatus}</p>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#0000ff]">
                  {timeRemaining > 0 ? `${timeRemaining}s` : 'Almost done...'}
                </div>
                <div className="text-xs text-gray-500">
                  {timeRemaining > 0 ? 'estimated time remaining' : 'finishing up'}
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-[#0000ff] h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ 
                  width: `${estimatedTime > 0 ? ((estimatedTime - timeRemaining) / estimatedTime) * 100 : 0}%` 
                }}
              />
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Fetching {isPlaylist ? (url.includes('@') || url.includes('channel') ? 'channel' : 'playlist') : 'video'} metadata from YouTube</div>
              <div>• Downloading transcript{isPlaylist ? 's' : ''}</div>
              <div>• Analyzing content with AI (GPT-4o-mini)</div>
              <div>• Identifying engaging segments (30+ seconds)</div>
              {isPlaylist && (
                <div className="text-[#0000ff] font-semibold mt-2">
                  Processing {url.includes('@') || url.includes('channel') ? 'channel (up to 75 videos)' : 'playlist'} (all videos)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Highlights List */}
        {highlights.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Detected Highlights ({highlights.length})
              </h2>
              <button
                onClick={handleSaveToFeed}
                className="bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700"
              >
                Save All to Feed
              </button>
            </div>

            <div className="space-y-4">
              {highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="border border-black p-4 flex gap-4"
                >
                  {/* Thumbnail */}
                  <img
                    src={highlight.thumbnailUrl}
                    alt={highlight.title}
                    className="w-40 h-24 object-cover flex-shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1 text-sm">{highlight.title}</h3>
                    <p className="text-xs text-gray-600 mb-1">
                      {highlight.creator} • {highlight.datePublished}
                    </p>
                    <p className="text-xs mb-2 line-clamp-2">
                      {highlight.reason || highlight.description}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-700">
                      <span>
                        Start: {Math.floor(highlight.startTime / 60)}:
                        {(highlight.startTime % 60).toString().padStart(2, '0')}
                      </span>
                      <span>Duration: {highlight.duration}s</span>
                      {highlight.confidence && (
                        <span className="text-green-600">
                          Confidence: {(highlight.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <a
                      href={`https://youtube.com/watch?v=${highlight.videoId}&t=${highlight.startTime}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0000ff] text-xs underline"
                    >
                      Preview
                    </a>
                    <button
                      onClick={() => removeHighlight(highlight.id)}
                      className="text-red-600 text-xs underline"
                    >
                      Remove
                    </button>
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
            <li>Paste a YouTube video URL, playlist URL, or channel URL (e.g., youtube.com/@username/videos) above</li>
            <li>AI analyzes the transcript to find the most engaging moments</li>
            <li>Review the suggested highlights (each 30+ seconds)</li>
            <li>Click "Preview" to watch any segment on YouTube</li>
            <li>Remove any highlights you don&apos;t want</li>
            <li>Click "Save All to Feed" to add them to your feed</li>
          </ol>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> You need to set up YOUTUBE_API_KEY and OPENAI_API_KEY in your .env.local file.
              Without these, the system will use fallback behavior (first 30 seconds of videos).
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

