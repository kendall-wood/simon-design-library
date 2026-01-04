'use client';

import { MediaItem } from '@/types/media';
import { useState, useMemo, useEffect, useRef } from 'react';
import { readingView, typography, header } from '@/config/design';
import BookletPrintModal from './BookletPrintModal';

interface ReadingViewProps {
  media: MediaItem;
  onBack: () => void;
}

type PageType = 'title' | 'toc' | 'chapter';

interface Page {
  type: PageType;
  number: number;
  chapterNumber?: number;
  chapterTitle?: string;
}

export default function ReadingView({ media, onBack }: ReadingViewProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showChapterNav, setShowChapterNav] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [showHighlightOptions, setShowHighlightOptions] = useState(false);
  const [showHighlightList, setShowHighlightList] = useState(false);
  const [showTypeSizeOptions, setShowTypeSizeOptions] = useState(false);
  const [showBookmarkDropdown, setShowBookmarkDropdown] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [textSize, setTextSize] = useState(14);
  const [bookmarkedPages, setBookmarkedPages] = useState<Set<number>>(new Set());
  const [highlights, setHighlights] = useState<Map<string, Array<{text: string, id: string}>>>(new Map());
  const [highlightIdCounter, setHighlightIdCounter] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Ref for content container to reset scroll position
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Parse chapters from content
  const parsedChapters = useMemo(() => {
    if (!media.content) return [];
    
    const chapters: Array<{
      number: number;
      title: string;
      content: string;
    }> = [];
    
    // Split content by chapter markers (# ) OR section markers (## )
    // This handles both main chapters and subsections as separate pages
    const sections = media.content.split(/(?=^#{1,2} )/m);
    
    sections.forEach((section, index) => {
      const lines = section.trim().split('\n');
      if (lines.length > 0) {
        const firstLine = lines[0];
        // Match both # and ## as chapter markers
        if (firstLine.startsWith('# ') || firstLine.startsWith('## ')) {
          const title = firstLine.replace(/^#{1,2} /, '').trim();
          const content = lines.slice(1).join('\n').trim();
          chapters.push({
            number: index,
            title,
            content
          });
        }
      }
    });
    
    // FALLBACK: If no markdown chapters found, treat entire content as one chapter
    // (Even if chapter metadata exists in library.json, we need the content to be properly formatted)
    if (chapters.length === 0 && media.content.trim()) {
      chapters.push({
        number: 0,
        title: 'Full Text',
        content: media.content
      });
    }
    
    return chapters;
  }, [media.content]);

  // NEW: Paginate content into screen-sized pages
  const paginatedPages = useMemo(() => {
    const CHARS_PER_PAGE = 2000; // ~2000 characters per page (adjustable)
    const allPages: Array<{
      type: 'title' | 'toc' | 'content';
      chapterTitle?: string;
      chapterNumber?: number;
      content?: string;
      pageNumber: number;
    }> = [];
    
    // Page 1: Title
    allPages.push({ type: 'title', pageNumber: 1 });
    
    // Page 2: TOC
    allPages.push({ type: 'toc', pageNumber: 2 });
    
    // Page 3+: Content pages
    parsedChapters.forEach((chapter, chapterIdx) => {
      // Split chapter content into paragraphs
      const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
      
      let currentPageContent = '';
      let currentChapterStarted = false;
      
      paragraphs.forEach((para, paraIdx) => {
        // If this would exceed page size, save current page and start new one
        if (currentPageContent.length + para.length > CHARS_PER_PAGE && currentPageContent.length > 0) {
          allPages.push({
            type: 'content',
            chapterTitle: chapter.title,
            chapterNumber: chapterIdx,
            content: currentPageContent.trim(),
            pageNumber: allPages.length + 1
          });
          currentPageContent = '';
          currentChapterStarted = true;
        }
        
        // Add chapter title on first page of chapter
        if (!currentChapterStarted && paraIdx === 0) {
          currentPageContent = `# ${chapter.title}\n\n${para}\n\n`;
          currentChapterStarted = true;
        } else {
          currentPageContent += para + '\n\n';
        }
      });
      
      // Add remaining content as final page of chapter
      if (currentPageContent.trim()) {
        allPages.push({
          type: 'content',
          chapterTitle: chapter.title,
          chapterNumber: chapterIdx,
          content: currentPageContent.trim(),
          pageNumber: allPages.length + 1
        });
      }
    });
    
    return allPages;
  }, [parsedChapters]);

  // Build page structure: Title Page -> TOC -> Paginated Content
  const pages: Page[] = useMemo(() => {
    return paginatedPages.map((page, idx) => ({
      type: page.type === 'content' ? 'chapter' : page.type,
      number: page.pageNumber,
      chapterNumber: page.chapterNumber,
      chapterTitle: page.chapterTitle
    }));
  }, [paginatedPages]);

  const currentPage = pages[currentPageIndex];
  const currentPageData = paginatedPages[currentPageIndex];
  const totalPages = pages.length;

  // Get current chapter name for footer
  const currentChapterName = useMemo(() => {
    if (currentPage.type === 'title') return 'Title Page';
    if (currentPage.type === 'toc') return 'Contents';
    if (currentPage.type === 'chapter' && currentPage.chapterNumber !== undefined) {
      return parsedChapters[currentPage.chapterNumber]?.title || '';
    }
    return '';
  }, [currentPage, parsedChapters]);

  const handleNext = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
    setShowChapterNav(false);
  };

  const handleTextSizeIncrease = () => {
    setTextSize(prev => Math.min(prev + 2, 36));
  };

  const handleTextSizeDecrease = () => {
    setTextSize(prev => Math.max(prev - 2, 12));
  };

  const toggleBookmark = () => {
    const newBookmarks = new Set(bookmarkedPages);
    
    // If current page is bookmarked, remove it
    if (newBookmarks.has(currentPageIndex)) {
      newBookmarks.delete(currentPageIndex);
      setBookmarkedPages(newBookmarks);
      setShowBookmarkDropdown(false);
    } 
    // If there's already a bookmark on another page, show dropdown
    else if (hasOtherBookmark) {
      setShowBookmarkDropdown(!showBookmarkDropdown);
    }
    // No other bookmarks, just bookmark this page
    else {
      newBookmarks.add(currentPageIndex);
      setBookmarkedPages(newBookmarks);
      setShowBookmarkDropdown(false);
    }
  };

  const isBookmarked = bookmarkedPages.has(currentPageIndex);
  const hasOtherBookmark = Array.from(bookmarkedPages).some(pageIdx => pageIdx !== currentPageIndex);
  
  // Get the other bookmarked page info
  const getOtherBookmarkInfo = () => {
    const otherBookmarkIndex = Array.from(bookmarkedPages).find(pageIdx => pageIdx !== currentPageIndex);
    if (otherBookmarkIndex !== undefined) {
      const page = pages[otherBookmarkIndex];
      return {
        pageIndex: otherBookmarkIndex,
        pageNumber: page?.number || otherBookmarkIndex + 1,
        chapterName: page?.type === 'title' ? 'Title Page' : 
                     page?.type === 'toc' ? 'Contents' : 
                     page?.chapterTitle || 'Chapter'
      };
    }
    return null;
  };

  const goToBookmarkedPage = () => {
    const otherBookmark = getOtherBookmarkInfo();
    if (otherBookmark) {
      setCurrentPageIndex(otherBookmark.pageIndex);
      setShowBookmarkDropdown(false);
    }
  };

  const removeOtherBookmark = () => {
    const otherBookmarkIndex = Array.from(bookmarkedPages).find(pageIdx => pageIdx !== currentPageIndex);
    if (otherBookmarkIndex !== undefined) {
      const newBookmarks = new Set(bookmarkedPages);
      newBookmarks.delete(otherBookmarkIndex);
      setBookmarkedPages(newBookmarks);
      
      // Now bookmark the current page
      newBookmarks.add(currentPageIndex);
      setBookmarkedPages(newBookmarks);
      setShowBookmarkDropdown(false);
    }
  };

  // Handle text selection for highlighting or removing
  const handleTextSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (removeMode) {
      // Remove mode: check if clicked on highlighted text
      const target = e.target as HTMLElement;
      const mark = target.closest('mark');
      
      if (mark) {
        const highlightId = mark.getAttribute('data-highlight-id');
        if (highlightId) {
          const pageKey = `page-${currentPageIndex}`;
          const newHighlights = new Map(highlights);
          const pageHighlights = newHighlights.get(pageKey) || [];
          
          // Remove the highlight with this ID
          const filteredHighlights = pageHighlights.filter(h => h.id !== highlightId);
          newHighlights.set(pageKey, filteredHighlights);
          setHighlights(newHighlights);
        }
      }
      return;
    }
    
    if (!highlightMode) return;
    
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;
    
    const selectedText = selection.toString().trim();
    const pageKey = `page-${currentPageIndex}`;
    
    // Create unique highlight with ID
    const highlightId = `highlight-${highlightIdCounter}`;
    setHighlightIdCounter(highlightIdCounter + 1);
    
    const newHighlights = new Map(highlights);
    const pageHighlights = newHighlights.get(pageKey) || [];
    pageHighlights.push({ text: selectedText, id: highlightId });
    newHighlights.set(pageKey, pageHighlights);
    setHighlights(newHighlights);
    
    // Clear selection
    selection.removeAllRanges();
  };

  // Remove the most recent highlight
  const handleRemoveLastHighlight = () => {
    const pageKey = `page-${currentPageIndex}`;
    const newHighlights = new Map(highlights);
    const pageHighlights = newHighlights.get(pageKey) || [];
    
    if (pageHighlights.length > 0) {
      pageHighlights.pop(); // Remove last highlight
      newHighlights.set(pageKey, pageHighlights);
      setHighlights(newHighlights);
    }
  };

  // Toggle remove mode
  const handleToggleRemoveMode = () => {
    setRemoveMode(!removeMode);
    if (!removeMode) {
      setHighlightMode(false); // Turn off highlight mode when entering remove mode
    }
  };

  // Get all highlights across all pages with page numbers
  const getAllHighlights = () => {
    const allHighlights: Array<{text: string, pageIndex: number, pageNumber: number}> = [];
    highlights.forEach((pageHighlights, pageKey) => {
      const pageIndex = parseInt(pageKey.replace('page-', ''));
      const pageNumber = pages[pageIndex]?.number || pageIndex + 1;
      pageHighlights.forEach(highlight => {
        allHighlights.push({
          text: highlight.text,
          pageIndex,
          pageNumber
        });
      });
    });
    return allHighlights;
  };

  // Navigate to a highlighted text's page
  const goToHighlightPage = (pageIndex: number) => {
    setCurrentPageIndex(pageIndex);
    setShowHighlightList(false);
  };

  // Handle scroll progress for vertical progress bar
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    setScrollProgress(progress);
  };

  // Reset scroll progress and scroll position when page changes
  useEffect(() => {
    setScrollProgress(0);
    // Reset scroll position to top
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }
  }, [currentPageIndex]);

  // Render Title Page
  const renderTitlePage = () => (
    <div className="flex-1 flex flex-col items-center justify-center">
      <h1 
        className="text-center font-bold mb-8"
        style={{ 
          fontSize: '28px',
          lineHeight: '32px',
          fontFamily: 'var(--font-eb-garamond)',
          paddingLeft: '32px',
          paddingRight: '32px'
        }}
      >
        {media.title}
      </h1>
      <p 
        className="text-center"
        style={{ 
          fontSize: '18px',
          lineHeight: '24px',
          fontFamily: 'var(--font-eb-garamond)'
        }}
      >
        {media.author}
      </p>
    </div>
  );

  // Render Table of Contents
  const renderTableOfContents = () => (
    <div 
      className="flex-1 overflow-y-auto"
      style={{
        paddingLeft: `${readingView.bodyPaddingHorizontal}px`,
        paddingRight: `${readingView.bodyPaddingHorizontal + 24}px`, // More inset from right
        paddingTop: `${readingView.bodyPaddingVertical}px`,
        paddingBottom: `${readingView.bodyPaddingVertical}px`,
      }}
    >
      <h2 
        className="font-bold text-center"
        style={{ 
          fontSize: '20px',
          lineHeight: '24px',
          fontFamily: 'var(--font-eb-garamond)',
          marginBottom: '24px'
        }}
      >
        Contents
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {parsedChapters.map((chapter, index) => {
          // Find the first page that belongs to this chapter
          const chapterPageIndex = paginatedPages.findIndex(
            page => page.type === 'content' && page.chapterNumber === index
          );
          
          // Get the actual page number from that page
          const pageNumber = chapterPageIndex >= 0 ? paginatedPages[chapterPageIndex].pageNumber : index + 3;
          
          return (
            <button
              key={chapter.number}
              onClick={() => goToPage(chapterPageIndex)}
              className="w-full text-left hover:bg-gray-50 py-2 px-2 rounded"
            >
              <div 
                className="flex justify-between items-start"
                style={{ fontFamily: 'var(--font-xanh-mono)' }}
              >
                <span 
                  className="flex-1 pr-4"
                  style={{ 
                    fontSize: '14px',
                    lineHeight: '20px'
                  }}
                >
                  {chapter.title}
                </span>
                <span 
                  className="text-gray-500"
                  style={{ 
                    fontSize: '12px',
                    lineHeight: '20px'
                  }}
                >
                  {pageNumber}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Chapter Content (now paginated, no scroll)
  const renderChapterContent = () => {
    if (!currentPageData || currentPageData.type !== 'content') return null;
    
    const pageHighlights = highlights.get(`page-${currentPageIndex}`) || [];
    
    // Split content into paragraphs
    const paragraphs = (currentPageData.content || '').split('\n\n').filter(p => p.trim());

    // Function to apply highlights to text
    const applyHighlights = (text: string, paragraphIndex: number) => {
      if (pageHighlights.length === 0) return text;
      
      let result = text;
      let offset = 0;
      
      pageHighlights.forEach((highlight, hIndex) => {
        const searchText = highlight.text;
        const foundIndex = text.indexOf(searchText);
        
        if (foundIndex !== -1) {
          const beforeHighlight = result.substring(0, foundIndex + offset);
          const highlightedText = result.substring(foundIndex + offset, foundIndex + offset + searchText.length);
          const afterHighlight = result.substring(foundIndex + offset + searchText.length);
          
          const markTag = `<mark data-highlight-id="${highlight.id}" style="background-color: #0000ff; color: white; padding: 2px 0;">${highlightedText}</mark>`;
          result = beforeHighlight + markTag + afterHighlight;
          
          offset += markTag.length - searchText.length;
        }
      });
      
      return result;
    };

    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div 
          ref={contentContainerRef}
          className="flex-1 flex flex-col"
          style={{
            paddingLeft: `${readingView.bodyPaddingHorizontal}px`,
            paddingRight: `${readingView.bodyPaddingHorizontal + 24}px`,
            paddingTop: `${readingView.bodyPaddingVertical}px`,
            paddingBottom: `${readingView.bodyPaddingVertical}px`,
            userSelect: highlightMode || removeMode ? 'text' : 'auto',
            WebkitUserSelect: highlightMode || removeMode ? 'text' : 'auto',
            cursor: removeMode ? 'pointer' : 'auto',
            overflowY: 'auto' // ENABLE SCROLL - so content doesn't get cut off
          }}
          onMouseUp={handleTextSelection}
          onClick={handleTextSelection}
          onTouchEnd={handleTextSelection}
          onScroll={handleScroll}
        >
          {/* Render paragraphs */}
          {paragraphs.map((paragraph, index) => {
            // Check for chapter title (starts with #)
            if (paragraph.startsWith('# ')) {
              return (
                <h2 
                  key={index}
                  className="font-bold"
                  style={{ 
                    fontSize: '20px',
                    lineHeight: '24px',
                    fontFamily: 'var(--font-eb-garamond)',
                    marginBottom: '24px'
                  }}
                >
                  {paragraph.replace('# ', '')}
                </h2>
              );
            }
            
            // Check for subheadings
            if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
              return (
                <h3 
                  key={index}
                  className="font-semibold"
                  style={{ 
                    fontSize: '16px',
                    lineHeight: '20px',
                    fontFamily: 'var(--font-eb-garamond)',
                    marginBottom: '16px',
                    marginTop: index > 0 ? '24px' : '0'
                  }}
                >
                  {paragraph.replace(/^#{2,3} /, '')}
                </h3>
              );
            }
            
            // Regular paragraph
            return (
              <p 
                key={index}
                style={{ 
                  marginBottom: `${readingView.paragraphSpacing + 4}px`,
                  fontSize: `${textSize}px`,
                  lineHeight: `${textSize * 1.5}px`,
                  fontFamily: 'var(--font-xanh-mono)',
                  textAlign: 'left'
                }}
                dangerouslySetInnerHTML={{ __html: applyHighlights(paragraph, index) }}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-screen flex flex-col bg-white overflow-hidden relative">
      {/* Vertical scroll progress indicator - small blue/gray rounded slider on right side */}
      {currentPage.type === 'chapter' && (
        <div 
          className="fixed z-50 bg-gray-200 rounded-full"
          style={{
            right: '8px',
            top: '200px', // Position below the tools bar with some padding
            width: '6px',
            height: '60px',
            pointerEvents: 'none'
          }}
        >
          <div 
            className="w-full rounded-full transition-all duration-150"
            style={{
              height: `${scrollProgress}%`,
              backgroundColor: '#0000ff',
              borderRadius: '3px'
            }}
          />
        </div>
      )}

      {/* Top line */}
      <div className="w-full line-thin border-t-[0.5px]" />
      
      {/* Header content - matching main library header */}
      <div 
        className="flex items-end px-[16px] relative"
        style={{ 
          paddingTop: `${header.verticalPadding}px`,
          paddingBottom: 0
        }}
      >
        {/* Walking SVG */}
        <img 
          src="/images/walking.svg"
          alt="Walking figure"
          className="flex-shrink-0"
          style={{ 
            height: `${header.blueSquareSize}px`,
            width: 'auto'
          }}
        />
        
        {/* Simon Design Library text */}
        <h1 
          className="relative"
          style={{ 
            fontFamily: 'var(--font-eb-garamond)',
            fontSize: `${typography.headerSize}px`,
            lineHeight: '1',
            marginLeft: `${header.gapBetweenSquareAndText}px`,
            whiteSpace: 'nowrap',
            paddingBottom: 0,
            zIndex: 1
          }}
        >
          Simon Design Library
        </h1>
      </div>
      
      {/* Bottom line of header */}
      <div className="w-full line-thin border-t-[0.5px]" />
      
      {/* Book info bar - White background with title/author/Back button */}
      <div 
        className="w-full bg-white text-black flex items-center"
        style={{
          height: `${readingView.topBarHeight}px`,
        }}
      >
        {/* Back button */}
        <button 
          onClick={onBack}
          className="flex items-center justify-center hover:bg-gray-50 text-[12px]"
          style={{ 
            fontFamily: 'var(--font-xanh-mono)',
            paddingLeft: `${readingView.topBarPaddingHorizontal}px`,
            paddingRight: `${readingView.topBarPaddingHorizontal}px`,
            height: '100%'
          }}
        >
          ← Library
        </button>
        
        {/* Vertical divider */}
        <div className="line-thin border-l-[0.5px] h-full" />
        
        {/* Title and author - left aligned */}
        <div 
          className="flex-1 flex flex-col justify-center overflow-hidden"
          style={{
            paddingLeft: '20px',
            paddingRight: '20px'
          }}
        >
          <div 
            className="text-[14px] font-medium truncate"
            style={{ 
              fontFamily: 'var(--font-eb-garamond)',
              lineHeight: '18px',
              marginBottom: '2px'
            }}
          >
            {media.title}
          </div>
          <div 
            className="text-[11px] text-gray-600 truncate"
            style={{ 
              fontFamily: 'var(--font-xanh-mono)',
              lineHeight: '14px'
            }}
          >
            {media.author}
          </div>
        </div>
      </div>
      
      <div className="w-full line-thin border-t-[0.5px]" />

      {/* Tools bar - Highlight, Text Size, Bookmark */}
      <div className="w-full bg-white relative">
        {/* Blue bookmark indicator if current page is bookmarked - descends from below the bar */}
        {isBookmarked && (
          <div 
            className="absolute bg-[#0000ff]"
            style={{
              width: '20px',
              height: '32px',
              right: '16px',
              top: '40px',
              zIndex: 10
            }}
          />
        )}
        
        <div className="flex items-stretch" style={{ height: '40px' }}>
          {/* Highlight button */}
          <div className="relative flex-1">
            <button
              onClick={() => {
                setHighlightMode(!highlightMode);
                setShowHighlightOptions(!showHighlightOptions);
              }}
              className={`w-full h-full flex items-center justify-center hover:bg-gray-50 ${highlightMode ? 'bg-blue-50' : ''}`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Highlighter pen body */}
                <rect x="9" y="4" width="6" height="10" fill={highlightMode ? '#0000ff' : '#999'} rx="1"/>
                {/* Highlighter tip */}
                <path d="M8 14 L12 18 L16 14 Z" fill={highlightMode ? '#0000ff' : '#60a5fa'} />
                {/* Highlight mark */}
                <rect x="4" y="19" width="16" height="3" fill={highlightMode ? '#0000ff' : '#60a5fa'} opacity="0.4" rx="1"/>
              </svg>
            </button>

            {/* Highlight options dropdown */}
            {showHighlightOptions && (
              <div 
                className="absolute top-full left-0 right-0 bg-white border-[0.5px] border-black flex z-50"
                style={{ marginTop: '-0.5px' }}
              >
                <button
                  onClick={handleToggleRemoveMode}
                  className={`flex-1 flex items-center justify-center hover:bg-gray-50 text-[20px] ${removeMode ? 'bg-red-50 text-red-600' : ''}`}
                  style={{
                    height: '40px',
                    fontFamily: 'var(--font-xanh-mono)'
                  }}
                  title="Click highlighted text to remove"
                >
                  ✕
                </button>
                <div className="line-thin border-l-[0.5px] h-full" />
                <button
                  onClick={() => {
                    // Keep highlight mode active for more highlighting
                    setHighlightMode(true);
                    setRemoveMode(false);
                    setShowHighlightOptions(true);
                  }}
                  className="flex-1 flex items-center justify-center hover:bg-gray-50 text-[24px] font-bold"
                  style={{
                    height: '40px',
                    fontFamily: 'var(--font-xanh-mono)'
                  }}
                  title="Continue highlighting"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="line-thin border-l-[0.5px] h-full" />

          {/* Text Size button */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowTypeSizeOptions(!showTypeSizeOptions)}
              className="w-full h-full flex items-center justify-center gap-2 hover:bg-gray-50"
              style={{
                fontFamily: 'var(--font-xanh-mono)'
              }}
            >
              <span className="text-[16px] font-semibold">Aa</span>
              <span className="text-[13px]">{textSize}px</span>
            </button>

            {/* Type size options dropdown */}
            {showTypeSizeOptions && (
              <div 
                className="absolute top-full left-0 right-0 bg-white border-[0.5px] border-black flex z-50"
                style={{ marginTop: '-0.5px' }}
              >
                <button
                  onClick={handleTextSizeDecrease}
                  className="flex-1 flex items-center justify-center hover:bg-gray-50 text-[24px] font-bold"
                  style={{
                    height: '40px',
                    fontFamily: 'var(--font-xanh-mono)'
                  }}
                  disabled={textSize <= 12}
                >
                  −
                </button>
                <div className="line-thin border-l-[0.5px] h-full" />
                <button
                  onClick={handleTextSizeIncrease}
                  className="flex-1 flex items-center justify-center hover:bg-gray-50 text-[24px] font-bold"
                  style={{
                    height: '40px',
                    fontFamily: 'var(--font-xanh-mono)'
                  }}
                  disabled={textSize >= 36}
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="line-thin border-l-[0.5px] h-full" />

          {/* Highlight List button - Pen icon */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowHighlightList(!showHighlightList)}
              className="w-full h-full flex items-center justify-center hover:bg-gray-50"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(-45deg)' }}>
                {/* Pen body */}
                <rect x="7" y="2" width="6" height="12" fill="#666" rx="1"/>
                {/* Pen tip */}
                <path d="M7 14 L10 18 L13 14 Z" fill="#666" />
                {/* Pen clip */}
                <rect x="11" y="3" width="1.5" height="4" fill="#999" rx="0.5"/>
              </svg>
            </button>

            {/* Highlight list dropdown */}
            {showHighlightList && (
              <div 
                className="absolute top-full left-0 bg-white border-[0.5px] border-black z-50 overflow-y-auto"
                style={{ 
                  marginTop: '-0.5px',
                  maxHeight: '240px',
                  right: 'calc(-100% - 1px)' // Extend to include bookmark button width + divider
                }}
              >
                {getAllHighlights().length === 0 ? (
                  <div 
                    className="px-4 py-6 text-center text-gray-500 text-[12px]"
                    style={{ fontFamily: 'var(--font-xanh-mono)' }}
                  >
                    No highlights yet
                  </div>
                ) : (
                  getAllHighlights().map((highlight, index) => (
                    <button
                      key={index}
                      onClick={() => goToHighlightPage(highlight.pageIndex)}
                      className="w-full text-left hover:bg-gray-50 border-b-[0.5px] border-gray-200"
                      style={{
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingTop: '10px',
                        paddingBottom: '10px'
                      }}
                    >
                      <div 
                        className="text-gray-500 mb-2"
                        style={{ 
                          fontFamily: 'var(--font-xanh-mono)',
                          fontSize: '10px'
                        }}
                      >
                        Page {highlight.pageNumber}
                      </div>
                      <div 
                        className="line-clamp-2"
                        style={{ 
                          fontFamily: 'var(--font-xanh-mono)',
                          fontSize: '11px',
                          lineHeight: '15px'
                        }}
                      >
                        {highlight.text}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="line-thin border-l-[0.5px] h-full" />

          {/* Print button */}
          <div className="flex-1">
            <button
              onClick={() => setShowPrintModal(true)}
              className="w-full h-full flex items-center justify-center hover:bg-gray-50 text-gray-600"
              title="Print Booklet"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
            </button>
          </div>

          <div className="line-thin border-l-[0.5px] h-full" />

          {/* Bookmark button */}
          <div className="relative flex-1">
            <button
              onClick={toggleBookmark}
              className={`w-full h-full flex items-center justify-center hover:bg-gray-50 ${isBookmarked ? 'text-[#0000ff]' : 'text-gray-600'}`}
            >
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M1 1C1 0.447715 1.44772 0 2 0H12C12.5523 0 13 0.447715 13 1V17L7 13L1 17V1Z" 
                  fill={isBookmarked ? '#0000ff' : 'none'}
                  stroke={isBookmarked ? '#0000ff' : 'currentColor'}
                  strokeWidth="1.5"
                />
              </svg>
            </button>

            {/* Other bookmark dropdown - shows when there's another bookmarked page */}
            {showBookmarkDropdown && !isBookmarked && hasOtherBookmark && getOtherBookmarkInfo() && (
              <div 
                className="absolute top-full right-0 bg-white border-[0.5px] border-black z-50 flex"
                style={{ marginTop: '-0.5px' }}
              >
                {/* X button to remove other bookmark */}
                <button
                  onClick={removeOtherBookmark}
                  className="flex items-center justify-center hover:bg-red-50 text-[#0000ff] bg-blue-50"
                  style={{
                    width: '40px',
                    height: '40px',
                    fontFamily: 'var(--font-xanh-mono)',
                    fontSize: '16px'
                  }}
                  title="Remove bookmark"
                >
                  ✕
                </button>
                
                <div className="line-thin border-l-[0.5px] h-full" />
                
                {/* Go to bookmark button */}
                <button
                  onClick={goToBookmarkedPage}
                  className="text-left hover:bg-gray-50 flex-shrink-0"
                  style={{
                    paddingLeft: '12px',
                    paddingRight: '12px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    height: '40px',
                    minWidth: '100px'
                  }}
                >
                  <div 
                    className="text-gray-500 mb-1"
                    style={{ 
                      fontFamily: 'var(--font-xanh-mono)',
                      fontSize: '10px'
                    }}
                  >
                    {getOtherBookmarkInfo()?.chapterName}
                  </div>
                  <div 
                    className="truncate"
                    style={{ 
                      fontFamily: 'var(--font-xanh-mono)',
                      fontSize: '11px',
                      lineHeight: '14px'
                    }}
                  >
                    Page {getOtherBookmarkInfo()?.pageNumber}
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="line-thin border-r-[0.5px] h-full" />
        </div>
      </div>

      <div className="w-full line-thin border-t-[0.5px]" />

      {/* Render appropriate page type */}
      {currentPage.type === 'title' && renderTitlePage()}
      {currentPage.type === 'toc' && renderTableOfContents()}
      {currentPage.type === 'chapter' && renderChapterContent()}

      {/* Bottom Navigation Section - ALWAYS VISIBLE */}
      <div className="w-full flex-shrink-0">
        {/* Line above progress bar */}
        <div className="w-full line-thin border-t-[0.5px]" />
        
        {/* Progress bar */}
        <div 
          className="w-full bg-white flex items-center gap-3"
          style={{ 
            height: '24px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          {/* Percentage */}
          <span 
            className="text-[12px] flex-shrink-0"
            style={{ 
              fontFamily: 'var(--font-xanh-mono)',
              minWidth: '40px'
            }}
          >
            {Math.round(((currentPageIndex + 1) / totalPages) * 100)}%
          </span>
          
          {/* Progress bar */}
          <div 
            className="flex-1 rounded-full overflow-hidden"
            style={{ 
              height: '6px',
              backgroundColor: '#e5e5e5'
            }}
          >
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${((currentPageIndex + 1) / totalPages) * 100}%`,
                backgroundColor: '#00c48c'
              }}
            />
          </div>
        </div>
        
        {/* Line above navigation */}
        <div className="w-full line-thin border-t-[0.5px]" />
        
        {/* Back | Next buttons */}
        <div 
          className="flex items-stretch bg-white"
          style={{ height: `${readingView.navHeight}px` }}
        >
          <button 
            onClick={handlePrevious}
            disabled={currentPageIndex === 0}
            className="flex-1 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              fontFamily: 'var(--font-xanh-mono)',
              fontSize: `${typography.bodySize}px`,
              lineHeight: `${typography.bodyLineHeight}px`
            }}
          >
            Back
          </button>
          
          <div className="line-thin border-l-[0.5px] h-full" />
          
          <button 
            onClick={handleNext}
            disabled={currentPageIndex >= totalPages - 1}
            className="flex-1 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              fontFamily: 'var(--font-xanh-mono)',
              fontSize: `${typography.bodySize}px`,
              lineHeight: `${typography.bodyLineHeight}px`
            }}
          >
            Next
          </button>
        </div>
        
        {/* Line between sections */}
        <div className="w-full line-thin border-t-[0.5px]" />
        
        {/* Page info: chapter name | page number */}
        <button
          onClick={() => setShowChapterNav(!showChapterNav)}
          className="flex items-stretch bg-white hover:bg-gray-50 w-full"
          style={{ height: `${readingView.footerHeight}px` }}
        >
          <div 
            className="flex-1 flex items-center text-left"
            style={{ 
              paddingLeft: `${readingView.footerPadding}px`,
              paddingRight: `${readingView.footerPadding}px`,
              fontSize: `${readingView.footerTextSize}px`,
              fontFamily: 'var(--font-xanh-mono)'
            }}
          >
            {currentChapterName}
          </div>
          
          <div className="line-thin border-l-[0.5px] h-full" />
          
          <div 
            className="flex items-center justify-center"
            style={{ 
              minWidth: '120px',
              paddingLeft: `${readingView.footerPadding}px`,
              paddingRight: `${readingView.footerPadding}px`,
              fontSize: `${readingView.footerTextSize}px`,
              fontFamily: 'var(--font-xanh-mono)'
            }}
          >
            {currentPage.number} / {totalPages}
          </div>
        </button>
        
        {/* Bottom line */}
        <div className="w-full line-thin border-t-[0.5px]" />
      </div>

      {/* Chapter Navigation Popup */}
      {showChapterNav && (
        <div 
          className="fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-black z-50 overflow-y-auto"
          style={{ 
            height: '328px',
            maxWidth: '402px',
            margin: '0 auto'
          }}
        >
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="w-full line-thin border-b-[0.5px] flex items-center justify-between px-4 py-2">
              <span 
                className="text-[12px]"
                style={{ fontFamily: 'var(--font-xanh-mono)' }}
              >
                Chapters
              </span>
              <button 
                onClick={() => setShowChapterNav(false)}
                className="text-[12px] hover:underline"
                style={{ fontFamily: 'var(--font-xanh-mono)' }}
              >
                Close
              </button>
            </div>

            {/* Chapter list */}
            <div className="flex-1 overflow-y-auto">
              {/* Title Page */}
              <button
                onClick={() => goToPage(0)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b-[0.5px] border-black ${
                  currentPageIndex === 0 ? 'bg-[#0000ff] text-white' : ''
                }`}
              >
                <div 
                  className="text-[12px]"
                  style={{ fontFamily: 'var(--font-xanh-mono)' }}
                >
                  Title Page
                </div>
                <div 
                  className="text-[10px] opacity-70 mt-1"
                  style={{ fontFamily: 'var(--font-xanh-mono)' }}
                >
                  Page 1
                </div>
              </button>

              {/* Table of Contents */}
              <button
                onClick={() => goToPage(1)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b-[0.5px] border-black ${
                  currentPageIndex === 1 ? 'bg-[#0000ff] text-white' : ''
                }`}
              >
                <div 
                  className="text-[12px]"
                  style={{ fontFamily: 'var(--font-xanh-mono)' }}
                >
                  Contents
                </div>
                <div 
                  className="text-[10px] opacity-70 mt-1"
                  style={{ fontFamily: 'var(--font-xanh-mono)' }}
                >
                  Page 2
                </div>
              </button>

              {/* Chapters */}
              {parsedChapters.map((chapter, index) => {
                const pageIndex = index + 2;
                return (
                  <button
                    key={chapter.number}
                    onClick={() => goToPage(pageIndex)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b-[0.5px] border-black ${
                      currentPageIndex === pageIndex ? 'bg-[#0000ff] text-white' : ''
                    }`}
                  >
                    <div 
                      className="text-[12px]"
                      style={{ fontFamily: 'var(--font-xanh-mono)' }}
                    >
                      {chapter.title}
                    </div>
                    <div 
                      className="text-[10px] opacity-70 mt-1"
                      style={{ fontFamily: 'var(--font-xanh-mono)' }}
                    >
                      Page {pageIndex + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && (
        <BookletPrintModal
          media={media}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
