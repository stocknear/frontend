import jsPDF from 'jspdf';
import TurndownService from 'turndown';

// Initialize turndown service for HTML to markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '•',
  codeBlockStyle: 'fenced'
});

// Configure turndown to handle common HTML elements better
turndownService.addRule('removeClasses', {
  filter: (node) => {
    // Remove class attributes but keep the content
    if (node.getAttribute && node.getAttribute('class')) {
      node.removeAttribute('class');
    }
    return false;
  }
});

function convertHtmlToCleanText(content: string): string {
  try {
    // First convert HTML to markdown
    const markdown = turndownService.turndown(content);
    
    // Clean up common markdown patterns for better PDF display
    return markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/^#+\s/gm, '') // Remove heading markers but keep content
      .replace(/^>\s/gm, '') // Remove blockquote markers
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Convert links to just text
      .replace(/`([^`]+)`/g, '$1') // Remove inline code backticks
      .replace(/```[\s\S]*?```/g, '[Code Block]') // Replace code blocks
      .trim();
  } catch (error) {
    console.warn('Error converting HTML to text:', error);
    // Fallback: strip HTML tags manually
    return content
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'") // Replace &#39; with '
      .trim();
  }
}

interface Message {
  role: 'user' | 'system';
  content: string;
  sources?: Array<{
    name: string;
    description: string;
    ticker?: string;
    url?: string;
  }>;
}

interface ExportOptions {
  title?: string;
  timestamp?: string;
}

export async function exportChatToPDF(messages: Message[], options: ExportOptions = {}) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Add Stocknear branding header
  await addHeader(pdf, pageWidth, margin);
  yPosition = 55;

  // Title removed per user request - skip timestamp as well

  // Process messages
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }

    // Add message
    yPosition = await addMessage(pdf, message, margin, yPosition, contentWidth, pageHeight);
    
    // Add some spacing between messages
    yPosition += 8;
  }

  // Footer removed per user request

  return pdf;
}

async function addHeader(pdf: jsPDF, pageWidth: number, margin: number) {
  try {
    // Load and add the actual Stocknear logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = () => {
        console.warn('Failed to load Stocknear logo, using fallback');
        resolve(null);
      };
      logoImg.src = '/pwa-192x192.png';
    });
    
    // Set up sizing and positioning (left-aligned but vertically centered)
    const logoSize = 12;
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0); // Black color for Stocknear
    
    // Calculate vertical center alignment
    const textHeight = 28 * 0.352778; // Convert font size to mm (1 pt = 0.352778 mm)
    const logoY = margin + (textHeight - logoSize) / 2; // Center logo with text baseline
    const textY = margin + textHeight * 0.8; // Adjust text baseline for better visual alignment
    
    // Add logo image if loaded successfully (vertically centered)
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      pdf.addImage(logoImg, 'PNG', margin, logoY, logoSize, logoSize);
    } else {
      // Fallback: simple blue square
      pdf.setFillColor(59, 130, 246);
      pdf.rect(margin, logoY, logoSize, logoSize, 'F');
    }
    
    // Add brand name (aligned with logo)
    pdf.text('Stocknear', margin + logoSize + 6, textY);
    
  } catch (error) {
    console.warn('Error loading logo:', error);
    // Fallback with same alignment
    const logoSize = 12;
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const textHeight = 28 * 0.352778;
    const logoY = margin + (textHeight - logoSize) / 2;
    const textY = margin + textHeight * 0.8;
    
    // Fallback: simple blue square
    pdf.setFillColor(59, 130, 246);
    pdf.rect(margin, logoY, logoSize, logoSize, 'F');
    
    // Add brand name
    pdf.text('Stocknear', margin + logoSize + 6, textY);
  }
  
  // Add a subtle line under the header
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.5);
  pdf.line(margin, margin + 18, pageWidth - margin, margin + 18);
}

async function addMessage(
  pdf: jsPDF, 
  message: Message, 
  margin: number, 
  yPosition: number, 
  contentWidth: number, 
  pageHeight: number
): Promise<number> {
  const isUser = message.role === 'user';
  
  // Set role label styling
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0); // Black for both user and assistant
  
  const roleLabel = isUser ? 'You' : 'Stocknear AI';
  pdf.text(roleLabel, margin, yPosition);
  yPosition += 8;

  // Set content styling
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);

  // Convert HTML content to clean text
  const cleanContent = convertHtmlToCleanText(message.content);

  // Split and add content
  const contentLines = pdf.splitTextToSize(cleanContent, contentWidth);
  
  for (let j = 0; j < contentLines.length; j++) {
    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.text(contentLines[j], margin, yPosition);
    yPosition += 5;
  }

  // Add sources if available
  if (message.sources && message.sources.length > 0) {
    yPosition += 5;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Sources:', margin, yPosition);
    yPosition += 6;

    pdf.setFont('helvetica', 'normal');
    
    for (const source of message.sources) {
      if (yPosition > pageHeight - 25) {
        pdf.addPage();
        yPosition = margin;
      }
      
      const sourceText = `• ${source.name}${source.ticker ? ` (${source.ticker})` : ''}: ${source.description}`;
      const sourceLines = pdf.splitTextToSize(sourceText, contentWidth - 5);
      
      for (const line of sourceLines) {
        pdf.text(line, margin + 5, yPosition);
        yPosition += 4;
      }
    }
  }

  // Add a separator line after the message content
  yPosition += 5;
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPosition, margin + contentWidth, yPosition);
  yPosition += 3;

  return yPosition + 2;
}

// Footer function removed per user request

export async function downloadChatPDF(messages: Message[], filename?: string) {
  try {
    const pdf = await exportChatToPDF(messages, {});
    
    const finalFilename = filename || `stocknear-chat-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(finalFilename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

function getConversationTitle(messages: Message[]): string {
  // Get the first user message as the title, truncated
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (firstUserMessage) {
    const title = firstUserMessage.content.trim();
    return title.length > 60 ? title.substring(0, 60) + '...' : title;
  }
  return 'Chat Conversation';
}