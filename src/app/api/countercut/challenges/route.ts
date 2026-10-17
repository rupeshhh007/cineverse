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
    const { caseId, title, description, movieIds } = body;

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

    // 1. If caseId is provided, verify case ownership and that requested movies match the proposed challenge
    if (caseId) {
      const caseRes = await query<any>(
        `SELECT user_id, proposed_challenge FROM agent_cases WHERE case_id = $1`,
        [caseId]
      );

      if (caseRes.rows.length === 0) {
        return NextResponse.json(
          { error: 'Originating Countercut case not found' },
          { status: 404 }
        );
      }

      const caseRow = caseRes.rows[0];
      if (caseRow.user_id !== authUser.user_id) {
        return NextResponse.json(
          { error: 'Forbidden: Originating case does not belong to authenticated user' },
          { status: 403 }
        );
      }

      const proposed =
        typeof caseRow.proposed_challenge === 'string'
          ? JSON.parse(caseRow.proposed_challenge)
          : caseRow.proposed_challenge;

      if (proposed && Array.isArray(proposed.movieIds)) {
        const proposedSet = new Set(proposed.movieIds.map(Number));
        const matches = cleanMovieIds.every((id: number) => proposedSet.has(id));
        if (!matches) {
          return NextResponse.json(
            { error: 'Challenge movies do not match the proposed challenge on this case' },
            { status: 400 }
          );
        }
      }
    }

    // 2. Prevent duplicate list creation (idempotent user action)
    const existingList = await query<any>(
      `SELECT watchlist_id FROM watchlists WHERE user_id = $1 AND name = $2 LIMIT 1;`,
      [authUser.user_id, title.trim()]
    );

    if (existingList.rows.length > 0) {
      return NextResponse.json({
        success: true,
        watchlistId: existingList.rows[0].watchlist_id,
        alreadyExisted: true,
        message: 'Challenge watchlist already exists for this user',
      });
    }

    // 3. Verify all movies exist in relational storage
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

    // 4. Atomically create watchlist and add items using withTransaction
    const created = await withTransaction(async (tx) => {
      const listRes = await tx.query<{ watchlist_id: number }>(
        `INSERT INTO watchlists (user_id, name, description, is_public)
         VALUES ($1, $2, $3, TRUE)
         RETURNING watchlist_id;`,
        [
          authUser.user_id,
          title.trim(),
          description
            ? description.trim()
            : 'Curated double-feature challenge from Countercut investigation.',
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
