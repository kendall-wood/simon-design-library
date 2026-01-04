import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Use Node.js runtime for file system access
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const newEntry = await request.json();

    // Path to library.json
    const libraryPath = path.join(process.cwd(), 'data', 'library.json');

    // Read existing library
    const fileContent = await fs.readFile(libraryPath, 'utf-8');
    const library = JSON.parse(fileContent);

    // Check if entry with same ID already exists
    const existingIndex = library.findIndex((item: any) => item.id === newEntry.id);
    
    if (existingIndex >= 0) {
      // Update existing entry
      library[existingIndex] = newEntry;
    } else {
      // Add new entry
      library.push(newEntry);
    }

    // Write back to file
    await fs.writeFile(libraryPath, JSON.stringify(library, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Book saved to library successfully',
      totalBooks: library.length
    });

  } catch (error: any) {
    console.error('Save to library error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save to library', 
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}



