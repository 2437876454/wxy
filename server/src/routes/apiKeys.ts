import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import crypto from 'crypto';

const router = Router();

// List keys
router.get('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const db = getDb();
  const keys = db.prepare(
    'SELECT id, name, key, last_used, is_active, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).all(userId);
  res.json(keys);
});

// Create key
router.post('/', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    res.status(400).json({ error: '请输入密钥名称' });
    return;
  }

  const id = uuidv4();
  const key = 'sk-' + crypto.randomBytes(32).toString('hex');

  const db = getDb();
  db.prepare(
    'INSERT INTO api_keys (id, user_id, name, key) VALUES (?, ?, ?, ?)'
  ).run(id, userId, name.trim(), key);

  res.status(201).json({ id, name: name.trim(), key, created_at: new Date().toISOString() });
});

// Delete key
router.delete('/:id', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const db = getDb();

  const key = db.prepare(
    'SELECT id FROM api_keys WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId);

  if (!key) {
    res.status(404).json({ error: '密钥不存在' });
    return;
  }

  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ message: '密钥已删除' });
});

// Toggle key active status
router.patch('/:id/toggle', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const db = getDb();

  const key = db.prepare(
    'SELECT id, is_active FROM api_keys WHERE id = ? AND user_id = ?'
  ).get(req.params.id, userId) as { id: string; is_active: number } | undefined;

  if (!key) {
    res.status(404).json({ error: '密钥不存在' });
    return;
  }

  db.prepare('UPDATE api_keys SET is_active = ? WHERE id = ?')
    .run(key.is_active ? 0 : 1, req.params.id);

  res.json({ message: '状态已更新', is_active: !key.is_active });
});

export default router;
