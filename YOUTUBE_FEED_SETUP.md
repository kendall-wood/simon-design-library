# YouTube Feed Setup Guide

## Overview

The YouTube Feed feature allows you to create a TikTok-style feed of engaging video clips from YouTube. The system automatically analyzes videos using AI to find the most stimulating 30+ second segments.

## Features

- 🎥 **Automatic Highlight Detection**: AI analyzes video transcripts to find engaging moments
- 📱 **Swipeable Feed**: Vertical scrolling feed (swipe, arrow keys, or mouse wheel)
- 🎬 **Embedded Playback**: Videos play directly in your existing preview window
- 📊 **Metadata Display**: Shows title, creator, date, and description below the video
- 🎯 **Playlist Support**: Analyze entire YouTube playlists at once

## Setup Instructions

### 1. Get API Keys

#### YouTube Data API v3 (Required)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "YouTube Data API v3"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

#### OpenAI API Key (Recommended)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Copy your API key

**Note**: Without OpenAI, the system will use fallback behavior (first 30 seconds of videos). With OpenAI, you get intelligent segment detection (~$0.01 per video).

### 2. Configure Environment Variables

Create a `.env.local` file in the `app-src` directory:

```bash
# YouTube Data API v3 Key
YOUTUBE_API_KEY=your_youtube_api_key_here

# OpenAI API Key (optional but recommended)
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

## How to Use

### Adding Videos to Your Feed

1. Navigate to `/admin/youtube-feed` or click the link from `/admin`
2. Paste a YouTube video URL or playlist URL
3. Click "Analyze"
4. Wait for AI to process the video (usually 10-30 seconds)
5. Review the suggested highlights
6. Click "Preview" to watch any segment on YouTube
7. Remove any highlights you don't want
8. Click "Save All to Feed" to add them

### Viewing the Feed

1. Go to the main page (`/`)
2. Click the "Feed" button in the navigation bar
3. Videos will play automatically in the preview window
4. Swipe up/down, use arrow keys, or scroll with mouse wheel to navigate
5. Video metadata appears below the navigation buttons

## How AI Analysis Works

The system uses a multi-step process:

1. **Fetch Metadata**: Gets video title, creator, date from YouTube API
2. **Download Transcript**: Fetches the video's closed captions/transcript
3. **AI Analysis**: GPT-4o-mini analyzes the transcript looking for:
   - Key insights or revelations
   - Emotional peaks or compelling storytelling
   - Surprising information
   - Actionable advice
   - Entertaining moments
   - Climactic points
4. **Return Highlights**: AI suggests 2-4 engaging segments with timestamps and confidence scores

## File Structure

```
app-src/
├── app/
│   ├── admin/
│   │   └── youtube-feed/
│   │       └── page.tsx          # YouTube Feed Manager UI
│   ├── api/
│   │   └── youtube/
│   │       ├── analyze/
│   │       │   └── route.ts      # Video analysis API
│   │       └── save-feed/
│   │           └── route.ts      # Save highlights API
│   └── page.tsx                  # Main page (updated)
├── components/
│   ├── FeedView.tsx              # Swipeable feed component
│   ├── MediaPreview.tsx          # Updated to support YouTube
│   └── NavigationBar.tsx         # Updated with Feed button
├── data/
│   └── youtube-feed.json         # Stored feed items
└── types/
    └── media.ts                  # Updated with YouTubeFeedItem type
```

## Troubleshooting

### "Invalid YouTube URL"
- Make sure you're pasting a valid YouTube video or playlist URL
- Supported formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID`

### "Failed to analyze video"
- Check that your API keys are correctly set in `.env.local`
- Verify the video has closed captions/transcript available
- Some videos may not have transcripts (system will use fallback)

### "No feed items yet"
- You need to add videos through the YouTube Feed Manager first
- Navigate to `/admin/youtube-feed` and analyze some videos

### Videos not playing
- Check browser console for errors
- Ensure the video allows embedding (some videos are restricted)
- Try a different video

## Cost Considerations

- **YouTube API**: Free tier includes 10,000 quota units/day (enough for ~100 videos)
- **OpenAI API**: GPT-4o-mini costs ~$0.01 per video analyzed
- **Total**: Analyzing 100 videos ≈ $1.00

## Tips for Best Results

1. **Choose engaging content**: Educational, entertaining, or storytelling videos work best
2. **Use playlists**: Analyze entire playlists to quickly build your feed
3. **Review before saving**: Always preview highlights to ensure quality
4. **Curate your feed**: Remove low-quality segments before saving
5. **Mix content types**: Variety keeps the feed interesting

## Future Enhancements

Potential improvements you could add:

- User likes/favorites for feed items
- Share feed items
- Filter by creator or topic
- Auto-refresh feed with new content
- Custom timestamp editing
- Download/save video clips
- Analytics on most-watched segments

