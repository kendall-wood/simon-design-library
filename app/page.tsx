'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import MediaPreview from '@/components/MediaPreview';
import NavigationBar from '@/components/NavigationBar';
import ContentTable from '@/components/ContentTable';
import ReadingView from '@/components/ReadingView';
import VerticalFeedView from '@/components/VerticalFeedView';
import FullVideoView from '@/components/FullVideoView';
import BookletPrintModal from '@/components/BookletPrintModal';
import { MediaItem, YouTubeFeedItem, AlJazeeraFeedItem, ZeteoFeedItem, FeedItem, ViewType } from '@/types/media';
import libraryData from '@/data/library.json';
import youtubeFeedData from '@/data/youtube-feed.json';
import alJazeeraFeedData from '@/data/aljazeera-feed.json';
import zeteoFeedData from '@/data/zeteo-feed.json';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [readingMode, setReadingMode] = useState(false);
  const [currentFeedItem, setCurrentFeedItem] = useState<FeedItem | null>(null);
  const [randomizedFeed, setRandomizedFeed] = useState<FeedItem[]>([]);
  const [printingBook, setPrintingBook] = useState<MediaItem | null>(null);

  // Randomize feed when entering feed view - merge YouTube, Al Jazeera, and Zeteo
  useEffect(() => {
    if (currentView === 'feed') {
      const youtubeFeed = youtubeFeedData as YouTubeFeedItem[];
      const alJazeeraFeed = alJazeeraFeedData as AlJazeeraFeedItem[];
      const zeteoFeed = zeteoFeedData as ZeteoFeedItem[];
      
      // Shuffle all feeds
      const shuffledYouTube = [...youtubeFeed].sort(() => Math.random() - 0.5);
      const shuffledAlJazeera = [...alJazeeraFeed].sort(() => Math.random() - 0.5);
      const shuffledZeteo = [...zeteoFeed].sort(() => Math.random() - 0.5);
      
      // Interleave: 1 news video (Al Jazeera or Zeteo) every 5 YouTube videos
      const mergedFeed: FeedItem[] = [];
      let ytIndex = 0;
      let ajIndex = 0;
      let ztIndex = 0;
      
      while (ytIndex < shuffledYouTube.length || ajIndex < shuffledAlJazeera.length || ztIndex < shuffledZeteo.length) {
        // Add 5 YouTube videos
        for (let i = 0; i < 5 && ytIndex < shuffledYouTube.length; i++) {
          mergedFeed.push(shuffledYouTube[ytIndex++]);
        }
        // Alternate between Al Jazeera and Zeteo
        if (ajIndex < shuffledAlJazeera.length && (ztIndex >= shuffledZeteo.length || Math.random() > 0.5)) {
          mergedFeed.push(shuffledAlJazeera[ajIndex++]);
        } else if (ztIndex < shuffledZeteo.length) {
          mergedFeed.push(shuffledZeteo[ztIndex++]);
        }
      }
      
      setRandomizedFeed(mergedFeed);
      console.log(`📺 Feed loaded: ${youtubeFeed.length} YouTube + ${alJazeeraFeed.length} Al Jazeera + ${zeteoFeed.length} Zeteo = ${mergedFeed.length} total`);
    }
  }, [currentView]);

  // Load saved items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('simon-my-media');
    if (saved) {
      setSavedItems(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const handleSaveToMyMedia = (id: string) => {
    const newSavedItems = savedItems.includes(id)
      ? savedItems.filter(item => item !== id)
      : [...savedItems, id];
    
    setSavedItems(newSavedItems);
    localStorage.setItem('simon-my-media', JSON.stringify(newSavedItems));
  };

  // Handle print book
  const handlePrintBook = (item: MediaItem) => {
    setPrintingBook(item);
  };

  // Convert YouTube feed items to MediaItems for library display
  const getYouTubeMediaItems = (): MediaItem[] => {
    // Group feed items by videoId to get unique videos
    const videoMap = new Map<string, YouTubeFeedItem[]>();
    (youtubeFeedData as YouTubeFeedItem[]).forEach(item => {
      if (!videoMap.has(item.videoId)) {
        videoMap.set(item.videoId, []);
      }
      videoMap.get(item.videoId)!.push(item);
    });

    // Create MediaItem for each unique video
    return Array.from(videoMap.entries()).map(([videoId, clips]) => {
      const firstClip = clips[0];
      return {
        id: `youtube-${videoId}`,
        title: firstClip.title,
        author: firstClip.creator,
        year: new Date(firstClip.datePublished).getFullYear(),
        mediaType: 'Video' as const,
        description: firstClip.description,
        videoUrl: `https://youtube.com/watch?v=${videoId}`,
        previewImage: firstClip.thumbnailUrl,
        // Store clips for random preview selection
        youtubeClips: clips
      };
    });
  };

  // Filter items based on current view and search
  const getFilteredItems = (): MediaItem[] => {
    // Combine library items with YouTube videos
    let items = [...(libraryData as MediaItem[]), ...getYouTubeMediaItems()];

    // Filter by view (library or my media)
    if (currentView === 'my-media') {
      items = items.filter(item => savedItems.includes(item.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.author.toLowerCase().includes(query) ||
        item.year.toString().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    }

    return items;
  };

  const filteredItems = getFilteredItems();
  
  // Get total library count (all items without search filter)
  const totalLibraryCount = [...(libraryData as MediaItem[]), ...getYouTubeMediaItems()].length;
  
  // Get selected media from either library or YouTube videos
  const selectedMedia = selectedMediaId 
    ? [...(libraryData as MediaItem[]), ...getYouTubeMediaItems()].find(item => item.id === selectedMediaId) || null
    : null;

  // For YouTube videos, select a random clip for preview
  const getRandomClipForPreview = (item: MediaItem): YouTubeFeedItem | null => {
    if (item.youtubeClips && item.youtubeClips.length > 0) {
      const randomIndex = Math.floor(Math.random() * item.youtubeClips.length);
      return item.youtubeClips[randomIndex];
    }
    return null;
  };

  const handleSelectMedia = (id: string) => {
    setSelectedMediaId(id);
    setReadingMode(false);
  };

  const handleReadBook = (item: MediaItem) => {
    setSelectedMediaId(item.id);
    setReadingMode(true);
  };

  const handleEnterReadingMode = () => {
    if (selectedMedia && 'mediaType' in selectedMedia && 
        (selectedMedia.mediaType === 'Book' || selectedMedia.mediaType === 'Document')) {
      setReadingMode(true);
    }
  };

  const handleFeedItemChange = (item: FeedItem) => {
    setCurrentFeedItem(item);
  };

  // Clear selection when switching to library view
  useEffect(() => {
    if (currentView === 'library') {
      setSelectedMediaId(null);
    }
  }, [currentView]);

  // Determine what to show in preview
  let previewMedia: MediaItem | FeedItem | null = null;
  if (currentView === 'feed') {
    previewMedia = currentFeedItem;
  } else if (selectedMedia && selectedMedia.youtubeClips) {
    // Show random clip for YouTube videos in library
    previewMedia = getRandomClipForPreview(selectedMedia);
  } else {
    previewMedia = selectedMedia;
  }

  // Double click to enter reading mode
  useEffect(() => {
    if (selectedMedia && 'mediaType' in selectedMedia && 
        (selectedMedia.mediaType === 'Book' || selectedMedia.mediaType === 'Document')) {
      const timer = setTimeout(() => {
        // Auto-enter reading mode after selection for books and documents
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedMedia]);

  // Show reading view for books and documents
  if (readingMode && selectedMedia && 'mediaType' in selectedMedia && 
      (selectedMedia.mediaType === 'Book' || selectedMedia.mediaType === 'Document')) {
    return (
      <ReadingView 
        media={selectedMedia} 
        onBack={() => setReadingMode(false)} 
      />
    );
  }

  // Show full video view for YouTube videos
  if (readingMode && selectedMedia && selectedMedia.youtubeClips) {
    return (
      <FullVideoView 
        media={selectedMedia} 
        onBack={() => setReadingMode(false)} 
      />
    );
  }

  // Show vertical feed view
  if (currentView === 'feed') {
    return (
      <VerticalFeedView 
        feedItems={randomizedFeed}
        onBack={() => setCurrentView('library')}
      />
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Preview Area */}
      <div 
        className="w-full cursor-pointer flex-shrink-0 relative"
        style={{ height: '328px' }}
        onClick={handleEnterReadingMode}
      >
        <MediaPreview 
          selectedMedia={previewMedia}
        />
        
        {/* Navigation Bar - Overlayed at bottom of preview */}
        <div className="absolute bottom-0 left-0 right-0">
          <NavigationBar 
            currentView={currentView}
            onViewChange={setCurrentView}
            currentFeedItem={currentFeedItem}
            totalLibraryCount={totalLibraryCount}
          />
        </div>
      </div>
      
      {/* Content Area - fills remaining space, moved up to touch preview */}
      <div className="flex-1 overflow-hidden bg-white">
        <ContentTable 
          items={filteredItems}
          selectedId={selectedMediaId}
          onSelect={handleSelectMedia}
          onItemSelected={handleReadBook}
          onSaveToMyMedia={handleSaveToMyMedia}
          onPrintBook={handlePrintBook}
          savedItems={savedItems}
        />
      </div>

      {/* Print Modal */}
      {printingBook && (
        <BookletPrintModal
          media={printingBook}
          onClose={() => setPrintingBook(null)}
        />
      )}
    </div>
  );
}
