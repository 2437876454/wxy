import Database from 'better-sqlite3';

const DB_PATH = '/tmp/console.db';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = DELETE');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDb(): void {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      last_used TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens INTEGER NOT NULL,
      cost REAL NOT NULL,
      api_key_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_records(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_usage_api_key ON usage_records(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
  `);

  const count = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (count.count === 0) {
    seedDemoData(database);
  }
}

function seedDemoData(database: Database.Database): void {
  const bcrypt = require('bcryptjs');
  const v4 = require('uuid').v4;

  const userId = v4();
  const hashedPassword = bcrypt.hashSync('demo123456', 10);

  database.prepare(
    'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)'
  ).run(userId, 'demo', 'demo@example.com', hashedPassword);

  const keys = [
    { name: '生产环境', key: 'sk-demo-prod-' + v4().replace(/-/g, '').slice(0, 24) },
    { name: '测试环境', key: 'sk-demo-staging-' + v4().replace(/-/g, '').slice(0, 24) },
    { name: '个人开发', key: 'sk-demo-dev-' + v4().replace(/-/g, '').slice(0, 24) },
  ];

  const keyIds: { id: string; name: string }[] = [];
  for (const k of keys) {
    const id = v4();
    database.prepare(
      'INSERT INTO api_keys (id, user_id, name, key) VALUES (?, ?, ?, ?)'
    ).run(id, userId, k.name, k.key);
    keyIds.push({ id, name: k.name });
  }

  const models = ['deepseek-chat', 'deepseek-coder', 'deepseek-reasoner'];
  const endpoints = ['/chat/completions', '/completions', '/v1/chat/completions'];
  const stmt = database.prepare(
    'INSERT INTO usage_records (id, user_id, model, tokens, cost, api_key_id, endpoint, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const insertMany = database.transaction(() => {
    for (let day = 60; day >= 0; day--) {
      const date = new Date(Date.now() - day * 86400000);
      const callsPerDay = Math.floor(Math.random() * 30) + 5;

      for (let i = 0; i < callsPerDay; i++) {
        const model = models[Math.floor(Math.random() * models.length)];
        const keyEntry = keyIds[Math.floor(Math.random() * keyIds.length)];
        const tokens = Math.floor(Math.random() * 4000) + 100;
        const cost = parseFloat((tokens * 0.000002).toFixed(6));
        const time = new Date(date.getTime() + Math.floor(Math.random() * 86400000));

        stmt.run(
          v4(),
          userId,
          model,
          tokens,
          cost,
          keyEntry.id,
          endpoints[Math.floor(Math.random() * endpoints.length)],
          time.toISOString()
        );
      }
    }
  });

  insertMany();
}
