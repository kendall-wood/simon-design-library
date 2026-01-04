'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { header, typography, table, mediaPreview } from '@/config/design';

export default function PDFProcessorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentView, setCurrentView] = useState<'info' | 'preview'>('info');
  
  // Metadata fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [previewImagePath, setPreviewImagePath] = useState('/images/author.png');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Auto-generate output name from filename
      const name = selectedFile.name
        .replace('.pdf', '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase();
      setOutputName(name);
      
      // Auto-generate title from filename
      const titleName = selectedFile.name
        .replace('.pdf', '')
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setTitle(titleName);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImageFile(selectedImage);
      
      // Generate the path where it will be saved
      const imageName = selectedImage.name.toLowerCase();
      setPreviewImagePath(`/images/${imageName}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setProcessing(true);
    setError('');
    setResult(null);
    setProgress(0);
    
    // Estimate processing time based on file size (roughly 1 second per 100KB)
    const fileSizeInKB = file.size / 1024;
    const estimatedTime = Math.max(10, Math.ceil(fileSizeInKB / 100) * 10); // Minimum 10s, 10s per 100KB
    setElapsedTime(estimatedTime);

    // Start countdown timer
    const timerInterval = setInterval(() => {
      setElapsedTime(prev => Math.max(0, prev - 1));
    }, 1000);

    // Simulate progress (since we can't get real progress from API)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 2000);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('outputName', outputName);
    formData.append('title', title);
    formData.append('author', author);
    formData.append('year', year.toString());
    formData.append('description', description);
    formData.append('previewImage', previewImagePath);
    
    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      // Use OpenAI-powered extraction
      const response = await fetch('/api/process-pdf-ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to process PDF');
      }

      setProgress(100);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      clearInterval(timerInterval);
      clearInterval(progressInterval);
      setProcessing(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!result?.libraryJson) return;
    
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch('/api/save-to-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: result.libraryJson,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save to library');
      }

      alert('✅ Book saved to library successfully! Refresh the homepage to see it.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save to library');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✓ Copied to clipboard!');
  };

  return (
    <div className="w-full h-full bg-white text-black flex flex-col">
      {/* Header - Sticky */}
      <header className="w-full sticky top-0 bg-white z-10">
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
        
        {/* Bottom line */}
        <div className="w-full line-thin border-t-[0.5px]" />
      </header>

      {/* Preview Area with Overlay Navigation */}
      <div className="relative" style={{ height: `${mediaPreview.height + table.headerHeight}px` }}>
        {/* Preview Area */}
        <div 
          className="w-full h-full bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => document.getElementById('preview-image')?.click()}
        >
          {imageFile ? (
            <div className="w-full h-full relative">
              <Image 
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            </div>
          ) : (
            <div className="text-[12px] text-gray-500">
              Click to upload preview image
            </div>
          )}
        </div>

        {/* Back Button - Overlaid top left */}
        <div className="absolute top-0 left-0 z-10">
          <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
            <Link 
              href="/"
              className="flex items-center justify-center hover:bg-gray-50 text-[12px] leading-[12px]"
              style={{
                paddingLeft: '16px',
                paddingRight: '16px'
              }}
            >
              ← Back
            </Link>
            <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
          </div>
          <div className="w-full line-thin border-t-[0.5px]" />
        </div>

        {/* Info/Preview Buttons - Overlaid bottom left */}
        <div className="absolute bottom-0 left-0 z-10 inline-flex">
          <div className="flex">
            {/* Info Button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
                <button 
                  type="button"
                  onClick={() => setCurrentView('info')}
                  className={`flex items-center justify-center text-[12px] leading-[12px] hover:bg-gray-50 ${
                    currentView === 'info' ? 'bg-gray-100' : ''
                  }`}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px'
                  }}
                >
                  Info
                </button>
                <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
              </div>
            </div>
            
            {/* Preview Button */}
            <div>
              <div className="line-thin border-t-[0.5px]" />
              <div className="flex items-stretch bg-white" style={{ height: `${table.headerHeight}px` }}>
                <button 
                  type="button"
                  onClick={() => setCurrentView('preview')}
                  className={`flex items-center justify-center text-[12px] leading-[12px] hover:bg-gray-50 ${
                    currentView === 'preview' ? 'bg-gray-100' : ''
                  }`}
                  style={{
                    paddingLeft: '16px',
                    paddingRight: '16px'
                  }}
                >
                  Preview
                </button>
                <div className="line-thin border-r-[0.5px] -my-[0.5px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {currentView === 'info' ? (
          <form onSubmit={handleSubmit}>
          {/* Top line above input section */}
          <div className="w-full line-thin border-t-[0.5px]" />
          {/* PDF File */}
          <div className="flex items-center">
            <div 
              className="text-[12px] leading-[14px]" 
              style={{ 
                width: '140px',
                paddingLeft: '16px',
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
            >
              PDF File *
            </div>
            <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
            <div 
              className="flex-1"
              style={{ 
                paddingLeft: `${table.columnLeftPadding}px`,
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
            >
              <input
                type="file"
                id="pdf-file"
                accept=".pdf"
                onChange={handleFileChange}
                className="text-[12px] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-[12px] file:bg-gray-100 file:text-black hover:file:bg-gray-200"
              />
              {file && (
                <p className="text-[11px] text-gray-600 mt-1">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="w-full line-thin border-t-[0.5px]" />
          <div className="flex items-center">
            <div 
              className="text-[12px] leading-[14px]" 
              style={{ 
                width: '140px',
                paddingLeft: '16px',
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
            >
              Title *
            </div>
            <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 outline-none bg-transparent text-[12px] leading-[14px]"
              style={{ 
                paddingLeft: `${table.columnLeftPadding}px`,
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
              placeholder="e.g., Black Skin, White Masks"
              required
            />
          </div>

          {/* Author */}
          <div className="w-full line-thin border-t-[0.5px]" />
          <div className="flex items-center">
            <div 
              className="text-[12px] leading-[14px]" 
              style={{ 
                width: '140px',
                paddingLeft: '16px',
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
            >
              Author *
            </div>
            <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="flex-1 outline-none bg-transparent text-[12px] leading-[14px]"
              style={{ 
                paddingLeft: `${table.columnLeftPadding}px`,
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
              placeholder="e.g., Franz Fanon"
              required
            />
          </div>

          {/* Year */}
          <div className="w-full line-thin border-t-[0.5px]" />
          <div className="flex items-center">
            <div 
              className="text-[12px] leading-[14px]" 
              style={{ 
                width: '140px',
                paddingLeft: '16px',
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
            >
              Year *
            </div>
            <div className="line-thin border-l-[0.5px] -my-[0.5px]" />
            <input
              type="number"
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="flex-1 outline-none bg-transparent text-[12px] leading-[14px]"
              style={{ 
                paddingLeft: `${table.columnLeftPadding}px`,
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
              placeholder="e.g., 1952"
              required
            />
          </div>

          {/* Preview Image - Hidden input */}
          <input
            type="file"
            id="preview-image"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Description */}
          <div className="w-full line-thin border-t-[0.5px]" />
          <div className="flex flex-col">
            <div 
              className="text-[12px] leading-[14px]" 
              style={{ 
                paddingLeft: '16px',
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding + 3}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`
              }}
            >
              Description *
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full outline-none bg-transparent text-[12px] leading-[18px] resize-none"
              style={{ 
                paddingLeft: '16px',
                paddingRight: `${table.columnRightPadding}px`,
                paddingTop: `${table.rowVerticalPadding}px`,
                paddingBottom: `${table.rowVerticalPadding + 3}px`,
                minHeight: '100px'
              }}
              placeholder="A brief description of the book..."
              required
            />
          </div>

          {/* Submit Button */}
          <div className="w-full line-thin border-t-[0.5px]" />
          <div 
            className="flex items-center justify-center"
            style={{ 
              paddingTop: `${table.rowVerticalPadding + 8}px`,
              paddingBottom: `${table.rowVerticalPadding + 8}px`
            }}
          >
            <button
              type="submit"
              disabled={processing || !file}
              className="text-[12px] leading-[12px] px-[32px] py-[8px] bg-white text-black hover:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Processing PDF...' : 'Extract & Format Text'}
            </button>
          </div>
          <div className="w-full line-thin border-t-[0.5px]" />

          {/* Progress Bar */}
          {processing && (
            <>
              <div 
                className="flex items-center"
                style={{ 
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding}px`,
                  paddingBottom: `${table.rowVerticalPadding}px`
                }}
              >
                <div className="flex-1 text-[12px] text-gray-600">
                  Processing with OpenAI... {elapsedTime}s remaining
                </div>
              </div>
              <div className="w-full line-thin border-t-[0.5px]" />
              <div 
                style={{ 
                  paddingLeft: `${table.columnLeftPadding}px`,
                  paddingRight: `${table.columnRightPadding}px`,
                  paddingTop: `${table.rowVerticalPadding}px`,
                  paddingBottom: `${table.rowVerticalPadding}px`
                }}
              >
                <div className="w-full bg-gray-200 h-2">
                  <div 
                    className="bg-black h-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-500 text-center mt-2">
                  {Math.round(progress)}% complete
                </div>
              </div>
              <div className="w-full line-thin border-t-[0.5px]" />
            </>
          )}
          </form>
        ) : (
          /* Preview View */
          <div className="w-full h-full">
            {/* Top line above preview section */}
            <div className="w-full line-thin border-t-[0.5px]" />
            <div className="p-6">
            {result && result.formattedContent ? (
              <div className="text-[12px] leading-[18px] whitespace-pre-wrap">
                {result.formattedContent}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[12px] text-gray-500">
                {processing ? 'Processing PDF...' : 'Upload and process a PDF to see preview'}
              </div>
            )}
            </div>
          </div>
        )}

        {error && (
          <div 
            className="bg-red-50 text-red-800 text-[12px] border-t-[0.5px] border-b-[0.5px]"
            style={{ 
              paddingLeft: `${table.columnLeftPadding}px`,
              paddingRight: `${table.columnRightPadding}px`,
              paddingTop: `${table.rowVerticalPadding}px`,
              paddingBottom: `${table.rowVerticalPadding}px`
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div>
            <div className="bg-green-50 border border-green-300 text-green-800 px-8 py-6 rounded text-[14px]">
              PDF processed successfully!
            </div>

            <div className="bg-gray-50 p-8 rounded border border-gray-200">
              <h2 className="text-[20px] font-medium mb-6">Extraction Summary</h2>
              <div className="grid grid-cols-2 gap-8 text-[14px]">
                <div>
                  <span className="font-medium">Total Pages:</span> {result.totalPages}
                </div>
                <div>
                  <span className="font-medium">Chapters Detected:</span> {result.chapters?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Characters:</span> {result.formattedContent?.length.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Words:</span> {result.formattedContent?.split(/\s+/).length.toLocaleString()}
                </div>
              </div>
            </div>

            {result.chapters && result.chapters.length > 0 && (
              <div>
                <h2 className="text-[20px] font-medium mb-6">Detected Chapters</h2>
                <div className="bg-gray-50 border border-gray-200 rounded p-8 max-h-96 overflow-y-auto">
                  {result.chapters.map((chapter: any, idx: number) => (
                    <div key={idx} className="border-b border-gray-200 pb-4 mb-4 last:border-0">
                      <div className="font-medium text-[14px]">Chapter {chapter.number}: {chapter.title}</div>
                      <div className="text-[13px] text-gray-600 mt-2">
                        Pages {chapter.startPage} - {chapter.endPage}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-medium">Save to Library</h2>
                <div className="flex gap-4">
                  <button
                    onClick={handleSaveToLibrary}
                    disabled={saving}
                    className="bg-black text-white px-8 py-4 rounded text-[14px] hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save to Library'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(result.libraryJson)}
                    className="bg-gray-200 text-black px-7 py-4 rounded text-[14px] hover:bg-gray-300 font-medium transition-colors"
                  >
                    Copy JSON
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={result.libraryJson}
                className="w-full h-72 border border-gray-300 rounded p-6 font-mono text-[13px] bg-gray-50 leading-relaxed"
              />
              <div className="bg-blue-50 border border-blue-200 p-6 rounded mt-4 text-[14px]">
                <strong>One-Click Save:</strong>
                <p className="mt-3 leading-relaxed">
                  Click the <strong>"Save to Library"</strong> button above to automatically add this book to your library. 
                  The site will update instantly!
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[20px] font-medium">Formatted Content</h2>
                <button
                  onClick={() => copyToClipboard(result.formattedContent)}
                  className="bg-gray-200 text-black px-7 py-4 rounded text-[14px] hover:bg-gray-300 font-medium transition-colors"
                >
                  Copy Content
                </button>
              </div>
              <textarea
                readOnly
                value={result.formattedContent}
                className="w-full h-96 border border-gray-300 rounded p-6 font-mono text-[13px] bg-gray-50 leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
