'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * SignaturePad.jsx — dependency‑free signature capture for React (JavaScript)
 * - Mouse / touch / pen via Pointer Events
 * - High‑DPI (retina) scaling
 * - Undo / Redo / Clear
 * - Export PNG & SVG (vector)
 *
 * Drop into Next.js App Router as a client component.
 */

const DEFAULTS = {
  width: 600,
  height: 240,
  background: '#ffffff',
  color: '#111111',
  lineWidth: 2.5,
};

function useDevicePixelRatio() {
  const [dpr, setDpr] = useState(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  useEffect(() => {
    const onChange = () => setDpr(window.devicePixelRatio || 1);
    window.addEventListener('resize', onChange);
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener?.('change', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      mq.removeEventListener?.('change', onChange);
    };
  }, []);
  return dpr;
}

function midpoint(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, time: b.time }; }

function pathFromStroke(ctx, stroke) {
  const pts = stroke.points;
  if (!pts.length) return;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;

  if (pts.length === 1) {
    const p = pts[0];
    ctx.beginPath();
    ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.color;
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i];
    const n = pts[i + 1];
    const mid = midpoint(c, n);
    ctx.quadraticCurveTo(c.x, c.y, mid.x, mid.y);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
}

function renderAll(ctx, dpr, cssWidth, cssHeight, background, strokes, showGuide) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.scale(dpr, dpr);
  for (const s of strokes) pathFromStroke(ctx, s);
  if (showGuide) {
    const y = cssHeight - 48;
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(cssWidth - 16, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto';
    ctx.fillStyle = '#64748b';
    //ctx.fillText('Sign above the line', 20, y - 10);
    ctx.restore();
  }
}

