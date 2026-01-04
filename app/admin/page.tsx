'use client';

import { useState } from 'react';
import { MediaItem, MediaType } from '@/types/media';

export default function AdminPage() {
  const [formData, setFormData] = useState<Partial<MediaItem>>({
    year: new Date().getFullYear(),
    title: '',
    author: '',
    mediaType: 'Book',
    description: '',
    content: '',
    totalPages: 0,
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate ID
    const id = Date.now().toString();
    const newItem: MediaItem = {
      ...formData,
      id,
    } as MediaItem;

    // In a real implementation, this would save to a database
    // For now, we'll just log it and show instructions
    console.log('New media item:', newItem);
    
    alert(`Media item created! 
    
To add this to your library:
1. Copy the JSON below
2. Add it to app-src/data/library.json

${JSON.stringify(newItem, null, 2)}`);

    // Reset form
    setFormData({
      year: new Date().getFullYear(),
      title: '',
      author: '',
      mediaType: 'Book',
      description: '',
      content: '',
      totalPages: 0,
    });
    setPdfFile(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile(file);
    setProcessing(true);

    // In a real implementation, this would process the PDF
    // For now, we'll just show a message
    setTimeout(() => {
      alert('PDF processing would happen here. For now, please manually enter the content.');
      setProcessing(false);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen bg-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-eb-garamond)' }}>
          Admin - Add Media
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Year */}
          <div>
            <label className="block mb-1">Year</label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full border border-black px-2 py-1"
              required
            />
          </div>

          {/* Title */}
          <div>
            <label className="block mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-black px-2 py-1"
              required
            />
          </div>

          {/* Author */}
          <div>
            <label className="block mb-1">Author</label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full border border-black px-2 py-1"
              required
            />
          </div>

          {/* Media Type */}
          <div>
            <label className="block mb-1">Media Type</label>
            <select
              value={formData.mediaType}
              onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as MediaType })}
              className="w-full border border-black px-2 py-1"
              required
            >
              <option value="Book">Book</option>
              <option value="Video">Video</option>
              <option value="Photo">Photo</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-black px-2 py-1 h-24"
              required
            />
          </div>

          {/* Book-specific fields */}
          {formData.mediaType === 'Book' && (
            <>
              <div>
                <label className="block mb-1">Total Pages</label>
                <input
                  type="number"
                  value={formData.totalPages}
                  onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) })}
                  className="w-full border border-black px-2 py-1"
                />
              </div>

              <div>
                <label className="block mb-1">Upload PDF</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="w-full border border-black px-2 py-1"
                />
                {processing && <p className="text-sm mt-1">Processing PDF...</p>}
              </div>

              <div>
                <label className="block mb-1">Content (Markdown)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full border border-black px-2 py-1 h-48 font-mono text-sm"
                  placeholder="# Chapter One&#10;&#10;Content here..."
                />
              </div>

              <div>
                <label className="block mb-1">Preview Image URL</label>
                <input
                  type="text"
                  value={formData.previewImage || ''}
                  onChange={(e) => setFormData({ ...formData, previewImage: e.target.value })}
                  className="w-full border border-black px-2 py-1"
                  placeholder="/images/author.jpg"
                />
              </div>
            </>
          )}

          {/* Video-specific fields */}
          {formData.mediaType === 'Video' && (
            <div>
              <label className="block mb-1">Video URL</label>
              <input
                type="text"
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full border border-black px-2 py-1"
                placeholder="https://..."
              />
            </div>
          )}

          {/* Photo-specific fields */}
          {formData.mediaType === ('Photo' as const) && (
            <div>
              <label className="block mb-1">Image URLs (one per line)</label>
              <textarea
                className="w-full border border-black px-2 py-1 h-24"
                placeholder="/images/photo1.jpg&#10;/images/photo2.jpg"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#0000ff] text-white py-2 px-4 hover:bg-blue-700"
          >
            Add Media Item
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-100">
          <h2 className="font-bold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Fill out the form above</li>
            <li>Click "Add Media Item"</li>
            <li>Copy the JSON output</li>
            <li>Add it to <code className="bg-white px-1">app-src/data/library.json</code></li>
            <li>Refresh the main page to see your new item</li>
          </ol>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200">
          <h2 className="font-bold mb-2">YouTube Feed Manager</h2>
          <p className="text-sm mb-3">
            Want to add YouTube video clips to your feed? Use the YouTube Feed Manager to automatically find engaging segments.
          </p>
          <a 
            href="/admin/youtube-feed" 
            className="inline-block bg-[#0000ff] text-white px-4 py-2 text-sm hover:bg-blue-700"
          >
            Go to YouTube Feed Manager
          </a>
        </div>

        <div className="mt-4 p-4 bg-green-50 border border-green-200">
          <h2 className="font-bold mb-2">Al Jazeera Feed Manager</h2>
          <p className="text-sm mb-3">
            Fetch the latest news videos from Al Jazeera NewsFeed (last 7 days). Videos update daily.
          </p>
          <a 
            href="/admin/aljazeera-feed" 
            className="inline-block bg-[#0000ff] text-white px-4 py-2 text-sm hover:bg-blue-700"
          >
            Go to Al Jazeera Feed Manager
          </a>
        </div>

        <div className="mt-4 p-4 bg-purple-50 border border-purple-200">
          <h2 className="font-bold mb-2">Zeteo Feed Manager</h2>
          <p className="text-sm mb-3">
            Fetch the latest videos from Zeteo (Mehdi Hasan's news platform) - last 7 days.
          </p>
          <a 
            href="/admin/zeteo-feed" 
            className="inline-block bg-[#0000ff] text-white px-4 py-2 text-sm hover:bg-blue-700"
          >
            Go to Zeteo Feed Manager
          </a>
        </div>

        <div className="mt-4">
          <a href="/" className="text-[#0000ff] underline">
            ← Back to Library
          </a>
        </div>
      </div>
    </div>
  );
}

