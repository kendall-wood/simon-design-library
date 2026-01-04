'use client';

import { useState, useMemo } from 'react';
import { MediaItem } from '@/types/media';
import jsPDF from 'jspdf';
import { typography, header, table, mediaPreview } from '@/config/design';

interface BookletPrintModalProps {
  media: MediaItem;
  onClose: () => void;
}

export default function BookletPrintModal({ media, onClose }: BookletPrintModalProps) {
  const [printMode, setPrintMode] = useState<'simple'>('simple'); // Default to simple (binder clip)
  const [bodyTextSize, setBodyTextSize] = useState(12); // Default 12pt for print
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0); // Which pair of pages to show (0 = cover, 1 = pages 1-2, etc.)

  // Parse chapters from content (same logic as ReadingView)
  const parsedChapters = (): Array<{ number: number; title: string; content: string }> => {
    if (!media.content) return [];
    const chapters: Array<{ number: number; title: string; content: string }> = [];
    const sections = media.content.split(/(?=^#{1,2} )/m);
    
    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.startsWith('# ') || firstLine.startsWith('## ')) {
          const title = firstLine.replace(/^#{1,2} /, '').trim();
          const content = lines.slice(1).join('\n').trim();
          chapters.push({ number: index, title, content });
        }
      }
    });
    
    if (chapters.length === 0 && media.content.trim()) {
      chapters.push({ number: 0, title: 'Full Text', content: media.content });
    }
    
    return chapters;
  };

  const chapters = parsedChapters();

  // Calculate book pages with proper formatting
  const generateBookPages = () => {
    const pages: Array<{ 
      type: 'cover' | 'blank' | 'toc' | 'content'; 
      content?: string; 
      pageNumber?: number; 
      chapterTitle?: string 
    }> = [];
    
    // Page 1: Cover
    pages.push({ type: 'cover' });
    
    // Page 2: Blank (inside cover)
    pages.push({ type: 'blank' });
    
    // Page 3: Table of Contents
    pages.push({ type: 'toc' });
    
    // Pages 4+: Content - Flow all chapters continuously for print optimization
    let pageNumber = 1;
    
    // Characters per page calculation to fill to bottom margin without exceeding it
    // Page dimensions: 8.5"×11" with 0.25" margins = 8"×10.5" content area
    // But we need to account for header/footer space
    
    // Available vertical space calculation:
    // - Chapter title: 12pt + spacing = 0.35" total
    // - Bottom page number: 0.35" reserved space
    // - Usable content height: 10.5" - 0.35" - 0.35" = 9.8"
    const availableHeightInches = 10.5 - 0.35 - 0.35; // 9.8 inches
    const availableHeightPoints = availableHeightInches * 72; // ~705 points
    
    // Calculate maximum lines that fit in available content height
    const lineHeightPoints = bodyTextSize * 1.4; // Line height in points
    const maxLinesPerPage = Math.floor(availableHeightPoints / lineHeightPoints);
    
    // Calculate characters per line for Xanh Mono (monospace)
    // Xanh Mono character width is approximately 0.6em
    const contentWidthPoints = 8 * 72; // 576 points (full width between margins)
    const charWidthPoints = bodyTextSize * 0.6;
    const maxCharsPerLine = Math.floor(contentWidthPoints / charWidthPoints);
    
    // Calculate total characters per page
    // Use 0.90 factor to account for paragraph breaks and ensure no cutoff
    const CHARS_PER_PAGE = Math.floor(maxLinesPerPage * maxCharsPerLine * 0.90);
    
    console.log(`[Pagination] ${bodyTextSize}pt: ${maxLinesPerPage} lines × ${maxCharsPerLine} chars/line = ${CHARS_PER_PAGE} chars/page`);
    
    
    // Combine all chapters into one continuous flow with *** separators
    let allContent = '';
    chapters.forEach((chapter, idx) => {
      // Add chapter heading
      allContent += `# ${chapter.title}\n\n`;
      // Add chapter content
      allContent += chapter.content;
      // Add *** separator between chapters (not after last one)
      if (idx < chapters.length - 1) {
        allContent += '\n\n***\n\n';
      }
    });
    
    // Now paginate the continuous content by characters, not paragraphs
    let currentPageContent = '';
    let currentChapterTitle = chapters[0]?.title || '';
    
    // Split into paragraphs but keep flowing
    const paragraphs = allContent.split('\n\n').filter(p => p.trim());
    
    for (const para of paragraphs) {
      // Check if this paragraph is a chapter heading
      if (para.startsWith('# ')) {
        currentChapterTitle = para.replace(/^# /, '').trim();
        // Don't include chapter headings in the content, just track for header
        continue;
      }
      
      // Calculate space needed for this paragraph (including newlines)
      const paraWithSpacing = (currentPageContent ? '\n\n' : '') + para;
      
      // If adding this paragraph exceeds the limit, create a new page
      if (currentPageContent && (currentPageContent.length + paraWithSpacing.length > CHARS_PER_PAGE)) {
        pages.push({
          type: 'content',
          content: currentPageContent.trim(),
          pageNumber: pageNumber++,
          chapterTitle: currentChapterTitle
        });
        currentPageContent = para; // Start new page with this paragraph
      } else {
        // Add to current page
        currentPageContent += paraWithSpacing;
      }
    }
    
    // Add final page if there's remaining content
    if (currentPageContent.trim()) {
      pages.push({
        type: 'content',
        content: currentPageContent.trim(),
        pageNumber: pageNumber++,
        chapterTitle: currentChapterTitle
      });
    }
    
    // Add blank pages to make total divisible by 4 (for saddle stitch)
    while (pages.length % 4 !== 0) {
      pages.push({ type: 'blank' });
    }
    
    return pages;
  };

  const bookPages = useMemo(() => generateBookPages(), [chapters, bodyTextSize]);
  const canUseSaddleStitch = bookPages.length <= 64; // ~60 pages safe limit

  // Get preview pages based on current index
  const getPreviewPages = () => {
    if (previewPageIndex === 0) {
      // Cover page (single page on left, blank on right)
      return {
        left: bookPages[0],
        right: null,
        label: 'Cover'
      };
    }
    
    // Regular pages (pairs)
    const leftIndex = previewPageIndex * 2 - 1;
    const rightIndex = previewPageIndex * 2;
    
    const leftPage = bookPages[leftIndex] || null;
    const rightPage = bookPages[rightIndex] || null;
    
    // Determine label based on page types
    let label = '';
    if (leftPage?.type === 'toc') {
      label = 'TOC';
    } else if (leftPage?.type === 'blank' && rightPage?.type === 'toc') {
      label = 'TOC';
    } else if (leftPage?.type === 'content' || rightPage?.type === 'content') {
      // Show page range for content pages with "Pages" prefix
      const leftNum = leftPage?.pageNumber || '';
      const rightNum = rightPage?.pageNumber || '';
      if (leftNum && rightNum) {
        label = `Pages ${leftNum}-${rightNum}`;
      } else if (leftNum) {
        label = `Page ${leftNum}`;
      } else if (rightNum) {
        label = `Page ${rightNum}`;
      }
    }
    
    return {
      left: leftPage,
      right: rightPage,
      label
    };
  };

  const currentPreviewPages = getPreviewPages();
  const maxPreviewIndex = Math.min(8, Math.ceil(bookPages.length / 2)); // Show up to 16 pages (8 pairs)

  const handlePrevPage = () => {
    if (previewPageIndex > 0) {
      setPreviewPageIndex(previewPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (previewPageIndex < maxPreviewIndex - 1) {
      setPreviewPageIndex(previewPageIndex + 1);
    }
  };

  // Render page content based on type
  const renderPageContent = (page: any, scale: number) => {
    if (!page) {
      return <div className="text-center text-gray-400 text-xs">Blank</div>;
    }

    if (page.type === 'cover') {
      return (
        <>
          <div 
            className="flex-1 flex flex-col items-center justify-center"
            style={{ padding: `${48 * scale}px ${32 * scale}px` }}
          >
            {/* Walking SVG - bigger */}
            <img 
              src="/images/walking.svg"
              alt="Walking figure"
              className="mb-6"
              style={{ 
                height: `${60 * scale}px`,
                width: 'auto',
                marginBottom: `${24 * scale}px`
              }}
            />
            
            <div 
              className="text-center font-bold mb-6"
              style={{ 
                fontSize: `${28 * scale}px`, 
                lineHeight: `${34 * scale}px`,
                marginBottom: `${20 * scale}px`,
                fontFamily: 'var(--font-eb-garamond)'
              }}
            >
              {media.title}
            </div>
            <div 
              className="text-center mb-8"
              style={{ 
                fontSize: `${18 * scale}px`,
                marginBottom: `${32 * scale}px`,
                fontFamily: 'var(--font-eb-garamond)'
              }}
            >
              {media.author}
            </div>
          </div>
          {/* Bottom section with smaller SVG and library text */}
          <div 
            className="flex flex-col items-center"
            style={{ paddingBottom: `${24 * scale}px` }}
          >
            <img 
              src="/images/walking.svg"
              alt="Walking figure"
              style={{ 
                height: `${16 * scale}px`,
                width: 'auto',
                marginBottom: `${8 * scale}px`
              }}
            />
            <div 
              className="text-center text-gray-600"
              style={{ 
                fontSize: `${8 * scale}px`,
                fontFamily: 'var(--font-xanh-mono)',
                letterSpacing: '0.1em'
              }}
            >
              SIMON DESIGN LIBRARY
            </div>
          </div>
        </>
      );
    }

    if (page.type === 'toc') {
      return (
        <>
          <div 
            className="text-center mb-2 font-bold flex-shrink-0"
            style={{ 
              fontSize: `${10 * scale}px`,
              fontFamily: 'var(--font-xanh-mono)'
            }}
          >
            Contents
          </div>
          <div 
            className="text-left flex-1 overflow-hidden"
            style={{ 
              fontSize: `${bodyTextSize * scale * 0.7}px`, // TOC uses 70% of body text size
              fontFamily: 'var(--font-xanh-mono)',
              lineHeight: `${bodyTextSize * scale * 0.7 * 1.5}px`
            }}
          >
            {chapters.map((ch, idx) => (
              <div key={idx} className="mb-1">{idx + 1}. {ch.title}</div>
            ))}
          </div>
        </>
      );
    }

    if (page.type === 'content') {
      return (
        <>
          <div 
            className="text-center mb-1 text-gray-600 flex-shrink-0"
            style={{ 
              fontSize: `${12 * scale}px`,
              fontFamily: 'var(--font-xanh-mono)'
            }}
          >
            {page.chapterTitle}
          </div>
          <div 
            className="text-left flex-1 overflow-hidden"
            style={{ 
              fontSize: `${bodyTextSize * scale}px`,
              lineHeight: `${bodyTextSize * scale * 1.4}px`,
              fontFamily: 'var(--font-xanh-mono)',
              whiteSpace: 'pre-wrap'
            }}
          >
            {/* Render content as-is with proper handling of *** separators */}
            {(page.content || '').split('\n\n').map((para, idx) => {
              if (para.trim() === '***') {
                return (
                  <div 
                    key={idx}
                    className="text-center text-gray-600"
                    style={{ 
                      margin: `${16 * scale}px 0`,
                      fontSize: `${bodyTextSize * scale}px`
                    }}
                  >
                    ***
                  </div>
                );
              }
              return (
                <div 
                  key={idx}
                  style={{ marginBottom: `${8 * scale}px` }}
                >
                  {para}
                </div>
              );
            })}
          </div>
          {page.pageNumber && (
            <div 
              className="text-gray-600 flex-shrink-0 mt-1"
              style={{ 
                fontSize: `${9 * scale}px`,
                fontFamily: 'var(--font-xanh-mono)'
              }}
            >
              {page.pageNumber}
            </div>
          )}
        </>
      );
    }

    return null;
  };

  // Calculate saddle stitch page order
  const getSaddleStitchOrder = () => {
    const sheets: Array<[number, number, number, number]> = [];
    const totalPages = bookPages.length;
    
    for (let i = 0; i < totalPages / 4; i++) {
      const sheet: [number, number, number, number] = [
        totalPages - (i * 2) - 1,     // Front right
        i * 2,                         // Front left
        i * 2 + 1,                     // Back left
        totalPages - (i * 2) - 2       // Back right
      ];
      sheets.push(sheet);
    }
    
    return sheets;
  };

  const generatePDF = async (mode: 'booklet' | 'simple') => {
    setIsGenerating(true);
    
    try {
      const pdf = new jsPDF({
        orientation: mode === 'booklet' ? 'landscape' : 'portrait',
        unit: 'in',
        format: 'letter'
      });

      if (mode === 'booklet') {
        const sheets = getSaddleStitchOrder();
        
        for (let sheetIdx = 0; sheetIdx < sheets.length; sheetIdx++) {
          const [frontRight, frontLeft, backLeft, backRight] = sheets[sheetIdx];
          
          if (sheetIdx > 0) pdf.addPage();
          
          // Render front of sheet (2 pages side by side)
          await renderPageToPDF(pdf, bookPages[frontLeft], 0.25, 0.25, 5.25, 8, 'left');
          await renderPageToPDF(pdf, bookPages[frontRight], 5.75, 0.25, 5.25, 8, 'right');
          
          // Add back of sheet
          pdf.addPage();
          await renderPageToPDF(pdf, bookPages[backLeft], 0.25, 0.25, 5.25, 8, 'left');
          await renderPageToPDF(pdf, bookPages[backRight], 5.75, 0.25, 5.25, 8, 'right');
        }
      } else {
        // Simple mode: one page per sheet, front and back
        for (let i = 0; i < bookPages.length; i++) {
          if (i > 0) pdf.addPage();
          await renderPageToPDF(pdf, bookPages[i], 0.25, 0.25, 8, 10.5, 'center');
        }
      }

      // Open PDF in new window for printing instead of downloading
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        // Fallback if popup blocked
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${media.title.replace(/[^a-z0-9]/gi, '_')}_booklet.pdf`;
        link.click();
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderPageToPDF = async (
    pdf: jsPDF,
    page: any,
    x: number,
    y: number,
    width: number,
    height: number,
    align: 'left' | 'right' | 'center'
  ) => {
    // Render page content based on type
    const marginX = 0.25;
    const marginY = 0.25;
    const contentX = x + marginX;
    const contentY = y + marginY;
    const contentWidth = width - (marginX * 2);
    const contentHeight = height - (marginY * 2);

    pdf.setFont('helvetica');

    if (page.type === 'cover') {
      // Cover page with bigger text and more padding
      pdf.setFontSize(32);
      pdf.setFont('times', 'bold');
      
      // Title (centered vertically with more padding)
      const titleLines = pdf.splitTextToSize(media.title, contentWidth - 1.5);
      const titleHeight = titleLines.length * 0.45;
      const titleY = contentY + (contentHeight / 2) - titleHeight + 0.5;
      pdf.text(titleLines, contentX + (contentWidth / 2), titleY, { align: 'center' });
      
      // Author
      pdf.setFontSize(18);
      pdf.setFont('times', 'normal');
      pdf.text(media.author, contentX + (contentWidth / 2), titleY + titleHeight + 0.75, { align: 'center' });
      
      // Bottom section: "SIMON DESIGN LIBRARY" with more spacing
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const libraryText = 'SIMON DESIGN LIBRARY';
      const bottomY = contentY + contentHeight - 0.5;
      
      // Calculate letter spacing for stretched text
      const textWidth = contentWidth * 0.5;
      const charSpacing = textWidth / libraryText.length;
      
      // Draw text with character spacing at bottom
      let textX = contentX + (contentWidth / 2) - (textWidth / 2);
      for (let i = 0; i < libraryText.length; i++) {
        pdf.text(libraryText[i], textX + (i * charSpacing), bottomY);
      }
      
    } else if (page.type === 'toc') {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Table of Contents', contentX + (contentWidth / 2), contentY + 0.5, { align: 'center' });
      
      pdf.setFontSize(bodyTextSize);
      pdf.setFont('helvetica', 'normal');
      let tocY = contentY + 1;
      
      chapters.forEach((chapter, idx) => {
        if (tocY < contentY + contentHeight - 0.5) {
          pdf.text(`${idx + 1}. ${chapter.title}`, contentX + 0.25, tocY);
          tocY += 0.25;
        }
      });
      
    } else if (page.type === 'content') {
      // Chapter content with *** separators between paragraphs
      pdf.setFontSize(bodyTextSize);
      pdf.setFont('helvetica', 'normal');
      
      const lineHeight = (bodyTextSize / 72) * 1.4; // 1.4 line height multiplier in inches
      
      // Chapter name at top (if exists) - always 12pt
      let currentY = contentY;
      if (page.chapterTitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        const truncatedTitle = page.chapterTitle.length > 40 
          ? page.chapterTitle.substring(0, 37) + '...' 
          : page.chapterTitle;
        pdf.text(truncatedTitle, contentX + (contentWidth / 2), currentY + 0.2, { align: 'center' });
        currentY += 0.35; // Space after chapter title (accounts for 12pt height)
        pdf.setFontSize(bodyTextSize);
        pdf.setFont('helvetica', 'normal');
      } else {
        currentY += 0.15; // Small top padding if no chapter title
      }
      
      // Calculate bottom Y boundary (leave room for page number)
      // Make sure we have enough space for one full line before the page number
      const bottomY = contentY + contentHeight - 0.35;
      
      // Split by paragraph breaks
      const paragraphs = (page.content || '').split('\n\n');
      
      paragraphs.forEach((para, paraIdx) => {
        if (!para.trim()) return;
        
        // Check if this is a separator
        if (para.trim() === '***') {
          if (currentY + (lineHeight * 2) < bottomY) {
            currentY += lineHeight * 0.5;
            pdf.setFontSize(bodyTextSize);
            pdf.text('***', contentX + (contentWidth / 2), currentY, { align: 'center' });
            currentY += lineHeight * 1.5;
          }
          return;
        }
        
        // Render paragraph - use proper content width for text wrapping
        const lines = pdf.splitTextToSize(para, contentWidth - 0.2);
        lines.forEach((line: string) => {
          // Strictly enforce bottom margin - check if NEXT line would exceed
          // This ensures current line is fully visible
          if (currentY < bottomY) {
            pdf.text(line, contentX + 0.1, currentY);
            currentY += lineHeight;
          }
        });
        
        // Small space between paragraphs (but not after separators)
        if (paraIdx < paragraphs.length - 1 && para.trim() !== '***') {
          currentY += lineHeight * 0.3;
        }
      });
      
      // Page number at bottom
      if (page.pageNumber) {
        pdf.setFontSize(9);
        pdf.text(
          `${page.pageNumber}`,
          align === 'left' ? contentX + 0.25 : contentX + contentWidth - 0.25,
          contentY + contentHeight - 0.2,
          { align: align === 'left' ? 'left' : 'right' }
        );
      }
    }
    // Blank pages render nothing
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="w-full sticky top-0 bg-white z-10">
        <div className="w-full line-thin border-t-[0.5px]" />
        
        <div 
          className="flex items-end px-[16px]"
          style={{ 
            paddingTop: `${header.verticalPadding}px`,
            paddingBottom: 0
          }}
        >
          <img 
            src="/images/walking.svg"
            alt="Walking figure"
            className="flex-shrink-0"
            style={{ 
              height: `${header.blueSquareSize}px`,
              width: 'auto'
            }}
          />
          
          <h1 
            style={{ 
              fontFamily: 'var(--font-eb-garamond)',
              fontSize: `${typography.headerSize}px`,
              lineHeight: '1',
              marginLeft: `${header.gapBetweenSquareAndText}px`,
              whiteSpace: 'nowrap',
              paddingBottom: 0
            }}
          >
            Simon Design Library
          </h1>
        </div>
        
        <div className="w-full line-thin border-t-[0.5px]" />
      </header>

      {/* Preview Area */}
      <div className="relative" style={{ height: `${mediaPreview.height + table.headerHeight}px` }}>
        <div 
          className="w-full h-full bg-gray-50 flex items-center justify-center p-4"
        >
          {/* Page Preview - Shows actual paper orientation and layout */}
          {printMode === 'simple' ? (
            /* Binder Clip: Two portrait pages side-by-side (as they'd look when bound) */
            /* Scale: Real 8.5"×11" (612px×792px at 72dpi), preview 160px×207px per page = ~26% scale */
            <div className="flex" style={{ gap: '0px' }}>
              {/* Cover is single portrait page */}
              {previewPageIndex === 0 ? (
                <div 
                  className="bg-white shadow-2xl relative flex flex-col"
                  style={{
                    width: '160px',
                    height: '207px',
                    padding: '16px 12px',
                    fontFamily: 'var(--font-xanh-mono)'
                  }}
                >
                  {renderPageContent(currentPreviewPages.left, 0.26)}
                </div>
              ) : (
                <>
                  {/* Left page */}
                  <div 
                    className="bg-white shadow-2xl relative flex flex-col"
                    style={{
                      width: '160px',
                      height: '207px',
                      padding: '16px 12px',
                      fontFamily: 'var(--font-xanh-mono)',
                      borderRight: '0.5px solid #0000ff'
                    }}
                  >
                    {renderPageContent(currentPreviewPages.left, 0.26)}
                  </div>

                  {/* Right page */}
                  <div 
                    className="bg-white shadow-2xl relative flex flex-col"
                    style={{
                      width: '160px',
                      height: '207px',
                      padding: '16px 12px',
                      fontFamily: 'var(--font-xanh-mono)'
                    }}
                  >
                    {renderPageContent(currentPreviewPages.right, 0.26)}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Saddle Stitch: Landscape 11"×8.5" paper with two pages side-by-side */
            /* This is ONE SHEET with 2 book pages on it */
            /* Scale: Real 11"×8.5" (792px×612px at 72dpi), preview 380px×294px = ~48% scale */
            previewPageIndex === 0 ? (
              /* Cover is single portrait page for saddle stitch too */
              <div 
                className="bg-white shadow-2xl relative flex flex-col"
                style={{
                  width: '235px',
                  height: '304px',
                  padding: '20px 16px',
                  fontFamily: 'var(--font-xanh-mono)'
                }}
              >
                {renderPageContent(currentPreviewPages.left, 0.48)}
              </div>
            ) : (
              <div 
                className="bg-white shadow-2xl relative flex"
                style={{
                  width: '380px',
                  height: '294px',
                  padding: '20px 16px',
                  fontFamily: 'var(--font-xanh-mono)'
                }}
              >
                {/* Left page (half of sheet) */}
                <div 
                  className="flex-1 flex flex-col"
                  style={{
                    paddingRight: '14px',
                    marginRight: '14px',
                    borderRight: '0.5px solid #0000ff'
                  }}
                >
                  {renderPageContent(currentPreviewPages.left, 0.48)}
                </div>

                {/* Right page (half of sheet) */}
                <div 
                  className="flex-1 flex flex-col"
                  style={{
                    paddingLeft: '14px'
                  }}
                >
                  {renderPageContent(currentPreviewPages.right, 0.48)}
                </div>
              </div>
            )
          )}
        </div>

        {/* Back Button - Top left */}
        <div className="absolute top-0 left-0 z-10">
          <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
            <button
              onClick={onClose}
              className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
              style={{
                fontFamily: 'var(--font-xanh-mono)',
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
            >
              ← Back
            </button>
            <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
          </div>
          <div className="w-full line-thin border-t-[0.5px]" />
        </div>

        {/* Navigation Arrows - Bottom left */}
        <div className="absolute bottom-0 left-0 z-10 inline-flex">
          <div className="flex">
            {/* Left Arrow */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
                <button 
                  onClick={handlePrevPage}
                  disabled={previewPageIndex === 0}
                  className="flex items-center justify-center text-[12px] leading-[12px] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'var(--font-xanh-mono)',
                    paddingLeft: '16px',
                    paddingRight: '16px'
                  }}
                >
                  ←
                </button>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>
            
            {/* Page Label */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
                <div 
                  className="flex items-center justify-center text-[12px] leading-[12px]"
                  style={{
                    fontFamily: 'var(--font-xanh-mono)',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    minWidth: '80px'
                  }}
                >
                  {currentPreviewPages.label}
                </div>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>
            
            {/* Right Arrow */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
                <button 
                  onClick={handleNextPage}
                  disabled={previewPageIndex >= maxPreviewIndex - 1}
                  className="flex items-center justify-center text-[12px] leading-[12px] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'var(--font-xanh-mono)',
                    paddingLeft: '16px',
                    paddingRight: '16px'
                  }}
                >
                  →
                </button>
                <div className="line-thin border-r-[0.5px] -my-[0.5px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div>
            {/* Title */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Book Title
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                {media.title}
              </div>
            </div>

            {/* Author */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Author
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                {media.author}
              </div>
            </div>

            {/* Binding Method */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Binding Method *
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 flex gap-4 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="simple"
                    checked={printMode === 'simple'}
                    onChange={() => setPrintMode('simple')}
                  />
                  <span>Binder Clip</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="booklet"
                    checked={printMode === 'booklet'}
                    onChange={() => setPrintMode('booklet')}
                    disabled={!canUseSaddleStitch}
                  />
                  <span className={!canUseSaddleStitch ? 'text-gray-400' : ''}>
                    Saddle Stitch {!canUseSaddleStitch && '(Too many pages)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Text Size */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Body Text Size
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 flex items-center gap-4 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                <input
                  type="range"
                  min="10"
                  max="32"
                  value={bodyTextSize}
                  onChange={(e) => setBodyTextSize(parseInt(e.target.value))}
                  className="flex-1 max-w-xs"
                />
                <span>{bodyTextSize}pt</span>
              </div>
            </div>

            {/* Total Pages */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Total Pages
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                {bookPages.length}
              </div>
            </div>

            {/* Sheets Needed */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Sheets Needed
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                {printMode === 'booklet' ? (
                  <>
                    <span style={{ color: bookPages.length > 50 ? '#ef4444' : 'inherit' }}>
                      {Math.ceil(bookPages.length / 4)}
                    </span>
                    {' (4 pages per sheet)'}
                  </>
                ) : (
                  <>
                    <span style={{ color: bookPages.length > 50 ? '#ef4444' : 'inherit' }}>
                      {Math.ceil(bookPages.length / 2)}
                    </span>
                    {' (2 pages per sheet)'}
                  </>
                )}
              </div>
            </div>

            {/* Paper Size */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="flex items-center">
              <div 
                className="text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  width: '140px',
                  paddingLeft: '16px',
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                Paper Size
              </div>
              <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              <div
                className="flex-1 text-[12px] leading-[14px]"
                style={{ 
                  fontFamily: 'var(--font-xanh-mono)',
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding + 3}px`,
                  paddingBottom: `${table.rowVerticalPadding + 3}px`
                }}
              >
                8.5" × 11" {printMode === 'booklet' ? 'Landscape' : 'Portrait'}
              </div>
            </div>

            {/* Download Button */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div 
              className="flex items-center justify-center"
              style={{ 
                paddingTop: `${table.rowVerticalPadding + 8}px`,
                paddingBottom: `${table.rowVerticalPadding + 8}px`
              }}
            >
              <button
                onClick={() => generatePDF(printMode)}
                disabled={isGenerating || (!canUseSaddleStitch && printMode === 'booklet')}
                className="text-[12px] leading-[12px] px-[32px] py-[8px] bg-white text-black hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                style={{ fontFamily: 'var(--font-xanh-mono)' }}
              >
                {isGenerating ? 'Generating PDF...' : 'Print'}
              </button>
            </div>
            <div className="w-full line-thin border-t-[0.5px]" />
          </div>
      </div>
    </div>
  );
}

