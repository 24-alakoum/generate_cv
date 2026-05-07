import { Router } from 'express';
import db from '../src/db.js';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/dashboard', (req, res) => {
  const users = db.all('users');
  const cvs = db.all('cvs');
  const letters = db.all('cover_letters');
  const payments = db.all('payments');
  const analytics = db.all('analytics');
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const usersToday = users.filter(u => u.created_at && u.created_at.slice(0, 10) === today).length;
  const cvsToday = cvs.filter(c => c.created_at && c.created_at.slice(0, 10) === today).length;
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidUsers = new Set(completedPayments.map(p => p.user_id)).size;

  const eventCounts = {};
  analytics.forEach(a => { eventCounts[a.event] = (eventCounts[a.event] || 0) + 1; });
  const events = Object.entries(eventCounts).map(([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count);

  const recentUsers = users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
    .map(u => ({ id: u.id, email: u.email, name: u.name, created_at: u.created_at }));

  const userCVCount = {};
  cvs.forEach(c => { userCVCount[c.user_id] = (userCVCount[c.user_id] || 0) + 1; });
  const topUsers = users.map(u => ({ id: u.id, email: u.email, name: u.name, cv_count: userCVCount[u.id] || 0 }))
    .sort((a, b) => b.cv_count - a.cv_count).slice(0, 10);

  const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
  const avgCredits = users.length ? Math.round(totalCredits / users.length) : 0;
  const maxCredits = users.length ? Math.max(...users.map(u => u.credits || 0)) : 0;

  res.json({
    users: { total: users.length, today: usersToday },
    cvs: { total: cvs.length, today: cvsToday },
    coverLetters: letters.length,
    payments: { total: completedPayments.length, revenue: totalRevenue, paidUsers },
    events,
    recentUsers,
    topUsers,
    credits: { total: totalCredits, avg: avgCredits, max: maxCredits }
  });
});

router.get('/users', (req, res) => {
  const users = db.all('users').sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, credits: u.credits, created_at: u.created_at, last_login: u.last_login }));
  res.json(users);
});

router.get('/cvs', (req, res) => {
  const users = db.all('users');
  const userMap = {};
  users.forEach(u => userMap[u.id] = u);
  const cvs = db.all('cvs').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50)
    .map(c => ({ id: c.id, name: c.name, user_id: c.user_id, user_email: userMap[c.user_id]?.email, user_name: userMap[c.user_id]?.name, template: c.template, created_at: c.created_at }));
  res.json(cvs);
});

router.get('/payments', (req, res) => {
  const users = db.all('users');
  const userMap = {};
  users.forEach(u => userMap[u.id] = u);
  const payments = db.all('payments').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50)
    .map(p => ({ id: p.id, user_id: p.user_id, user_email: userMap[p.user_id]?.email, user_name: userMap[p.user_id]?.name, amount: p.amount, credits: p.credits, status: p.status, created_at: p.created_at }));
  res.json(payments);
});

router.post('/credits', (req, res) => {
  const { userId, credits } = req.body;
  if (!userId || !credits) return res.status(400).json({ error: 'userId et credits requis' });
  const user = db.find('users', u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  db.update('users', u => u.id === userId, { credits: (user.credits || 0) + credits });
  db.insert('analytics', { id: uuidv4(), event: 'admin_add_credits', user_id: userId, metadata: JSON.stringify({ credits }), created_at: new Date().toISOString() });
  res.json({ message: `${credits} crédits ajoutés` });
});

import { v4 as uuidv4 } from 'uuid';
export default router;
