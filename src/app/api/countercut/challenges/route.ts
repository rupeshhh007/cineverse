export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { withTransaction, query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required to create a challenge watchlist' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, movieIds } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Watchlist title is required' }, { status: 400 });
    }

    if (!Array.isArray(movieIds) || movieIds.length === 0) {
      return NextResponse.json({ error: 'At least one movie ID is required' }, { status: 400 });
    }

    const cleanMovieIds = movieIds.map(Number).filter((id) => !isNaN(id) && id > 0);
    if (cleanMovieIds.length === 0) {
      return NextResponse.json({ error: 'Valid movie IDs are required' }, { status: 400 });
    }

    // Verify all movies exist in the database
    const checkMovies = await query(
      `SELECT movie_id FROM movies WHERE movie_id = ANY($1::int[]);`,
      [cleanMovieIds]
    );

    if (checkMovies.rows.length !== cleanMovieIds.length) {
      return NextResponse.json(
        { error: 'One or more specified movies do not exist in the database' },
        { status: 400 }
      );
    }

    // Atomically create watchlist and add items using withTransaction
    const created = await withTransaction(async (tx) => {
      const listRes = await tx.query<{ watchlist_id: number }>(
        `INSERT INTO watchlists (user_id, name, description, is_public)
         VALUES ($1, $2, $3, TRUE)
         RETURNING watchlist_id;`,
        [
          authUser.user_id,
          title.trim(),
          description ? description.trim() : 'Curated double-feature challenge from Countercut investigation.',
        ]
      );

      const watchlistId = listRes.rows[0].watchlist_id;

      for (const mId of cleanMovieIds) {
        await tx.query(
          `INSERT INTO watchlist_items (watchlist_id, movie_id)
           VALUES ($1, $2)
           ON CONFLICT (watchlist_id, movie_id) DO NOTHING;`,
          [watchlistId, mId]
        );
      }

      return { watchlistId };
    });

    return NextResponse.json({
      success: true,
      watchlistId: created.watchlistId,
      message: 'Challenge double-feature watchlist created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
