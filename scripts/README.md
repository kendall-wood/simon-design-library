# PDF Processing Scripts

## Setup

Install the required dependency:

```bash
npm install pdf-parse
```

## Usage

### Process a PDF

```bash
node scripts/process-pdf.js <path-to-pdf> <output-name>
```

Example:
```bash
node scripts/process-pdf.js ~/Downloads/black-skin-white-masks.pdf fanon-black-skin
```

This will:
1. Extract all text from the PDF
2. Detect chapter structure automatically
3. Clean up OCR artifacts
4. Format the text for the reading view
5. Save the output to `data/<output-name>.json`

### Add to Library

After processing:

1. Open the generated JSON file in `data/`
2. Copy the `formattedContent` field
3. Add it to your media item in `data/library.json`:

```json
{
  "id": "5",
  "year": 1961,
  "title": "Black Skin, White Masks",
  "author": "Franz Fanon",
  "mediaType": "Book",
  "description": "...",
  "content": "<paste formattedContent here>",
  "totalPages": 251,
  "chapters": [
    {
      "number": 1,
      "title": "Chapter One",
      "startPage": 1,
      "endPage": 45
    }
  ]
}
```

## Features

### Automatic Chapter Detection

The script automatically detects:
- "Chapter 1", "Chapter One", etc.
- "CHAPTER 1", "CHAPTER ONE", etc.
- Numbered sections

### Text Cleaning

- Removes excessive whitespace
- Fixes common OCR errors
- Normalizes quotes and punctuation
- Preserves paragraph structure

### Image Handling

Images in PDFs are noted as footnotes in the text. When you see `[Image: page X]`, you can:
1. Extract the image manually from the PDF
2. Save it to `public/images/`
3. Add the reference in the reading view

## Future Enhancements

- Automatic image extraction
- Better chapter detection with ML
- Support for footnotes and citations
- Table of contents generation

