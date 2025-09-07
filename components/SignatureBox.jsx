'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Load react-signature-canvas only on client to avoid SSR issues
const SignatureCanvas = dynamic(() => import('react-signature-canvas'), { ssr: false });

/**
 * SignatureBox.jsx — Next.js App Router client component (JavaScript)
 * - Captures signature via react-signature-canvas
 * - On Save: embeds Customer ID (and timestamp) into the PNG, downloads the file,
 *   and POSTs base64 to /api/signature-base64.
 */
export default function SignatureBox({
  customerId = 'UNKNOWN',
  penColorDefault = '#111111',
  width = 700,
  height = 260,
  downloadPrefix = 'signature', // file name prefix
}) {
  const sigRef = useRef(null);
  const [penColor, setPenColor] = useState(penColorDefault);
  const [cid, setCid] = useState(customerId);

  const handleClear = () => sigRef.current && sigRef.current.clear();

  const composeWithWatermark = (trimmedCanvas, cidValue, targetWidth, minSigHeight) => {
    // Ensure the final image is large enough for signature + top margin + gap + footer
    const srcW = trimmedCanvas.width;
    const srcH = trimmedCanvas.height;

    const topPad = 12;   // NEW: top margin so signature isn't touching the top
    const gapY = 12;     // gap between signature and footer
    const footerH = 44;  // footer band height

    const outW = Math.max(srcW, Number(targetWidth) || srcW);
    const sigH = Math.max(srcH, Number(minSigHeight) || srcH);
    const outH = topPad + sigH + gapY + footerH;

    const off = document.createElement('canvas');
    off.width = outW;
    off.height = outH;
    const ctx = off.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);

    // Draw signature with horizontal centering and top margin
    const dx = Math.floor((outW - srcW) / 2);
    const dy = topPad; // apply topPad
    ctx.drawImage(trimmedCanvas, dx, dy);

    // Footer background below the signature area (after gap)
    const footerY = topPad + sigH + gapY;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, footerY, outW, footerH);

    // Separator line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, footerY + 0.5);
    ctx.lineTo(outW, footerY + 0.5);
    ctx.stroke();

    // Labels
    const ts = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    const safeCid = (cidValue || 'UNKNOWN').toString().trim() || 'UNKNOWN';
    const leftText = `Customer ID: ${safeCid}`;
    const rightText = ts;

    // Fit text if very long
    const pad = 10;
    const baseFont = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';

    const fitAndDraw = (text, align, x) => {
      let size = 14;
      ctx.textAlign = align;
      ctx.font = `${size}px ${baseFont}`;
      const max = (outW / 2) - pad * 2;
      while (ctx.measureText(text).width > max && size > 10) {
        size -= 1;
        ctx.font = `${size}px ${baseFont}`;
      }
      ctx.fillText(text, x, footerY + footerH / 2);
    };

    fitAndDraw(leftText, 'left', pad);
    fitAndDraw(rightText, 'right', outW - pad);

    return off;
  };

  const handleSave = async () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      console.warn('Nothing to save — canvas is empty');
      return;
    }

    // 1) Get trimmed signature as a canvas
    const trimmed = sigRef.current.getTrimmedCanvas();

    // 2) Compose final image with Customer ID watermark
    const finalCanvas = composeWithWatermark(trimmed, cid, width, height);

    // 3) Convert to base64
    const dataUrl = finalCanvas.toDataURL('image/png');

    // 4) Print to browser console
    console.log('Client: base64 length', dataUrl.length);
    console.log('Client: base64 preview', dataUrl.slice(0, 120) + '...');

    // 5) Trigger PNG download (optional)
    const tsFile = new Date().toISOString().replace(/[:.]/g, '-');
    const safeCid = (cid || 'UNKNOWN').toString().trim() || 'UNKNOWN';
    const fname = `${downloadPrefix}-${safeCid}-${tsFile}.png`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fname;
    a.click();

    // 6) POST base64 to backend and handle PDF download
    try {
      const res = await fetch('/api/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          accountName: safeCid,
          bsb: '123-456', // You can make these dynamic if needed
          accountNumber: '12345678'
        }),
      });
      const json = await res.json();
      console.log('Server response:', json);

      // Download PDF if available
      if (json.pdfBase64) {
        const a = document.createElement('a');
        a.href = json.pdfBase64;
        a.download = `signature-${safeCid}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Failed to send to server', e);
    }
  };

  return (
    <div className="p-4 max-w-3xl">
      <div className="mb-2 flex items-center gap-3">
        <label className="text-sm text-slate-600">Customer ID</label>
        <input
          type="text"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
          placeholder="Enter Customer ID"
          className="px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>
      <div className="mb-2 flex items-center gap-3">
        <button onClick={handleClear} className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200">Clear</button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded bg-emerald-600 text-white">Save (embed ID & download)</button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-inner">
        <SignatureCanvas
          ref={sigRef}
          penColor={penColor}
          throttle={16}
          canvasProps={{
            width,
            height,
            className: 'block rounded-xl',
            style: { touchAction: 'none', cursor: 'crosshair' },
          }}
        />
      </div>

      <p className="mt-2 text-xs text-slate-500">
        The generated PNG includes a readable label with Customer ID and timestamp in the bottom‑right corner.
      </p>
    </div>
  );
}


