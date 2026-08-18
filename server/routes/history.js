import { Router } from 'express';
import protect from '../middleware/auth.js';
import Content from '../models/Content.js';
import asyncHandler from '../utils/asyncHandler.js';
import { regenerateContent } from '../controllers/generatorController.js';
import userRateLimit from '../middleware/userRateLimit.js';
import creditCheck from '../middleware/creditCheck.js';
import PDFDocument from 'pdfkit';

const router = Router();

router.get('/', protect, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const favoriteOnly = req.query.favorite === 'true';
  const filter = { user: req.user._id, ...(favoriteOnly ? { favorite: true } : {}) };

  const [items, total] = await Promise.all([
    Content.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Content.countDocuments(filter),
  ]);

  res.status(200).json({ items, total, page, pages: Math.ceil(total / limit) });
}));

router.get('/export', protect, asyncHandler(async (req, res) => {
  const format = req.query.format || 'csv';
  const favoriteOnly = req.query.favorite === 'true';
  const filter = { user: req.user._id, ...(favoriteOnly ? { favorite: true } : {}) };
  const items = await Content.find(filter).sort({ createdAt: -1 }).lean();

  if (format === 'csv') {
    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const rows = [
      ['Type', 'Prompt', 'Output', 'Favorite', 'Created At'],
      ...items.map((item) => [
        item.type,
        item.prompt,
        item.output,
        item.favorite ? 'Yes' : 'No',
        item.createdAt?.toISOString?.() || '',
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
    res.status(200).type('text/csv').attachment('contentforge-history.csv').send(csv);
    return;
  }

  if (format !== 'pdf') {
    return res.status(400).json({ message: 'Export format must be csv or pdf' });
  }

  res.status(200);
  res.type('application/pdf');
  res.attachment('contentforge-history.pdf');
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(20).fillColor('#312e81').text('ContentForge Content History');
  doc.moveDown(0.5).fontSize(9).fillColor('#6b7280').text(`Exported ${new Date().toISOString()}`);

  items.forEach((item, index) => {
    if (index > 0) doc.addPage();
    doc.moveDown(1).fontSize(14).fillColor('#111827').text(`${item.type.toUpperCase()}${item.favorite ? ' ★' : ''}`);
    doc.moveDown(0.4).fontSize(9).fillColor('#4b5563').text(`Created: ${item.createdAt?.toISOString?.() || ''}`);
    doc.moveDown(0.7).fontSize(10).fillColor('#111827').text('Prompt');
    doc.moveDown(0.2).fontSize(10).text(item.prompt || '');
    doc.moveDown(0.7).fontSize(10).text('Output');
    doc.moveDown(0.2).fontSize(10).text(item.output || '');
  });
  doc.end();
}));

router.patch('/:id/favorite', protect, asyncHandler(async (req, res) => {
  if (typeof req.body.favorite !== 'boolean') {
    return res.status(400).json({ message: 'favorite must be a boolean' });
  }
  const content = await Content.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { favorite: req.body.favorite, updatedAt: new Date() } },
    { new: true, runValidators: true }
  );
  if (!content) return res.status(404).json({ message: 'Content not found' });
  res.status(200).json({ content });
}));

router.post('/:id/regenerate', protect, userRateLimit(10), creditCheck(1), regenerateContent);

router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await Content.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.status(200).json({ success: true });
}));

export default router;
