import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { Order, Pressing } from '@/types';
import { formatFCFA, formatDateFR } from './utils';

// A6 portrait étendu
const W = 298;
const H = 500;
const ML = 20;
const MR = W - 20;

/**
 * Nettoie une chaîne pour pdf-lib (Helvetica = WinAnsi uniquement).
 * Remplace les caractères Unicode non supportés (espaces fines, NBSP, etc.)
 * par des espaces ASCII normaux, et supprime tout caractère hors Latin-1.
 */
function sanitize(text: unknown): string {
  return String(text ?? '')
    .replace(/[\u00a0\u202f\u2009\u2007\u2008]/g, ' ') // espaces Unicode → espace ASCII
    .replace(/[\u2018\u2019]/g, "'")     // guillemets courbes → apostrophe ASCII
    .replace(/[\u201c\u201d]/g, '"')     // guillemets courbes doubles
    .replace(/[\u2013\u2014]/g, '-')     // tirets longs
    .replace(/[\u2026]/g, '...')          // points de suspension
    .replace(/[^\x00-\xFF]/g, '');        // supprime tout ce qui est hors Latin-1
}

export async function generateInvoicePDF(order: Order, pressing: Pressing): Promise<Uint8Array> {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([W, H]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const navy  = rgb(15/255,  23/255,  42/255);
  const blue  = rgb(37/255,  99/255, 235/255);
  const green = rgb(22/255, 163/255,  74/255);
  const red   = rgb(220/255, 38/255,  38/255);
  const gray  = rgb(100/255,116/255, 139/255);
  const ltGr  = rgb(226/255,232/255, 240/255);
  const bgLt  = rgb(248/255,250/255, 252/255);
  const bgBl  = rgb(239/255,246/255, 255/255);
  const bgGr  = rgb(240/255,253/255, 244/255);
  const bgRd  = rgb(254/255,242/255, 242/255);

  // Helpers — sanitize() garantit que drawText ne crashe jamais
  const tx = (text: unknown, x: number, y: number, sz: number, f = font, c = navy) =>
    page.drawText(sanitize(text), { x, y, size: sz, font: f, color: c });

  const txC = (text: unknown, y: number, sz: number, f = font, c = navy) => {
    const s = sanitize(text);
    const w = f.widthOfTextAtSize(s, sz);
    page.drawText(s, { x: W/2 - w/2, y, size: sz, font: f, color: c });
  };

  const txR = (text: unknown, rightX: number, y: number, sz: number, f = font, c = navy) => {
    const s = sanitize(text);
    const w = f.widthOfTextAtSize(s, sz);
    page.drawText(s, { x: rightX - w, y, size: sz, font: f, color: c });
  };

  const hLine = (y: number, x1 = ML, x2 = MR, col = ltGr, th = 0.7) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: th, color: col });

  const box = (x: number, y: number, w: number, h: number, fill = bgLt, border = ltGr) =>
    page.drawRectangle({ x, y, width: w, height: h, color: fill, borderColor: border, borderWidth: 0.8 });

  let y = H;

  // 1. BANDES DÉCORATIVES + EN-TÊTE
  page.drawRectangle({ x: 0, y: H - 7, width: W, height: 7, color: blue });
  page.drawRectangle({ x: 0, y: H - 10, width: W, height: 3, color: rgb(15/255,23/255,42/255) });
  y = H - 22;

  // Logo (si disponible)
  let logoDrawn = false;
  const targetLogoUrl =
    pressing.logo_url ||
    (typeof window !== 'undefined' ? window.location.origin + '/assets/logo.jpg' : '');

  if (targetLogoUrl) {
    try {
      let imgBytes: ArrayBuffer;
      if (targetLogoUrl.startsWith('data:')) {
        const b64 = targetLogoUrl.split(',')[1];
        const bin = atob(b64);
        imgBytes = new Uint8Array(bin.length).map((_, i) => bin.charCodeAt(i)).buffer;
      } else {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        const resp = await fetch(targetLogoUrl, { signal: controller.signal });
        clearTimeout(timer);
        imgBytes = await resp.arrayBuffer();
      }
      const isJpg =
        targetLogoUrl.startsWith('data:image/jpeg') ||
        targetLogoUrl.endsWith('.jpg') ||
        targetLogoUrl.endsWith('.jpeg');
      const img = isJpg ? await doc.embedJpg(imgBytes) : await doc.embedPng(imgBytes);
      page.drawImage(img, { x: ML, y: y - 24, width: 28, height: 28 });
      logoDrawn = true;
      tx((pressing.name || 'Nora Pressing').toUpperCase(), ML + 34, y - 6, 10, bold, navy);
      tx(`Tel: ${pressing.phone_primary || ''}${pressing.phone_secondary ? ' / ' + pressing.phone_secondary : ''}`, ML + 34, y - 18, 7, font, gray);
    } catch {
      logoDrawn = false;
    }
  }
  if (!logoDrawn) {
    tx((pressing.name || 'Nora Pressing').toUpperCase(), ML, y - 4, 10, bold, navy);
    tx(`Tel: ${pressing.phone_primary || ''}${pressing.phone_secondary ? ' / ' + pressing.phone_secondary : ''}`, ML, y - 16, 7, font, gray);
  }

  txR(`N. ${order.invoice_number || ''}`, MR, y - 4, 8.5, bold, blue);
  txR(`Le ${formatDateFR(order.created_at)}`, MR, y - 16, 7, font, gray);
  y -= 30;

  if (pressing.address) {
    tx(pressing.address, ML + (logoDrawn ? 34 : 0), y, 7, font, gray);
    y -= 10;
  }

  y -= 6;
  hLine(y, ML, MR, blue, 1);
  y -= 16;

  // 2. BLOC CLIENT
  const clientLines: string[] = [];
  if (order.customer_name) clientLines.push(`Nom        : ${order.customer_name}`);
  clientLines.push(`Telephone  : ${order.customer_phone || ''}`);
  if (order.customer_address) clientLines.push(`Adresse    : ${order.customer_address}`);

  const clientBoxH = 14 + clientLines.length * 12;
  box(ML, y - clientBoxH + 12, W - ML*2, clientBoxH, bgLt, ltGr);
  tx('INFORMATIONS CLIENT', ML + 8, y, 6.5, bold, gray);
  y -= 12;
  clientLines.forEach((line) => {
    tx(line, ML + 8, y, 8, font, navy);
    y -= 12;
  });
  y -= 12;

  // 3. TABLEAU PRESTATIONS
  page.drawRectangle({ x: ML, y: y - 14, width: W - ML*2, height: 16, color: rgb(241/255,245/255,249/255), borderColor: ltGr, borderWidth: 0.8 });
  tx('DESIGNATION', ML + 6, y - 9, 6.5, bold, gray);
  tx('QTE',        ML + 150, y - 9, 6.5, bold, gray);
  txR('MONTANT',   MR - 2,   y - 9, 6.5, bold, gray);
  y -= 22;

  const service = order.offer_name || 'Pressing';
  const qty     = order.billing_type === 'kg' ? `${order.quantity} kg` : `${order.quantity} u.`;
  tx(service, ML + 6, y, 8.5, font, navy);
  tx(qty,     ML + 150, y, 8.5, font, navy);
  txR(formatFCFA(order.gross_amount), MR - 2, y, 8.5, bold, navy);
  y -= 8;
  hLine(y, ML, MR, ltGr, 0.5);
  y -= 16;

  // 4. DÉTAIL FINANCIER
  const pickup   = order.pickup_fee   || 0;
  const delivery = order.delivery_fee || 0;
  const ttc      = order.total_amount || (order.gross_amount + pickup + delivery);
  const paid     = order.amount_paid  || 0;

  type FinRow = { label: string; val: string; dim?: boolean };
  const rows: FinRow[] = [
    { label: 'Sous-total prestations :', val: formatFCFA(order.gross_amount) },
    { label: 'Frais de ramassage :',     val: pickup   > 0 ? formatFCFA(pickup)   : 'Inclus', dim: pickup   === 0 },
    { label: 'Frais de livraison :',     val: delivery > 0 ? formatFCFA(delivery) : 'Inclus', dim: delivery === 0 },
    { label: 'Acompte verse :',          val: `- ${formatFCFA(paid)}` },
  ];

  rows.forEach((row) => {
    const fg = row.dim ? rgb(180/255,190/255,200/255) : gray;
    tx(row.label, ML + 90, y, 7.5, font, fg);
    txR(row.val,  MR - 2,  y, 7.5, font, row.dim ? fg : navy);
    y -= 13;
  });
  y -= 4;

  box(ML + 88, y - 5, W - ML - 90, 20, bgBl, blue);
  tx('TOTAL TTC :',            ML + 95, y + 2, 8.5, bold, blue);
  txR(formatFCFA(ttc), MR - 4, y + 2, 10, bold, blue);
  y -= 28;

  const isPaid = (order.remaining_amount <= 0) || (order.payment_status === 'paid');
  box(ML + 88, y - 5, W - ML - 90, 20, isPaid ? bgGr : bgRd, isPaid ? green : red);
  tx('RESTE A PAYER :',                    ML + 95, y + 2, 8, bold, isPaid ? green : red);
  txR(formatFCFA(order.remaining_amount), MR - 4,  y + 2, 10, bold, isPaid ? green : red);
  y -= 28;

  const statusText = isPaid ? 'REGLE' : 'NON REGLE';
  box(ML, y - 4, 72, 18, isPaid ? bgGr : bgRd, isPaid ? green : red);
  tx(statusText, ML + 7, y + 1, 8.5, bold, isPaid ? green : red);
  y -= 30;

  hLine(y, ML, MR, ltGr, 0.5);
  y -= 16;

  // 5. QR CODE WHATSAPP
  try {
    const phone = (pressing.phone_secondary || pressing.phone_primary || '').replace(/[^0-9]/g, '');
    const msg   = encodeURIComponent(`Bonjour, ma commande ${order.invoice_number || ''}`);
    const waUrl = `https://wa.me/${phone}?text=${msg}`;
    const qrDataUrl = await QRCode.toDataURL(waUrl, { margin: 1, width: 120 });

    // Décoder le base64 directement — PAS de fetch() sur data: URL
    const b64Data = qrDataUrl.split(',')[1];
    const binStr  = atob(b64Data);
    const qrArr   = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) qrArr[i] = binStr.charCodeAt(i);
    const qrImg   = await doc.embedPng(qrArr.buffer);

    const qrSize = 44;
    page.drawImage(qrImg, { x: W/2 - qrSize/2, y: y - qrSize, width: qrSize, height: qrSize });
    const scanTxt = 'Flasher pour contacter le pressing via WhatsApp';
    const scanW   = font.widthOfTextAtSize(scanTxt, 6);
    tx(scanTxt, W/2 - scanW/2, y - qrSize - 10, 6, font, gray);
    y -= qrSize + 20;
  } catch {
    // QR code optionnel — ne doit jamais bloquer la génération du PDF
    y -= 10;
  }

  y -= 8;
  hLine(y, ML, MR, ltGr, 0.5);
  y -= 14;

  // 6. PIED DE PAGE
  const thanks = pressing.thank_you_message || 'Merci de nous faire confiance !';
  txC(thanks, y, 8.5, bold, navy);
  y -= 12;
  txC(`Service client : ${pressing.phone_secondary || pressing.phone_primary || ''}`, y, 7, font, gray);
  page.drawRectangle({ x: 0, y: 0, width: W, height: 4, color: blue });

  return await doc.save();
}

