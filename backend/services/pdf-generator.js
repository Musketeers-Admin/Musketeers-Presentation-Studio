const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');

function hexToRgb(hex) {
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

const COLORS = {
  black: hexToRgb('0A0A0A'),
  white: hexToRgb('FFFFFF'),
  blue: hexToRgb('0D41FF'),
  yellow: hexToRgb('FFD81D'),
  red: hexToRgb('FC2E12'),
  green: hexToRgb('30E047'),
  gray: hexToRgb('6B7280'),
  lightGray: hexToRgb('F9FAFB'),
};

async function generatePDF({ slides: slideDataArray, clientName, outputPath }) {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const W = 960;
  const H = 540;

  for (const slideData of slideDataArray) {
    const page = pdfDoc.addPage([W, H]);
    const layout = slideData.layout || 'bullets';

    if (layout === 'cover') {
      // Black background
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COLORS.black });

      // Four dots
      const dots = [
        { color: COLORS.yellow, x: 48, y: H - 55 },
        { color: COLORS.red, x: 81, y: H - 55 },
        { color: COLORS.blue, x: 48, y: H - 88 },
        { color: COLORS.green, x: 81, y: H - 88 },
      ];
      dots.forEach(dot => {
        page.drawCircle({ x: dot.x, y: dot.y, size: 11, color: dot.color });
      });

      // Company name
      page.drawText('Design Musketeer', { x: 48, y: H - 130, size: 13, font: regularFont, color: COLORS.gray });

      // Title
      const title = (slideData.slide_title || clientName).substring(0, 50);
      const titleSize = title.length > 30 ? 36 : 44;
      page.drawText(title, { x: 48, y: H - 210, size: titleSize, font: boldFont, color: COLORS.white });

      // Subtitle
      if (slideData.slide_subtitle) {
        page.drawText(slideData.slide_subtitle.substring(0, 60), { x: 48, y: H - 270, size: 20, font: regularFont, color: COLORS.yellow });
      }

      // Footer
      const footer = `Design Musketeer x ${clientName}`;
      page.drawText(footer, { x: W / 2 - footer.length * 3, y: 18, size: 10, font: regularFont, color: COLORS.gray });

    } else if (layout === 'quote') {
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COLORS.lightGray });
      page.drawText('"', { x: 40, y: H - 100, size: 80, font: boldFont, color: COLORS.blue });

      const quoteText = (slideData.body_content?.[0] || '').substring(0, 200);
      // Word wrap manually
      const words = quoteText.split(' ');
      let line = '';
      let yPos = H - 180;
      words.forEach(word => {
        const testLine = line + (line ? ' ' : '') + word;
        if (testLine.length * 10 > W - 100) {
          if (line) page.drawText(line, { x: 70, y: yPos, size: 20, font: regularFont, color: COLORS.black });
          line = word;
          yPos -= 30;
        } else {
          line = testLine;
        }
      });
      if (line) page.drawText(line, { x: 70, y: yPos, size: 20, font: regularFont, color: COLORS.black });

      if (slideData.body_content?.[1]) {
        page.drawText(slideData.body_content[1].substring(0, 80), { x: 70, y: 80, size: 13, font: regularFont, color: COLORS.gray });
      }

      const footer = `Design Musketeer x ${clientName}`;
      page.drawText(footer, { x: W / 2 - footer.length * 3, y: 18, size: 10, font: regularFont, color: COLORS.gray });

    } else {
      // Default: white bg, bullets
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COLORS.white });

      // Blue accent bar
      page.drawRectangle({ x: 28, y: H - 88, width: 7, height: 52, color: COLORS.blue });

      // Title
      const title = (slideData.slide_title || '').substring(0, 50);
      page.drawText(title, { x: 50, y: H - 60, size: 26, font: boldFont, color: COLORS.black });

      // Subtitle
      let contentY = H - 100;
      if (slideData.slide_subtitle) {
        page.drawText(slideData.slide_subtitle.substring(0, 70), { x: 50, y: H - 90, size: 15, font: regularFont, color: COLORS.gray });
        contentY = H - 125;
      }

      // Bullets
      (slideData.body_content || []).slice(0, 8).forEach((item, i) => {
        const y = contentY - (i * 42);
        if (y > 50) {
          page.drawCircle({ x: 60, y: y + 6, size: 4, color: COLORS.blue });
          const text = item.substring(0, 90);
          page.drawText(text, { x: 75, y: y, size: 15, font: regularFont, color: COLORS.black });
        }
      });

      // Footer
      const footer = `Design Musketeer x ${clientName}`;
      page.drawText(footer, { x: W / 2 - footer.length * 3, y: 18, size: 10, font: regularFont, color: COLORS.gray });
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
  return outputPath;
}

module.exports = { generatePDF };
