import { jsPDF } from 'jspdf';
import { ChatMessage } from '../types';

// Helper to remove unsupported emojis & symbols that corrupt standard PDF fonts
const sanitizeTextForPDF = (text: string): string => {
  return text
    // Remove emojis and non-standard symbols
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // Clean specific unicode markers
    .replace(/💡|📌|⚙️|📊|🌐|📚|🌸|🚀|⚡|✨|🔍|📝|🛠️|✔|❌|⚠️/g, '')
    // Strip raw FLOW lines or technical internal markers
    .replace(/^.*FLOW:.*$/gm, '')
    .replace(/(?:\[[^\]]+\]\s*--\([^)]*\)-->\s*)+\[[^\]]+\]/gi, '')
    .replace(/--\([^)]*\)-->/g, '')
    .trim();
};

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
  doc.setFillColor(15, 23, 42); // Dark slate #0f172a
  doc.rect(0, 0, pageWidth, 26, 'F');

  // App Brand Logo & Title
  doc.setTextColor(6, 182, 212); // Cyan accent #06b6d4
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Talend AI — Documentation & Rapport d\'Expertise', margin, 12);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Document officiellement généré le ${dateStr}`, margin, 19);

  y = 34;

  // Session Topic Box
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  
  const displayTitle = sanitizeTextForPDF(sessionTitle || 'Session d\'échange Talend');
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

    // Check page overflow for message role header
    if (y > pageHeight - 30) {
      doc.addPage();
      y = margin;
    }

    // Sender Tag Header
    const roleTitle = isUser ? 'UTILISATEUR' : 'TALEND AI ASSISTANT';
    if (isUser) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setTextColor(30, 41, 59);
    } else {
      doc.setFillColor(236, 254, 255);
      doc.setDrawColor(165, 243, 252);
      doc.setTextColor(14, 116, 144);
    }

    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(roleTitle, margin + 3, y + 4.8);

    y += 11;

    // Clean text and split code blocks vs normal paragraphs
    const sanitizedRaw = sanitizeTextForPDF(
      msg.text.replace(/(?:###|\*\*|\n|^)\s*(?:💡\s*)?Questions complémentaires suggérées\s*:?[\s\S]*$/i, '')
    );

    // Split text into normal parts and code blocks (```code```)
    const blocks = sanitizedRaw.split(/(```[\s\S]*?```)/g);

    for (const block of blocks) {
      if (!block.trim()) continue;

      if (block.startsWith('```')) {
        // Render Code Block
        const codeLinesRaw = block
          .replace(/^```[a-zA-Z0-9]*\n?/, '')
          .replace(/\n?```$/, '')
          .split('\n');

        doc.setFont('courier', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);

        // Calculate code block height
        const wrappedCodeLines: string[] = [];
        for (const line of codeLinesRaw) {
          const split = doc.splitTextToSize(line, contentWidth - 10);
          wrappedCodeLines.push(...split);
        }

        const codeBoxHeight = wrappedCodeLines.length * 4.2 + 6;

        if (y + codeBoxHeight > pageHeight - 20) {
          doc.addPage();
          y = margin;
        }

        // Draw background box for code
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, y, contentWidth, codeBoxHeight, 1.5, 1.5, 'FD');

        let codeY = y + 4.5;
        for (const cLine of wrappedCodeLines) {
          doc.text(cLine, margin + 4, codeY);
          codeY += 4.2;
        }

        y += codeBoxHeight + 5;
      } else {
        // Render Normal Markdown Text Line by Line
        const paragraphs = block.split('\n');

        for (const paragraph of paragraphs) {
          const pTrimmed = paragraph.trim();
          if (!pTrimmed) {
            y += 2.5; // Small paragraph spacing
            continue;
          }

          // Check Page Overflow
          if (y > pageHeight - 20) {
            doc.addPage();
            y = margin;
          }

          // Headers formatting
          if (pTrimmed.startsWith('# ') || pTrimmed.startsWith('## ') || pTrimmed.startsWith('### ')) {
            const headingText = pTrimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10.5);
            doc.setTextColor(15, 23, 42);

            const hLines = doc.splitTextToSize(headingText, contentWidth - 4);
            for (const hL of hLines) {
              if (y > pageHeight - 20) {
                doc.addPage();
                y = margin;
              }
              doc.text(hL, margin + 2, y);
              y += 5.5;
            }
            y += 1.5;
          } else if (pTrimmed.startsWith('---')) {
            // Horizontal Rule
            doc.setDrawColor(226, 232, 240);
            doc.line(margin, y, margin + contentWidth, y);
            y += 4;
          } else {
            // Standard Text / Bullet point
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(51, 65, 85);

            let cleanLine = pTrimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
            const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ');
            if (isBullet) {
              cleanLine = '• ' + cleanLine.substring(2);
            }

            const pLines = doc.splitTextToSize(cleanLine, contentWidth - (isBullet ? 6 : 4));
            for (const line of pLines) {
              if (y > pageHeight - 20) {
                doc.addPage();
                y = margin;
              }
              doc.text(line, margin + (isBullet ? 5 : 2), y);
              y += 4.5;
            }
          }
        }
      }
    }

    y += 6; // Spacing between messages
  }

  // Footer with Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Talend AI — Document d'Expertise ETL • Page ${i} / ${totalPages}`,
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
