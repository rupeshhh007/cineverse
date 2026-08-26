-- ============================================================================
-- CINEVERSE: A Social Movie Discovery and Review Platform
-- Database Management Systems (DBMS) - PostgreSQL Schema DDL
-- Author: CineVerse Engineering Team
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DROP EXISTING OBJECTS (FOR CLEAN RE-INSTALLATION)
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_recent_activity_feed CASCADE;
DROP VIEW IF EXISTS v_genre_performance CASCADE;
DROP VIEW IF EXISTS v_user_leaderboard CASCADE;
DROP VIEW IF EXISTS v_trending_movies CASCADE;

DROP TRIGGER IF EXISTS trg_update_movie_rating ON reviews CASCADE;
DROP TRIGGER IF EXISTS trg_log_review_activity ON reviews CASCADE;
DROP TRIGGER IF EXISTS trg_update_review_likes ON review_likes CASCADE;
DROP TRIGGER IF EXISTS trg_log_watchlist_activity ON watchlist_items CASCADE;

DROP FUNCTION IF EXISTS fn_trg_update_movie_rating_stats() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_log_review_activity() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_update_review_likes() CASCADE;
DROP FUNCTION IF EXISTS fn_trg_log_watchlist_activity() CASCADE;
DROP FUNCTION IF EXISTS fn_recommend_movies(INT, INT) CASCADE;
DROP FUNCTION IF EXISTS fn_get_user_analytics(INT) CASCADE;

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS watchlist_items CASCADE;
DROP TABLE IF EXISTS watchlists CASCADE;
DROP TABLE IF EXISTS review_likes CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS movie_cast CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS movie_genres CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS movies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 2. TABLE DEFINITIONS (Normalized to 3NF / BCNF)
-- ----------------------------------------------------------------------------

-- USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'hashed_secret',
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    banner_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- GENRES TABLE
CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon_name VARCHAR(30) DEFAULT 'film'
);

-- MOVIES TABLE
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    tmdb_id INT UNIQUE,
    title VARCHAR(255) NOT NULL,
    tagline TEXT,
    overview TEXT NOT NULL,
    release_date DATE NOT NULL,
    runtime INT NOT NULL, -- in minutes
    poster_url VARCHAR(500) NOT NULL,
    backdrop_url VARCHAR(500) NOT NULL,
    trailer_url VARCHAR(500),
    director VARCHAR(150),
    avg_rating NUMERIC(3, 1) DEFAULT 0.0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MOVIE_GENRES (Many-to-Many Bridge Table)
CREATE TABLE movie_genres (
    movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id INT NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- PEOPLE TABLE (Cast, Crew, Directors)
CREATE TABLE people (
    person_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    profile_path VARCHAR(500),
    known_for_department VARCHAR(50) DEFAULT 'Acting',
    biography TEXT
);

-- MOVIE_CAST (Many-to-Many Bridge with Role Attributes)
CREATE TABLE movie_cast (
    movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    person_id INT NOT NULL REFERENCES people(person_id) ON DELETE CASCADE,
    character_name VARCHAR(150),
    job_role VARCHAR(50) DEFAULT 'Actor', -- 'Actor', 'Director', 'Writer', 'Composer'
    cast_order INT DEFAULT 0,
    PRIMARY KEY (movie_id, person_id, job_role)
);

-- REVIEWS TABLE
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
    review_text TEXT NOT NULL,
    has_spoilers BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_movie_review UNIQUE (user_id, movie_id)
);

-- REVIEW_LIKES TABLE
CREATE TABLE review_likes (
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    review_id INT NOT NULL REFERENCES reviews(review_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, review_id)
);

