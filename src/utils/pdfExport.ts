import { jsPDF } from 'jspdf';
import { ChatMessage } from '../types';

export const exportSessionToPDF = (sessionTitle: string, messages: ChatMessage[]) => {
  if (!messages || messages.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = 0;

  // Header Banner Background
  doc.setFillColor(23, 23, 23); // Dark background #171717
  doc.rect(0, 0, pageWidth, 26, 'F');

  // App Brand Logo & Title
  doc.setTextColor(0, 210, 230); // Cyan accent
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Talend AI — Expertise & Documentation', margin, 12);

  doc.setTextColor(160, 160, 160);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rapport d'échange généré le ${new Date().toLocaleString('fr-FR')}`, margin, 19);

  y = 34;

  // Session Topic Box
  doc.setFillColor(245, 247, 250);
  doc.setDrawColor(220, 226, 235);
  
  const displayTitle = sessionTitle || 'Session d\'échange Talend';
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(`Sujet : ${displayTitle}`, contentWidth - 8);
  const titleBoxHeight = titleLines.length * 5.5 + 8;

  doc.roundedRect(margin, y, contentWidth, titleBoxHeight, 2, 2, 'FD');
  
  doc.setTextColor(30, 41, 59);
  doc.text(titleLines, margin + 4, y + 6);

  y += titleBoxHeight + 10;

  // Loop through messages
  for (let idx = 0; idx < messages.length; idx++) {
    const msg = messages[idx];
    const isUser = msg.sender === 'user';

    // Page overflow check for message header
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }

    // Sender Tag Header
    const roleTitle = isUser ? 'UTILISATEUR' : 'TALEND AI ASSISTANT';
    if (isUser) {
      doc.setFillColor(240, 243, 248);
      doc.setDrawColor(200, 210, 225);
      doc.setTextColor(30, 50, 90);
    } else {
      doc.setFillColor(232, 246, 252);
      doc.setDrawColor(180, 225, 242);
      doc.setTextColor(0, 110, 155);
    }

    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(roleTitle, margin + 3, y + 4.8);

    y += 10;

    // Clean Markdown and formatting symbols for clean text presentation in PDF
    const cleanMsgText = msg.text
      .replace(/(?:###|\*\*|\n|^)\s*(?:💡\s*)?Questions complémentaires suggérées\s*:?[\s\S]*$/i, '')
      .replace(/^.*FLOW:.*$/gm, '')
      .replace(/(?:\[[^\]]+\]\s*--\([^)]*\)-->\s*)+\[[^\]]+\]/gi, '')
      .replace(/--\([^)]*\)-->/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/###\s*(.*)/g, '• $1')
      .replace(/##\s*(.*)/g, '• $1')
      .replace(/#\s*(.*)/g, '• $1')
      .replace(/`{3}[\s\S]*?`{3}/g, (match) => {
        return '\n' + match.replace(/`{3}\w*\n?/g, '').trim() + '\n';
      })
      .replace(/`(.*?)`/g, '$1')
      .trim();

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(45, 55, 72);

    const lines = doc.splitTextToSize(cleanMsgText, contentWidth - 4);

    for (const line of lines) {
      if (y > pageHeight - 18) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin + 2, y);
      y += 4.8;
    }

    y += 7; // Spacing between messages
  }

  // Footer with Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Talend AI — Session d'Expertise • Page ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // Download PDF file
  const fileSlug = displayTitle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 35) || 'session_talend';

  doc.save(`Talend_AI_${fileSlug}.pdf`);
};
