export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const movieId = searchParams.get('movieId');
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const conditions: string[] = ['1=1'];
  const params: any[] = [];
  let paramIdx = 1;

  if (movieId) {
    conditions.push(`r.movie_id = $${paramIdx++}`);
    params.push(parseInt(movieId, 10));
  }

  if (userId) {
    conditions.push(`r.user_id = $${paramIdx++}`);
    params.push(parseInt(userId, 10));
  }

  const sql = `
    SELECT 
      r.review_id,
      r.user_id,
      r.movie_id,
      r.rating,
      r.review_text,
      r.has_spoilers,
      r.likes_count,
      r.created_at,
      r.updated_at,
      u.username,
      u.display_name,
      u.avatar_url,
      m.title AS movie_title,
      m.poster_url AS poster_url
    FROM reviews r
    JOIN users u ON r.user_id = u.user_id
    JOIN movies m ON r.movie_id = m.movie_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY r.created_at DESC
    LIMIT ${limit};
  `;

  try {
    const result = await query(sql, params);
    return NextResponse.json({
      reviews: result.rows,
      meta: {
        sql: result.sql,
        params: result.params,
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
    const { userId, movieId, rating, reviewText, hasSpoilers } = body;

    if (!userId || !movieId || rating === undefined || !reviewText) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, movieId, rating, reviewText' },
        { status: 400 }
      );
    }

    const numRating = parseFloat(rating);
    if (numRating < 1.0 || numRating > 10.0) {
      return NextResponse.json(
        { error: 'Rating must be between 1.0 and 10.0' },
        { status: 400 }
      );
    }

    // Upsert review (Postgres trigger trg_update_movie_rating will auto-recalc movie stats!)
    const sql = `
      INSERT INTO reviews (user_id, movie_id, rating, review_text, has_spoilers, updated_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, movie_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        review_text = EXCLUDED.review_text,
        has_spoilers = EXCLUDED.has_spoilers,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const result = await query(sql, [
      userId,
      movieId,
      numRating,
      reviewText,
      Boolean(hasSpoilers),
    ]);

    // Fetch the updated movie stats to show the trigger's immediate effect!
    const movieCheck = await query(
      `SELECT movie_id, title, avg_rating, review_count FROM movies WHERE movie_id = $1;`,
      [movieId]
    );

    return NextResponse.json({
      success: true,
      review: result.rows[0],
      updatedMovie: movieCheck.rows[0],
      triggerEffect: {
        triggerName: 'trg_update_movie_rating',
        newAvgRating: movieCheck.rows[0]?.avg_rating,
        newReviewCount: movieCheck.rows[0]?.review_count,
      },
      meta: {
        sql: result.sql,
        durationMs: result.durationMs,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
