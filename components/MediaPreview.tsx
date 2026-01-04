'use client';

import { MediaItem, YouTubeFeedItem, AlJazeeraFeedItem, ZeteoFeedItem, FeedItem } from '@/types/media';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface MediaPreviewProps {
  selectedMedia: MediaItem | FeedItem | null;
  shouldAutoplay?: boolean; // Control whether video should autoplay
}

export default function MediaPreview({ selectedMedia, shouldAutoplay = true }: MediaPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [videoTime, setVideoTime] = useState(0);
  const [userWantsSound, setUserWantsSound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  console.log('MediaPreview render - selectedMedia:', selectedMedia?.title || 'none', 'shouldAutoplay:', shouldAutoplay);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('MediaPreview UNMOUNTING for:', selectedMedia?.title || 'unknown');
    };
  }, [selectedMedia]);

  // Type guards to check feed item types
  const isYouTubeFeedItem = (media: MediaItem | FeedItem | null): media is YouTubeFeedItem => {
    return media !== null && 'videoId' in media && (!('source' in media) || media.source === 'youtube');
  };

  const isAlJazeeraFeedItem = (media: MediaItem | FeedItem | null): media is AlJazeeraFeedItem => {
    return media !== null && 'source' in media && media.source === 'aljazeera';
  };

  const isZeteoFeedItem = (media: MediaItem | FeedItem | null): media is ZeteoFeedItem => {
    return media !== null && 'source' in media && media.source === 'zeteo';
  };

  // Reset iframe when media changes (forces video to restart from beginning)
  useEffect(() => {
    if (isYouTubeFeedItem(selectedMedia) || isAlJazeeraFeedItem(selectedMedia) || isZeteoFeedItem(selectedMedia)) {
      setIsLoading(true);
      setIframeKey(prev => prev + 1); // Force iframe reload
      // Hide loading after a short delay (iframe should be loading by then)
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [selectedMedia]);

  // Load sound preference
  useEffect(() => {
    const savedPref = localStorage.getItem('youtube-sound-enabled');
    if (savedPref === 'true') {
      setUserWantsSound(true);
    }
  }, []);

  // Listen for YouTube player events via postMessage
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from YouTube
      if (event.origin !== 'https://www.youtube.com') return;

      try {
        const data = JSON.parse(event.data);
        
        // Detect when user unmutes the video
        if (data.event === 'onStateChange' || data.info?.muted === false || data.info?.volume > 0) {
          // User interacted with volume - save preference
          if (!userWantsSound) {
            setUserWantsSound(true);
            localStorage.setItem('youtube-sound-enabled', 'true');
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userWantsSound]);

  // Listen for YouTube player events to detect unmute
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Check if video is playing and unmuted
        if (data.info?.playerState === 1 && data.info?.muted === false) {
          if (!userWantsSound) {
            setUserWantsSound(true);
            localStorage.setItem('youtube-sound-enabled', 'true');
          }
        }
      } catch (e) {
        // Ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userWantsSound]);

  // Track video time and update subtitles
  useEffect(() => {
    if (!isYouTubeFeedItem(selectedMedia) || !selectedMedia.transcript) return;

    const interval = setInterval(() => {
      setVideoTime(prev => prev + 0.5);
    }, 500);

    return () => clearInterval(interval);
  }, [selectedMedia]);

  // Reset video time when media changes
  useEffect(() => {
    setVideoTime(0);
    setCurrentSubtitle('');
  }, [selectedMedia]);

  // Update current subtitle based on video time
  useEffect(() => {
    if (!isYouTubeFeedItem(selectedMedia)) return;
    
    if (!selectedMedia.transcript || selectedMedia.transcript.length === 0) {
      console.log('No transcript data available for this video');
      return;
    }

    const currentTime = selectedMedia.startTime + videoTime;
    const currentSegment = selectedMedia.transcript.find((seg, idx) => {
      const nextSeg = selectedMedia.transcript![idx + 1];
      return seg.time <= currentTime && (!nextSeg || nextSeg.time > currentTime);
    });

    if (currentSegment) {
      setCurrentSubtitle(currentSegment.text);
    }
  }, [videoTime, selectedMedia]);


  return (
    <div className="w-full h-full relative">
      {!selectedMedia ? (
        // Default video when nothing selected - stretched to full height
        <div className="w-full h-full bg-black relative">
          <video 
            src="/default-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      ) : isYouTubeFeedItem(selectedMedia) ? (
        // YouTube Feed Item
        <div className="w-full h-full bg-black relative">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <p className="text-white text-sm">Loading video...</p>
              </div>
            </div>
          )}

          <iframe
            key={`${selectedMedia.id}-${iframeKey}`}
            src={`https://www.youtube.com/embed/${selectedMedia.videoId}?start=${selectedMedia.startTime}&autoplay=1&mute=1&controls=1&modestbranding=1&cc_load_policy=1&cc_lang_pref=en&rel=0&playsinline=1&enablejsapi=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedMedia.title}
            onLoad={() => setIsLoading(false)}
          />
          
          {/* Custom Subtitles */}
          {currentSubtitle && !isLoading && (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 pointer-events-none">
              <div 
                className="bg-black/80 text-white px-4 py-2 text-center max-w-[90%]"
                style={{
                  fontSize: '14px',
                  lineHeight: '18px',
                  fontFamily: 'var(--font-eb-garamond)',
                }}
              >
                {currentSubtitle}
              </div>
            </div>
          )}
        </div>
      ) : isAlJazeeraFeedItem(selectedMedia) ? (
        // Al Jazeera Feed Item (from YouTube)
        <div className="w-full h-full bg-black relative">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <p className="text-white text-sm">Loading video...</p>
              </div>
            </div>
          )}

          <iframe
            key={`${selectedMedia.id}-${iframeKey}`}
            src={`${selectedMedia.embedUrl}?autoplay=1&mute=1&controls=1&modestbranding=1&cc_load_policy=1&cc_lang_pref=en&rel=0&playsinline=1&enablejsapi=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedMedia.title}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      ) : isZeteoFeedItem(selectedMedia) ? (
        // Zeteo Feed Item (from YouTube)
        <div className="w-full h-full bg-black relative">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                <p className="text-white text-sm">Loading video...</p>
              </div>
            </div>
          )}

          <iframe
            key={`${selectedMedia.id}-${iframeKey}`}
            src={`${selectedMedia.embedUrl}?autoplay=1&mute=1&controls=1&modestbranding=1&cc_load_policy=1&cc_lang_pref=en&rel=0&playsinline=1&enablejsapi=1`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; accelerometer; gyroscope; picture-in-picture"
            allowFullScreen
            title={selectedMedia.title}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      ) : (
        // Media display when selected (MediaItem)
        <div className="w-full h-full">
          {'mediaType' in selectedMedia && 
           (selectedMedia.mediaType === 'Book' || selectedMedia.mediaType === 'Document') && 
           selectedMedia.previewImage && (
            <div className="w-full h-full relative bg-gray-100">
              <Image 
                src={selectedMedia.previewImage} 
                alt={selectedMedia.author}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            </div>
          )}
          
          {'mediaType' in selectedMedia && selectedMedia.mediaType === 'Video' && selectedMedia.videoUrl && (
            <div className="w-full h-full bg-black">
              <video 
                src={selectedMedia.videoUrl}
                controls
                className="w-full h-full"
              />
            </div>
          )}
          
          {'mediaType' in selectedMedia && selectedMedia.mediaType === 'Image' && selectedMedia.images && (
            <div className="w-full h-full relative">
              <div 
                className="w-full h-full overflow-x-auto flex snap-x snap-mandatory"
                onScroll={(e) => {
                  const index = Math.round(e.currentTarget.scrollLeft / 402);
                  setCurrentImageIndex(index);
                }}
              >
                {selectedMedia.images.map((img, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                    <Image 
                      src={img.url} 
                      alt={img.caption || ''}
                      fill
                      style={{ objectFit: 'cover' }}
                      unoptimized
                    />
                  </div>
                ))}
              </div>
              {selectedMedia.images[currentImageIndex]?.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-[12px]">
                  {selectedMedia.images[currentImageIndex].caption}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

