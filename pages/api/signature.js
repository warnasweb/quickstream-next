// ==============================================
// Next.js App Router API route (app/api/signature-base64/route.js)
// Receives base64 PNG (data URL) and prints to SERVER console
// ==============================================

import { PDFDocument, rgb } from 'pdf-lib';
import { NextResponse } from 'next/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { imageBase64 } = req.body;
    const accountName ='Rajesh Warna';
    const bsb ='123-456';
    const accountNumber ='12345678';
    if (
      !imageBase64 ||
      typeof imageBase64 !== 'string' ||
      !imageBase64.startsWith('data:image/')
    ) {
      return res.status(400).json({ error: 'imageBase64 data URL required' });
    }

    // Decode base64 image
    const base64 = imageBase64.split(',')[1];
    const imgBuffer = Buffer.from(base64, 'base64');

    // Create a new PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 400]);

    // Add static text
    page.drawText(`Account Name: ${accountName || ''}`, { x: 50, y: 350, size: 16, color: rgb(0, 0, 0) });
    page.drawText(`BSB: ${bsb || ''}`, { x: 50, y: 320, size: 16, color: rgb(0, 0, 0) });
    page.drawText(`Account Number: ${accountNumber || ''}`, { x: 50, y: 290, size: 16, color: rgb(0, 0, 0) });
    page.drawText('Signature:', { x: 50, y: 250, size: 16, color: rgb(0, 0, 0) });

    // Embed the signature image
    let image;
    if (imageBase64.startsWith('data:image/png')) {
      image = await pdfDoc.embedPng(imgBuffer);
    } else if (imageBase64.startsWith('data:image/jpeg')) {
      image = await pdfDoc.embedJpg(imgBuffer);
    } else {
      return res.status(400).json({ error: 'Unsupported image format' });
    }

    // Draw the image on the PDF
    page.drawImage(image, {
      x: 150,
      y: 180,
      width: 200,
      height: 60,
    });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Send PDF as base64 to frontend
    res.status(200).json({
      ok: true,
      pdfBase64: `data:application/pdf;base64,${Buffer.from(pdfBytes).toString('base64')}`,
    });
  } catch (err) {
    console.error('Server: error creating PDF', err);
    return res.status(400).json({ error: 'bad request' });
  }
}