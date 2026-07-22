import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { generateToken } from '../middleware/auth';

const router = Router();

router.post('/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: '用户名、邮箱和密码不能为空' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: '密码长度至少6位' });
    return;
  }

  const db = getDb();
  const existing = db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).get(username, email);

  if (existing) {
    res.status(409).json({ error: '用户名或邮箱已被注册' });
    return;
  }

  const id = uuidv4();
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.prepare(
    'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)'
  ).run(id, username, email, hashedPassword);

  const token = generateToken({ userId: id, username });
  res.status(201).json({ token, user: { id, username, email } });
});

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }

  const db = getDb();
  const user = db.prepare(
    'SELECT id, username, email, password FROM users WHERE username = ?'
  ).get(username) as { id: string; username: string; email: string; password: string } | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }

  const token = generateToken({ userId: user.id, username: user.username });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.get('/me', (req: Request, res: Response) => {
  // This route is protected by authMiddleware at the app level
  const token = req.headers.authorization?.slice(7);
  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'console-demo-secret-key-2024') as { userId: string; username: string };
    const db = getDb();
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(decoded.userId);
    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    res.json(user);
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
});

export default router;
