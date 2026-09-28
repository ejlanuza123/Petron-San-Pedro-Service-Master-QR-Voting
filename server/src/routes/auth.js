import express from 'express';
import db, { verifyPassword } from '../db/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Username and password are required' });
  }

  const admin = db.getAdminByUsername(username);
  if (!admin) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
  }

  const isValid = verifyPassword(password, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid username or password' });
  }

  db.updateAdminLogin(admin.id);
  db.logAction({
    admin_id: admin.id,
    action: 'ADMIN_LOGIN',
    target_id: admin.id,
    details: `Admin ${admin.username} logged in successfully`
  });

  const token = generateToken({
    id: admin.id,
    username: admin.username,
    role: admin.role,
    name: admin.name
  });

  res.json({
    token,
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role
    }
  });
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  const admin = db.getAdminByUsername(req.user.username);
  if (!admin) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Admin account not found' });
  }
  res.json({
    user: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      last_login: admin.last_login
    }
  });
});

export default router;
