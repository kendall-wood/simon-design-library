import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout

interface AlJazeeraFeedItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  datePublished: string;
  duration: string;
  source: 'aljazeera';
}

export async function POST() {
  try {
    console.log('🌍 Fetching Al Jazeera videos from YouTube...');

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      throw new Error('YOUTUBE_API_KEY not configured');
    }

    // Al Jazeera English YouTube channel ID
    const channelId = 'UCNye-wNBqNL5ZzHSJj3l8Bg';
    
    const videos: AlJazeeraFeedItem[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch latest videos from Al Jazeera's YouTube channel
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet&order=date&maxResults=50&type=video&key=${youtubeApiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API Error:', errorData);
      throw new Error(`Failed to fetch Al Jazeera videos: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    for (const item of data.items) {
      const publishedAt = new Date(item.snippet.publishedAt);
      
      // Only include videos from last 7 days
      if (publishedAt < sevenDaysAgo) continue;

      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumbnailUrl = item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url;
      const datePublished = item.snippet.publishedAt;
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

      videos.push({
        id: `aljazeera-${videoId}`,
        title,
        description: item.snippet.description || title,
        videoUrl,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl,
        datePublished,
        duration: 'N/A', // YouTube API doesn't provide duration in search results
        source: 'aljazeera',
      });
    }

    console.log(`✅ Found ${videos.length} Al Jazeera videos from last 7 days`);

    // Save to file
    const fs = await import('fs/promises');
    const path = await import('path');
    const feedFilePath = path.join(process.cwd(), 'data', 'aljazeera-feed.json');

    // Load existing feed to avoid duplicates
    let existingFeed: AlJazeeraFeedItem[] = [];
    try {
      const fileContent = await fs.readFile(feedFilePath, 'utf-8');
      existingFeed = JSON.parse(fileContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading aljazeera-feed.json:', error);
      }
    }

    // Filter out videos older than 7 days from existing feed
    const filteredExisting = existingFeed.filter(item => {
      const itemDate = new Date(item.datePublished);
      return itemDate >= sevenDaysAgo;
    });

    // Merge new videos with existing (avoid duplicates by URL)
    const existingUrls = new Set(filteredExisting.map(item => item.videoUrl));
    const newVideos = videos.filter(video => !existingUrls.has(video.videoUrl));
    
    const mergedFeed = [...filteredExisting, ...newVideos];

    // Save updated feed
    await fs.writeFile(feedFilePath, JSON.stringify(mergedFeed, null, 2));

    console.log(`💾 Saved ${mergedFeed.length} total videos (${newVideos.length} new)`);

    return NextResponse.json({
      success: true,
      total: mergedFeed.length,
      new: newVideos.length,
      videos: mergedFeed,
    });

  } catch (error) {
    console.error('❌ Error fetching Al Jazeera videos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

