export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  let sql = `
    SELECT 
      w.watchlist_id,
      w.user_id,
      w.name,
      w.description,
      w.is_public,
      w.likes_count,
      w.created_at,
      u.username AS owner_username,
      u.display_name AS owner_display_name,
      u.avatar_url AS owner_avatar_url,
      COUNT(wi.movie_id)::INT AS movie_count,
      COALESCE(
        json_agg(
          json_build_object(
            'movie_id', m.movie_id,
            'title', m.title,
            'poster_url', m.poster_url,
            'avg_rating', m.avg_rating
          )
        ) FILTER (WHERE m.movie_id IS NOT NULL), '[]'
      ) AS movies
    FROM watchlists w
    JOIN users u ON w.user_id = u.user_id
    LEFT JOIN watchlist_items wi ON w.watchlist_id = wi.watchlist_id
    LEFT JOIN movies m ON wi.movie_id = m.movie_id
  `;

  const params: any[] = [];
  if (userId) {
    sql += ` WHERE w.user_id = $1`;
    params.push(parseInt(userId, 10));
  } else {
    sql += ` WHERE w.is_public = TRUE`;
  }

  sql += `
    GROUP BY w.watchlist_id, u.user_id
    ORDER BY w.likes_count DESC, w.created_at DESC;
  `;

  try {
    const result = await query(sql, params);
    return NextResponse.json({
      lists: result.rows,
      meta: {
        sql: result.sql,
        durationMs: result.durationMs,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, isPublic, movieIds } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing userId or list name' }, { status: 400 });
    }

    // 1. Insert watchlist
    const insertListSql = `
      INSERT INTO watchlists (user_id, name, description, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const listRes = await query(insertListSql, [
      userId,
      name,
      description || '',
      isPublic !== false,
    ]);
    const newList = listRes.rows[0];

    // 2. Insert movie items if provided
    if (Array.isArray(movieIds) && movieIds.length > 0) {
      for (const mid of movieIds) {
        await query(
          `INSERT INTO watchlist_items (watchlist_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [newList.watchlist_id, mid]
        );
      }
    }

    // 3. Log activity
    await query(
      `INSERT INTO activity_logs (user_id, activity_type, target_id, metadata) VALUES ($1, 'CREATE_LIST', $2, $3);`,
      [userId, newList.watchlist_id, JSON.stringify({ list_name: name, movie_count: movieIds?.length || 0 })]
    );

    return NextResponse.json({ success: true, list: newList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
