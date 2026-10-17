export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, allowWrite } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'SQL query string is required' }, { status: 400 });
    }

    const trimmedSql = sql.trim();

    // Strip comments to inspect underlying statements
    const strippedSql = trimmedSql
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .trim();

    // Mutating keywords that must not execute in safe read-only mode
    const mutatingPattern = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE)\b/i;
    const explainAnalyzePattern = /\bEXPLAIN\s+(ANALYZE|.*\bANALYZE\b)/i;

    // Check multiple statements
    const statements = strippedSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const hasMutatingStatements = statements.some(s => mutatingPattern.test(s));
    const hasExplainAnalyze = explainAnalyzePattern.test(strippedSql);

    if (!allowWrite) {
      if (hasMutatingStatements || hasExplainAnalyze) {
        return NextResponse.json(
          {
            success: false,
            error: 'Execution blocked: Mutating statements (or EXPLAIN ANALYZE) require Write Mode.',
            detail: 'Cineverse DB Studio operates in protected Read-Only mode by default to ensure database integrity during evaluation.',
            hint: 'Toggle "Write Mode" in the DB Studio footer to authorize schema or data modifications.',
          },
          { status: 403 }
        );
      }
    } else {
      // In Write Mode, verify user authentication strictly
      const authUser = await getAuthenticatedUser(request);
      if (!authUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'Write Mode requires an authenticated user session.',
            detail: 'Unauthenticated requests cannot perform mutating operations on the database.',
          },
          { status: 401 }
        );
      }
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
