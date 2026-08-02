import type { BulkOrder, BulkOrderItem } from '../types';

// Light theme — zuso-ledger style: "Green and White Simple Modern"
const DARK: [number, number, number] = [51, 51, 51];
const GREEN: [number, number, number] = [139, 154, 70];
const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];
const GRAY: [number, number, number] = [120, 120, 120];
const BORDER: [number, number, number] = [221, 221, 221];
const LIGHT_GREEN: [number, number, number, number] = [139, 154, 70, 0.08];

function money(n: number): string {
  return `RM ${Number(n || 0).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(d: string): string {
  if (!d) return '';
  const date = new Date(d);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export async function generateBulkOrderPdf(
  order: BulkOrder,
  sellerEmail: string,
): Promise<string> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - 14;
  const items = (order.items || []) as BulkOrderItem[];

  // Helper: filled rounded rect
  function filledRect(x: number, y: number, w: number, h: number, color: readonly number[], radius = 0) {
    doc.setFillColor(...color);
    if (radius > 0) doc.roundedRect(x, y, w, h, radius, radius, 'F');
    else doc.rect(x, y, w, h, 'F');
  }

  // ═══════════════════ 1. HEADER ═══════════════════
  const HEADER_H = 38;
  filledRect(0, 0, pageWidth, HEADER_H, DARK);

  // Logo box
  doc.setFillColor(...WHITE);
  doc.roundedRect(14, 9, 20, 20, 3, 3, 'FD');

  // Company
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.text('ZUSO Pharma', 38, 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('by Leverage Medical Sdn. Bhd.', 38, 22);
  doc.text('FDA Approved · MAL Regulated · Sterile A — Rx Only', 38, 26);

  // INVOICE title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', right, 19, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('BULK PEN ORDER', right, 26, { align: 'right' });

  // ═══════════════════ 2. INFO ═══════════════════
  const INFO_Y = HEADER_H + 6;

  // Order info
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('ORDER #', 14, INFO_Y);
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.text(order.id.slice(0, 8).toUpperCase(), 14, INFO_Y + 5);

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('DATE:', 14, INFO_Y + 11);
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(formatDate(order.created_at), 14, INFO_Y + 15);

  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('SELLER CODE:', 14, INFO_Y + 21);
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(order.seller_code, 14, INFO_Y + 25);

  // BILL TO
  const BT_X = 100;
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('BILL TO', BT_X, INFO_Y);
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'bold');
  doc.text(sellerEmail, BT_X, INFO_Y + 5);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${order.status.replace(/_/g, ' ').toUpperCase()}`, BT_X, INFO_Y + 10);

  // ═══════════════════ 3. TABLE ═══════════════════
  const TABLE_Y = INFO_Y + 33;

  const tableBody = items.map((it, i) => [
    String(i + 1),
    `${it.brand === 'atheryx' ? 'ATHERYX' : 'ELYSION'} ${it.peptide}`,
    `${it.dosage_mg}mg`,
    String(it.quantity),
    money(it.unit_retail_myr),
    money(it.unit_cost_myr),
    money(it.unit_cost_myr * it.quantity),
  ]);

  autoTable(doc, {
    startY: TABLE_Y,
    head: [['NO', 'PRODUCT', 'DOSE', 'QTY', 'RETAIL', 'COST/UNIT', 'TOTAL']],
    body: tableBody,
    headStyles: {
      fillColor: GREEN,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left' as const,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' as const },
      1: { cellWidth: 'auto' as const, halign: 'left' as const },
      2: { cellWidth: 16, halign: 'center' as const },
      3: { cellWidth: 12, halign: 'center' as const },
      4: { cellWidth: 24, halign: 'right' as const },
      5: { cellWidth: 24, halign: 'right' as const },
      6: { cellWidth: 28, halign: 'right' as const },
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      textColor: [...BLACK],
    },
    alternateRowStyles: { fillColor: [248, 249, 245] },
    styles: { lineColor: BORDER, lineWidth: 0.3 },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 6;

  // ═══════════════════ 4. TOTALS ═══════════════════
  const TOTALS_X = 110;
  const AMOUNT_X = right;

  const drawLine = (label: string, amount: number, opts: {
    color?: readonly number[]; bold?: boolean; size?: number; bgColor?: readonly number[];
  } = {}) => {
    const fs = opts.size ?? 9;
    if (opts.bgColor) {
      doc.setFillColor(...opts.bgColor);
      doc.rect(TOTALS_X - 2, finalY - 2, AMOUNT_X - TOTALS_X + 3, fs + 5, 'F');
    }
    doc.setFontSize(fs);
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setTextColor(...(opts.color ?? BLACK));
    doc.text(label, TOTALS_X, finalY, { align: 'left' });
    doc.text(money(amount), AMOUNT_X, finalY, { align: 'right' });
    finalY += fs + 3;
  };

  drawLine('Retail Value', order.total_retail_myr, { color: GRAY });
  drawLine('Cost Price', order.total_cost_myr, { color: GREEN, bold: true, size: 11 });

  const savings = order.total_retail_myr - order.total_cost_myr;
  if (savings > 0) {
    drawLine('You Save', -savings, { color: [180, 60, 60], size: 9 });
  }

  finalY += 4;

  // Separator
  doc.setDrawColor(...BORDER);
  doc.line(TOTALS_X, finalY, AMOUNT_X, finalY);
  finalY += 3;

  // Total Due
  drawLine('Total Due', order.total_cost_myr, {
    bold: true, size: 12, color: GREEN, bgColor: LIGHT_GREEN,
  });

  finalY += 8;

  // ═══════════════════ 5. PAYMENT METHOD ═══════════════════
  if (finalY > pageHeight - 70) { doc.addPage(); finalY = 20; }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLACK);
  doc.text('PAYMENT METHOD', 14, finalY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  let py = finalY + 6;
  doc.text('Bank: Maybank', 14, py); py += 4.5;
  doc.text('Account Name: LEVERAGE MEDICAL SDN BHD', 14, py); py += 4.5;
  doc.text('Account Number: 556011164525', 14, py);

  // Terms
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS', 100, finalY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text('Stock will be prepared after payment is confirmed.', 100, finalY + 6);
  doc.text('Please email your receipt to admin@zusopharma.com', 100, finalY + 11);

  finalY = Math.max(finalY + 30, py + 10);

  // ═══════════════════ 6. FOOTER ═══════════════════
  const FOOTER_H = 22;
  if (finalY > pageHeight - FOOTER_H - 10) { doc.addPage(); }

  filledRect(0, pageHeight - FOOTER_H, pageWidth, FOOTER_H, DARK);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('THANK YOU FOR YOUR ORDER', 14, pageHeight - FOOTER_H + 9);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('ZUSO Pharma — FDA Approved · MAL Regulated · Sterile A — Rx Only', 14, pageHeight - FOOTER_H + 15);

  // Output
  const dataUri = doc.output('datauristring');
  return dataUri.substring(dataUri.indexOf(',') + 1);
}
