import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Use Node.js runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File;
    const imageFile = formData.get('image') as File | null;
    const outputName = formData.get('outputName') as string;
    
    // Get metadata from form
    const title = formData.get('title') as string || outputName;
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
        
        // Save to public/images directory
        const imagesDir = path.join(process.cwd(), 'public', 'images');
        const imagePath = path.join(imagesDir, imageFile.name.toLowerCase());
        
        // Ensure images directory exists
        await fs.mkdir(imagesDir, { recursive: true });
        
        // Write image file
        await fs.writeFile(imagePath, imageBuffer);
        
        console.log(`✓ Image saved to: ${imagePath}`);
      } catch (imageError) {
        console.error('Failed to save image:', imageError);
        // Continue processing even if image save fails
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Import pdf-parse v1.x (default export is the function)
    const pdfParse = require('pdf-parse');
    
    // Parse PDF page by page to track content location
    const pageTexts: string[] = [];
    let totalPages = 0;
    
    const data = await pdfParse(buffer, {
      max: 0,
      pagerender: async (pageData: any) => {
        const textContent = await pageData.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        pageTexts.push(pageText);
        return pageText;
      }
    });

    totalPages = data.numpages;
    const rawText = data.text;

    // Advanced text cleaning and formatting
    function cleanAndFormatText(text: string): string {
      let cleaned = text;
      
      // 1. Normalize line breaks and spaces
      cleaned = cleaned.replace(/\r\n/g, '\n');
      cleaned = cleaned.replace(/[ \t]{2,}/g, ' ');
      
      // 2. Fix hyphenated words across lines
      cleaned = cleaned.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2');
      
      // 3. Fix spacing issues
      cleaned = cleaned.replace(/(\d+)([A-Za-z])/g, '$1 $2'); // "51per" -> "51 per"
      cleaned = cleaned.replace(/([a-z])(\d+)/g, '$1 $2');
      
      // 4. Process line by line
      const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const processedLines: string[] = [];
      let inTableOfContents = false;
      let skipUntilMainContent = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1] || '';
        
        // Detect TOC start
        if (line.match(/^(Contents|Table of Contents|CONTENTS)$/i)) {
          inTableOfContents = true;
          skipUntilMainContent = true;
          continue;
        }
        
        // Skip everything until we hit Part/Chapter (end of TOC)
        if (skipUntilMainContent) {
          if (line.match(/^Part\s+[IVX]+$/i) || line.match(/^Chapter\s+[IVX0-9]+/i)) {
            skipUntilMainContent = false;
            inTableOfContents = false;
            // Continue to process this line as a heading
          } else {
            continue; // Skip TOC content
          }
        }
        
        // Remove standalone page numbers
        if (line.match(/^\d{1,3}$/)) continue;
        
        // Remove page number pairs
        if (line.match(/^\d+\s+\d+$/)) continue;
        
        // Detect Part headings (e.g., "Part I", "Part II")
        if (line.match(/^Part\s+[IVX]+$/i)) {
          processedLines.push('');
          processedLines.push('');
          processedLines.push('# ' + line);
          processedLines.push('');
          continue;
        }
        
        // Detect chapter/section numbers (e.g., "1", "2", "3" when followed by a title)
        if (line.match(/^\d+$/) && nextLine && nextLine.match(/^[A-Z]/)) {
          processedLines.push('');
          processedLines.push('');
          processedLines.push(`# ${line}. ${nextLine}`);
          processedLines.push('');
          i++; // Skip next line since we combined it
          continue;
        }
        
        // Detect chapter titles that include "CHAPTER X."
        if (line.match(/CHAPTER\s+\d+\.\s+/i)) {
          processedLines.push('');
          processedLines.push('');
          processedLines.push('# ' + line);
          processedLines.push('');
          continue;
        }
        
        // Detect ALL CAPS section headings (but not too long)
        if (line === line.toUpperCase() && line.length > 5 && line.length < 100 && line.match(/^[A-Z\s]+$/)) {
          processedLines.push('');
          processedLines.push('## ' + line);
          processedLines.push('');
          continue;
        }
        
        // Join lines that are part of the same paragraph
        // A new paragraph starts if:
        // - Previous line ended with period, question mark, or exclamation
        // - Current line starts with capital letter
        if (processedLines.length > 0) {
          const lastLine = processedLines[processedLines.length - 1];
          
          // If last line doesn't end with punctuation and current line doesn't start with capital,
          // it's probably a continuation
          if (lastLine && !lastLine.match(/[.!?]$/) && !line.match(/^[A-Z]/)) {
            processedLines[processedLines.length - 1] = lastLine + ' ' + line;
            continue;
          }
          
          // If last line ends with comma or lowercase, join with current
          if (lastLine && (lastLine.match(/,$/) || lastLine.match(/[a-z]$/)) && !line.match(/^[A-Z]/)) {
            processedLines[processedLines.length - 1] = lastLine + ' ' + line;
            continue;
          }
        }
        
        // Add as new line/paragraph
        processedLines.push(line);
      }
      
      // Join with double line breaks for paragraphs
      let result = processedLines.join('\n\n');
      
      // Clean up excessive spacing
      result = result.replace(/\n{4,}/g, '\n\n\n');
      
      return result.trim();
    }

    const formattedContent = cleanAndFormatText(rawText);

    // Detect chapters from formatted content
    function detectChapters(content: string, totalPages: number) {
      const chapters = [];
      const paragraphs = content.split('\n\n');
      let chapterNumber = 0;
      let charsSoFar = 0;
      const totalChars = content.length;
      
      for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i].trim();
        
        // Look for lines marked as major headings (# prefix)
        if (para.startsWith('# ')) {
          chapterNumber++;
          const title = para.replace('# ', '').trim();
          
          // Estimate page based on character position
          const estimatedPage = Math.max(1, Math.floor((charsSoFar / totalChars) * totalPages));
          
          chapters.push({
            number: chapterNumber,
            title: title,
            startPage: estimatedPage,
            endPage: totalPages // Will be updated with next chapter
          });
          
          // Update previous chapter's end page
          if (chapters.length > 1) {
            chapters[chapters.length - 2].endPage = Math.max(1, estimatedPage - 1);
          }
        }
        
        charsSoFar += para.length + 2; // +2 for \n\n
      }
      
      // If no chapters detected, create a single chapter
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

    const chapters = detectChapters(formattedContent, totalPages);

    // Determine mediaType based on page count: >50 pages = Book, ≤50 pages = Document
    const mediaType = totalPages > 50 ? 'Book' : 'Document';

    // Generate library.json entry with user-provided metadata
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
      content: formattedContent
    };

    return NextResponse.json({
      success: true,
      totalPages,
      chapters,
      formattedContent,
      rawText,
      libraryJson: JSON.stringify(libraryEntry, null, 2)
    });

  } catch (error: any) {
    console.error('PDF processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process PDF', 
        details: error?.message || 'Unknown error',
        stack: error?.stack
      },
      { status: 500 }
    );
  }
}
