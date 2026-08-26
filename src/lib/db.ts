import { PGlite } from '@electric-sql/pglite';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Global singleton to preserve connection across HMR and concurrent API handlers
const globalForDb = globalThis as unknown as {
  pglite?: PGlite;
  pgPool?: Pool;
  initPromise?: Promise<void>;
};

const useExternalPostgres = Boolean(process.env.DATABASE_URL);

/**
 * Initialize PostgreSQL Engine (Embedded PGlite or standard pg Pool)
 */
export async function getDb() {
  if (useExternalPostgres) {
    if (!globalForDb.pgPool) {
      globalForDb.pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
    }
    return { type: 'postgres' as const, client: globalForDb.pgPool };
  }

  // Embedded PostgreSQL (PGlite)
  if (!globalForDb.pglite) {
    const dbPath = path.join(process.cwd(), '.pglite_db');
    globalForDb.pglite = new PGlite(dbPath);
  }

  if (!globalForDb.initPromise) {
    globalForDb.initPromise = initDatabaseSchema(globalForDb.pglite);
  }
  await globalForDb.initPromise;

  return { type: 'pglite' as const, client: globalForDb.pglite };
}

/**
 * Executes schema.sql and seed.sql if tables do not exist
 */
async function initDatabaseSchema(pglite: PGlite) {
  try {
    // Check if movies table exists
    const check = await pglite.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movies'
      );
    `);

    if (!check.rows[0]?.exists) {
      console.log('⚡ [DBMS] Initializing CineVerse Schema and Seeds...');
      const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
      const seedPath = path.join(process.cwd(), 'db', 'seed.sql');

      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pglite.exec(schemaSql);
        console.log('✅ [DBMS] Schema, Triggers, Views & Procedures installed.');
      }

      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8');
        await pglite.exec(seedSql);
        console.log('✅ [DBMS] Seed dataset successfully populated.');
      }
    }
  } catch (error) {
    console.error('❌ [DBMS] Error initializing schema:', error);
  }
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  durationMs: number;
  sql: string;
  params?: any[];
}

/**
 * Main Raw SQL query executor with performance profiling
 */
export async function query<T = any>(
  sqlText: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const start = performance.now();
  const db = await getDb();

  try {
    let rows: T[] = [];
    let rowCount = 0;

    if (db.type === 'pglite') {
      const res = await db.client.query<T>(sqlText, params);
      rows = res.rows || [];
      rowCount = res.affectedRows ?? rows.length;
    } else {
      const res = await db.client.query<any>(sqlText, params);
      rows = res.rows || [];
      rowCount = res.rowCount ?? rows.length;
    }

    const durationMs = Math.round((performance.now() - start) * 100) / 100;

    return {
      rows,
      rowCount,
      durationMs,
      sql: sqlText.trim(),
      params,
    };
  } catch (error: any) {
    console.error('SQL Execution Error:', {
      sql: sqlText,
      params,
      message: error.message,
    });
    throw error;
  }
}

/**
 * Raw multi-statement SQL script executor (DDL/DML)
 */
export async function execSql(sqlText: string): Promise<{ durationMs: number }> {
  const start = performance.now();
  const db = await getDb();

  if (db.type === 'pglite') {
    await db.client.exec(sqlText);
  } else {
    await db.client.query(sqlText);
  }

  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  return { durationMs };
}
