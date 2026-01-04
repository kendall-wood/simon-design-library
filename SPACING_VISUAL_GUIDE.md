# Visual Spacing Guide

## 📐 Where Each Setting Affects

```
┌─────────────────────────────────────┐ ← lineThickness (0.5px)
│                                     │
│  ■ Simon Design Library             │ ← header.verticalPadding (10px top/bottom)
│  ↑                                  │   header.horizontalPadding (16px left/right)
│  └─ header.gapBetweenSquareAndText  │   header.blueSquareSize (35x35px)
│                                     │
├─────────────────────────────────────┤ ← lineThickness (0.5px)
│                                     │
│  PRINT     ← mediaPreview.topPadding (40px from top)
│  VIDEO        mediaPreview.leftPadding (24px from left)
│  PHOTO        mediaPreview.gapBetweenItems (3px between)
│                                     │
│                                     │ ← mediaPreview.height (328px total)
│                                     │
├─────────────────────────────────────┤ ← lineThickness (0.5px)
│ Home │ Library │ My Media │ Search │ ← navigationBar.height (32px)
│  ↑                                  │   navigationBar.buttonLeftPadding (24px)
│  └─ navigationBar.buttonRightPadding│   navigationBar.buttonRightPadding (24px)
├──────┼──────────────────────┼───────┤ ← lineThickness (0.5px)
│ Year │ Name / Author        │ Media │ ← table.headerHeight (24px)
│  ↑   │  ↑                   │   ↑   │   table.columnLeftPadding (24px)
│  └───┼──└───────────────────┼───┘   │   table.columnRightPadding (12px)
├──────┼──────────────────────┼───────┤ ← lineThickness (0.5px)
│      │                      │       │
│ 1961 │ "Book Title"         │ Book  │ ← table.rowVerticalPadding (8px top/bottom)
│      │ Author Name          │       │   table.columnLeftPadding (24px left)
│      │                      │       │   table.columnRightPadding (12px right)
├──────┼──────────────────────┼───────┤
│      │                      │       │
│ Description text here...            │ ← table.descriptionLeftPadding (24px)
│                                     │   table.descriptionTopPadding (16px)
│ [Save to My Media]                  │   table.descriptionBottomPadding (16px)
│                                     │
└─────────────────────────────────────┘
```

---

## 🎯 Quick Adjustments

### Want More Space Around Text?
**Increase these:**
- `table.columnLeftPadding` (currently 24)
- `table.columnRightPadding` (currently 12)
- `table.rowVerticalPadding` (currently 8)

### Want Taller Rows?
**Increase:**
- `table.rowVerticalPadding` (currently 8)

### Want Wider Columns?
**Increase:**
- `table.yearColumnWidth` (currently 50)
- `table.mediaColumnWidth` (currently 60)

### Want More Space in Header?
**Increase:**
- `header.verticalPadding` (currently 10)
- `header.horizontalPadding` (currently 16)

### Want PRINT/VIDEO/PHOTO Lower?
**Increase:**
- `mediaPreview.topPadding` (currently 40)

---

## 📏 Measurement Reference

```
Padding = Space INSIDE an element
┌─────────────────────┐
│ ← padding →         │
│  Content Here       │
│         ← padding → │
└─────────────────────┘

Margin = Space OUTSIDE an element
┌─────────────────────┐
│  Element 1          │
└─────────────────────┘
       ↕ margin
┌─────────────────────┐
│  Element 2          │
└─────────────────────┘
```

---

## 🔢 Current Values at a Glance

| Setting | Value | What it does |
|---------|-------|--------------|
| `lineThickness` | 0.5px | All divider lines |
| `header.verticalPadding` | 10px | Space above/below header |
| `header.horizontalPadding` | 16px | Space from screen edges |
| `mediaPreview.height` | 328px | Preview area height |
| `mediaPreview.topPadding` | 40px | PRINT position from top |
| `navigationBar.height` | 32px | Nav bar height |
| `table.headerHeight` | 24px | Column header height |
| `table.rowVerticalPadding` | 8px | Row height (top+bottom) |
| `table.columnLeftPadding` | 24px | Space from left edge |
| `table.yearColumnWidth` | 50px | Year column width |
| `table.mediaColumnWidth` | 60px | Media column width |

---

## 💡 Pro Tips

1. **Make small changes** - Try +/- 4px at a time
2. **Test as you go** - Save and refresh after each change
3. **Keep it consistent** - Use multiples of 4 (4, 8, 12, 16, 20, 24...)
4. **Write down changes** - Note what you changed in case you want to undo

---

## 🎨 Common Scenarios

### "Text is touching the lines"
```typescript
table: {
  columnLeftPadding: 30,     // Increase from 24
  rowVerticalPadding: 10,    // Increase from 8
}
```

### "Everything feels too tight"
```typescript
header: {
  verticalPadding: 14,       // Increase from 10
}
table: {
  columnLeftPadding: 28,     // Increase from 24
  rowVerticalPadding: 10,    // Increase from 8
}
```

### "I want it exactly like Figma"
Open your Figma, measure the spacing, and enter those exact numbers!

---

**File to edit:** `app-src/config/design.ts`