export default function SignaturePad({
  width = DEFAULTS.width,
  height = DEFAULTS.height,
  background = DEFAULTS.background,
  color = DEFAULTS.color,
  lineWidth = DEFAULTS.lineWidth,
  showGuide = true,
  className,
  onSave,
}) {
  const dpr = useDevicePixelRatio();
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState(color);
  const [strokeWidth, setStrokeWidth] = useState(lineWidth);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctxRef.current = ctx;
      renderAll(ctx, dpr, width, height, background, strokes, showGuide);
    }
  }, [width, height, dpr, background, showGuide]);

  useEffect(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    renderAll(ctx, dpr, width, height, background, strokes, showGuide);
  }, [strokes, dpr, width, height, background, showGuide]);

  const getPos = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y, time: Date.now(), pressure: e.pressure };
  };

  const onPointerDown = (e) => {
    e.target.setPointerCapture?.(e.pointerId);
    setIsDrawing(true);
    setRedoStack([]);
    const p = getPos(e);
    setStrokes((prev) => [...prev, { points: [p], color: strokeColor, width: strokeWidth }]);
  };

  const onPointerMove = (e) => {
    if (!isDrawing) return;
    const p = getPos(e);
    setStrokes((prev) => {
      const copy = prev.slice();
      const last = copy[copy.length - 1];
      if (last) last.points.push(p);
      return copy;
    });
  };

  const onPointerUp = (e) => {
    setIsDrawing(false);
    e.target.releasePointerCapture?.(e.pointerId);
  };

  const clear = () => { setStrokes([]); setRedoStack([]); };
  const undo = () => {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const copy = prev.slice();
      const popped = copy.pop();
      setRedoStack((r) => [...r, popped]);
      return copy;
    });
  };
  const redo = () => {
    setRedoStack((prev) => {
      if (!prev.length) return prev;
      const copy = prev.slice();
      const restored = copy.pop();
      setStrokes((s) => [...s, restored]);
      return copy;
    });
  };

  const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 1.0));

  const exportPNG = async () => {
    const canvas = canvasRef.current;
    const pngBlob = await canvasToBlob(canvas);
    const dataUrl = await new Promise((res) => {
      const reader = new FileReader();
      reader.onloadend = () => res(reader.result);
      reader.readAsDataURL(pngBlob);
    });
    const svgText = exportSVGText(width, height, background, strokes);
    return { pngBlob, dataUrl, svgText };
  };

  const handleSave = async () => {
    const result = await exportPNG();
    const { dataUrl } = result; // base64 data URL

    // 1) Print base64 (truncated) to the BROWSER console
    console.log('Client: base64 length', dataUrl.length);
    console.log('Client: base64 preview', dataUrl.slice(0, 100) + '...');

    // 2) Send to backend as JSON (base64 in body)
    try {
      const res = await fetch('/api/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl })
      });
      const json = await res.json();
      console.log('Server response:', json);
    } catch (e) {
      console.error('Failed to POST base64 to server', e);
    }

    // Optional: still download locally for the user
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `signature-${Date.now()}.png`;
    a.click();

    // Notify parent if needed
    onSave && onSave(result);
  };

  return (
    <div className={'w-full max-w-3xl mx-auto p-4 ' + (className || '')}>
      <h2 className="text-lg font-semibold mb-2">Signature Pad</h2>

      <div className="rounded-2xl shadow-inner border border-slate-200 bg-white select-none" style={{ width, padding: 8 }}>
        <canvas
          ref={canvasRef}
          className="block rounded-xl touch-none"
          style={{ width, height, touchAction: 'none', cursor: 'crosshair' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={() => setIsDrawing(false)}
        />
      </div>
      <div className="flex items-center justify-between gap-3 mb-3" style={{ marginTop: '5px' }}>
        
      <div className="flex items-center gap-2 justify-end w-full">
          <button onClick={clear} className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700">Clear</button>
          <button onClick={handleSave} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow">Save PNG</button>
        </div>
       </div>

     
    </div>
  );
}

// ===== SVG export helpers =====
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function strokeToSvgPath(stroke) {
  const pts = stroke.points;
  if (!pts.length) return '';
  if (pts.length === 1) {
    const p = pts[0];
    return `<circle cx="${p.x}" cy="${p.y}" r="${stroke.width / 2}" fill="${stroke.color}"/>`;
  }
  const d = [];
  d.push(`M ${pts[0].x} ${pts[0].y}`);
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i];
    const n = pts[i + 1];
    const mx = (c.x + n.x) / 2;
    const my = (c.y + n.y) / 2;
    d.push(`Q ${c.x} ${c.y} ${mx} ${my}`);
  }
  const last = pts[pts.length - 1];
  d.push(`L ${last.x} ${last.y}`);
  return `<path d="${d.join(' ')}" fill="none" stroke="${stroke.color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="${stroke.width}"/>`;
}
function exportSVGText(width, height, background, strokes) {
  const paths = strokes.map((s) => strokeToSvgPath(s)).join('\n');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n` +
    `  <rect width="100%" height="100%" fill="${esc(background)}"/>\n` +
    paths +
    `\n</svg>`
  );
}

// ===== Example Next.js App Router page (client usage) =====
export function Demo() {
  const [saved, setSaved] = useState(null);
  return (
    <div className="min-h-[60vh] py-8">
      <h1 className="text-2xl font-semibold mb-4">Signature Capture (React, JS)</h1>
      <SignaturePad
        width={700}
        height={260}
        onSave={async ({ pngBlob, svgText, dataUrl }) => {
          setSaved(dataUrl);
          const fd = new FormData();
          fd.append('file', new File([pngBlob], `signature-${Date.now()}.png`, { type: 'image/png' }));
          fd.append('signerName', 'John Citizen');
          fd.append('consentText', 'I agree to the Terms');
          // upload handled by component via /api/signature-base64
        }}
      />
      {saved && (
        <div className="mt-4">
          <div className="text-sm text-slate-600 mb-2">Saved preview:</div>
          <img src={saved} alt="signature preview" className="border rounded-lg max-w-full"/>
        </div>
      )}
    </div>
  );
}

// ==============================================
// Next.js App Router API route (app/api/signature/route.js)
// Uploads PNG to S3. Configure AWS creds, AWS_REGION & S3_BUCKET.
// ==============================================
/*
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
export const runtime = 'nodejs';

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req) {
  const form = await req.formData();
  const file = form.get('file');
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  const safeName = (file.name || 'signature.png').replace(/[^a-z0-9._-]+/gi, '_');
  const Key = `signatures/${Date.now()}-${safeName}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key,
    Body: buf,
    ContentType: file.type || 'image/png',
    ACL: 'private',
  }));

  const meta = {
    signerName: form.get('signerName') || null,
    consentText: form.get('consentText') || null,
    ip: req.headers.get('x-forwarded-for'),
    ua: req.headers.get('user-agent'),
    ts: new Date().toISOString(),
    key: Key,
  };

  return NextResponse.json({ ok: true, key: Key, meta }, { status: 201 });
}
*/


// ==============================================
// Next.js App Router API route (app/api/signature-base64/route.js)
// Receives base64 PNG (data URL) and prints to SERVER console
// ==============================================
/*
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
      return NextResponse.json({ error: 'imageBase64 data URL required' }, { status: 400 });
    }
    // Log to server console (visible in `next dev` / server logs)
    console.log('Server: received base64 length', imageBase64.length);
    console.log('Server: preview', imageBase64.slice(0, 120) + '...');

    // If you also need the raw bytes:
    const base64 = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    console.log('Server: decoded bytes', buffer.length);

    return NextResponse.json({ ok: true, bytes: buffer.length });
  } catch (err) {
    console.error('Server: error handling base64 upload', err);
    return NextResponse.json({ error: 'bad request' }, { status: 400 });
  }
}
*/