-- WATCHLISTS TABLE (Custom User Curated Lists)
CREATE TABLE watchlists (
    watchlist_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_system_default BOOLEAN DEFAULT FALSE, -- e.g. default 'Watchlist'
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WATCHLIST_ITEMS TABLE
CREATE TABLE watchlist_items (
    watchlist_id INT NOT NULL REFERENCES watchlists(watchlist_id) ON DELETE CASCADE,
    movie_id INT NOT NULL REFERENCES movies(movie_id) ON DELETE CASCADE,
    notes VARCHAR(255),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (watchlist_id, movie_id)
);

-- FOLLOWS TABLE (Social Graph)
CREATE TABLE follows (
    follower_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    following_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    CONSTRAINT check_not_self_follow CHECK (follower_id != following_id)
);

-- ACTIVITY_LOGS TABLE (Real-time Audit & Social Feed)
CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'NEW_REVIEW', 'LIKE_REVIEW', 'CREATE_LIST', 'WATCHLIST_ADD', 'FOLLOW'
    target_id INT NOT NULL, -- movie_id, review_id, watchlist_id, or followed user_id
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ----------------------------------------------------------------------------
CREATE INDEX idx_movies_release_date ON movies(release_date DESC);
CREATE INDEX idx_movies_avg_rating ON movies(avg_rating DESC);
CREATE INDEX idx_movies_title ON movies(title);
CREATE INDEX idx_reviews_movie_id ON reviews(movie_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_movie_genres_genre_id ON movie_genres(genre_id);
CREATE INDEX idx_movie_cast_person_id ON movie_cast(person_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- ----------------------------------------------------------------------------
-- 4. DATABASE TRIGGERS & PL/pgSQL FUNCTIONS
-- ----------------------------------------------------------------------------

-- TRIGGER 1: Automatically recalculate average rating and review count on movie
CREATE OR REPLACE FUNCTION fn_trg_update_movie_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
    target_movie_id INT;
    v_avg NUMERIC(3, 1);
    v_count INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_movie_id := OLD.movie_id;
    ELSE
        target_movie_id := NEW.movie_id;
    END IF;

    -- Calculate fresh aggregate stats
    SELECT 
        COALESCE(ROUND(AVG(rating), 1), 0.0),
        COUNT(*)
    INTO v_avg, v_count
    FROM reviews
    WHERE movie_id = target_movie_id;

    -- Update movie summary columns
    UPDATE movies
    SET 
        avg_rating = v_avg,
        review_count = v_count
    WHERE movie_id = target_movie_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_movie_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_movie_rating_stats();


-- TRIGGER 2: Automatically log activity on review submission
CREATE OR REPLACE FUNCTION fn_trg_log_review_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_movie_title VARCHAR(255);
BEGIN
    SELECT title INTO v_movie_title FROM movies WHERE movie_id = NEW.movie_id;

    INSERT INTO activity_logs (user_id, activity_type, target_id, metadata)
    VALUES (
        NEW.user_id,
        'NEW_REVIEW',
        NEW.movie_id,
        jsonb_build_object(
            'movie_id', NEW.movie_id,
            'movie_title', v_movie_title,
            'rating', NEW.rating,
            'review_id', NEW.review_id,
            'snippet', SUBSTRING(NEW.review_text FROM 1 FOR 80)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_review_activity
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_trg_log_review_activity();


-- TRIGGER 3: Update review like count automatically
CREATE OR REPLACE FUNCTION fn_trg_update_review_likes()
RETURNS TRIGGER AS $$
DECLARE
    target_review_id INT;
    v_likes INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_review_id := OLD.review_id;
    ELSE
        target_review_id := NEW.review_id;
    END IF;

    SELECT COUNT(*) INTO v_likes FROM review_likes WHERE review_id = target_review_id;

    UPDATE reviews
    SET likes_count = v_likes
    WHERE review_id = target_review_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_review_likes
AFTER INSERT OR DELETE ON review_likes
FOR EACH ROW
EXECUTE FUNCTION fn_trg_update_review_likes();


-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURES & ANALYTICAL FUNCTIONS
-- ----------------------------------------------------------------------------

-- FUNCTION: Smart Movie Recommendation Algorithm (Personalized Collaborative Filter)
CREATE OR REPLACE FUNCTION fn_recommend_movies(p_user_id INT, p_limit INT DEFAULT 6)
RETURNS TABLE (
    movie_id INT,
    title VARCHAR(255),
    poster_url VARCHAR(500),
    avg_rating NUMERIC(3, 1),
    recommendation_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH UserTopGenres AS (
        -- Step 1: Find user's favorite genres based on high ratings (rating >= 7.0)
        SELECT mg.genre_id, COUNT(*) AS affinity_score
        FROM reviews r
        JOIN movie_genres mg ON r.movie_id = mg.movie_id
        WHERE r.user_id = p_user_id AND r.rating >= 7.0
        GROUP BY mg.genre_id
        ORDER BY affinity_score DESC
        LIMIT 3
    ),
    UnwatchedMovies AS (
        -- Step 2: Get movies the user has not yet reviewed or watched
        SELECT m.movie_id, m.title, m.poster_url, m.avg_rating, g.name AS genre_name
        FROM movies m
        JOIN movie_genres mg ON m.movie_id = mg.movie_id
        JOIN genres g ON mg.genre_id = g.genre_id
        JOIN UserTopGenres utg ON mg.genre_id = utg.genre_id
        WHERE m.movie_id NOT IN (
            SELECT r.movie_id FROM reviews r WHERE r.user_id = p_user_id
        )
    )
    SELECT 
        um.movie_id,
        um.title,
        um.poster_url,
        um.avg_rating,
        ('Recommended because you enjoy ' || um.genre_name || ' films')::TEXT AS recommendation_reason
    FROM UnwatchedMovies um
    GROUP BY um.movie_id, um.title, um.poster_url, um.avg_rating, um.genre_name
    ORDER BY um.avg_rating DESC, um.movie_id
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- FUNCTION: User Profile & Watch Analytics Aggregator
CREATE OR REPLACE FUNCTION fn_get_user_analytics(p_user_id INT)
RETURNS JSONB AS $$
DECLARE
    v_total_reviews INT;
    v_avg_rating NUMERIC(3, 2);
    v_total_runtime_mins INT;
    v_total_watchlists INT;
    v_followers_count INT;
    v_following_count INT;
    v_rating_distribution JSONB;
    v_top_genres JSONB;
BEGIN
    -- Basic counts
    SELECT 
        COUNT(*),
        COALESCE(AVG(r.rating), 0.0),
        COALESCE(SUM(m.runtime), 0)
    INTO v_total_reviews, v_avg_rating, v_total_runtime_mins
    FROM reviews r
    JOIN movies m ON r.movie_id = m.movie_id
    WHERE r.user_id = p_user_id;

    -- Watchlists
    SELECT COUNT(*) INTO v_total_watchlists FROM watchlists WHERE user_id = p_user_id;

    -- Social
    SELECT COUNT(*) INTO v_followers_count FROM follows WHERE following_id = p_user_id;
    SELECT COUNT(*) INTO v_following_count FROM follows WHERE follower_id = p_user_id;

    -- Rating distribution histogram (1-10)
    SELECT jsonb_object_agg(bucket::TEXT, COALESCE(counts.c, 0))
    INTO v_rating_distribution
    FROM generate_series(1, 10) AS bucket
    LEFT JOIN (
        SELECT FLOOR(rating)::INT AS bucket, COUNT(*) AS c
        FROM reviews
        WHERE user_id = p_user_id
        GROUP BY FLOOR(rating)
    ) counts ON bucket = counts.bucket;

    -- Top genres
    SELECT jsonb_agg(genre_row)
    INTO v_top_genres
    FROM (
        SELECT g.name, COUNT(*) as count
        FROM reviews r
        JOIN movie_genres mg ON r.movie_id = mg.movie_id
        JOIN genres g ON mg.genre_id = g.genre_id
        WHERE r.user_id = p_user_id
        GROUP BY g.name
        ORDER BY count DESC
        LIMIT 5
    ) genre_row;

    RETURN jsonb_build_object(
        'total_reviews', v_total_reviews,
        'avg_rating', ROUND(v_avg_rating, 1),
        'total_runtime_hours', ROUND(v_total_runtime_mins / 60.0, 1),
        'total_watchlists', v_total_watchlists,
        'followers_count', v_followers_count,
        'following_count', v_following_count,
        'rating_distribution', COALESCE(v_rating_distribution, '{}'::jsonb),
        'top_genres', COALESCE(v_top_genres, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 6. ADVANCED VIEWS & WINDOW FUNCTIONS
-- ----------------------------------------------------------------------------

-- VIEW 1: Trending Movies using Bayesian Weighted Score
CREATE OR REPLACE VIEW v_trending_movies AS
WITH GlobalStats AS (
    SELECT 
        COALESCE(AVG(avg_rating), 5.0) AS global_mean_rating,
        3.0 AS min_reviews_threshold -- smoothing parameter
    FROM movies
)
SELECT 
    m.movie_id,
    m.title,
    m.tagline,
    m.release_date,
    m.runtime,
    m.poster_url,
    m.backdrop_url,
    m.director,
    m.avg_rating,
    m.review_count,
    ROUND(
        (
            (m.review_count / (m.review_count + gs.min_reviews_threshold)) * m.avg_rating +
            (gs.min_reviews_threshold / (m.review_count + gs.min_reviews_threshold)) * gs.global_mean_rating
        )::NUMERIC, 
        2
    ) AS bayesian_score
FROM movies m
CROSS JOIN GlobalStats gs
ORDER BY bayesian_score DESC, m.review_count DESC;


-- VIEW 2: User Leaderboard with Window Functions (DENSE_RANK)
CREATE OR REPLACE VIEW v_user_leaderboard AS
SELECT 
    u.user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    COUNT(r.review_id) AS total_reviews,
    COALESCE(SUM(r.likes_count), 0) AS total_likes_received,
    COALESCE(ROUND(AVG(r.rating), 1), 0.0) AS avg_rating_given,
    DENSE_RANK() OVER (ORDER BY COUNT(r.review_id) DESC, COALESCE(SUM(r.likes_count), 0) DESC) AS rank
FROM users u
LEFT JOIN reviews r ON u.user_id = r.user_id
GROUP BY u.user_id, u.username, u.display_name, u.avatar_url;


-- VIEW 3: Genre Performance & Popularity
CREATE OR REPLACE VIEW v_genre_performance AS
SELECT 
    g.genre_id,
    g.name AS genre_name,
    g.slug,
    COUNT(DISTINCT mg.movie_id) AS total_movies,
    COUNT(r.review_id) AS total_reviews,
    COALESCE(ROUND(AVG(r.rating), 2), 0.0) AS avg_genre_rating
FROM genres g
LEFT JOIN movie_genres mg ON g.genre_id = mg.genre_id
LEFT JOIN reviews r ON mg.movie_id = r.movie_id
GROUP BY g.genre_id, g.name, g.slug
ORDER BY total_movies DESC, total_reviews DESC;


-- VIEW 4: Unified Activity Feed with Entity Joins
CREATE OR REPLACE VIEW v_recent_activity_feed AS
SELECT 
    al.log_id,
    al.activity_type,
    al.created_at,
    u.user_id,
    u.username,
    u.display_name,
    u.avatar_url,
    al.metadata,
    m.movie_id,
    m.title AS movie_title,
    m.poster_url AS movie_poster
FROM activity_logs al
JOIN users u ON al.user_id = u.user_id
LEFT JOIN movies m ON al.target_id = m.movie_id
ORDER BY al.created_at DESC;