// ─── Télécharger — stratégie multi-navigateur garantie ────────────────────
export function downloadPDF(pdfBytes: Uint8Array, fileName: string) {
  const blob = new Blob([pdfBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });

  // Stratégie 1 : msSaveBlob (Edge Legacy / anciens navigateurs)
  if (typeof (navigator as any).msSaveBlob === 'function') {
    (navigator as any).msSaveBlob(blob, fileName);
    return;
  }

  // Stratégie 2 : anchor + createObjectURL (Chrome, Edge, Firefox — desktop et mobile)
  try {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href        = url;
    a.download    = fileName;
    a.rel         = 'noopener';
    a.style.display = 'none';
    document.body.appendChild(a);

    // Déclencher le clic après un micro-délai (nécessaire pour Firefox et certaines PWA)
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
      // Révoquer après 15 s (délai généreux pour mobile / PWA lents)
      setTimeout(() => URL.revokeObjectURL(url), 15_000);
    }, 100);
    return;
  } catch {
    // createObjectURL indisponible — fallback ci-dessous
  }

  // Stratégie 3 (fallback universel) : DataURL base64
  const reader = new FileReader();
  reader.onloadend = () => {
    const a = document.createElement('a');
    a.href        = reader.result as string;
    a.download    = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  reader.readAsDataURL(blob);
}

