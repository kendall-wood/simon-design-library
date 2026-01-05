import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes - max for Hobby plan

// Helper to extract video ID from URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Helper to extract playlist ID
function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&\n?#]+)/);
  return match ? match[1] : null;
}

// Helper to extract channel handle (e.g., @profjiangclips)
function extractChannelHandle(url: string): string | null {
  const match = url.match(/youtube\.com\/@([^/\n?#]+)/);
  return match ? match[1] : null;
}

// Helper to extract channel ID from /channel/ or /c/ URLs
function extractChannelId(url: string): string | null {
  const patterns = [
    /youtube\.com\/channel\/([^/\n?#]+)/,
    /youtube\.com\/c\/([^/\n?#]+)/,
    /youtube\.com\/user\/([^/\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    // Check if it's a playlist
    const playlistId = extractPlaylistId(url);
    if (playlistId) {
      const highlights = await handlePlaylist(playlistId);
      return NextResponse.json({ highlights });
    }
    
    // Check if it's a channel (handle or ID)
    const channelHandle = extractChannelHandle(url);
    const channelId = extractChannelId(url);
    if (channelHandle || channelId) {
      const highlights = await handleChannel(channelHandle || channelId!, channelHandle ? 'handle' : 'id');
      return NextResponse.json({ highlights });
    }
    
    // Single video
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Supported: video, playlist, or channel URLs' },
        { status: 400 }
      );
    }
    
    const highlights = await analyzeVideo(videoId);
    return NextResponse.json({ highlights });
    
  } catch (error) {
    console.error('Error analyzing video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze video' },
      { status: 500 }
    );
  }
}

async function analyzeVideo(videoId: string) {
  // Check if this video already exists in the feed
  const fs = await import('fs/promises');
  const path = await import('path');
  try {
    const feedPath = path.join(process.cwd(), 'data', 'youtube-feed.json');
    const feedData = await fs.readFile(feedPath, 'utf-8');
    const existingFeed = JSON.parse(feedData);
    const alreadyExists = existingFeed.some((item: any) => item.videoId === videoId);
    
    if (alreadyExists) {
      console.log(`Video ${videoId} already exists in feed, skipping...`);
      return []; // Return empty array to skip this video
    }
  } catch (err) {
    // Feed file doesn't exist yet, that's okay
    console.log('Feed file not found or error reading, continuing...');
  }

  // 1. Fetch video metadata from YouTube API
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  const metadataResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${youtubeApiKey}`
  );
  
  if (!metadataResponse.ok) {
    const errorData = await metadataResponse.json().catch(() => ({}));
    console.error('YouTube API Error (video metadata):', errorData);
    throw new Error(`Failed to fetch video metadata: ${errorData.error?.message || metadataResponse.statusText}`);
  }
  
  const metadataData = await metadataResponse.json();
  const video = metadataData.items?.[0];
  
  if (!video) {
    throw new Error('Video not found');
  }
  
  // 2. Fetch transcript
  let transcript;
  try {
    transcript = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (error) {
    console.log('No transcript available, using default highlight');
    // If no transcript, return a default highlight at the beginning
    return [{
      id: `${videoId}-0`,
      videoId,
      title: video.snippet.title,
      creator: video.snippet.channelTitle,
      datePublished: video.snippet.publishedAt.split('T')[0],
      description: video.snippet.description.slice(0, 200) + '...',
      thumbnailUrl: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
      startTime: 0,
      duration: 30,
      confidence: 0.5,
      reason: 'Opening segment (no transcript available for AI analysis)',
    }];
  }
  
  // 3. Analyze transcript with AI
  const highlights = await analyzeTranscriptWithAI(
    transcript,
    video.snippet.title,
    videoId,
    video.snippet
  );
  
  return highlights;
}

async function analyzeTranscriptWithAI(
  transcript: any[],
  title: string,
  videoId: string,
  snippet: any
) {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  if (!openaiApiKey) {
    // Fallback: return first 30 seconds if no OpenAI key
    return [{
      id: `${videoId}-0`,
      videoId,
      title: snippet.title,
      creator: snippet.channelTitle,
      datePublished: snippet.publishedAt.split('T')[0],
      description: snippet.description.slice(0, 200) + '...',
      thumbnailUrl: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
      startTime: 0,
      duration: 30,
      confidence: 0.5,
      reason: 'Opening segment (OpenAI not configured)',
    }];
  }

  // Prepare transcript text with timestamps
  const transcriptText = transcript
    .map(entry => `[${Math.floor(entry.offset / 1000)}s] ${entry.text}`)
    .join('\n');
  
  // Call OpenAI to analyze
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing video transcripts to find the most engaging, stimulating, and valuable segments. Look for:
- Key insights or revelations
- Emotional peaks or compelling storytelling
- Surprising information or plot twists
- Actionable advice or practical tips
- Entertaining or humorous moments
- Climactic points or conclusions
- Distinct topic changes or new concepts

IMPORTANT: Extract MULTIPLE clips when appropriate:
- For long videos (20+ min): Find 3-6 highlights
- For medium videos (10-20 min): Find 2-4 highlights  
- For short videos (<10 min): Find 1-3 highlights
- Each highlight should be DISTINCT and cover different topics/moments
- Spread highlights throughout the video, not clustered together
- Avoid overlapping segments

Return highlights as a JSON object with this structure:
{
  "highlights": [
    {
      "startTime": number (in seconds),
      "duration": number (30-60 seconds),
      "reason": "brief explanation of why this segment is engaging",
      "confidence": number (0-1, how confident you are this is engaging)
    }
  ]
}

Each segment should be at least 30 seconds long. Prioritize VARIETY and DISTRIBUTION across the video.`
        },
        {
          role: 'user',
          content: `Video: "${title}"\n\nTranscript:\n${transcriptText.slice(0, 12000)}\n\nFind the most engaging segments (minimum 30 seconds each).`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  
  if (!openaiResponse.ok) {
    throw new Error('OpenAI API request failed');
  }
  
  const aiData = await openaiResponse.json();
  const analysis = JSON.parse(aiData.choices[0].message.content);
  
  // Get transcript segments for this highlight
  const getTranscriptForHighlight = (startTime: number, duration: number) => {
    const endTime = startTime + duration;
    return transcript.filter(entry => {
      const entryTime = entry.offset / 1000;
      return entryTime >= startTime && entryTime <= endTime;
    }).map(entry => ({
      time: Math.floor(entry.offset / 1000),
      text: entry.text
    }));
  };

  // Format highlights
  const highlights = analysis.highlights.map((h: any, idx: number) => ({
    id: `${videoId}-${idx}`,
    videoId,
    title: snippet.title,
    creator: snippet.channelTitle,
    datePublished: snippet.publishedAt.split('T')[0],
    description: h.reason || snippet.description.slice(0, 200) + '...',
    thumbnailUrl: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
    startTime: Math.floor(h.startTime),
    duration: Math.max(30, Math.floor(h.duration || 30)),
    confidence: h.confidence || 0.8,
    reason: h.reason,
    transcript: getTranscriptForHighlight(Math.floor(h.startTime), Math.max(30, Math.floor(h.duration || 30))),
  }));
  
  return highlights;
}

async function handlePlaylist(playlistId: string) {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  // Fetch playlist videos
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${playlistId}&part=snippet&maxResults=500&key=${youtubeApiKey}`
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('YouTube API Error:', errorData);
    throw new Error(`Failed to fetch playlist: ${errorData.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  // Process all videos from the playlist
  const allHighlights = [];
  const videosToProcess = data.items; // Process all videos, not just first 10
  
  console.log(`Processing ${videosToProcess.length} videos from playlist...`);
  
  for (const item of videosToProcess) {
    try {
      const videoId = item.snippet.resourceId.videoId;
      const highlights = await analyzeVideo(videoId);
      // Take ALL highlights from each video (AI will return multiple if appropriate)
      allHighlights.push(...highlights);
    } catch (error) {
      console.error(`Failed to analyze video in playlist:`, error);
      // Continue with other videos
    }
  }
  
  return allHighlights;
}

async function handleChannel(channelIdentifier: string, type: 'handle' | 'id') {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY not configured');
  }

  let channelId: string;

  // If it's a handle, resolve it to a channel ID first
  if (type === 'handle') {
    const handleResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channelIdentifier}&key=${youtubeApiKey}`
    );
    
    if (!handleResponse.ok) {
      const errorData = await handleResponse.json().catch(() => ({}));
      console.error('YouTube API Error (handle resolution):', errorData);
      throw new Error(`Failed to resolve channel handle: ${errorData.error?.message || handleResponse.statusText}`);
    }
    
    const handleData = await handleResponse.json();
    if (!handleData.items || handleData.items.length === 0) {
      throw new Error(`Channel handle @${channelIdentifier} not found`);
    }
    
    channelId = handleData.items[0].id;
    console.log(`Resolved @${channelIdentifier} to channel ID: ${channelId}`);
  } else {
    channelId = channelIdentifier;
  }

  // Get the channel's uploads playlist ID
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
  );
  
  if (!channelResponse.ok) {
    const errorData = await channelResponse.json().catch(() => ({}));
    console.error('YouTube API Error (channel metadata):', errorData);
    throw new Error(`Failed to fetch channel: ${errorData.error?.message || channelResponse.statusText}`);
  }
  
  const channelData = await channelResponse.json();
  if (!channelData.items || channelData.items.length === 0) {
    throw new Error('Channel not found');
  }
  
  const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error('Channel has no uploads playlist');
  }
  
  console.log(`Found uploads playlist for channel: ${uploadsPlaylistId}`);
  
  // Fetch videos from the uploads playlist (limit to 750 videos)
  // Note: YouTube API limits to 50 results per page, so we need pagination
  const CHANNEL_VIDEO_LIMIT = 750;
  let allVideos: any[] = [];
  let nextPageToken: string | undefined = undefined;
  
  do {
    // Calculate how many more videos we need
    const remaining = CHANNEL_VIDEO_LIMIT - allVideos.length;
    if (remaining <= 0) break;
    
    const maxResults = Math.min(50, remaining); // YouTube API max is 50 per page
    const playlistUrl: string = `https://www.googleapis.com/youtube/v3/playlistItems?playlistId=${uploadsPlaylistId}&part=snippet&maxResults=${maxResults}&key=${youtubeApiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    
    const playlistResponse = await fetch(playlistUrl);
    
    if (!playlistResponse.ok) {
      const errorData = await playlistResponse.json().catch(() => ({}));
      console.error('YouTube API Error (playlist items):', errorData);
      throw new Error(`Failed to fetch channel videos: ${errorData.error?.message || playlistResponse.statusText}`);
    }
    
    const playlistData = await playlistResponse.json();
    const newVideos = playlistData.items || [];
    
    // Add videos up to the limit
    const videosToAdd = newVideos.slice(0, remaining);
    allVideos.push(...videosToAdd);
    
    nextPageToken = playlistData.nextPageToken;
    
    console.log(`Fetched ${allVideos.length} videos so far (limit: ${CHANNEL_VIDEO_LIMIT})...`);
    
    // Stop if we've reached the limit or there are no more pages
    if (allVideos.length >= CHANNEL_VIDEO_LIMIT || !nextPageToken) break;
  } while (nextPageToken);
  
  console.log(`Processing ${allVideos.length} videos from channel (limited to ${CHANNEL_VIDEO_LIMIT})...`);
  
  // Process all videos from the channel
  const allHighlights = [];
  
  for (const item of allVideos) {
    try {
      const videoId = item.snippet.resourceId.videoId;
      const highlights = await analyzeVideo(videoId);
      // Take ALL highlights from each video (AI will return multiple if appropriate)
      allHighlights.push(...highlights);
    } catch (error) {
      console.error(`Failed to analyze video in channel:`, error);
      // Continue with other videos
    }
  }
  
  return allHighlights;
}

