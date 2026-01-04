# Simon Design Library - Setup Guide

## ✅ Project Created Successfully!

Your Simon Design Library is now ready. The development server is running at:

**http://localhost:3000**

## What's Built

### Core Features
- ✅ Mobile-first design (402×874px viewport)
- ✅ Header with EB Garamond typography
- ✅ Media preview area (328px)
- ✅ Navigation: Home | Library | My Media | Search
- ✅ Content table with proper spacing and alignment
- ✅ Row selection with blue highlight
- ✅ Smooth slide-down descriptions
- ✅ Reading view for books
- ✅ localStorage for "My Media" collection
- ✅ Real-time search filtering
- ✅ Admin interface at `/admin`
- ✅ PDF processing script

### Design Specifications Met
- All lines: 0.5px
- Base spacing: 12px
- Row spacing: 4px
- Header font: EB Garamond 43px
- Body font: Xanh Mono 12px
- Blue square: 35×35px
- Hanging punctuation on titles

## Quick Start

### View the Site
1. Open http://localhost:3000
2. Click on any book row to see the description
3. Click the preview area to enter reading mode
4. Use the navigation to filter by media type

### Add Content

#### Option 1: Admin Interface
1. Go to http://localhost:3000/admin
2. Fill out the form
3. Copy the generated JSON
4. Add it to `data/library.json`

#### Option 2: Process a PDF
```bash
# Install PDF parser
npm install pdf-parse

# Process a PDF
node scripts/process-pdf.js ~/path/to/book.pdf output-name

# Copy the formatted content to library.json
```

### Add Images
1. Place images in `public/images/`
2. Reference them in library.json as `/images/filename.jpg`

## File Structure

```
app-src/
├── app/
│   ├── page.tsx              # Main library view
│   ├── admin/page.tsx        # Admin interface
│   ├── layout.tsx            # Fonts & metadata
│   └── globals.css           # Global styles
├── components/
│   ├── Header.tsx            # Site header
│   ├── MediaPreview.tsx      # Media display
│   ├── NavigationBar.tsx     # Nav buttons
│   ├── ContentTable.tsx      # Library table
│   └── ReadingView.tsx       # Reading interface
├── data/
│   └── library.json          # Your content
├── public/
│   └── images/               # Media assets
└── scripts/
    └── process-pdf.js        # PDF processor
```

## Next Steps

### 1. Add Your Content
- Edit `data/library.json`
- Add your books, videos, and photos
- Include descriptions and metadata

### 2. Add Images
- Place author photos in `public/images/`
- Update the `previewImage` field in library.json

### 3. Process PDFs
- Use the PDF script to extract text
- Format it for the reading view
- Add chapter information

### 4. Customize
- Adjust colors in `globals.css`
- Modify spacing if needed
- Add more media types

### 5. Deploy

#### To GitHub Pages:
```bash
# Build the static site
npm run build

# The 'out' folder contains your site
# Push to GitHub and enable Pages
```

#### Manual Deployment:
```bash
npm run build
# Upload the 'out' folder to any static host
```

## Sample Data

The site comes with sample data from Frantz Fanon's works. You can:
- Keep it as reference
- Replace it with your own content
- Add to it gradually

## Troubleshooting

### Server won't start
```bash
cd app-src
npm install
npm run dev
```

### Fonts not loading
- Check your internet connection (fonts load from Google)
- Clear browser cache

### Images not showing
- Ensure images are in `public/images/`
- Check the path in library.json starts with `/images/`

### PDF processing fails
```bash
npm install pdf-parse
```

## Design Notes

### Mobile Viewport
The site is designed for 402×874px (iPhone size). It will scale proportionally on other devices.

### Typography
- **EB Garamond**: Header only (43px)
- **Xanh Mono**: Everything else (12px base, scalable in reading view)

### Lines
All dividers are exactly 0.5px for that crisp, minimal look.

### Spacing
- 12px: General padding/margins
- 4px: Vertical spacing between table rows
- Equal padding: Left/right on navigation buttons

### Colors
- Black: `#000000`
- Blue: `#0000ff`
- White: `#ffffff`

## Support

For issues or questions, refer to:
- `README.md` - General documentation
- `scripts/README.md` - PDF processing guide
- Component files - Inline comments

---

**Enjoy building your archive!** 📚

