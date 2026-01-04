/**
 * SIMON DESIGN LIBRARY - DESIGN CONFIGURATION
 * 
 * Edit these numbers to adjust spacing, sizes, and colors throughout the site.
 * All measurements are in pixels (px).
 */

export const DESIGN_CONFIG = {
  
  // ============================================
  // COLORS
  // ============================================
  colors: {
    blue: '#0000ff',        // Highlight color
    black: '#000000',       // Text and lines
    white: '#ffffff',       // Background
  },

  // ============================================
  // VIEWPORT (Mobile size)
  // ============================================
  viewport: {
    width: 402,             // Screen width
    height: 874,            // Screen height
  },

  // ============================================
  // LINE THICKNESS
  // ============================================
  lineThickness: 0.5,       // All divider lines (0.5px)

  // ============================================
  // TYPOGRAPHY
  // ============================================
  typography: {
    // Header
    headerSize: 39,         // "Simon Design Library" font size (reduced to fit)
    headerLineHeight: 39,   // Header line height
    
    // Body text
    bodySize: 12,           // All other text font size
    bodyLineHeight: 14,     // Line height for table rows
    descriptionLineHeight: 18, // Line height for descriptions
  },

  // ============================================
  // HEADER SECTION
  // ============================================
  header: {
    verticalPadding: 0,    // Space above/below header content
    horizontalPadding: 16,  // Space from left/right edges
    blueSquareSize: 39,     // Size of walking SVG (35px height)
    gapBetweenSquareAndText: 0, // Space between SVG and text
  },

  // ============================================
  // MEDIA PREVIEW AREA
  // ============================================
  mediaPreview: {
    height: 328,            // Total height of preview area
    topPadding: 40,         // Distance from top to PRINT/VIDEO/PHOTO
    leftPadding: 24,        // Left padding for navigation text
    rightPadding: 16,       // Right padding
    gapBetweenItems: 3,     // Space between PRINT, VIDEO, PHOTO
  },

  // ============================================
  // NAVIGATION BAR
  // ============================================
  navigationBar: {
    height: 32,             // Height of nav bar
    buttonLeftPadding: 16,  // Left padding inside buttons
    buttonRightPadding: 16, // Right padding inside buttons
    searchLeftPadding: 32,  // Left padding in search input
    searchRightPadding: 16, // Right padding in search input
  },

  // ============================================
  // CONTENT TABLE
  // ============================================
  table: {
    // Column widths
    yearColumnWidth: 50,    // Year column width
    mediaColumnWidth: 90,   // Media column width
    // Name/Author column is flexible (flex-1)
    
    // Header row
    headerHeight: 32,       // Height of "Year | Name/Author | Media" row
    
    // Content rows
    rowVerticalPadding: 6,  // Padding above/below row content (TIGHT like Figma)
    
    // Column padding (MINIMAL like Figma)
    columnLeftPadding: 6,   // Left padding in each column (very close to line)
    columnRightPadding: 6,  // Right padding in each column
    
    // Expanded description
    descriptionLeftPadding: 12,   // Left padding
    descriptionRightPadding: 32,  // Right padding
    descriptionTopPadding: 12,    // Top padding
    descriptionBottomPadding: 12, // Bottom padding
    descriptionMarginBottom: 12,  // Space between text and button
    
    // Save button
    saveButtonLeftPadding: 12,    // Button left padding
    saveButtonRightPadding: 12,   // Button right padding
    saveButtonTopPadding: 4,      // Button top padding
    saveButtonBottomPadding: 4,   // Button bottom padding
  },

  // ============================================
  // READING VIEW
  // ============================================
  readingView: {
    // Top bar (blue with title/author)
    topBarHeight: 48,           // Height of blue top bar
    topBarPaddingHorizontal: 16, // Left/right padding
    topBarPaddingVertical: 8,    // Top/bottom padding
    
    // Chapter title section
    chapterTitleHeight: 40,      // Height of chapter title area
    chapterTitlePadding: 12,     // Padding around chapter title
    
    // Body text area
    bodyPaddingHorizontal: 24,   // Left/right padding for text
    bodyPaddingVertical: 16,     // Top/bottom padding for text
    bodyTextSize: 14,            // Font size for body text
    bodyLineHeight: 18,          // Line height for body text
    paragraphSpacing: 16,        // Space between paragraphs
    
    // Navigation footer (Back | Next)
    navHeight: 40,               // Height of Back/Next buttons
    navButtonPadding: 12,        // Padding inside nav buttons
    
    // Page info footer (page number | chapter name)
    footerHeight: 48,            // Height of page info footer
    footerPadding: 16,           // Padding in footer
    footerTextSize: 12,          // Font size for page numbers
  },

  // ============================================
  // ANIMATIONS
  // ============================================
  animations: {
    slideDownDuration: 300, // Duration in milliseconds (0.3s)
  },
};

// Export individual sections for easier imports
export const { colors, viewport, lineThickness, typography, header, mediaPreview, navigationBar, table, readingView, animations } = DESIGN_CONFIG;

