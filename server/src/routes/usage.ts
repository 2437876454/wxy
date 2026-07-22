import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';

const router = Router();

router.get('/stats', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const db = getDb();

  const days = parseInt(req.query.days as string) || 7;
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Summary
  const summary = db.prepare(`
    SELECT
      COALESCE(SUM(cost), 0) as total_cost,
      COALESCE(SUM(tokens), 0) as total_tokens,
      COUNT(*) as total_requests
    FROM usage_records
    WHERE user_id = ? AND created_at >= ?
  `).get(userId, since) as { total_cost: number; total_tokens: number; total_requests: number };

  const activeKeys = db.prepare(
    'SELECT COUNT(*) as count FROM api_keys WHERE user_id = ? AND is_active = 1'
  ).get(userId) as { count: number };

  // Daily cost series
  const dailyCost = db.prepare(`
    SELECT DATE(created_at) as date, SUM(cost) as cost
    FROM usage_records
    WHERE user_id = ? AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(userId, since) as { date: string; cost: number }[];

  // Model breakdown
  const modelBreakdown = db.prepare(`
    SELECT model, SUM(cost) as cost, SUM(tokens) as tokens, COUNT(*) as requests
    FROM usage_records
    WHERE user_id = ? AND created_at >= ?
    GROUP BY model
    ORDER BY cost DESC
  `).all(userId, since) as { model: string; cost: number; tokens: number; requests: number }[];

  // Recent calls
  const recentCalls = db.prepare(`
    SELECT r.*, k.name as api_key_name
    FROM usage_records r
    LEFT JOIN api_keys k ON r.api_key_id = k.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all(userId) as (Record<string, unknown> & { api_key_name: string })[];

  res.json({
    total_cost: summary.total_cost,
    total_tokens: summary.total_tokens,
    total_requests: summary.total_requests,
    active_keys: activeKeys.count,
    daily_cost: dailyCost,
    model_breakdown: modelBreakdown,
    recent_calls: recentCalls,
  });
});

router.get('/cost-trend', (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const db = getDb();

  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const data = db.prepare(`
    SELECT DATE(created_at) as date, SUM(cost) as cost, SUM(tokens) as tokens, COUNT(*) as requests
    FROM usage_records
    WHERE user_id = ? AND created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all(userId, since);

  res.json(data);
});

export default router;
