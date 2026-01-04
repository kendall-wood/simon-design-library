'use client';

import { navigationBar } from '@/config/design';
import { ViewType, FeedItem } from '@/types/media';
import { useState, useEffect } from 'react';

interface NavigationBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  currentFeedItem?: FeedItem | null;
  totalLibraryCount?: number;
}

export default function NavigationBar({ 
  currentView, 
  onViewChange,
  currentFeedItem,
  totalLibraryCount = 0
}: NavigationBarProps) {
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [shareFeedback, setShareFeedback] = useState<string>('');

  // Load liked videos from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('liked-youtube-videos');
    if (saved) {
      setLikedVideos(new Set(JSON.parse(saved)));
    }
  }, []);

  // Toggle like for current video
  const handleToggleLike = () => {
    if (!currentFeedItem) return;

    const newLiked = new Set(likedVideos);
    if (newLiked.has(currentFeedItem.id)) {
      newLiked.delete(currentFeedItem.id);
    } else {
      newLiked.add(currentFeedItem.id);
    }
    setLikedVideos(newLiked);
    localStorage.setItem('liked-youtube-videos', JSON.stringify(Array.from(newLiked)));
  };

  const handleShare = async () => {
    if (!currentFeedItem) return;
    
    // Generate URL based on source
    let url: string;
    if ('videoId' in currentFeedItem) {
      // YouTube video
      url = `https://youtube.com/watch?v=${currentFeedItem.videoId}&t=${currentFeedItem.startTime}`;
    } else {
      // Al Jazeera or Zeteo video
      url = currentFeedItem.videoUrl;
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setShareFeedback('Link copied!');
      setTimeout(() => setShareFeedback(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setShareFeedback('Failed to copy!');
      setTimeout(() => setShareFeedback(''), 2000);
    }
  };

  const isLiked = currentFeedItem ? likedVideos.has(currentFeedItem.id) : false;
  return (
    <div className="w-full">
      <div className="flex w-full">
        {currentView === 'feed' && currentFeedItem ? (
          // Feed view navigation
          <>
            {/* Back button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <button 
                  className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
                  onClick={() => onViewChange('library')}
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

            {/* My Media button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <button 
                  className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
                  onClick={() => onViewChange('my-media')}
                  style={{
                    paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                    paddingRight: `${navigationBar.buttonRightPadding}px`
                  }}
                >
                  My Media
                </button>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>

            {/* Share button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
                  style={{
                    paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                    paddingRight: `${navigationBar.buttonRightPadding}px`
                  }}
                >
                  Share
                </button>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>

            {/* Watch on Source button (YouTube or Al Jazeera) */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <a
                  href={
                    'videoId' in currentFeedItem
                      ? `https://youtube.com/watch?v=${currentFeedItem.videoId}&t=${currentFeedItem.startTime}`
                      : currentFeedItem.videoUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px] text-[#0000ff] underline"
                  style={{
                    paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                    paddingRight: `${navigationBar.buttonRightPadding}px`
                  }}
                >
                  {'videoId' in currentFeedItem 
                    ? 'Watch on YouTube' 
                    : 'source' in currentFeedItem && currentFeedItem.source === 'zeteo'
                    ? 'Watch on Zeteo'
                    : 'Watch on Al Jazeera'}
                </a>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>

            {/* Heart/Like button - fills remaining space */}
            <div className="flex-1">
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch justify-center" style={{ height: `${navigationBar.height}px` }}>
                <button
                  onClick={handleToggleLike}
                  className={`w-full flex items-center justify-center text-[20px] transition-colors ${
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
          </>
        ) : (
          // Library/My Media view navigation
          <>
            {/* Library button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <button 
                  className={`flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px] ${
                    currentView === 'library' ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => onViewChange('library')}
                  style={{
                    paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                    paddingRight: `${navigationBar.buttonRightPadding}px`
                  }}
                >
                  Library ({totalLibraryCount})
                </button>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>
            
            {/* Feed button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <button 
                  className={`flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px] ${
                    currentView === 'feed' ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => onViewChange('feed')}
                  style={{
                    paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                    paddingRight: `${navigationBar.buttonRightPadding}px`
                  }}
                >
                  Feed
                </button>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>
            
            {/* My Media button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${navigationBar.height}px` }}>
                <button 
                  className={`flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px] ${
                    currentView === 'my-media' ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => onViewChange('my-media')}
                  style={{
                    paddingLeft: `${navigationBar.buttonLeftPadding}px`,
                    paddingRight: `${navigationBar.buttonRightPadding}px`
                  }}
                >
                  My Media
                </button>
                <div className="line-thin border-r-[0.5px] -my-[0.5px]" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

