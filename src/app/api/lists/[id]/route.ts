export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const watchlistId = parseInt(params.id, 10);
  if (isNaN(watchlistId)) {
    return NextResponse.json({ error: 'Invalid watchlist ID' }, { status: 400 });
  }

  try {
    const listSql = `
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
        u.avatar_url AS owner_avatar_url
      FROM watchlists w
      JOIN users u ON w.user_id = u.user_id
      WHERE w.watchlist_id = $1;
    `;
    const listRes = await query(listSql, [watchlistId]);

    if (listRes.rows.length === 0) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    const itemsSql = `
      SELECT 
        m.movie_id,
        m.title,
        m.poster_url,
        m.backdrop_url,
        m.release_date,
        m.avg_rating,
        m.review_count,
        m.runtime,
        wi.added_at,
        wi.notes
      FROM watchlist_items wi
      JOIN movies m ON wi.movie_id = m.movie_id
      WHERE wi.watchlist_id = $1
      ORDER BY wi.added_at DESC;
    `;
    const itemsRes = await query(itemsSql, [watchlistId]);

    return NextResponse.json({
      list: listRes.rows[0],
      movies: itemsRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const watchlistId = parseInt(params.id, 10);
  try {
    const body = await request.json();
    const { movieId, action } = body; // action: 'add' or 'remove'

    if (!movieId) {
      return NextResponse.json({ error: 'Missing movieId' }, { status: 400 });
    }

    if (action === 'remove') {
      await query(
        `DELETE FROM watchlist_items WHERE watchlist_id = $1 AND movie_id = $2;`,
        [watchlistId, movieId]
      );
      return NextResponse.json({ success: true, action: 'removed' });
    } else {
      await query(
        `INSERT INTO watchlist_items (watchlist_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [watchlistId, movieId]
      );
      return NextResponse.json({ success: true, action: 'added' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
