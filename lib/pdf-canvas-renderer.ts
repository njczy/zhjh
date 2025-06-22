/**
 * Canvas-based PDF renderer that mimics PDF.js structure
 * Provides better Chinese character support through Canvas rendering
 */

export class CanvasPDFDocument {
  private pages: HTMLCanvasElement[] = [];
  private currentCanvas: HTMLCanvasElement;
  private currentContext: CanvasRenderingContext2D;
  private pageWidth = 595; // A4 width in points
  private pageHeight = 842; // A4 height in points
  private scale = 2; // For higher quality
  private currentY = 0;
  private margin = 50;
  
  constructor() {
    this.currentCanvas = this.createPage();
    const ctx = this.currentCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.currentContext = ctx;
    this.setupContext();
  }
  
  private createPage(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.pageWidth * this.scale;
    canvas.height = this.pageHeight * this.scale;
    this.pages.push(canvas);
    return canvas;
  }
  
  private setupContext(): void {
    this.currentContext.scale(this.scale, this.scale);
    this.currentContext.fillStyle = '#ffffff';
    this.currentContext.fillRect(0, 0, this.pageWidth, this.pageHeight);
    this.currentContext.fillStyle = '#000000';
    this.currentY = this.margin;
  }
  
  addPage(): void {
    this.currentCanvas = this.createPage();
    const ctx = this.currentCanvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.currentContext = ctx;
    this.setupContext();
  }
  
