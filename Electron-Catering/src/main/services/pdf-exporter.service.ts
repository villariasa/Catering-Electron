import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import type { Booking, Invoice, BusinessInfo } from '../../preload/types';

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

  /**
   * Generate a single-page A4 portrait payment receipt for an invoice.
   */
  async generateReceiptPdf(invoice: Invoice, business: BusinessInfo): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage(PageSizes.A4);
    const W = PageSizes.A4[0];
    const H = PageSizes.A4[1];
    const MX = 50;
    let y = H - 60;

    page.drawText(sanitizePdfText(business.name || "Jayraldine's Catering"), {
      x: MX, y, size: 20, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255),
    });
    y -= 18;
    page.drawText(sanitizePdfText(business.address || 'Cebu City, Philippines'), {
      x: MX, y, size: 9, font: fontRegular, color: rgb(71 / 255, 85 / 255, 105 / 255),
    });
    y -= 12;
    page.drawText(sanitizePdfText(`${business.contact || ''}  ${business.email || ''}`.trim()), {
      x: MX, y, size: 9, font: fontRegular, color: rgb(71 / 255, 85 / 255, 105 / 255),
    });

    y -= 40;
    page.drawRectangle({ x: MX, y: y - 6, width: W - 2 * MX, height: 1, color: rgb(203 / 255, 213 / 255, 225 / 255) });
    y -= 30;

    page.drawText('OFFICIAL RECEIPT', { x: MX, y, size: 16, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
    y -= 24;

    const rows: [string, string][] = [
      ['Invoice #', invoice.invoice_ref],
      ['Booking #', invoice.booking_ref],
      ['Customer', invoice.customer_name],
      ['Event Date', invoice.event_date],
      ['Status', invoice.status],
    ];
    for (const [label, value] of rows) {
      page.drawText(sanitizePdfText(label), { x: MX, y, size: 10, font: fontBold, color: rgb(71 / 255, 85 / 255, 105 / 255) });
      page.drawText(sanitizePdfText(value || '-'), { x: MX + 130, y, size: 10, font: fontRegular, color: rgb(15 / 255, 23 / 255, 42 / 255) });
      y -= 18;
    }

    y -= 20;
    page.drawRectangle({ x: MX, y: y - 6, width: W - 2 * MX, height: 1, color: rgb(203 / 255, 213 / 255, 225 / 255) });
    y -= 30;

    const amountRows: [string, number][] = [
      ['Total Amount', invoice.total_amount],
      ['Amount Paid', invoice.amount_paid],
      ['Balance Due', invoice.balance],
    ];
    for (const [label, amount] of amountRows) {
      page.drawText(sanitizePdfText(label), { x: MX, y, size: 11, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
      page.drawText(sanitizePdfText(`PHP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`), {
        x: MX + 300, y, size: 11, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255),
      });
      y -= 20;
    }

    y -= 30;
    page.drawText(sanitizePdfText(`Generated ${new Date().toLocaleString('en-PH')}`), {
      x: MX, y, size: 8, font: fontRegular, color: rgb(148 / 255, 163 / 255, 184 / 255),
    });

    return pdfDoc.save();
  }

  /**
   * Generate a single-page A4 portrait financial report PDF (KPIs + monthly revenue table).
   */
  async generateFinancialReportPdf(reportData: any, business: BusinessInfo, period: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = pdfDoc.addPage(PageSizes.A4);
    const W = PageSizes.A4[0];
    const H = PageSizes.A4[1];
    const MX = 50;
    let y = H - 60;

    page.drawText(sanitizePdfText(business.name || "Jayraldine's Catering"), { x: MX, y, size: 20, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
    y -= 20;
    page.drawText(sanitizePdfText(`Financial Report — ${period}`), { x: MX, y, size: 12, font: fontBold, color: rgb(71 / 255, 85 / 255, 105 / 255) });
    y -= 30;
    page.drawRectangle({ x: MX, y: y - 6, width: W - 2 * MX, height: 1, color: rgb(203 / 255, 213 / 255, 225 / 255) });
    y -= 26;

    const kpis: [string, string][] = [
      ['Total Bookings', String(reportData.totalBookings)],
      ['Total Revenue', `PHP ${reportData.totalRevenue.toLocaleString()}`],
      ['Total Pax', String(reportData.totalPax)],
      ['Unpaid Balance', `PHP ${reportData.unpaidTotal.toLocaleString()}`],
      ["Today's Bookings", String(reportData.todayBookings)],
      ["This Week's Bookings", String(reportData.weekBookings)],
    ];
    for (const [label, value] of kpis) {
      page.drawText(sanitizePdfText(label), { x: MX, y, size: 10, font: fontBold, color: rgb(71 / 255, 85 / 255, 105 / 255) });
      page.drawText(sanitizePdfText(value), { x: MX + 220, y, size: 10, font: fontRegular, color: rgb(15 / 255, 23 / 255, 42 / 255) });
      y -= 18;
    }

    y -= 16;
    page.drawText('Monthly Revenue (last 12 months)', { x: MX, y, size: 12, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
    y -= 20;
    for (const m of reportData.monthlyRevenue || []) {
      if (y < 60) break;
      page.drawText(sanitizePdfText(m.month), { x: MX, y, size: 9, font: fontRegular, color: rgb(71 / 255, 85 / 255, 105 / 255) });
      page.drawText(sanitizePdfText(`PHP ${m.revenue.toLocaleString()}`), { x: MX + 100, y, size: 9, font: fontRegular, color: rgb(15 / 255, 23 / 255, 42 / 255) });
      y -= 14;
    }

    page.drawText(sanitizePdfText(`Generated ${new Date().toLocaleString('en-PH')}`), { x: MX, y: 30, size: 8, font: fontRegular, color: rgb(148 / 255, 163 / 255, 184 / 255) });

    return pdfDoc.save();
  }

  /**
   * Generic multi-page A4 portrait table listing PDF (used by the AI's document-generation tool).
   */
  async generateTablePdf(title: string, columns: string[], rows: (string | number)[][], bizName = "Jayraldine's Catering"): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const W = PageSizes.A4[0];
    const H = PageSizes.A4[1];
    const MX = 40;
    const colW = (W - 2 * MX) / Math.max(1, columns.length);
    const rowH = 18;

    let page = pdfDoc.addPage(PageSizes.A4);
    let y = H - 50;

    const drawHeader = () => {
      page.drawText(sanitizePdfText(bizName), { x: MX, y, size: 14, font: fontBold, color: rgb(15 / 255, 23 / 255, 42 / 255) });
      y -= 18;
      page.drawText(sanitizePdfText(title), { x: MX, y, size: 11, font: fontBold, color: rgb(71 / 255, 85 / 255, 105 / 255) });
      y -= 22;
      page.drawRectangle({ x: MX, y: y - 4, width: W - 2 * MX, height: rowH, color: rgb(30 / 255, 41 / 255, 59 / 255) });
      columns.forEach((col, i) => {
        page.drawText(sanitizePdfText(col).toUpperCase(), { x: MX + i * colW + 4, y: y + 1, size: 7, font: fontBold, color: rgb(1, 1, 1) });
      });
      y -= rowH + 4;
    };

    drawHeader();

    rows.forEach((row, idx) => {
      if (y < 40) {
        page = pdfDoc.addPage(PageSizes.A4);
        y = H - 50;
        drawHeader();
      }
      if (idx % 2 === 0) {
        page.drawRectangle({ x: MX, y: y - 4, width: W - 2 * MX, height: rowH, color: rgb(248 / 255, 250 / 255, 252 / 255) });
      }
      row.forEach((cell, i) => {
        page.drawText(sanitizePdfText(String(cell ?? '')).slice(0, 40), { x: MX + i * colW + 4, y: y + 1, size: 7.5, font: fontRegular, color: rgb(30 / 255, 41 / 255, 59 / 255) });
      });
      y -= rowH;
    });

    return pdfDoc.save();
  }
}
