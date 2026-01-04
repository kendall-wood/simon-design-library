# Simon Design Library

A mobile-first archive experience for selected materials (print, video, photo).

## Design Specifications

- **Viewport**: 402 × 874px (mobile)
- **Typefaces**: 
  - EB Garamond (43px for header)
  - Xanh Mono (12px for all other text)
- **Lines**: All dividers are 0.5px
- **Spacing**: 12px base padding, 4px between table rows

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

This creates a static export in the `out/` directory.

### Deploy to GitHub Pages

1. Push your code to GitHub
2. Go to Settings → Pages
3. Set source to "GitHub Actions"
4. The site will automatically deploy on push to main

Or manually:

```bash
npm run build
# Upload the 'out' folder to your hosting
```

## Project Structure

```
app-src/
├── app/
│   ├── page.tsx          # Main library view
│   ├── admin/
│   │   └── page.tsx      # Admin interface
│   ├── layout.tsx        # Root layout with fonts
│   └── globals.css       # Global styles
├── components/
│   ├── Header.tsx        # Site header
│   ├── MediaPreview.tsx  # Media display area
│   ├── NavigationBar.tsx # Navigation buttons
│   ├── ContentTable.tsx  # Library table
│   └── ReadingView.tsx   # Book reading interface
├── data/
│   └── library.json      # Media library data
├── types/
│   └── media.ts          # TypeScript types
└── scripts/
    ├── process-pdf.js    # PDF processing script
    └── README.md         # Script documentation
```

## Adding Content

### Via Admin Interface

1. Go to `/admin`
2. Fill out the form
3. Copy the generated JSON
4. Add it to `data/library.json`

### Processing PDFs

```bash
npm install pdf-parse
node scripts/process-pdf.js <pdf-path> <output-name>
```

See `scripts/README.md` for details.

## Features

- ✅ Mobile-first design (402×874px)
- ✅ Three media types: Print, Video, Photo
- ✅ Search functionality (real-time filtering)
- ✅ "My Media" collection (localStorage)
- ✅ Reading view for books
- ✅ Expandable descriptions
- ✅ Admin interface
- ✅ PDF processing script
- ✅ Static export (GitHub Pages ready)

## Design Details

### Header
- EB Garamond 43px
- Blue square placeholder (35×35px)
- 0.5px lines above and below

### Media Preview Area
- ~328px height
- Shows PRINT/VIDEO/PHOTO navigation when empty
- Displays selected media (image/video)
- Photos support horizontal swipe

### Navigation Bar
- Home | Library | My Media | Search
- 0.5px vertical dividers
- 12px horizontal padding per button

### Content Table
- Three columns: Year | Name/Author | Media
- 4px vertical spacing between rows
- Blue highlight on selection
- Smooth slide-down for descriptions
- Hanging punctuation for titles

### Reading View
- Scalable text for legibility
- Chapter navigation
- Page counter
- Back/Next buttons
- Image footnote overlays

## Technology

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Fonts**: Google Fonts (EB Garamond, Xanh Mono)
- **Storage**: localStorage for user data
- **Export**: Static HTML/CSS/JS

## Browser Support

Optimized for mobile Safari and Chrome on iOS.

## License

Private project.
