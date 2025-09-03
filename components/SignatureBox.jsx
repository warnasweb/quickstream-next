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

  const composeWithWatermark = (trimmedCanvas, cidValue) => {
    // Create an offscreen canvas with a dedicated footer band and a margin gap
    const w = trimmedCanvas.width;
    const h = trimmedCanvas.height;
    const footerH = 44;   // height for label area
    const gapY = 12;      // vertical margin between signature and footer text

    const off = document.createElement('canvas');
    off.width = w;
    off.height = h + gapY + footerH;
    const ctx = off.getContext('2d');

    // Solid white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, off.width, off.height);

    // Draw the signature at the top (unchanged)
    ctx.drawImage(trimmedCanvas, 0, 0);

    // Footer background (starts AFTER the margin gap)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, h + gapY, w, footerH);

    // Separator line at the top of the footer (leaving gap above it)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h + gapY + 0.5);
    ctx.lineTo(w, h + gapY + 0.5);
    ctx.stroke();

    // Build labels
    const ts = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
    const safeCid = (cidValue || 'UNKNOWN').toString().trim() || 'UNKNOWN';
    const leftText = `signed by: ${safeCid} on `;
    const rightText = ts;

    // Fit text if very long
    const pad = 10;
    const baseFont = 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    let size = 14;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';

    const fitAndDraw = (text, align, x) => {
      size = 14;
      ctx.textAlign = align;
      ctx.font = `${size}px ${baseFont}`;
      const max = (w / 2) - pad * 2;
      while (ctx.measureText(text).width > max && size > 10) {
        size -= 1;
        ctx.font = `${size}px ${baseFont}`;
      }
      ctx.fillText(text, x, h + gapY + footerH / 2);
    };


    fitAndDraw(leftText, 'left', pad);
    fitAndDraw(rightText, 'right', w - pad);

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
    const finalCanvas = composeWithWatermark(trimmed, cid);

    // 3) Convert to base64
    const dataUrl = finalCanvas.toDataURL('image/png');

    // 4) Print to browser console
    console.log('Client: base64 length', dataUrl.length);
    console.log('Client: base64 preview', dataUrl.slice(0, 120) + '...');

    // 5) Trigger download
    const tsFile = new Date().toISOString().replace(/[:.]/g, '-');
    const safeCid = (cid || 'UNKNOWN').toString().trim() || 'UNKNOWN';
    const fname = `${downloadPrefix}-${safeCid}-${tsFile}.png`;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fname;
    a.click();

    // 6) POST base64 to backend
    try {
      const res = await fetch('/api/signature-base64', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, customerId: (cid || 'UNKNOWN').toString().trim() || 'UNKNOWN' }),
      });
      const json = await res.json();
      console.log('Server response:', json);
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