// ─── Imprimer (ouvre dans un onglet et déclenche l'impression) ────────────
export function printPDF(pdfBytes: Uint8Array) {
  const blob = new Blob([pdfBytes as unknown as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });

  let url: string;
  try {
    url = URL.createObjectURL(blob);
  } catch {
    // Si createObjectURL échoue, fallback au téléchargement
    downloadPDF(pdfBytes, 'Facture.pdf');
    return;
  }

  // Ouvrir dans un nouvel onglet
  const win = window.open(url, '_blank');

  if (win) {
    win.addEventListener('load', () => {
      try {
        win.focus();
        win.print();
      } catch {
        // L'utilisateur peut imprimer manuellement depuis l'onglet
      }
    });
  } else {
    // Si les popups sont bloquées, télécharger à la place
    downloadPDF(pdfBytes, 'Facture.pdf');
  }

  // Révoquer après 60 s (laisser le temps pour l'impression)
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────
export function shareOnWhatsApp(order: Order, pressing: Pressing) {
  const isPaid   = order.remaining_amount <= 0 || order.payment_status === 'paid';
  const phone    = (order.customer_phone || '').replace(/[^0-9]/g, '');
  const pickup   = order.pickup_fee   || 0;
  const delivery = order.delivery_fee || 0;

  const msg =
    `*FACTURE — ${pressing.name}*\n` +
    `N : *${order.invoice_number}*\n` +
    `Client : ${order.customer_name || 'Client'} (${order.customer_phone})\n` +
    `Prestation : ${order.offer_name}\n` +
    `Quantite : ${order.billing_type === 'kg' ? order.quantity + ' kg' : order.quantity + ' u.'}\n` +
    `---\n` +
    `Sous-total : ${formatFCFA(order.gross_amount)}\n` +
    (pickup   > 0 ? `Ramassage  : ${formatFCFA(pickup)}\n`   : '') +
    (delivery > 0 ? `Livraison  : ${formatFCFA(delivery)}\n` : '') +
    `*TOTAL TTC : ${formatFCFA(order.total_amount)}*\n` +
    `Paye       : ${formatFCFA(order.amount_paid)}\n` +
    `*RESTE     : ${formatFCFA(order.remaining_amount)}*\n` +
    `Statut     : *${isPaid ? 'REGLE' : 'NON REGLE'}*\n` +
    `---\n` +
    `Merci de votre confiance ! Contact : ${pressing.phone_primary}`;

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
}
