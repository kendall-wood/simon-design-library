'use client';

import { YouTubeFeedItem } from '@/types/media';
import { useState, useEffect, useRef } from 'react';
import { table } from '@/config/design';

interface FeedViewProps {
  feedItems: YouTubeFeedItem[];
  onItemChange: (item: YouTubeFeedItem) => void;
}

export default function FeedView({ feedItems, onItemChange }: FeedViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const currentItem = feedItems[currentIndex];

  useEffect(() => {
    if (currentItem) {
      onItemChange(currentItem);
    }
  }, [currentIndex, currentItem, onItemChange]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    // Swipe left - next video (threshold: 50px)
    if (diff > 50 && currentIndex < feedItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    // Swipe right - previous video
    else if (diff < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const endX = e.clientX;
    const diff = startX - endX;

    // Swipe left - next video
    if (diff > 50 && currentIndex < feedItems.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    // Swipe right - previous video
    else if (diff < -50 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
    
    setIsDragging(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && currentIndex < feedItems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, feedItems.length]);

  // Wheel/scroll navigation (horizontal)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > 30) {
        if (e.deltaX > 0 && currentIndex < feedItems.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else if (e.deltaX < 0 && currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: true });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [currentIndex, feedItems.length]);

  if (!currentItem) {
    return (
      <div className="w-full p-8 text-center">
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
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Video metadata below navigation buttons */}
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
            {currentItem.title}
          </h3>
          
          {/* Creator and Date */}
          <div 
            className="text-[13px] leading-[16px] text-gray-600"
            style={{ marginBottom: '4px' }}
          >
            {currentItem.creator}
          </div>
          <div 
            className="text-[13px] leading-[16px] text-gray-500"
            style={{ marginBottom: '20px' }}
          >
            {new Date(currentItem.datePublished).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          
          {/* Description/Reason */}
          <p 
            className="text-[13px] leading-[20px]"
            style={{ marginBottom: '40px' }}
          >
            {currentItem.reason || currentItem.description}
          </p>
          
          {/* Navigation hint and counter */}
          <div 
            className="flex items-center justify-between border-t-[0.5px] border-gray-200"
            style={{ paddingTop: '20px' }}
          >
            <span className="text-[11px] text-gray-400">
              ← → Swipe or use arrow keys
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              {currentIndex + 1} / {feedItems.length}
            </span>
          </div>
        </div>
      </div>
      
      {/* Bottom border */}
      <div className="w-full border-t-[0.5px] border-black" />
    </div>
  );
}

