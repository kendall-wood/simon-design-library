'use client';

import { FeedItem } from '@/types/media';
import { useRef, useEffect, useState } from 'react';
import Header from '@/components/Header';
import MediaPreview from '@/components/MediaPreview';
import NavigationBar from '@/components/NavigationBar';

interface VerticalFeedViewProps {
  feedItems: FeedItem[];
  onBack?: () => void;
}

export default function VerticalFeedView({ feedItems, onBack }: VerticalFeedViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState(0); // Start with first video
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5])); // Start with more videos loaded
  const playingVideoKey = useRef(0); // Unique key for each video play session
  const userHasInteracted = useRef(false); // Track if user has interacted

  console.log('VerticalFeedView render - playingIndex:', playingIndex, 'currentIndex:', currentIndex);

  // Listen for ANY user interaction to unlock autoplay
  useEffect(() => {
    const handleInteraction = () => {
      if (!userHasInteracted.current) {
        console.log('🎯 User interaction detected - autoplay unlocked!');
        userHasInteracted.current = true;
        // Store in localStorage so it persists
        localStorage.setItem('youtube-autoplay-unlocked', 'true');
      }
    };

    // Check if already unlocked
    if (localStorage.getItem('youtube-autoplay-unlocked') === 'true') {
      userHasInteracted.current = true;
    }

    window.addEventListener('click', handleInteraction, { once: false });
    window.addEventListener('touchstart', handleInteraction, { once: false });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Track scroll direction and play next/previous video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTop = 0;
    let scrollTimeout: NodeJS.Timeout;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        console.log('⏸️ Scroll started');
      }
      
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        const currentScrollTop = container.scrollTop;
        const scrolledDown = currentScrollTop > lastScrollTop;
        
        console.log('🔄 Scroll stopped. Direction:', scrolledDown ? 'DOWN' : 'UP');
        
        let newIndex = playingIndex;
        
        if (scrolledDown && playingIndex < feedItems.length - 1) {
          // Scrolled down -> next video
          newIndex = playingIndex + 1;
          console.log('▶️ Playing NEXT video:', newIndex);
        } else if (!scrolledDown && playingIndex > 0) {
          // Scrolled up -> previous video
          newIndex = playingIndex - 1;
          console.log('▶️ Playing PREVIOUS video:', newIndex);
        }
        
        if (newIndex !== playingIndex) {
          setCurrentIndex(newIndex);
          // Increment key IMMEDIATELY to force remount
          playingVideoKey.current += 1;
          
          // Use setTimeout(0) to ensure state updates in next tick
          // This might help preserve the "user gesture" context on iOS
          setTimeout(() => {
            setPlayingIndex(newIndex);
          }, 0);
        }
        
        lastScrollTop = currentScrollTop;
      }, 100); // Reduced from 150ms to be more responsive
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [playingIndex, feedItems.length]);

  // Detect which videos should be loaded (lazy loading) - updates continuously
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndices(prev => {
          const newSet = new Set(prev);
          
          entries.forEach((entry) => {
            const index = parseInt(entry.target.getAttribute('data-video-index') || '0');
            
            if (entry.isIntersecting) {
              // Add current and adjacent videos (±3 range for smooth scrolling)
              for (let i = Math.max(0, index - 3); i <= Math.min(feedItems.length - 1, index + 3); i++) {
                newSet.add(i);
              }
            }
          });
          
          return newSet;
        });
      },
      {
        root: null,
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: '400px 0px', // Start loading 400px before visible
      }
    );

    // Observe all video elements
    const videoElements = container.querySelectorAll('[data-video-index]');
    videoElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [feedItems.length]); // Re-run when feed changes

  if (feedItems.length === 0) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[12px] text-gray-600 mb-4">
            No feed items yet. Add videos from the admin panel.
          </p>
          <a 
            href="/admin/youtube-feed" 
            className="text-[12px] text-[#0000ff] underline"
          >
            Go to YouTube Feed Manager
          </a>
        </div>
      </div>
    );
  }

  const currentItem = feedItems[currentIndex] || feedItems[0];

      return (
        <div className="w-full h-screen flex flex-col">
          {/* Fixed Header */}
          <Header
            searchQuery=""
            onSearchChange={() => {}}
          />

          {/* Fixed Navigation Bar - Only ONE for current video */}
          <NavigationBar
            currentView="feed"
            onViewChange={(view) => {
              if (view === 'library' || view === 'my-media') {
                onBack?.();
              }
            }}
            currentFeedItem={currentItem}
          />

          {/* Scrollable Feed Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-scroll"
        style={{ 
          scrollSnapType: 'y mandatory',
          scrollBehavior: 'smooth',
          scrollPaddingTop: '0px' // Snap to top since navbar is fixed
        }}
      >
        {feedItems.map((item, index) => {
          // Only render if visible or adjacent to visible
          const shouldRender = visibleIndices.has(index);
          
          return (
            <div 
              key={item.id}
              className="w-full"
              style={{ scrollSnapAlign: 'start' }}
              data-video-index={index}
            >
              {shouldRender ? (
                <>
                  {/* Video Player or Thumbnail - 16:9 aspect ratio */}
                  <div 
                    className="w-full" 
                    style={{ height: '226px' }}
                  >
                    {index === playingIndex ? (
                      <MediaPreview 
                        key={`video-${index}-${playingVideoKey.current}`}
                        selectedMedia={item} 
                        shouldAutoplay={true} 
                      />
                    ) : (
                      <div 
                        className="w-full h-full bg-black relative cursor-pointer"
                        style={{
                          backgroundImage: `url(${item.thumbnailUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                        onClick={() => {
                          console.log(`Thumbnail clicked for index ${index}`);
                          setCurrentIndex(index);
                          playingVideoKey.current += 1;
                          setPlayingIndex(index);
                        }}
                      >
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                          <div className="text-white text-4xl">▶</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Video Info - Auto height based on content */}
                  <div className="w-full border-t-[0.5px] border-black">
                    <div
                      style={{
                        paddingLeft: '24px',
                        paddingRight: '24px',
                        paddingTop: '24px',
                        paddingBottom: '24px'
                      }}
                    >
                      {/* News Badge for Al Jazeera */}
                      {'source' in item && item.source === 'aljazeera' && (
                        <div 
                          className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded text-[11px] font-medium"
                          style={{ 
                            marginBottom: '12px',
                            paddingLeft: '10px',
                            paddingRight: '12px',
                            paddingTop: '4px',
                            paddingBottom: '4px'
                          }}
                        >
                          <span className="text-[14px]">🌐</span>
                          <span>News</span>
                        </div>
                      )}

                      {/* News Badge for Zeteo */}
                      {'source' in item && item.source === 'zeteo' && (
                        <div 
                          className="inline-flex items-center gap-2 bg-blue-100 text-blue-600 rounded text-[11px] font-medium"
                          style={{ 
                            marginBottom: '12px',
                            paddingLeft: '10px',
                            paddingRight: '12px',
                            paddingTop: '4px',
                            paddingBottom: '4px'
                          }}
                        >
                          <span className="text-[14px]">🌐</span>
                          <span>News</span>
                        </div>
                      )}

                      {/* For Al Jazeera or Zeteo: Creator and Date ABOVE title */}
                      {'source' in item && (item.source === 'aljazeera' || item.source === 'zeteo') && (
                        <>
                          <div
                            className="text-[13px] leading-[16px] text-gray-600"
                            style={{ marginBottom: '4px' }}
                          >
                            {item.source === 'aljazeera' ? 'Al Jazeera' : 'Zeteo'}
                          </div>
                          <div
                            className="text-[13px] leading-[16px] text-gray-500"
                            style={{ marginBottom: '8px' }}
                          >
                            {new Date(item.datePublished).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </>
                      )}

                      {/* Title */}
                      <h3
                        className="text-[16px] font-bold leading-[20px]"
                        style={{ marginBottom: '8px' }}
                      >
                        {item.title}
                      </h3>

                      {/* For YouTube: Creator and Date BELOW title */}
                      {!('source' in item && (item.source === 'aljazeera' || item.source === 'zeteo')) && (
                        <>
                          <div
                            className="text-[13px] leading-[16px] text-gray-600"
                            style={{ marginBottom: '4px' }}
                          >
                            {'creator' in item ? item.creator : 'Unknown'}
                          </div>
                          <div
                            className="text-[13px] leading-[16px] text-gray-500"
                            style={{ marginBottom: '16px' }}
                          >
                            {new Date(item.datePublished).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </>
                      )}

                      {/* Description/Reason */}
                      <p className="text-[13px] leading-[20px]">
                        {item.reason || item.description}
                      </p>
                    </div>
                  </div>

            {/* Bottom border separator */}
            <div className="w-full border-t-[0.5px] border-black" />
                </>
              ) : (
                // Placeholder for unloaded videos
                <div style={{ height: '500px' }} className="w-full bg-gray-50 flex items-center justify-center">
                  <div className="text-gray-400 text-sm">Loading...</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

