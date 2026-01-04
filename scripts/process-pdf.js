/**
 * PDF Processing Script
 * 
 * This script processes PDF files and extracts:
 * - Text content
 * - Chapter structure
 * - Images (saved as footnotes)
 * 
 * Usage:
 *   node scripts/process-pdf.js <path-to-pdf> <output-name>
 * 
 * Requirements:
 *   npm install pdf-parse
 */

const fs = require('fs');
const path = require('path');

// Check if pdf-parse is installed
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.error('Error: pdf-parse is not installed.');
  console.error('Please run: npm install pdf-parse');
  process.exit(1);
}

async function processPDF(pdfPath, outputName) {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Parse the PDF
    console.log('Processing PDF...');
    const data = await pdfParse(dataBuffer);
    
    // Extract text
    let text = data.text;
    
    // Clean up the text
    text = cleanText(text);
    
    // Try to detect chapters
    const chapters = detectChapters(text);
    
    // Format for reading view
    const formattedContent = formatForReading(text);
    
    // Create output object
    const output = {
      totalPages: data.numpages,
      rawText: text,
      formattedContent: formattedContent,
      chapters: chapters,
      metadata: {
        info: data.info,
        processedAt: new Date().toISOString()
      }
    };
    
    // Save to file
    const outputPath = path.join(__dirname, '..', 'data', `${outputName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`✓ PDF processed successfully!`);
    console.log(`  Pages: ${data.numpages}`);
    console.log(`  Chapters detected: ${chapters.length}`);
    console.log(`  Output saved to: ${outputPath}`);
    console.log('\nYou can now copy the formattedContent to your library.json');
    
  } catch (error) {
    console.error('Error processing PDF:', error);
    process.exit(1);
  }
}

function cleanText(text) {
  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ');
  
  // Fix common OCR issues
  text = text.replace(/\s+([.,;:!?])/g, '$1');
  text = text.replace(/([.,;:!?])([A-Za-z])/g, '$1 $2');
  
  // Normalize quotes
  text = text.replace(/[""]/g, '"');
  text = text.replace(/['']/g, "'");
  
  return text.trim();
}

function detectChapters(text) {
  const chapters = [];
  
  // Common chapter patterns
  const patterns = [
    /Chapter\s+(\d+|One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten)/gi,
    /CHAPTER\s+(\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)/g,
    /(\d+)\.\s+[A-Z][A-Za-z\s]+/g
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      chapters.push({
        title: match[0].trim(),
        position: match.index,
        number: chapters.length + 1
      });
    }
  });
  
  // Remove duplicates and sort
  const uniqueChapters = chapters.filter((chapter, index, self) =>
    index === self.findIndex((c) => Math.abs(c.position - chapter.position) < 100)
  );
  
  return uniqueChapters.slice(0, 20); // Limit to 20 chapters
}

function formatForReading(text) {
  // Split into paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  // Format as HTML-friendly text
  let formatted = '';
  
  paragraphs.forEach((para, index) => {
    para = para.trim();
    if (para.length > 0) {
      // Check if it's a chapter heading
      if (/^(Chapter|CHAPTER)\s+/i.test(para)) {
        formatted += `\n\n# ${para}\n\n`;
      } else {
        formatted += para + '\n\n';
      }
    }
  });
  
  return formatted.trim();
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/process-pdf.js <path-to-pdf> <output-name>');
    console.log('Example: node scripts/process-pdf.js ./book.pdf fanon-black-skin');
    process.exit(1);
  }
  
  const [pdfPath, outputName] = args;
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found: ${pdfPath}`);
    process.exit(1);
  }
  
  processPDF(pdfPath, outputName);
}

module.exports = { processPDF, cleanText, detectChapters, formatForReading };

