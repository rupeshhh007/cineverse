export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, allowWrite } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'SQL query string is required' }, { status: 400 });
    }

    const trimmedSql = sql.trim();

    // Strip comments to inspect primary statement keyword
    const strippedSql = trimmedSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    // Read-only safety guard: Allow SELECT, WITH, EXPLAIN, SHOW, VALUES by default
    const firstWord = strippedSql.split(/\s+/)[0]?.toUpperCase();
    const isReadOnlyStatement = ['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'VALUES'].includes(firstWord);

    if (!allowWrite && !isReadOnlyStatement) {
      return NextResponse.json(
        {
          success: false,
          error: `Execution blocked: Write operations (${firstWord || 'DML/DDL'}) require Write Mode.`,
          detail: 'CineVerse DBMS Console runs in protected Read-Only mode by default to prevent accidental data corruption during evaluation.',
          hint: 'Toggle "Write Mode" in the console toolbar to allow INSERT, UPDATE, DELETE, or DDL operations.',
        },
        { status: 403 }
      );
    }

    const result = await query(trimmedSql);

    // Extract column metadata from first row if available
    const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

    return NextResponse.json({
      success: true,
      columns,
      rows: result.rows,
      rowCount: result.rowCount,
      durationMs: result.durationMs,
      sql: trimmedSql,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'SQL Execution Error',
        detail: error.detail || null,
        hint: error.hint || null,
      },
      { status: 400 }
    );
  }
}
