import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for long PDFs

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const imageFile = formData.get('image') as File | null;
    
    // Get metadata from form
    const title = formData.get('title') as string || 'Untitled';
    const author = formData.get('author') as string || 'Unknown Author';
    const year = parseInt(formData.get('year') as string) || new Date().getFullYear();
    const description = formData.get('description') as string || 'Add description here';
    let previewImage = formData.get('previewImage') as string || '/images/author.png';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Handle image upload if provided
    if (imageFile) {
      try {
        const imageBytes = await imageFile.arrayBuffer();
        const imageBuffer = Buffer.from(imageBytes);
        
        const imagesDir = path.join(process.cwd(), 'public', 'images');
        const imagePath = path.join(imagesDir, imageFile.name.toLowerCase());
        
        await fs.mkdir(imagesDir, { recursive: true });
        await fs.writeFile(imagePath, imageBuffer);
      } catch (imageError) {
        console.error('Failed to save image:', imageError);
      }
    }

    // Convert PDF to buffer and extract text
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(buffer);
    const rawText = pdfData.text;
    const totalPages = pdfData.numpages;

    console.log(`Processing ${totalPages} pages with OpenAI...`);

    // Split text into chunks (OpenAI has token limits)
    const CHUNK_SIZE = 50000; // ~50k characters per chunk
    const chunks: string[] = [];
    
    for (let i = 0; i < rawText.length; i += CHUNK_SIZE) {
      chunks.push(rawText.substring(i, i + CHUNK_SIZE));
    }

    console.log(`Split into ${chunks.length} chunks for processing...`);

    // Process each chunk with OpenAI
    let formattedContent = '';
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a text formatting expert. Format this PDF text for clean reading:

CRITICAL RULES:
1. ${i === 0 ? 'KEEP the table of contents at the start. Format it as "## Table of Contents" followed by the entries. After the TOC, continue with the main content.' : 'Continue formatting from previous chunk'}
2. Format major divisions as "# Part I", "# Part II", etc.
3. Format numbered sections as "# 1. The Instrument Of Government", "# 2. Parliaments", etc.
4. Format subsection headings with "## " prefix (ALL CAPS titles)
5. Use double line breaks (\\n\\n) between paragraphs
6. Remove ALL standalone page numbers (single numbers on their own line)
7. Fix spacing issues (e.g., "51per cent" → "51 per cent")
8. Join hyphenated words split across lines
9. Keep paragraph structure intact

OUTPUT RULES:
- Output ONLY the formatted text
- No commentary, explanations, or notes
- Start immediately with the content`
          },
          {
            role: "user",
            content: chunks[i]
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      });

      formattedContent += (response.choices[0].message.content || '') + '\n\n';
    }

    console.log('✓ OpenAI formatting complete!');

    // Detect chapters
    const chapters = detectChapters(formattedContent, totalPages);

    // Determine mediaType based on page count: >50 pages = Book, ≤50 pages = Document
    const mediaType = totalPages > 50 ? 'Book' : 'Document';

    // Generate library entry
    const libraryEntry = {
      id: Date.now().toString(),
      year: year,
      title: title,
      author: author,
      mediaType: mediaType,
      description: description,
      previewImage: previewImage,
      totalPages: totalPages,
      chapters: chapters,
      content: formattedContent.trim()
    };

    return NextResponse.json({
      success: true,
      totalPages,
      chapters,
      formattedContent: formattedContent.trim(),
      libraryJson: JSON.stringify(libraryEntry, null, 2)
    });

  } catch (error: any) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process PDF with OpenAI', 
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function detectChapters(content: string, totalPages: number) {
  const chapters = [];
  const paragraphs = content.split('\n\n');
  let chapterNumber = 0;
  let charsSoFar = 0;
  const totalChars = content.length;
  let currentPart = '';
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    
    // Detect Parts (major divisions)
    if (para.match(/^#\s*Part\s+[IVX]+/i)) {
      currentPart = para.replace('# ', '').trim();
      chapterNumber++;
      const estimatedPage = Math.max(1, Math.floor((charsSoFar / totalChars) * totalPages));
      
      chapters.push({
        number: chapterNumber,
        title: currentPart,
        startPage: estimatedPage,
        endPage: totalPages
      });
      
      if (chapters.length > 1) {
        chapters[chapters.length - 2].endPage = Math.max(1, estimatedPage - 1);
      }
    }
    // Detect numbered chapters/sections within parts (e.g., "# 1. The Instrument")
    else if (para.match(/^#\s*\d+\.?\s+/)) {
      chapterNumber++;
      const title = para.replace('# ', '').trim();
      const estimatedPage = Math.max(1, Math.floor((charsSoFar / totalChars) * totalPages));
      
      // If we're in a part, include it in the title
      const fullTitle = currentPart ? `${title}` : title;
      
      chapters.push({
        number: chapterNumber,
        title: fullTitle,
        startPage: estimatedPage,
        endPage: totalPages
      });
      
      if (chapters.length > 1) {
        chapters[chapters.length - 2].endPage = Math.max(1, estimatedPage - 1);
      }
    }
    // Detect other major headings
    else if (para.startsWith('# ') && !para.match(/table of contents/i)) {
      chapterNumber++;
      const title = para.replace('# ', '').trim();
      const estimatedPage = Math.max(1, Math.floor((charsSoFar / totalChars) * totalPages));
      
      chapters.push({
        number: chapterNumber,
        title: title,
        startPage: estimatedPage,
        endPage: totalPages
      });
      
      if (chapters.length > 1) {
        chapters[chapters.length - 2].endPage = Math.max(1, estimatedPage - 1);
      }
    }
    
    charsSoFar += para.length + 2;
  }
  
  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: 'Full Document',
      startPage: 1,
      endPage: totalPages
    });
  }
  
  return chapters;
}
