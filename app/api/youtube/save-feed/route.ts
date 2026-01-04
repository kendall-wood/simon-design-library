import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { highlights } = await request.json();
    
    if (!highlights || !Array.isArray(highlights)) {
      return NextResponse.json(
        { error: 'Invalid highlights data' },
        { status: 400 }
      );
    }
    
    // Read existing feed
    const feedPath = path.join(process.cwd(), 'data', 'youtube-feed.json');
    let existingFeed = [];
    
    try {
      const feedData = await fs.readFile(feedPath, 'utf-8');
      existingFeed = JSON.parse(feedData);
    } catch (error) {
      // File doesn't exist yet or is empty, that's okay
      console.log('Creating new feed file');
    }
    
    // Merge and deduplicate by ID
    const mergedFeed = [...existingFeed, ...highlights];
    const uniqueFeed = Array.from(
      new Map(mergedFeed.map(item => [item.id, item])).values()
    );
    
    // Save back to file
    await fs.writeFile(feedPath, JSON.stringify(uniqueFeed, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      count: uniqueFeed.length,
      added: highlights.length 
    });
  } catch (error) {
    console.error('Error saving feed:', error);
    return NextResponse.json(
      { error: 'Failed to save feed' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve current feed
export async function GET() {
  try {
    const feedPath = path.join(process.cwd(), 'data', 'youtube-feed.json');
    const feedData = await fs.readFile(feedPath, 'utf-8');
    const feed = JSON.parse(feedData);
    
    return NextResponse.json({ feed, count: feed.length });
  } catch (error) {
    return NextResponse.json({ feed: [], count: 0 });
  }
}

