const fs = require('node:fs');
const path = require('node:path');

class InMemoryPaymentStore {
  constructor() {
    this.processedEventIds = new Set();
    this.paymentsByOrderId = new Map();
  }

  async initialize() {}
  async close() {}
  async getStoreInfo() {
    return { driver: 'memory' };
  }

  async hasProcessedEvent(eventId) {
    return this.processedEventIds.has(eventId);
  }

  async markProcessedEvent(eventId, _type = null, _payload = null) {
    if (!eventId || this.processedEventIds.has(eventId)) {
      return false;
    }
    this.processedEventIds.add(eventId);
    return true;
  }

  async getPayment(orderId) {
    return this.paymentsByOrderId.get(orderId) || null;
  }

  async setPayment(orderId, record) {
    if (!orderId) return;
    const existing = this.paymentsByOrderId.get(orderId) || {};
    this.paymentsByOrderId.set(orderId, {
      ...existing,
      ...record,
      orderId,
      updatedAt: new Date().toISOString(),
    });
  }
}

class FilePaymentStore {
  constructor(filePath) {
    this.filePath = filePath || path.resolve(process.cwd(), 'data', 'payment-store.json');
    this.state = {
      processedEventIds: [],
      paymentsByOrderId: {},
    };
  }

  async initialize() {
    try {
      const dir = path.dirname(this.filePath);
      fs.mkdirSync(dir, { recursive: true });

      if (!fs.existsSync(this.filePath)) {
        await this.save();
        return;
      }

      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw);
      this.state = {
        processedEventIds: Array.isArray(parsed?.processedEventIds)
          ? parsed.processedEventIds
          : [],
        paymentsByOrderId: parsed?.paymentsByOrderId || {},
      };
    } catch (error) {
      console.error('Failed to load file payment store, using empty state:', error);
      this.state = {
        processedEventIds: [],
        paymentsByOrderId: {},
      };
    }
  }

  async close() {}
  async getStoreInfo() {
    return {
      driver: 'file',
      path: this.filePath,
    };
  }

  async save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  async hasProcessedEvent(eventId) {
    return this.state.processedEventIds.includes(eventId);
  }

  async markProcessedEvent(eventId, _type = null, _payload = null) {
    if (!eventId || this.state.processedEventIds.includes(eventId)) {
      return false;
    }
    this.state.processedEventIds.push(eventId);
    await this.save();
    return true;
  }

  async getPayment(orderId) {
    return this.state.paymentsByOrderId[orderId] || null;
  }

  async setPayment(orderId, record) {
    if (!orderId) return;
    this.state.paymentsByOrderId[orderId] = {
      ...(this.state.paymentsByOrderId[orderId] || {}),
      ...record,
      orderId,
      updatedAt: new Date().toISOString(),
    };
    await this.save();
  }
}

class SqlitePaymentStore {
  constructor(dbPath) {
    this.dbPath = dbPath || path.resolve(process.cwd(), 'data', 'payment-store.sqlite');
    this.db = null;
  }