  drawText(text: string, x: number, y: number, options: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    align?: CanvasTextAlign;
    maxWidth?: number;
  } = {}): number {
    const {
      fontSize = 12,
      fontFamily = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      color = '#000000',
      align = 'left',
      maxWidth
    } = options;
    
    this.currentContext.font = `${fontSize}px ${fontFamily}`;
    this.currentContext.fillStyle = color;
    this.currentContext.textAlign = align;
    this.currentContext.textBaseline = 'top';
    
    if (maxWidth) {
      // Wrap text
      const lines = this.wrapText(text, maxWidth, fontSize);
      const lineHeight = fontSize * 1.5;
      
      lines.forEach((line, index) => {
        this.currentContext.fillText(line, x, y + index * lineHeight);
      });
      
      return y + lines.length * lineHeight;
    } else {
      this.currentContext.fillText(text, x, y);
      return y + fontSize * 1.5;
    }
  }
  
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split('');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const char of words) {
      const testLine = currentLine + char;
      const metrics = this.currentContext.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  drawLine(x1: number, y1: number, x2: number, y2: number, options: {
    color?: string;
    width?: number;
  } = {}): void {
    const { color = '#000000', width = 1 } = options;
    
    this.currentContext.strokeStyle = color;
    this.currentContext.lineWidth = width;
    this.currentContext.beginPath();
    this.currentContext.moveTo(x1, y1);
    this.currentContext.lineTo(x2, y2);
    this.currentContext.stroke();
  }
  
  drawRect(x: number, y: number, width: number, height: number, options: {
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  } = {}): void {
    const { fillColor, strokeColor, strokeWidth = 1 } = options;
    
    if (fillColor) {
      this.currentContext.fillStyle = fillColor;
      this.currentContext.fillRect(x, y, width, height);
    }
    
    if (strokeColor) {
      this.currentContext.strokeStyle = strokeColor;
      this.currentContext.lineWidth = strokeWidth;
      this.currentContext.strokeRect(x, y, width, height);
    }
  }
  
  async addWatermark(text: string, options: {
    fontSize?: number;
    opacity?: number;
    angle?: number;
  } = {}): Promise<void> {
    const {
      fontSize = 48,
      opacity = 0.1,
      angle = -45
    } = options;
    
    this.currentContext.save();
    
    // Set opacity
    this.currentContext.globalAlpha = opacity;
    
    // Set font
    this.currentContext.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`;
    this.currentContext.fillStyle = '#cccccc';
    this.currentContext.textAlign = 'center';
    this.currentContext.textBaseline = 'middle';
    
    // Calculate center
    const centerX = this.pageWidth / 2;
    const centerY = this.pageHeight / 2;
    
    // Rotate and draw
    this.currentContext.translate(centerX, centerY);
    this.currentContext.rotate(angle * Math.PI / 180);
    
    // Draw watermark pattern
    const spacing = fontSize * 4;
    for (let x = -this.pageWidth; x < this.pageWidth; x += spacing * 2) {
      for (let y = -this.pageHeight; y < this.pageHeight; y += spacing) {
        this.currentContext.fillText(text, x, y);
      }
    }
    
    this.currentContext.restore();
  }
  
  async toBlob(): Promise<Blob> {
    // Combine all pages into a single PDF-like structure
    // For now, we'll create a multi-page image
    
    if (this.pages.length === 1) {
      return new Promise((resolve) => {
        this.pages[0].toBlob((blob) => {
          resolve(blob || new Blob());
        }, 'image/png', 0.95);
      });
    }
    
    // For multiple pages, create a combined canvas
    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = this.pageWidth * this.scale;
    combinedCanvas.height = this.pageHeight * this.scale * this.pages.length;
    
    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) return new Blob();
    
    // Draw all pages
    for (let i = 0; i < this.pages.length; i++) {
      ctx.drawImage(this.pages[i], 0, i * this.pageHeight * this.scale);
    }
    
    return new Promise((resolve) => {
      combinedCanvas.toBlob((blob) => {
        resolve(blob || new Blob());
      }, 'image/png', 0.95);
    });
  }
  
  // Convert to PDF using jsPDF as a fallback
  async toPDF(): Promise<Blob> {
    // Import jsPDF dynamically
    const jsPDF = (await import('jspdf')).default;
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [this.pageWidth, this.pageHeight]
    });
    
    // Add pages
    for (let i = 0; i < this.pages.length; i++) {
      if (i > 0) {
        pdf.addPage();
      }
      
      const imgData = this.pages[i].toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, this.pageWidth, this.pageHeight);
    }
    
    return pdf.output('blob');
  }
}

// Helper function to create a new document
export function createCanvasPDFDocument(): CanvasPDFDocument {
  return new CanvasPDFDocument();
}

// Format meeting group for display
const formatMeetingGroupForPDF = (groupKey: string): string => {
  const parts = groupKey.split("_");
  if (parts.length === 3) {
    const [date, , reviewer] = parts;
    return `${date} - ${reviewer}`;
  }
  return groupKey;
};

// Generate meeting minutes PDF
export const generateMeetingMinutesPDF = async (
  content: string,
  meetingGroup: string,
  meetingInfo?: { startTime: string; endTime: string; location: string }
): Promise<Blob> => {
  const doc = createCanvasPDFDocument();
  
  const leftMargin = 50;
  const pageWidth = 595;
  let currentY = 50;
  
  // Title
  currentY = doc.drawText(
    "会议纪要",
    pageWidth / 2,
    currentY,
    { fontSize: 20, align: 'center' }
  );
  
  currentY += 20;
  
  // Meeting info
  const meetingGroupFormatted = formatMeetingGroupForPDF(meetingGroup);
  currentY = doc.drawText(
    `会议: ${meetingGroupFormatted}`,
    leftMargin,
    currentY,
    { fontSize: 14 }
  );
  
  currentY += 10;
  
  // Meeting details if available
  if (meetingInfo) {
    const startDate = new Date(meetingInfo.startTime).toLocaleString("zh-CN");
    const endDate = new Date(meetingInfo.endTime).toLocaleString("zh-CN");
    
    currentY = doc.drawText(
      `时间: ${startDate} 至 ${endDate}`,
      leftMargin,
      currentY,
      { fontSize: 14 }
    );
    
    currentY += 10;
    
    currentY = doc.drawText(
      `地点: ${meetingInfo.location}`,
      leftMargin,
      currentY,
      { fontSize: 14 }
    );
  }
  
  // Add separator line
  currentY += 15;
  doc.drawLine(leftMargin, currentY, pageWidth - leftMargin, currentY);
  currentY += 15;
  
  // Add timestamp watermark
  const timestamp = new Date().toLocaleString("zh-CN");
  await doc.addWatermark(timestamp, {
    fontSize: 36,
    opacity: 0.08,
    angle: -45
  });
  
  // Content
  const paragraphs = content.split('\n').filter(p => p.trim());
  
  for (const paragraph of paragraphs) {
    // Check if we need a new page
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;
      
      // Add watermark to new page
      await doc.addWatermark(timestamp, {
        fontSize: 36,
        opacity: 0.08,
        angle: -45
      });
    }
    
    currentY = doc.drawText(
      paragraph,
      leftMargin,
      currentY,
      { fontSize: 12, maxWidth: pageWidth - 2 * leftMargin }
    );
    
    currentY += 10; // Paragraph spacing
  }
  
  // Try to convert to PDF, fallback to image
  try {
    return await doc.toPDF();
  } catch (error) {
    console.warn('Failed to generate PDF, falling back to image:', error);
    return await doc.toBlob();
  }
};

// Generate review summary PDF
export const generateReviewSummaryPDF = async (
  reviews: Array<{
    projectName: string;
    projectId: string;
    status: string;
    comments?: string;
    reviewer: string;
  }>,
  meetingGroup: string
): Promise<Blob> => {
  const doc = createCanvasPDFDocument();
  
  const leftMargin = 50;
  const pageWidth = 595;
  let currentY = 50;
  
  // Title
  currentY = doc.drawText(
    "评审意见汇总表",
    pageWidth / 2,
    currentY,
    { fontSize: 18, align: 'center' }
  );
  
  currentY += 15;
  
  // Meeting info
  const meetingGroupFormatted = formatMeetingGroupForPDF(meetingGroup);
  currentY = doc.drawText(
    `会议: ${meetingGroupFormatted}`,
    leftMargin,
    currentY,
    { fontSize: 14 }
  );
  
  currentY += 20;
  
  // Table headers
  const headers = ["项目名称", "项目编号", "评审结果", "评审意见"];
  const columnWidths = [160, 80, 80, 150];
  const startX = leftMargin;
  
  // Draw header background
  doc.drawRect(startX, currentY - 5, pageWidth - 2 * leftMargin, 25, {
    fillColor: '#f0f0f0'
  });
  
  // Draw headers
  let headerX = startX;
  for (let i = 0; i < headers.length; i++) {
    doc.drawText(
      headers[i],
      headerX + 5,
      currentY,
      { fontSize: 12 }
    );
    headerX += columnWidths[i];
  }
  
  currentY += 25;
  doc.drawLine(startX, currentY, pageWidth - leftMargin, currentY);
  currentY += 10;
  
  // Table content
  for (const review of reviews) {
    // Check if we need a new page
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;
      
      // Redraw headers
      doc.drawRect(startX, currentY - 5, pageWidth - 2 * leftMargin, 25, {
        fillColor: '#f0f0f0'
      });
      
      headerX = startX;
      for (let i = 0; i < headers.length; i++) {
        doc.drawText(
          headers[i],
          headerX + 5,
          currentY,
          { fontSize: 12 }
        );
        headerX += columnWidths[i];
      }
      
      currentY += 25;
      doc.drawLine(startX, currentY, pageWidth - leftMargin, currentY);
      currentY += 10;
    }
    
    const statusText = review.status === "已评审" ? "通过" : 
                       review.status === "已驳回" ? "不通过" : "待评审";
    const comments = review.comments || "无";
    
    // Draw row
    let cellX = startX;
    
    // Project name
    const projectName = review.projectName.length > 20 
      ? review.projectName.slice(0, 20) + "..." 
      : review.projectName;
    
    doc.drawText(
      projectName,
      cellX + 5,
      currentY,
      { fontSize: 10 }
    );
    cellX += columnWidths[0];
    
    // Project ID
    doc.drawText(
      review.projectId,
      cellX + 5,
      currentY,
      { fontSize: 10 }
    );
    cellX += columnWidths[1];
    
    // Status
    doc.drawText(
      statusText,
      cellX + 5,
      currentY,
      { fontSize: 10 }
    );
    cellX += columnWidths[2];
    
    // Comments
    const truncatedComments = comments.length > 30 
      ? comments.slice(0, 30) + "..." 
      : comments;
    
    doc.drawText(
      truncatedComments,
      cellX + 5,
      currentY,
      { fontSize: 10 }
    );
    
    currentY += 20;
    
    // Draw row separator
    doc.drawLine(startX, currentY, pageWidth - leftMargin, currentY, {
      color: '#e0e0e0'
    });
    currentY += 5;
  }
  
  try {
    return await doc.toPDF();
  } catch (error) {
    console.warn('Failed to generate PDF, falling back to image:', error);
    return await doc.toBlob();
  }
};

// Generate approval report PDF
export const generateApprovalReportPDF = async (
  reviews: Array<{
    projectName: string;
    projectId: string;
    status: string;
    comments?: string;
  }>,
  meetingGroup: string,
  approvalContent?: string
): Promise<Blob> => {
  const doc = createCanvasPDFDocument();
  
  const leftMargin = 50;
  const pageWidth = 595;
  let currentY = 50;
  
  // Title
  currentY = doc.drawText(
    "批复报告",
    pageWidth / 2,
    currentY,
    { fontSize: 20, align: 'center' }
  );
  
  currentY += 20;
  
  // Meeting info
  const meetingGroupFormatted = formatMeetingGroupForPDF(meetingGroup);
  currentY = doc.drawText(
    `评审会议: ${meetingGroupFormatted}`,
    leftMargin,
    currentY,
    { fontSize: 14 }
  );
  
  currentY += 10;
  
  // Date
  currentY = doc.drawText(
    `日期: ${new Date().toLocaleDateString("zh-CN")}`,
    leftMargin,
    currentY,
    { fontSize: 14 }
  );
  
  currentY += 20;
  
  // Summary statistics box
  const summaryHeight = 80;
  doc.drawRect(leftMargin, currentY, pageWidth - 2 * leftMargin, summaryHeight, {
    fillColor: '#f5f5f5',
    strokeColor: '#e0e0e0'
  });
  
  currentY += 10;
  
  const passedProjects = reviews.filter(r => r.status === "已评审").length;
  const rejectedProjects = reviews.filter(r => r.status === "已驳回").length;
  
  currentY = doc.drawText(
    `评审项目总数: ${reviews.length}`,
    leftMargin + 10,
    currentY,
    { fontSize: 12 }
  );
  
  currentY += 5;
  
  currentY = doc.drawText(
    `通过项目数: ${passedProjects}`,
    leftMargin + 10,
    currentY,
    { fontSize: 12 }
  );
  
  currentY += 5;
  
  currentY = doc.drawText(
    `未通过项目数: ${rejectedProjects}`,
    leftMargin + 10,
    currentY,
    { fontSize: 12 }
  );
  
  currentY += 20;
  
  // Approval content
  if (approvalContent) {
    currentY = doc.drawText(
      "批复内容:",
      leftMargin,
      currentY,
      { fontSize: 14 }
    );
    
    currentY += 15;
    
    // Split content into paragraphs
    const paragraphs = approvalContent.split('\n').filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      // Check if we need a new page
      if (currentY > 750) {
        doc.addPage();
        currentY = 50;
      }
      
      currentY = doc.drawText(
        paragraph,
        leftMargin,
        currentY,
        { fontSize: 12, maxWidth: pageWidth - 2 * leftMargin }
      );
      
      currentY += 10;
    }
  }
  
  try {
    return await doc.toPDF();
  } catch (error) {
    console.warn('Failed to generate PDF, falling back to image:', error);
    return await doc.toBlob();
  }
};

// Download helper
export const downloadPDF = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};