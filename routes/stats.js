import { Router } from 'express';
import db from '../src/db.js';

const router = Router();

router.get('/public', (req, res) => {
  res.json({
    totalUsers: db.count('users'),
    totalCVs: db.count('cvs'),
    totalGenerations: db.count('analytics', a => a.event === 'cv_generate')
  });
});

export default router;