  async initialize() {
    const dir = path.dirname(this.dbPath);
    fs.mkdirSync(dir, { recursive: true });
    const { open } = require('sqlite');
    const sqlite3 = require('sqlite3');

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS payment_events (
        event_id TEXT PRIMARY KEY,
        type TEXT,
        received_at TEXT DEFAULT (datetime('now')),
        payload_json TEXT
      );
    `);

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        order_id TEXT PRIMARY KEY,
        payment_intent_id TEXT UNIQUE,
        status TEXT NOT NULL,
        fulfillment TEXT NOT NULL DEFAULT 'pending',
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
  async getStoreInfo() {
    return {
      driver: 'sqlite',
      path: this.dbPath,
    };
  }

  async hasProcessedEvent(eventId) {
    const row = await this.db.get(
      `SELECT event_id FROM payment_events WHERE event_id = ? LIMIT 1`,
      [eventId]
    );
    return Boolean(row);
  }

  async markProcessedEvent(eventId, type = null, payload = null) {
    if (!eventId) return false;
    const result = await this.db.run(
      `INSERT OR IGNORE INTO payment_events (event_id, type, payload_json) VALUES (?, ?, ?)`,
      [eventId, type, payload ? JSON.stringify(payload) : null]
    );
    return result?.changes > 0;
  }

  async getPayment(orderId) {
    const row = await this.db.get(
      `SELECT order_id AS orderId, payment_intent_id AS paymentIntentId, status, fulfillment, updated_at AS updatedAt
       FROM payment_intents WHERE order_id = ? LIMIT 1`,
      [orderId]
    );
    return row || null;
  }

  async setPayment(orderId, record) {
    if (!orderId) return;
    const existing = (await this.getPayment(orderId)) || {};
    const merged = {
      orderId,
      paymentIntentId: record.paymentIntentId ?? existing.paymentIntentId ?? null,
      status: record.status ?? existing.status ?? 'requires_payment_method',
      fulfillment: record.fulfillment ?? existing.fulfillment ?? 'pending',
    };

    await this.db.run(
      `INSERT INTO payment_intents (order_id, payment_intent_id, status, fulfillment, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(order_id) DO UPDATE SET
         payment_intent_id = excluded.payment_intent_id,
         status = excluded.status,
         fulfillment = excluded.fulfillment,
         updated_at = datetime('now')`,
      [merged.orderId, merged.paymentIntentId, merged.status, merged.fulfillment]
    );
  }
}

class PostgresPaymentStore {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.client = null;
  }

  async initialize() {
    const { Client } = require('pg');
    this.client = new Client({
      connectionString: this.connectionString,
      ssl: process.env.PGSSLMODE === 'disable' ? false : undefined,
    });
    await this.client.connect();

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS payment_events (
        event_id TEXT PRIMARY KEY,
        type TEXT,
        received_at TIMESTAMPTZ DEFAULT NOW(),
        payload_json JSONB
      );
    `);

    await this.client.query(`
      CREATE TABLE IF NOT EXISTS payment_intents (
        order_id TEXT PRIMARY KEY,
        payment_intent_id TEXT UNIQUE,
        status TEXT NOT NULL,
        fulfillment TEXT NOT NULL DEFAULT 'pending',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
  }

  async close() {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
  async getStoreInfo() {
    return { driver: 'postgres' };
  }

  async hasProcessedEvent(eventId) {
    const result = await this.client.query(
      `SELECT event_id FROM payment_events WHERE event_id = $1 LIMIT 1`,
      [eventId]
    );
    return result.rowCount > 0;
  }

  async markProcessedEvent(eventId, type = null, payload = null) {
    if (!eventId) return false;
    const result = await this.client.query(
      `INSERT INTO payment_events (event_id, type, payload_json)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, type, payload ? JSON.stringify(payload) : null]
    );
    return result.rowCount > 0;
  }

  async getPayment(orderId) {
    const result = await this.client.query(
      `SELECT order_id AS "orderId", payment_intent_id AS "paymentIntentId", status, fulfillment, updated_at AS "updatedAt"
       FROM payment_intents WHERE order_id = $1 LIMIT 1`,
      [orderId]
    );
    return result.rows[0] || null;
  }

  async setPayment(orderId, record) {
    if (!orderId) return;
    const existing = (await this.getPayment(orderId)) || {};
    const merged = {
      orderId,
      paymentIntentId: record.paymentIntentId ?? existing.paymentIntentId ?? null,
      status: record.status ?? existing.status ?? 'requires_payment_method',
      fulfillment: record.fulfillment ?? existing.fulfillment ?? 'pending',
    };

    await this.client.query(
      `INSERT INTO payment_intents (order_id, payment_intent_id, status, fulfillment, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (order_id) DO UPDATE SET
         payment_intent_id = EXCLUDED.payment_intent_id,
         status = EXCLUDED.status,
         fulfillment = EXCLUDED.fulfillment,
         updated_at = NOW()`,
      [merged.orderId, merged.paymentIntentId, merged.status, merged.fulfillment]
    );
  }
}

async function createPaymentStoreFromEnv(overrides = {}) {
  const driver = (process.env.PAYMENT_STORE_DRIVER || 'auto').toLowerCase();
  const databaseUrl = process.env.DATABASE_URL || '';
  const sqlitePath = overrides.sqlitePath || process.env.SQLITE_DB_PATH || '';
  const filePath = overrides.paymentStorePath || process.env.PAYMENT_STORE_PATH || '';

  let store;
  if (driver === 'postgres' || (driver === 'auto' && databaseUrl)) {
    store = new PostgresPaymentStore(databaseUrl);
  } else if (driver === 'sqlite' || driver === 'auto') {
    store = new SqlitePaymentStore(sqlitePath || undefined);
  } else if (driver === 'file') {
    store = new FilePaymentStore(filePath || undefined);
  } else if (driver === 'memory') {
    store = new InMemoryPaymentStore();
  } else {
    throw new Error(`Unsupported PAYMENT_STORE_DRIVER: ${driver}`);
  }

  await store.initialize();
  return store;
}

module.exports = {
  InMemoryPaymentStore,
  FilePaymentStore,
  SqlitePaymentStore,
  PostgresPaymentStore,
  createPaymentStoreFromEnv,
};
