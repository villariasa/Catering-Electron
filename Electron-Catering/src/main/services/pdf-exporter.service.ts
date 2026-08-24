import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import type { Booking } from '../../preload/types';

function sanitizePdfText(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/₱/g, 'PHP ')
    .replace(/’/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/[^\x00-\x7F]/g, '');
}

export class PdfExporterService {
  /**
   * Export a multi-page printable Wall Calendar & Agenda PDF in 100% Landscape A4.
   */
  async exportCalendarPdf(savePath: string, year: number, month: number, bookings: Booking[], bizName = "Jayraldine's Catering"): Promise<boolean> {
    try {
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const monthName = months[month - 1] || 'August';

      // ── Page 1: Landscape Wall Calendar ────────────────────────────────────
      const page1 = pdfDoc.addPage(PageSizes.A4);
      page1.setSize(841.89, 595.28);
      const W = 841.89;
      const H = 595.28;
      const MX = 30;
      const MY = 25;
      const drawW = W - 2 * MX;

      // Header Bar (Dark Navy)
      const TITLE_H = 45;
      const titleY = H - MY - TITLE_H;
      page1.drawRectangle({
        x: MX,
        y: titleY,
        width: drawW,
        height: TITLE_H,
        color: rgb(15 / 255, 23 / 255, 42 / 255),
      });

      // Title Text
      page1.drawText(sanitizePdfText(`${monthName.toUpperCase()} ${year}`), {
        x: W / 2 - 80,
        y: titleY + 14,
        size: 20,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      page1.drawText(sanitizePdfText(bizName), {
        x: MX + drawW - 160,
        y: titleY + 16,
        size: 9,
        font: fontBold,
        color: rgb(147 / 255, 197 / 255, 253 / 255),
      });

      // Weekday Headers
      const WDAY_H = 20;
      const wdayY = titleY - WDAY_H;
      const colW = drawW / 7;
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

      page1.drawRectangle({
        x: MX,
        y: wdayY,
        width: drawW,
        height: WDAY_H,
        color: rgb(30 / 255, 41 / 255, 59 / 255),
      });

      days.forEach((d, i) => {
        page1.drawText(d, {
          x: MX + i * colW + colW / 2 - 20,
          y: wdayY + 6,
          size: 8,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      });

      // Month Grid Cells
      const nRows = 5;
      const availH = wdayY - MY - 15;
      const cellH = availH / nRows;

      let currentDay = 1;
      for (let r = 0; r < nRows; r++) {
        const rowBot = wdayY - (r + 1) * cellH;
        for (let c = 0; c < 7; c++) {
          if (currentDay > 31) break;
          const cx = MX + c * colW;
          const cy = rowBot;

          page1.drawRectangle({
            x: cx,
            y: cy,
            width: colW,
            height: cellH,
            borderColor: rgb(203 / 255, 213 / 255, 225 / 255),
            borderWidth: 0.5,
            color: rgb(1, 1, 1),
          });

          // Day number
          page1.drawText(String(currentDay), {
            x: cx + 6,
            y: cy + cellH - 16,
            size: 12,
            font: fontBold,
            color: rgb(15 / 255, 23 / 255, 42 / 255),
          });

          // Check bookings for day
          const dayStr = currentDay < 10 ? `0${currentDay}` : `${currentDay}`;
          const evs = (bookings || []).filter((b) => b && b.event_date && b.event_date.endsWith(`-${dayStr}`));
          if (evs.length > 0) {
            const totalPax = evs.reduce((s, b) => s + (b.pax || 0), 0);
            
            // Badge color based on pax
            let badgeBg = rgb(220 / 255, 252 / 255, 231 / 255); // Green
            let badgeTxt = rgb(21 / 255, 128 / 255, 61 / 255);
            if (totalPax >= 600) {
              badgeBg = rgb(254 / 255, 226 / 255, 226 / 255); // Red
              badgeTxt = rgb(185 / 255, 28 / 255, 28 / 255);
            } else if (totalPax >= 400) {
              badgeBg = rgb(254 / 255, 243 / 255, 199 / 255); // Amber
              badgeTxt = rgb(180 / 255, 83 / 255, 9 / 255);
            }

            page1.drawRectangle({
              x: cx + 4,
              y: cy + 6,
              width: colW - 8,
              height: cellH * 0.45,
              color: badgeBg,
            });

            page1.drawText(sanitizePdfText(`${evs.length} Booking${evs.length > 1 ? 's' : ''}`), {
              x: cx + 8,
              y: cy + cellH * 0.45 - 2,
              size: 8,
              font: fontBold,
              color: badgeTxt,
            });

            page1.drawText(sanitizePdfText(`${totalPax} Pax`), {
              x: cx + 8,
              y: cy + 10,
              size: 7,
              font: fontRegular,
              color: badgeTxt,
            });
          }

          currentDay++;
        }
      }

      // ── Page 2: Landscape Booking Agenda ──────────────────────────────────
      const page2 = pdfDoc.addPage(PageSizes.A4);
      page2.setSize(841.89, 595.28);

      // Header Bar
      page2.drawRectangle({
        x: MX,
        y: titleY,
        width: drawW,
        height: TITLE_H,
        color: rgb(15 / 255, 23 / 255, 42 / 255),
      });

      page2.drawText(sanitizePdfText(`BOOKING AGENDA - ${monthName.toUpperCase()} ${year}`), {
        x: W / 2 - 120,
        y: titleY + 14,
        size: 16,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      // Table Header
      const colX = [MX + 4, MX + 100, MX + 180, MX + 460, MX + 660, MX + 720];
      const hdrs = ['DATE & TIME', 'REF #', 'EVENT / CUSTOMER', 'VENUE', 'PAX', 'STATUS'];
      
      let tableY = titleY - 25;
      page2.drawRectangle({
        x: MX,
        y: tableY,
        width: drawW,
        height: 20,
        color: rgb(30 / 255, 41 / 255, 59 / 255),
      });

      hdrs.forEach((h, i) => {
        page2.drawText(h, {
          x: colX[i],
          y: tableY + 6,
          size: 8,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      });

      // Row Data
      let rowY = tableY - 24;
      (bookings || []).forEach((b: any, idx) => {
        if (rowY < MY + 20) return;

        const isEven = idx % 2 === 0;
        page2.drawRectangle({
          x: MX,
          y: rowY,
          width: drawW,
          height: 24,
          color: isEven ? rgb(1, 1, 1) : rgb(248 / 255, 250 / 255, 252 / 255),
        });

        const evDate = sanitizePdfText(b.event_date || '2026-08-28');
        const refStr = sanitizePdfText(b.booking_ref || b.booking_number || 'BK-2026-01');
        const custStr = sanitizePdfText(`${b.customer_name || 'Client'} (${b.occasion || b.event_type || 'Catering'})`);
        const venueStr = sanitizePdfText(b.venue || 'TBD Location').substring(0, 30);
        const paxStr = `${b.pax || 0} pax`;
        const statusStr = sanitizePdfText(b.status || 'CONFIRMED');

        page2.drawText(evDate, { x: colX[0], y: rowY + 7, size: 8, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
        page2.drawText(refStr, { x: colX[1], y: rowY + 7, size: 8, font: fontRegular, color: rgb(30 / 255, 41 / 255, 59 / 255) });
        page2.drawText(custStr, { x: colX[2], y: rowY + 7, size: 8, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
        page2.drawText(venueStr, { x: colX[3], y: rowY + 7, size: 8, font: fontRegular, color: rgb(71 / 255, 85 / 255, 105 / 255) });
        page2.drawText(paxStr, { x: colX[4], y: rowY + 7, size: 8, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
        page2.drawText(statusStr, { x: colX[5], y: rowY + 7, size: 8, font: fontBold, color: statusStr === 'CONFIRMED' ? rgb(22 / 255, 163 / 255, 74 / 255) : rgb(217 / 255, 119 / 255, 6 / 255) });

        rowY -= 24;
      });

      const pdfBytes = await pdfDoc.save();
      const parentDir = path.dirname(savePath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(savePath, pdfBytes);
      console.log(`[PdfExporterService] Landscape Wall Calendar PDF exported successfully to: ${savePath}`);
      return true;
    } catch (err) {
      console.error('[PdfExporterService] PDF export error:', err);
      return false;
    }
  }
}
