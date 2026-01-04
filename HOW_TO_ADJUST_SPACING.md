# How to Adjust Spacing & Design

## 🎯 Easy Configuration File

All spacing, sizes, and colors are now in **one easy file**:

```
app-src/config/design.ts
```

Open this file and change the numbers to adjust your design!

---

## 📝 What You Can Change

### **Colors**
```typescript
colors: {
  blue: '#0000ff',    // Change highlight color
  black: '#000000',   // Change text/line color
  white: '#ffffff',   // Change background
}
```

### **Header Spacing**
```typescript
header: {
  verticalPadding: 10,           // ↕️ Space above/below header
  horizontalPadding: 16,         // ↔️ Space from screen edges
  blueSquareSize: 35,            // Size of blue square
  gapBetweenSquareAndText: 10,  // Space between square and text
}
```

**Example:** Want more space above the header text?
- Change `verticalPadding: 10` to `verticalPadding: 15`

---

### **Media Preview Area**
```typescript
mediaPreview: {
  height: 328,           // Total height
  topPadding: 40,        // ↕️ Distance from top to PRINT/VIDEO/PHOTO
  leftPadding: 24,       // ↔️ Left spacing
  gapBetweenItems: 3,    // Space between PRINT, VIDEO, PHOTO lines
}
```

**Example:** Want PRINT/VIDEO/PHOTO lower down?
- Change `topPadding: 40` to `topPadding: 60`

---

### **Navigation Bar**
```typescript
navigationBar: {
  height: 32,                // Height of entire bar
  buttonLeftPadding: 24,     // ↔️ Left space inside buttons
  buttonRightPadding: 24,    // ↔️ Right space inside buttons
}
```

**Example:** Want more space inside buttons?
- Change `buttonLeftPadding: 24` to `buttonLeftPadding: 30`

---

### **Table Spacing**
```typescript
table: {
  yearColumnWidth: 50,         // Width of Year column
  mediaColumnWidth: 60,        // Width of Media column
  
  headerHeight: 24,            // Height of header row
  rowVerticalPadding: 4,       // ↕️ Space above/below text in rows (TIGHT!)
  
  columnLeftPadding: 6,        // ↔️ Left space in columns (MINIMAL!)
  columnRightPadding: 6,       // ↔️ Right space in columns (MINIMAL!)
  
  descriptionLeftPadding: 12,  // ↔️ Left space in descriptions
  descriptionTopPadding: 12,   // ↕️ Top space in descriptions
}
```

**Example:** Want more space between text and vertical lines?
- Change `columnLeftPadding: 6` to `columnLeftPadding: 12`

**Example:** Want taller rows?
- Change `rowVerticalPadding: 4` to `rowVerticalPadding: 8`

**Note:** Current values match your Figma - very tight and minimal!

---

### **Line Thickness**
```typescript
lineThickness: 0.5,  // All divider lines
```

**Example:** Want thicker lines?
- Change `lineThickness: 0.5` to `lineThickness: 1`

---

### **Typography**
```typescript
typography: {
  headerSize: 43,              // Header font size
  bodySize: 12,                // All other text
  bodyLineHeight: 14,          // Space between lines in table
  descriptionLineHeight: 18,   // Space between lines in descriptions
}
```

**Example:** Want bigger body text?
- Change `bodySize: 12` to `bodySize: 14`

---

## 🚀 How to Apply Changes

### **Step 1: Open the config file**
```bash
# Open in your code editor:
app-src/config/design.ts
```

### **Step 2: Change the numbers**
Just edit the numbers you want to change. For example:
```typescript
header: {
  verticalPadding: 15,  // Changed from 10 to 15
}
```

### **Step 3: Save the file**
Press `Cmd+S` (Mac) or `Ctrl+S` (Windows)

### **Step 4: See the changes**
The dev server will automatically reload. Refresh your browser to see the changes!

---

## 💡 Tips for Beginners

### **Understanding Measurements**
- All numbers are in **pixels (px)**
- Bigger number = more space
- Smaller number = less space

### **Padding vs Margin**
- **Padding**: Space *inside* an element (between content and border)
- **Margin**: Space *outside* an element (between elements)

### **Left/Right vs Top/Bottom**
- **Left/Right** (↔️): Horizontal spacing
- **Top/Bottom** (↕️): Vertical spacing

### **Common Adjustments**

**"Text is too close to lines"**
→ Increase padding numbers

**"Everything feels cramped"**
→ Increase all padding values by 4-8px

**"Too much white space"**
→ Decrease padding values by 4-8px

**"Rows are too tall"**
→ Decrease `rowVerticalPadding`

**"Rows are too short"**
→ Increase `rowVerticalPadding`

**"Columns are too narrow"**
→ Increase `yearColumnWidth` or `mediaColumnWidth`

---

## 🎨 Example Changes

### Make Everything More Spacious
```typescript
header: {
  verticalPadding: 15,        // was 10
  horizontalPadding: 20,      // was 16
}

table: {
  columnLeftPadding: 30,      // was 24
  rowVerticalPadding: 12,     // was 8
}
```

### Make Everything More Compact
```typescript
header: {
  verticalPadding: 6,         // was 10
  horizontalPadding: 12,      // was 16
}

table: {
  columnLeftPadding: 16,      // was 24
  rowVerticalPadding: 6,      // was 8
}
```

---

## ⚠️ Important Notes

1. **Don't delete any lines** - just change the numbers
2. **Keep the commas** at the end of each line
3. **Save the file** after making changes
4. **Refresh your browser** to see changes
5. **If something breaks**, just undo (Cmd+Z / Ctrl+Z) and try again

---

## 🆘 Need Help?

If you change something and it breaks:
1. Press `Cmd+Z` (Mac) or `Ctrl+Z` (Windows) to undo
2. Save the file
3. Refresh your browser

The original values are documented in this file, so you can always refer back!

---

## 📍 Quick Reference

**File location:** `app-src/config/design.ts`

**Most common adjustments:**
- `header.verticalPadding` - Space above/below header
- `table.columnLeftPadding` - Space from left edge of columns
- `table.rowVerticalPadding` - Height of rows
- `navigationBar.height` - Height of nav bar
- `mediaPreview.topPadding` - Position of PRINT/VIDEO/PHOTO

**After editing:**
1. Save file (Cmd+S / Ctrl+S)
2. Refresh browser

That's it! 🎉

