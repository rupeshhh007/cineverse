export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, displayName, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { rows } = await query(
      `INSERT INTO users (username, email, display_name, password_hash) 
       VALUES ($1, $2, $3, 'hashed_demo') 
       RETURNING *`,
      [username, email, displayName || username]
    );

    const user = rows[0];

    return NextResponse.json({
      success: true,
      user: {
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        email: user.email
      }
    });
  } catch (error: any) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
