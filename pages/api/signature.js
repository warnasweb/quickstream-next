// ==============================================
// Next.js App Router API route (app/api/signature-base64/route.js)
// Receives base64 PNG (data URL) and prints to SERVER console
// ==============================================

import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { imageBase64 } = req.body;
    console.log('Server: received base64 length', imageBase64);
    if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.startsWith('data:image/')) {
      return res.status(400).json({ error: 'imageBase64 data URL required' });
    }
    // Log to server console (visible in `next dev` / server logs)
    console.log('Server: received base64 length', imageBase64.length);
    console.log('Server: preview', imageBase64.slice(0, 120) + '...');

    // If you also need the raw bytes:
    const base64 = imageBase64.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    console.log('Server: decoded bytes', buffer.length);

    return res.status(200).json({ ok: true, bytes: buffer.length, preview: imageBase64});
  } catch (err) {
    console.error('Server: error handling base64 upload', err);
    return res.status(400).json({ error: 'bad request' });
  }
}