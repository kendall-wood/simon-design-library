export type MediaType = 'Book' | 'Document' | 'Video' | 'Image';
export type ViewType = 'library' | 'feed' | 'my-media';

export interface MediaItem {
  id: string;
  year: number;
  title: string;
  author: string;
  mediaType: MediaType;
  description: string;
  // For books
  content?: string; // Markdown content
  chapters?: Chapter[];
  totalPages?: number;
  // For photos
  images?: ImageData[];
  // For videos
  videoUrl?: string;
  // Thumbnail/preview
  previewImage?: string;
  // For YouTube videos with multiple clips
  youtubeClips?: YouTubeFeedItem[];
}

export interface Chapter {
  number: number;
  title: string;
  startPage: number;
  endPage: number;
}

export interface ImageData {
  url: string;
  caption?: string;
}

// YouTube Feed Types
export interface YouTubeFeedItem {
  id: string;
  videoId: string; // YouTube video ID
  title: string;
  creator: string;
  datePublished: string;
  description: string;
  thumbnailUrl: string;
  // Most engaging section
  startTime: number; // in seconds
  duration: number; // clip duration (30+ seconds)
  confidence?: number; // AI confidence score (0-1)
  reason?: string; // Why this segment is engaging
  transcript?: TranscriptSegment[]; // Subtitle data
  source?: 'youtube'; // Source identifier
}

export interface TranscriptSegment {
  time: number; // timestamp in seconds
  text: string; // subtitle text
}

// Al Jazeera Feed Types
export interface AlJazeeraFeedItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // Full video page URL
  embedUrl: string; // Embed URL (same as videoUrl for Al Jazeera)
  thumbnailUrl: string;
  datePublished: string;
  duration: string; // Format: "MM:SS"
  source: 'aljazeera'; // Source identifier
}

// Zeteo Feed Types
export interface ZeteoFeedItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string; // Full video page URL
  embedUrl: string; // Embed URL
  thumbnailUrl: string;
  datePublished: string;
  duration: string;
  source: 'zeteo'; // Source identifier
}

// Union type for all feed items
export type FeedItem = YouTubeFeedItem | AlJazeeraFeedItem | ZeteoFeedItem;

