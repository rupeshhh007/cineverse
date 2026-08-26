export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'SQL query string is required' }, { status: 400 });
    }

    const trimmedSql = sql.trim();

    // Prevent destructive system commands if desired, but allow full DDL/DML for academic demo
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
