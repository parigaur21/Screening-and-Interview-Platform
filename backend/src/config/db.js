import pg from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );
`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPostgres = false;
let pgPool = null;
let sqliteDb = null;

// Determine if we should connect to PostgreSQL (production RDS) or SQLite (local testing)
if (process.env.DB_HOST && process.env.DB_USER) {
  isPostgres = true;
  pgPool = new pg.Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
  console.log('🚀 DB Connection: Using PostgreSQL (AWS RDS Production Mode)');
} else {
  const dbPath = path.resolve(__dirname, '../../database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);
  console.log(`🔌 DB Connection: Using SQLite (Zero-Setup Local Mode) -> ${dbPath}`);
}

/**
 * Unified SQL query executor.
 * Translates PostgreSQL parameterized queries ($1, $2) to SQLite (?) transparently.
 */
export async function query(sql, params = []) {
  if (isPostgres) {
    try {
      const res = await pgPool.query(sql, params);
      return res.rows;
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      throw error;
    }
  } else {
    // Translate $1, $2 ... to ? for SQLite
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      sqliteDb.all(sqliteSql, params, (err, rows) => {
        if (err) {
          console.error('SQLite query error:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
}

/**
 * Unified SQL command executor (for INSERT/UPDATE/DELETE where meta info might be needed,
 * or simple execution).
 */
export async function execute(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount };
  } else {
    const sqliteSql = sql.replace(/\$\d+/g, '?');
    return new Promise((resolve, reject) => {
      sqliteDb.run(sqliteSql, params, function (err) {
        if (err) {
          console.error('SQLite execution error:', err);
          reject(err);
        } else {
          resolve({ rows: [], rowCount: this.changes, lastID: this.lastID });
        }
      });
    });
  }
}

/**
 * Initializes database schemas.
 */
export async function initDatabase() {
  const createJobsTable = `
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      description TEXT NOT NULL,
      requirements TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createCandidatesTable = `
    CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      skills TEXT,
      experience INTEGER,
      resume_text TEXT,
      fit_score INTEGER,
      screening_summary TEXT,
      status TEXT DEFAULT 'Screened',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createInterviewsTable = `
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      candidate_id TEXT NOT NULL,
      status TEXT DEFAULT 'Scheduled',
      current_question_index INTEGER DEFAULT 0,
      overall_feedback TEXT,
      score INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      interview_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      feedback TEXT,
      score INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    if (isPostgres) {
      await pgPool.query(createUsersTable);
      await pgPool.query(createJobsTable);
      await pgPool.query(createCandidatesTable);
      await pgPool.query(createInterviewsTable);
      await pgPool.query(createMessagesTable);
    } else {
      sqliteDb.serialize(() => {
        sqliteDb.run(createUsersTable);
        sqliteDb.run(createJobsTable);
        sqliteDb.run(createCandidatesTable);
        sqliteDb.run(createInterviewsTable);
        sqliteDb.run(createMessagesTable);
      });
    }
    console.log('✅ Database Schemas Initialized Successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize database schemas:', error);
  }
}
