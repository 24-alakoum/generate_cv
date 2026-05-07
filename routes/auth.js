import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../src/db.js';
import { authenticate, generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Tous les champs sont requis' });
  if (password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (6 caractères min)' });

  const existing = db.find('users', u => u.email === email);
  if (existing) return res.status(409).json({ error: 'Cet email est déjà utilisé' });

  const hashed = bcrypt.hashSync(password, 10);
  const user = {
    id: uuidv4(), email, password: hashed, name,
    role: 'user', credits: 3,
    created_at: new Date().toISOString(),
    last_login: null
  };
  db.insert('users', user);
  db.insert('analytics', { id: uuidv4(), event: 'user_register', user_id: user.id, metadata: JSON.stringify({ email }), created_at: new Date().toISOString() });

  const token = generateToken({ id: user.id, email: user.email, name: user.name, role: 'user' });
  res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: 'user', credits: 3 } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = db.find('users', u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }

  // Also check admin
  const admin = db.find('admin_users', a => a.email === email);
  if (admin && bcrypt.compareSync(password, admin.password)) {
    const token = generateToken({ id: admin.id, email: admin.email, name: admin.name, role: 'admin' });
    db.insert('analytics', { id: uuidv4(), event: 'admin_login', user_id: admin.id, created_at: new Date().toISOString() });
    return res.json({ token, user: { id: admin.id, email: admin.email, name: admin.name, role: 'admin', credits: 999 } });
  }

  db.update('users', u => u.id === user.id, { last_login: new Date().toISOString() });
  db.insert('analytics', { id: uuidv4(), event: 'user_login', user_id: user.id, created_at: new Date().toISOString() });

  const token = generateToken({ id: user.id, email: user.email, name: user.name, role: 'user' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: 'user', credits: user.credits } });
});

router.get('/me', authenticate, (req, res) => {
  if (req.user.role === 'admin') {
    const admin = db.find('admin_users', a => a.id === req.user.id);
    if (admin) return res.json({ id: admin.id, email: admin.email, name: admin.name, role: 'admin', credits: 999 });
  }
  const user = db.find('users', u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, credits: user.credits, created_at: user.created_at, last_login: user.last_login });
});

export default router;
