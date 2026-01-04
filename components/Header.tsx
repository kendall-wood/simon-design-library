'use client';

import { header, typography, navigationBar } from '@/config/design';
import Link from 'next/link';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Header({ searchQuery, onSearchChange }: HeaderProps) {
  return (
    <header className="w-full">
      {/* Top line */}
      <div className="w-full line-thin border-t-[0.5px]" />
      
      {/* Header content - aligned to bottom */}
      <div 
        className="flex items-end px-[16px]"
        style={{ 
          paddingTop: `${header.verticalPadding}px`,
          paddingBottom: 0
        }}
        >
         {/* Walking SVG - 35px height */}
         <img 
           src="/images/walking.svg"
           alt="Walking figure"
           className="flex-shrink-0"
           style={{ 
             height: `${header.blueSquareSize}px`,
             width: 'auto'
           }}
         />
         
          {/* Simon Design Library text - baseline aligned to bottom line */}
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
      
      {/* Bottom line - right against bottom of content */}
      <div className="w-full line-thin border-t-[0.5px]" />
      
      {/* Search bar and Upload button */}
      <div className="flex items-stretch" style={{ height: `${navigationBar.height}px` }}>
        {/* Search icon */}
        <div className="flex items-center justify-center" style={{ paddingLeft: '16px', paddingRight: '8px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="0.5"/>
            <line x1="8" y1="8" x2="11" y2="11" stroke="currentColor" strokeWidth="0.5"/>
          </svg>
        </div>
        
        {/* Search input */}
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 outline-none bg-transparent text-[12px] leading-[12px]"
          style={{
            paddingRight: `${navigationBar.searchRightPadding}px`
          }}
        />
        
        {/* Divider - extends full height */}
        <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
        
        {/* Upload button */}
        <Link 
          href="/pdf-processor"
          className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
          style={{
            paddingLeft: `${navigationBar.buttonLeftPadding}px`,
            paddingRight: '32px'
          }}
        >
          Upload
        </Link>
      </div>
      
      {/* Bottom line */}
      <div className="w-full line-thin border-t-[0.5px]" />
    </header>
  );
}

