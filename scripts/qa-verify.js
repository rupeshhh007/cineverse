
const { PGlite } = require('@electric-sql/pglite');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', '.pglite_db');
const db = new PGlite(dbPath);

const SESSION_SECRET = 'cineverse-secure-session-secret-key-2026';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, hash] = parts;
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const b1 = Buffer.from(hash, 'hex');
    const b2 = Buffer.from(testHash, 'hex');
    if (b1.length !== b2.length) return false;
    return crypto.timingSafeEqual(b1, b2);
  } catch {
    return false;
  }
}

function signSessionToken(payload) {
  const data = JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
  const encodedData = Buffer.from(data).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(encodedData).digest('base64url');
  return `${encodedData}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [encodedData, signature] = token.split('.');
  if (!encodedData || !signature) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encodedData).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    return JSON.parse(Buffer.from(encodedData, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function runQa() {
  console.log('🧪 Starting CineVerse QA Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Database and Schema version
    console.log('📦 Test 1: Schema and app_meta verification');
    const metaRes = await db.query("SELECT value FROM app_meta WHERE key = 'schema_version';");
    assert(metaRes.rows.length > 0, 'app_meta table exists and has schema_version');
    assert(metaRes.rows[0]?.value === '1.1.0', `Schema version is 1.1.0 (found: ${metaRes.rows[0]?.value})`);

    // Test 2: Auth Cryptography (scrypt + HMAC session)
    console.log('\n🔐 Test 2: Password hashing & Tamper-proof session tokens');
    const testPassword = 'mySecretPassword!2026';
    const hash = hashPassword(testPassword);
    assert(hash.startsWith('scrypt:'), 'Password hash uses scrypt format');
    assert(verifyPassword(testPassword, hash), 'Password verification succeeds with valid password');
    assert(!verifyPassword('wrongPassword', hash), 'Password verification fails with invalid password');

    const token = signSessionToken({ userId: 1, username: 'alexrivera' });
    assert(typeof token === 'string' && token.includes('.'), 'Signed session token is created');
    const decoded = verifySessionToken(token);
    assert(decoded && decoded.userId === 1 && decoded.username === 'alexrivera', 'Session token decodes properly');
    assert(verifySessionToken(token + 'tampered') === null, 'Tampered session token is safely rejected');

    // Test 3: Demo account login validation
    console.log('\n🔑 Test 3: Seed demo account passwords match scrypt verification');
    const demoUserRes = await db.query("SELECT user_id, username, password_hash FROM users WHERE email = 'alex@cineverse.io';");
    assert(demoUserRes.rows.length === 1, 'Alex Rivera demo account found');
    assert(verifyPassword('password123', demoUserRes.rows[0].password_hash), 'Alex Rivera demo password123 verified');

    // Test 4: Sequence alignment & New User Registration simulation
    console.log('\n👤 Test 4: User creation & SERIAL sequence safety');
    const userSeqRes = await db.query(`
      INSERT INTO users (username, email, password_hash, display_name)
      VALUES ('qa_tester_' || floor(random()*10000), 'qa_' || floor(random()*10000) || '@test.com', $1, 'QA Tester')
      RETURNING user_id, username;
    `, [hashPassword('password123')]);
    const newUserId = userSeqRes.rows[0]?.user_id;
    assert(newUserId >= 7, `New user inserted with SERIAL id >= 7 without collision (ID: ${newUserId})`);

    // Test 5: Triggers - trg_update_movie_rating on review insert/update
    console.log('\n⚡ Test 5: Real-time PostgreSQL rating triggers');
    const targetMovieId = 1;
    const initialMovie = await db.query('SELECT movie_id, avg_rating, review_count FROM movies WHERE movie_id = $1;', [targetMovieId]);
    const initialCount = initialMovie.rows[0].review_count;

    // Rate film
    await db.query(`
      INSERT INTO reviews (user_id, movie_id, rating, review_text, has_spoilers)
      VALUES ($1, $2, 10.0, '', FALSE)
      ON CONFLICT (user_id, movie_id)
      DO UPDATE SET rating = EXCLUDED.rating, review_text = EXCLUDED.review_text;
    `, [newUserId, targetMovieId]);

    const updatedMovie = await db.query('SELECT movie_id, avg_rating, review_count FROM movies WHERE movie_id = $1;', [targetMovieId]);
    assert(updatedMovie.rows[0].review_count === initialCount + 1, `trg_update_movie_rating automatically updated review_count (${initialCount} -> ${updatedMovie.rows[0].review_count})`);

    // Verify activity log trigger
    const activityCheck = await db.query(`
      SELECT * FROM activity_logs WHERE user_id = $1 AND activity_type = 'NEW_REVIEW' ORDER BY created_at DESC LIMIT 1;
    `, [newUserId]);
    assert(activityCheck.rows.length > 0, 'trg_log_review_activity automatically created audit log entry');

    // Test 6: Optional review text
    console.log('\n📝 Test 6: Optional review text verification');
    const emptyReviewCheck = await db.query('SELECT review_text FROM reviews WHERE user_id = $1 AND movie_id = $2;', [newUserId, targetMovieId]);
    assert(emptyReviewCheck.rows[0]?.review_text === '', 'Reviews accept empty string text (rating-only reviews allowed)');

    // Test 7: Stored Function - fn_get_user_analytics precision
    console.log('\n📊 Test 7: PL/pgSQL fn_get_user_analytics numeric precision');
    const analyticsRes = await db.query('SELECT fn_get_user_analytics($1) AS analytics;', [newUserId]);
    const analytics = analyticsRes.rows[0]?.analytics;
    assert(analytics !== null && typeof analytics === 'object', 'fn_get_user_analytics executes successfully');
    assert(Number(analytics.avg_rating) === 10, `Handles 10.00 without NUMERIC overflow: ${analytics.avg_rating}`);
    assert(typeof analytics.rating_distribution === 'object', 'Rating distribution histogram generated');

    // Test 8: Stored Function - fn_recommend_movies
    console.log('\n🎯 Test 8: fn_recommend_movies recommendation engine');
    const recsForNewUser = await db.query('SELECT * FROM fn_recommend_movies($1, 4);', [newUserId]);
    assert(recsForNewUser.rows.length > 0, `Returns valid recommendations even for users with few reviews (count: ${recsForNewUser.rows.length})`);

    // Test 9: Views - v_trending_movies with Bayesian prior
    console.log('\n📈 Test 9: Analytical views (v_trending_movies & v_recent_activity_feed)');
    const trendingRes = await db.query('SELECT movie_id, title, bayesian_score FROM v_trending_movies LIMIT 5;');
    assert(trendingRes.rows.length > 0, 'v_trending_movies view renders correctly');
    assert(Number(trendingRes.rows[0]?.bayesian_score) > 0, `Bayesian score computed properly: ${trendingRes.rows[0]?.bayesian_score}`);

    const feedRes = await db.query('SELECT log_id, activity_type, username FROM v_recent_activity_feed LIMIT 5;');
    assert(feedRes.rows.length > 0, 'v_recent_activity_feed joins correctly without column collision');

    // Test 10: Watchlist & trigger trg_log_watchlist_add
    console.log('\n🔖 Test 10: Watchlist items & trg_log_watchlist_add trigger');
    const listInsert = await db.query(`
      INSERT INTO watchlists (user_id, name, description, is_public)
      VALUES ($1, 'QA Test Watchlist', 'Testing triggers', TRUE)
      RETURNING watchlist_id;
    `, [newUserId]);
    const wId = listInsert.rows[0].watchlist_id;
    await db.query('INSERT INTO watchlist_items (watchlist_id, movie_id) VALUES ($1, 2);', [wId]);

    const watchlistLogCheck = await db.query(`
      SELECT * FROM activity_logs WHERE user_id = $1 AND activity_type = 'WATCHLIST_ADD' ORDER BY created_at DESC LIMIT 1;
    `, [newUserId]);
    assert(watchlistLogCheck.rows.length > 0, 'trg_log_watchlist_add automatically generated audit log event');

    // Cleanup QA tester
    await db.query('DELETE FROM watchlist_items WHERE watchlist_id = $1;', [wId]);
    await db.query('DELETE FROM watchlists WHERE watchlist_id = $1;', [wId]);
    await db.query('DELETE FROM activity_logs WHERE user_id = $1;', [newUserId]);
    await db.query('DELETE FROM reviews WHERE user_id = $1;', [newUserId]);
    await db.query('DELETE FROM users WHERE user_id = $1;', [newUserId]);
    console.log(`\n🧹 Cleaned up temporary QA user #${newUserId}`);

    console.log('\n=============================================');
    console.log(`🎉 QA Suite Completed: ${passed} PASSED, ${failed} FAILED`);
    console.log('=============================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('QA Suite encountered unexpected fatal error:', err);
    process.exit(1);
  }
}

runQa();
