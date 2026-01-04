'use client';

import { MediaItem } from '@/types/media';
import { useState, useEffect } from 'react';
import { navigationBar } from '@/config/design';
import Header from '@/components/Header';

interface FullVideoViewProps {
  media: MediaItem;
  onBack: () => void;
}

export default function FullVideoView({ media, onBack }: FullVideoViewProps) {
  const [userWantsSound, setUserWantsSound] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  // Load sound preference
  useEffect(() => {
    const savedPref = localStorage.getItem('youtube-sound-enabled');
    if (savedPref === 'true') {
      setUserWantsSound(true);
    }
  }, []);

  // Load liked state
  useEffect(() => {
    const saved = localStorage.getItem('liked-youtube-videos');
    if (saved) {
      const likedVideos = new Set(JSON.parse(saved));
      // Check if any clip from this video is liked
      const videoClipIds = media.youtubeClips?.map(clip => clip.id) || [];
      const isVideoLiked = videoClipIds.some(id => likedVideos.has(id));
      setIsLiked(isVideoLiked);
    }
  }, [media]);

  // Toggle like
  const handleToggleLike = () => {
    const saved = localStorage.getItem('liked-youtube-videos');
    const likedVideos = new Set(saved ? JSON.parse(saved) : []);
    
    // Get all clip IDs for this video
    const videoClipIds = media.youtubeClips?.map(clip => clip.id) || [];
    
    if (isLiked) {
      // Unlike - remove all clips from this video
      videoClipIds.forEach(id => likedVideos.delete(id));
    } else {
      // Like - add all clips from this video
      videoClipIds.forEach(id => likedVideos.add(id));
    }
    
    localStorage.setItem('liked-youtube-videos', JSON.stringify(Array.from(likedVideos)));
    setIsLiked(!isLiked);
  };

  // Extract videoId from the media
  const videoId = media.youtubeClips?.[0]?.videoId || '';

  // Jump to specific timestamp
  const handleJumpToMoment = (startTime: number) => {
    setCurrentTimestamp(startTime);
    setIframeKey(prev => prev + 1); // Force iframe reload with new timestamp
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Header */}
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Video Player - 16:9 aspect ratio */}
      <div className="w-full" style={{ height: '226px' }}>
        <div className="w-full h-full bg-black relative">
          <iframe
            key={iframeKey}
            src={`https://www.youtube.com/embed/${videoId}?start=${currentTimestamp}&autoplay=1&mute=${userWantsSound ? '0' : '1'}&controls=1&modestbranding=1&cc_load_policy=0&rel=0&playsinline=1&enablejsapi=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
            allowFullScreen
            title={media.title}
          />
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="w-full">
        <div className="flex w-full">
          {/* Back button */}
          <div>
            <div className="line-thin border-t-[0.5px]" />
            <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
              <button 
                className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
                onClick={onBack}
                style={{
                  paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                  paddingRight: `${navigationBar.buttonRightPadding}px`
                }}
              >
                ← Back
              </button>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
            </div>
          </div>

          {/* Watch on YouTube link */}
          <div>
            <div className="line-thin border-t-[0.5px]" />
            <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
              <a
                href={`https://youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px] text-[#0000ff] underline"
                style={{
                  paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                  paddingRight: `${navigationBar.buttonRightPadding}px`
                }}
              >
                Watch on YouTube
              </a>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
            </div>
          </div>

          {/* Heart/Like button - fills remaining space */}
          <div className="flex-1">
            <div className="line-thin border-t-[0.5px]" />
            <div className="flex items-stretch" style={{ height: `${navigationBar.height}px` }}>
              <button
                onClick={handleToggleLike}
                className={`flex-1 flex items-center justify-center text-[20px] transition-colors ${
                  isLiked 
                    ? 'bg-[#0000ff] text-white hover:bg-blue-700' 
                    : 'bg-white text-[#0000ff] hover:bg-gray-50'
                }`}
              >
                {isLiked ? '♥' : '♡'}
              </button>
              <div className="line-thin border-r-[0.5px] -my-[0.5px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Video Info */}
        <div className="w-full border-t-[0.5px] border-black">
          <div
            style={{
              paddingLeft: '24px',
              paddingRight: '24px',
              paddingTop: '32px',
              paddingBottom: '32px'
            }}
          >
            {/* Title */}
            <h3
              className="text-[16px] font-bold leading-[20px]"
              style={{ marginBottom: '8px' }}
            >
              {media.title}
            </h3>

            {/* Creator and Date */}
            <div
              className="text-[13px] leading-[16px] text-gray-600"
              style={{ marginBottom: '4px' }}
            >
              {media.author}
            </div>
            <div
              className="text-[13px] leading-[16px] text-gray-500"
              style={{ marginBottom: '20px' }}
            >
              {media.year}
            </div>

            {/* Description */}
            <p
              className="text-[13px] leading-[20px]"
              style={{ marginBottom: '0px' }}
            >
              {media.description}
            </p>
          </div>
        </div>

        {/* Highlighted Moments - Clickable */}
        {media.youtubeClips && media.youtubeClips.length > 1 && (
          <>
            {/* Divider line */}
            <div className="w-full border-t-[0.5px] border-black" />
            
            <div
              style={{
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingTop: '32px',
                paddingBottom: '32px'
              }}
            >
              <h4
                className="text-[14px] font-bold leading-[18px]"
                style={{ marginBottom: '16px' }}
              >
                Highlighted Moments ({media.youtubeClips.length})
              </h4>
              <div className="space-y-3">
                {media.youtubeClips.map((clip) => (
                  <button
                    key={clip.id}
                    onClick={() => handleJumpToMoment(clip.startTime)}
                    className="w-full text-left border-[0.5px] border-black hover:bg-gray-50 transition-colors"
                    style={{
                      paddingLeft: '16px',
                      paddingRight: '16px',
                      paddingTop: '12px',
                      paddingBottom: '12px'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-bold">
                        {Math.floor(clip.startTime / 60)}:{(clip.startTime % 60).toString().padStart(2, '0')}
                      </span>
                      <span className="text-[11px] text-gray-500">•</span>
                      <span className="text-[11px] text-gray-600">{clip.duration}s</span>
                      {clip.confidence && (
                        <>
                          <span className="text-[11px] text-gray-500">•</span>
                          <span className="text-[11px] text-green-600">
                            {(clip.confidence * 100).toFixed(0)}% match
                          </span>
                        </>
                      )}
                    </div>
                    {clip.reason && (
                      <p className="text-[12px] leading-[16px] text-gray-700">
                        {clip.reason}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Bottom border */}
        <div className="w-full border-t-[0.5px] border-black" />
      </div>
    </div>
  );
}

