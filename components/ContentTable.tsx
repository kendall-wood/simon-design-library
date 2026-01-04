'use client';

import { MediaItem } from '@/types/media';
import { useState, useEffect } from 'react';
import { table } from '@/config/design';

interface ContentTableProps {
  items: MediaItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onItemSelected: (item: MediaItem) => void;
  onSaveToMyMedia: (id: string) => void;
  onPrintBook: (item: MediaItem) => void;
  savedItems: string[];
}

type SortField = 'year' | 'name' | 'media';
type SortDirection = 'asc' | 'desc';

export default function ContentTable({ 
  items, 
  selectedId, 
  onSelect,
  onItemSelected,
  onSaveToMyMedia,
  onPrintBook,
  savedItems
}: ContentTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleRowClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      onSelect('');
    } else {
      setExpandedId(id);
      onSelect(id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort items based on current sort state
  const sortedItems = [...items].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;

    if (sortField === 'year') {
      comparison = a.year - b.year;
    } else if (sortField === 'name') {
      const aName = a.title.toLowerCase();
      const bName = b.title.toLowerCase();
      comparison = aName.localeCompare(bName);
    } else if (sortField === 'media') {
      comparison = a.mediaType.localeCompare(b.mediaType);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Column headers */}
      <div className="w-full line-thin border-t-[0.5px]" />
      
      <div className="flex items-stretch" style={{ height: `${table.headerHeight}px` }}>
        {/* Year column */}
        <button 
          onClick={() => handleSort('year')}
          className="flex items-center text-[12px] leading-[12px] hover:bg-gray-50 cursor-pointer"
          style={{ 
            width: `${table.yearColumnWidth}px`,
            paddingLeft: `${table.columnLeftPadding}px`,
            paddingRight: `${table.columnRightPadding}px`
          }}
        >
          Year {sortField === 'year' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        
        {/* Divider - extends full height */}
        <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
        
        {/* Name / Author column */}
        <button 
          onClick={() => handleSort('name')}
          className="flex-1 flex items-center text-[12px] leading-[12px] hover:bg-gray-50 cursor-pointer"
          style={{ 
            paddingLeft: `${table.columnLeftPadding}px`,
            paddingRight: `${table.columnRightPadding}px`
          }}
        >
          Name / Author {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
        
        {/* Divider - extends full height */}
        <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
        
        {/* Media column */}
        <button 
          onClick={() => handleSort('media')}
          className="flex items-center text-[12px] leading-[12px] hover:bg-gray-50 cursor-pointer"
          style={{ 
            width: `${table.mediaColumnWidth}px`,
            paddingLeft: `${table.columnLeftPadding}px`,
            paddingRight: `${table.columnRightPadding}px`
          }}
        >
          Media {sortField === 'media' && (sortDirection === 'asc' ? '↑' : '↓')}
        </button>
      </div>
      
      <div className="w-full line-thin border-t-[0.5px]" />
      
      {/* Content rows - fills remaining space */}
      <div className="flex-1 overflow-y-auto">
        {sortedItems.map((item) => (
          <div key={item.id}>
            {/* Row */}
            <button
              onClick={() => handleRowClick(item.id)}
              className={`w-full flex items-stretch text-left transition-colors ${
                expandedId === item.id ? 'bg-[#0000ff] text-white' : 'hover:bg-gray-50'
              }`}
              style={{ 
                paddingTop: `${table.rowVerticalPadding}px`,
                paddingBottom: `${table.rowVerticalPadding}px`
              }}
            >
              {/* Year */}
              <div 
                className="flex items-start text-[12px] leading-[14px]"
                style={{ 
                  width: `${table.yearColumnWidth}px`,
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`
                }}
              >
                {item.year}
              </div>
              
              {/* Name / Author */}
              <div 
                className="flex-1"
                style={{ 
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`
                }}
              >
                <div className="italic hanging-punctuation text-[12px] leading-[14px]">
                  "{item.title}"
                </div>
                <div className="author-inset text-[12px] leading-[14px]">
                  {item.author}
                </div>
              </div>
              
              {/* Media type */}
              <div 
                className="flex items-start text-[12px] leading-[14px]"
                style={{ 
                  width: `${table.mediaColumnWidth}px`,
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`
                }}
              >
                {item.mediaType}
              </div>
            </button>
            
            {/* Expanded description */}
            {expandedId === item.id && (
              <div 
                className="bg-white border-t-[0.5px] border-black overflow-hidden transition-all duration-300 ease-in-out"
                style={{ 
                  paddingLeft: `${table.descriptionLeftPadding}px`,
                  paddingRight: `${table.descriptionRightPadding}px`,
                  paddingTop: `${table.descriptionTopPadding}px`,
                  paddingBottom: `${table.descriptionBottomPadding}px`,
                  animation: 'slideDown 0.3s ease-in-out'
                }}
              >
                <p 
                  className="text-[12px] leading-[18px]"
                  style={{ marginBottom: `${table.descriptionMarginBottom}px` }}
                >
                  {item.description}
                </p>
                <div className="flex gap-2">
                  {(item.mediaType === 'Book' || item.mediaType === 'Document') && item.content && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemSelected(item);
                      }}
                      className="text-[12px] leading-[12px] border-[0.5px] border-black hover:bg-gray-100"
                      style={{
                        paddingLeft: `${table.saveButtonLeftPadding}px`,
                        paddingRight: `${table.saveButtonRightPadding}px`,
                        paddingTop: `${table.saveButtonTopPadding}px`,
                        paddingBottom: `${table.saveButtonBottomPadding}px`
                      }}
                    >
                      Read
                    </button>
                  )}
                  {'youtubeClips' in item && item.youtubeClips && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemSelected(item);
                      }}
                      className="text-[12px] leading-[12px] border-[0.5px] border-black hover:bg-gray-100"
                      style={{
                        paddingLeft: `${table.saveButtonLeftPadding}px`,
                        paddingRight: `${table.saveButtonRightPadding}px`,
                        paddingTop: `${table.saveButtonTopPadding}px`,
                        paddingBottom: `${table.saveButtonBottomPadding}px`
                      }}
                    >
                      Watch
                    </button>
                  )}
                  {/* Print button - only for books with content */}
                  {item.mediaType === 'Book' && item.content && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintBook(item);
                      }}
                      className="text-[12px] leading-[12px] border-[0.5px] border-black hover:bg-gray-100"
                      style={{
                        paddingLeft: `${table.saveButtonLeftPadding}px`,
                        paddingRight: `${table.saveButtonRightPadding}px`,
                        paddingTop: `${table.saveButtonTopPadding}px`,
                        paddingBottom: `${table.saveButtonBottomPadding}px`
                      }}
                    >
                      Print
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveToMyMedia(item.id);
                    }}
                    className={`text-[12px] leading-[12px] border-[0.5px] border-black ${
                      savedItems.includes(item.id) 
                        ? 'bg-[#0000ff] text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                    style={{
                      paddingLeft: `${table.saveButtonLeftPadding}px`,
                      paddingRight: `${table.saveButtonRightPadding}px`,
                      paddingTop: `${table.saveButtonTopPadding}px`,
                      paddingBottom: `${table.saveButtonBottomPadding}px`
                    }}
                  >
                    {savedItems.includes(item.id) ? 'Saved to My Media' : 'Save to My Media'}
                  </button>
                </div>
              </div>
            )}
            
            <div className="w-full line-thin border-t-[0.5px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

