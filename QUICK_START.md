# Quick Start Guide

## 🚀 Your Site is Running!

**Open in your browser:** http://localhost:3000

---

## 📱 Three Main Views

### 1. Library View (Main Page)
```
┌─────────────────────────────────────┐
│ ■ Simon Design Library              │ ← Header (EB Garamond 43px)
├─────────────────────────────────────┤
│                                     │
│  PRINT                              │ ← Media filter navigation
│  VIDEO                              │   (or preview when item selected)
│  PHOTO                              │
│                                     │
├─────────────────────────────────────┤
│ Home │ Library │ My Media │ Search │ ← Navigation bar
├──────┬──────────────────────┬───────┤
│ Year │ Name / Author        │ Media │ ← Table headers
├──────┼──────────────────────┼───────┤
│ 1961 │ "Book Title"         │ Book  │ ← Content rows
│      │ Author Name          │       │   (click to expand)
├──────┼──────────────────────┼───────┤
│ ...  │ ...                  │ ...   │
└──────┴──────────────────────┴───────┘
```

### 2. Reading View (Books)
```
┌─────────────────────────────────────┐
│ Back │ "Title" / Author             │ ← Blue header bar
├─────────────────────────────────────┤
│          Chapter One                │ ← Chapter title
├─────────────────────────────────────┤
│                                     │
│  Body text appears here...          │ ← Reading content
│  Formatted and justified...         │   (scalable)
│  Easy to read...                    │
│                                     │
├─────────────────────────────────────┤
│      Back      │      Next          │ ← Navigation
├────────────────┼────────────────────┤
│ 1 / 251        │ Chapter One        │ ← Page info
└────────────────┴────────────────────┘
```

### 3. Admin Interface
```
┌─────────────────────────────────────┐
│ Admin - Add Media                   │
│                                     │
│ Year:    [____]                     │
│ Title:   [____________________]     │
│ Author:  [____________________]     │
│ Type:    [Book ▼]                   │
│ Desc:    [____________________]     │
│          [____________________]     │
│                                     │
│ [Add Media Item]                    │
│                                     │
│ Instructions: ...                   │
└─────────────────────────────────────┘
```

---

## ⚡ Quick Actions

### View the Site
```bash
# Already running at:
http://localhost:3000
```

### Add Content
```bash
# Option 1: Use admin interface
open http://localhost:3000/admin

# Option 2: Edit directly
open app-src/data/library.json
```

### Process a PDF
```bash
cd app-src
npm install pdf-parse
npm run process-pdf ~/path/to/book.pdf book-name
```

### Add Images
```bash
# Place files in:
app-src/public/images/

# Reference in library.json:
"previewImage": "/images/author.jpg"
```

### Build for Production
```bash
cd app-src
npm run build
# Output in: ./out/
```

---

## 🎯 Try These Now

1. **Click on a book row** → See the description expand
2. **Click the preview area** → Enter reading mode
3. **Type in search** → Watch it filter in real-time
4. **Click "My Media"** → See your saved items
5. **Go to /admin** → Add new content

---

## 📂 Key Files

```
app-src/
├── data/library.json          ← Your content (edit this!)
├── public/images/             ← Your images (add here!)
├── app/page.tsx               ← Main page
├── app/admin/page.tsx         ← Admin interface
└── components/                ← UI components
    ├── Header.tsx
    ├── MediaPreview.tsx
    ├── NavigationBar.tsx
    ├── ContentTable.tsx
    └── ReadingView.tsx
```

---

## 🎨 Design Specs (Implemented)

- **Viewport**: 402 × 874px (mobile)
- **Header Font**: EB Garamond 43px
- **Body Font**: Xanh Mono 12px
- **Lines**: 0.5px everywhere
- **Spacing**: 12px base, 4px rows
- **Colors**: Black, White, Blue (#0000ff)

---

## 💡 Tips

### Testing on Mobile
1. Open Chrome DevTools (F12)
2. Click device icon (Ctrl+Shift+M)
3. Set to 402 × 874px
4. Or test on your actual iPhone!

### Adding Books
```json
{
  "id": "unique-id",
  "year": 1961,
  "title": "Book Title",
  "author": "Author Name",
  "mediaType": "Book",
  "description": "A short description...",
  "previewImage": "/images/author.jpg",
  "totalPages": 200,
  "content": "# Chapter One\n\nText here..."
}
```

### Saving User Data
- "My Media" uses localStorage
- Data persists in browser
- No backend needed

---

## 🐛 Troubleshooting

### Server won't start?
```bash
cd app-src
npm install
npm run dev
```

### Fonts not loading?
- Check internet connection
- Clear browser cache

### Images not showing?
- Ensure path starts with `/images/`
- Check file exists in `public/images/`

---

## 📚 More Help

- **SETUP.md** - Detailed setup guide
- **README.md** - Full documentation
- **PROJECT_SUMMARY.md** - Complete overview
- **CHECKLIST.md** - Feature checklist

---

## ✨ You're Ready!

Everything is set up and working. Start adding your content and make it yours!

**Happy archiving!** 📖

