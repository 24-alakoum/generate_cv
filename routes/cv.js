import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../src/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, (req, res) => {
  const { name, data, template } = req.body;
  if (!data) return res.status(400).json({ error: 'Données du CV requises' });

  const existing = db.find('cvs', c => c.user_id === req.user.id && c.name === name);
  if (existing) {
    db.update('cvs', c => c.id === existing.id, { data: JSON.stringify(data), template: template || 'professional', updated_at: new Date().toISOString() });
    db.insert('analytics', { id: uuidv4(), event: 'cv_update', user_id: req.user.id, metadata: JSON.stringify({ name }), created_at: new Date().toISOString() });
    return res.json({ id: existing.id, message: 'CV mis à jour' });
  }

  const user = db.find('users', u => u.id === req.user.id);
  if (user && user.credits < 1) {
    return res.status(403).json({ error: 'Crédits insuffisants', needPayment: true });
  }

  const cv = {
    id: uuidv4(), user_id: req.user.id, name: name || 'Mon CV',
    data: JSON.stringify(data), template: template || 'professional',
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  };
  db.insert('cvs', cv);
  if (user) db.update('users', u => u.id === req.user.id, { credits: user.credits - 1 });
  db.insert('analytics', { id: uuidv4(), event: 'cv_generate', user_id: req.user.id, metadata: JSON.stringify({ name }), created_at: new Date().toISOString() });

  res.status(201).json({ id: cv.id, credits: user ? user.credits - 1 : 0 });
});

router.get('/', authenticate, (req, res) => {
  const cvs = db.filter('cvs', c => c.user_id === req.user.id)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(c => ({ id: c.id, name: c.name, template: c.template, created_at: c.created_at, updated_at: c.updated_at }));
  res.json(cvs);
});

router.get('/:id', authenticate, (req, res) => {
  const cv = db.find('cvs', c => c.id === req.params.id && c.user_id === req.user.id);
  if (!cv) return res.status(404).json({ error: 'CV introuvable' });
  try { cv.data = JSON.parse(cv.data); } catch(e) {}
  db.insert('analytics', { id: uuidv4(), event: 'cv_view', user_id: req.user.id, metadata: JSON.stringify({ cvId: req.params.id }), created_at: new Date().toISOString() });
  res.json(cv);
});

router.delete('/:id', authenticate, (req, res) => {
  const removed = db.remove('cvs', c => c.id === req.params.id && c.user_id === req.user.id);
  if (removed === 0) return res.status(404).json({ error: 'CV introuvable' });
  res.json({ message: 'CV supprimé' });
});

export default router;
