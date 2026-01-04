import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes timeout

interface ZeteoFeedItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
  datePublished: string;
  duration: string;
  source: 'zeteo';
}

export async function POST() {
  try {
    console.log('📰 Fetching Zeteo videos from YouTube...');

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (!youtubeApiKey) {
      throw new Error('YOUTUBE_API_KEY not configured');
    }

    // Zeteo's YouTube channel ID (Mehdi Hasan's Zeteo)
    const channelId = 'UCPWXiRWZ29zrxPFIQT7eHSA';
    
    const videos: ZeteoFeedItem[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch latest videos from Zeteo's YouTube channel
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?channelId=${channelId}&part=snippet&order=date&maxResults=50&type=video&key=${youtubeApiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('YouTube API Error:', errorData);
      throw new Error(`Failed to fetch Zeteo videos: ${errorData.error?.message || response.statusText}`);
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
        id: `zeteo-${videoId}`,
        title,
        description: item.snippet.description || title,
        videoUrl,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        thumbnailUrl,
        datePublished,
        duration: 'N/A',
        source: 'zeteo',
      });
    }

    console.log(`✅ Found ${videos.length} Zeteo videos from last 7 days`);

    // Save to file
    const fs = await import('fs/promises');
    const path = await import('path');
    const feedFilePath = path.join(process.cwd(), 'data', 'zeteo-feed.json');

    // Load existing feed to avoid duplicates
    let existingFeed: ZeteoFeedItem[] = [];
    try {
      const fileContent = await fs.readFile(feedFilePath, 'utf-8');
      existingFeed = JSON.parse(fileContent);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error reading zeteo-feed.json:', error);
      }
    }

    // Filter out videos older than 7 days from existing feed
    const filteredExisting = existingFeed.filter(item => {
      const itemDate = new Date(item.datePublished);
      return itemDate >= sevenDaysAgo;
    });

    // Merge new videos with existing (avoid duplicates by ID)
    const existingIds = new Set(filteredExisting.map(item => item.id));
    const newVideos = videos.filter(video => !existingIds.has(video.id));
    
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
    console.error('❌ Error fetching Zeteo videos:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

