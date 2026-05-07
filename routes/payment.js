import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../src/db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

const PLANS = { starter: { credits: 5, amount: 499, name: 'Starter' }, pro: { credits: 15, amount: 999, name: 'Pro' }, unlimited: { credits: 50, amount: 1999, name: 'Illimité' } };

router.get('/plans', (req, res) => res.json(PLANS));

router.post('/checkout', authenticate, (req, res) => {
  const { plan } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Plan invalide' });
  const selected = PLANS[plan];
  const payment = {
    id: uuidv4(), user_id: req.user.id, amount: selected.amount,
    credits: selected.credits, stripe_id: 'sim_' + uuidv4().slice(0, 8),
    status: 'completed', created_at: new Date().toISOString()
  };
  db.insert('payments', payment);
  const user = db.find('users', u => u.id === req.user.id);
  db.update('users', u => u.id === req.user.id, { credits: (user?.credits || 0) + selected.credits });
  db.insert('analytics', { id: uuidv4(), event: 'payment_completed', user_id: req.user.id, metadata: JSON.stringify({ plan, amount: selected.amount, credits: selected.credits }), created_at: new Date().toISOString() });
  const updated = db.find('users', u => u.id === req.user.id);
  res.json({ success: true, credits: updated?.credits || 0, message: `${selected.credits} crédits ajoutés` });
});

router.get('/credits', authenticate, (req, res) => {
  const user = db.find('users', u => u.id === req.user.id);
  res.json({ credits: user?.credits || 0 });
});

export default router;
