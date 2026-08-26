# 🎬 CineVerse: A Social Movie Discovery & Review Platform
### Database Management Systems (DBMS) Course Project

[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Fullstack-Next.js_14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

---

## 🌟 Executive Summary

**CineVerse** is a production-grade social movie discovery and review platform engineered to demonstrate advanced **Database Management Systems (DBMS)** concepts. Inspired by Letterboxd and IMDb, the application provides an interactive cinematic experience powered by a **3NF/BCNF normalized PostgreSQL architecture** with **Triggers, Stored Procedures, ACID Transactions, Views, Window Functions, and an Interactive DBMS Console**.

---

## 🗄️ Relational Database Architecture (3NF Schema)

### Entity-Relationship (ER) Overview

```mermaid
erDiagram
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ WATCHLISTS : creates
    USERS ||--o{ FOLLOWS : follows
    USERS ||--o{ ACTIVITY_LOGS : generates
    USERS ||--o{ REVIEW_LIKES : likes
    MOVIES ||--o{ REVIEWS : receives
    MOVIES ||--|{ MOVIE_GENRES : categorized_as
    GENRES ||--|{ MOVIE_GENRES : includes
    MOVIES ||--o{ MOVIE_CAST : features
    PEOPLE ||--o{ MOVIE_CAST : acts_or_directs
    WATCHLISTS ||--|{ WATCHLIST_ITEMS : contains
    MOVIES ||--|{ WATCHLIST_ITEMS : listed_in
    REVIEWS ||--o{ REVIEW_LIKES : receives
```

### Relational Tables (12 Total):
1. **`users`**: User identity, display metadata, timestamps (`user_id`, `username`, `email`, `display_name`, `bio`, `avatar_url`).
2. **`genres`**: Movie taxonomy (`genre_id`, `name`, `slug`, `icon_name`).
3. **`movies`**: Film records (`movie_id`, `title`, `tagline`, `overview`, `release_date`, `runtime`, `poster_url`, `backdrop_url`, `director`, `avg_rating`, `review_count`).
4. **`movie_genres`**: Composite bridge table (`movie_id`, `genre_id`) with `ON DELETE CASCADE`.
5. **`people`**: Cast, directors, writers (`person_id`, `name`, `profile_path`, `known_for_department`, `biography`).
6. **`movie_cast`**: Cast & crew role assignments (`movie_id`, `person_id`, `character_name`, `job_role`, `cast_order`).
7. **`reviews`**: 10-point ratings & critiques (`review_id`, `user_id`, `movie_id`, `rating`, `review_text`, `has_spoilers`, `likes_count`). Constraint: `CHECK (rating >= 1.0 AND rating <= 10.0)`.
8. **`review_likes`**: Helpful votes on reviews (`user_id`, `review_id`).
9. **`watchlists`**: Custom curated film collections (`watchlist_id`, `user_id`, `name`, `description`, `is_public`, `likes_count`).
10. **`watchlist_items`**: M:N entries in watchlists (`watchlist_id`, `movie_id`, `notes`, `added_at`).
11. **`follows`**: Social graph (`follower_id`, `following_id`). Constraint: `CHECK (follower_id != following_id)`.
12. **`activity_logs`**: Audit trail and real-time social timeline (`log_id`, `user_id`, `activity_type`, `target_id`, `metadata`).

---

## ⚡ Advanced DBMS Concepts Implemented

### 1. PL/pgSQL Triggers
- **`trg_update_movie_rating`**: Fires on `AFTER INSERT OR UPDATE OR DELETE ON reviews`. Recalculates `movies.avg_rating` and `movies.review_count` automatically.
- **`trg_log_review_activity`**: Fires on `AFTER INSERT ON reviews`. Automatically writes a JSONB event audit trail to `activity_logs`.
- **`trg_update_review_likes`**: Fires on `AFTER INSERT OR DELETE ON review_likes`. Dynamically updates `reviews.likes_count`.

### 2. Stored Procedures & Functions
- **`fn_recommend_movies(p_user_id, p_limit)`**: Personalized recommendation algorithm that discovers high-affinity genres from a user's ratings and generates ranked suggestions.
- **`fn_get_user_analytics(p_user_id)`**: Aggregates total watch time (hours), average score, rating histogram distribution (1-10), and top 5 favorite genres in a single JSONB return object.

### 3. Analytical Views & Window Functions
- **`v_trending_movies`**: Computes Bayesian weighted score:
  $$\text{Score} = \left(\frac{v}{v+m}\right) R + \left(\frac{m}{v+m}\right) C$$
- **`v_user_leaderboard`**: Ranks community reviewers using `DENSE_RANK() OVER (ORDER BY COUNT(r.review_id) DESC, SUM(r.likes_count) DESC)`.
- **`v_genre_performance`**: Multi-table aggregation of film counts and rating distributions per genre.

### 4. Interactive In-App DBMS Console (`/dbms-console`)
- **Live SQL Runner**: Execute arbitrary SQL with millisecond latency profiling.
- **Trigger Verification Suite**: 1-click step-by-step trigger demonstration with before & after state comparison.
- **Floating "⚡ DBMS Inspector"**: Present on every screen to inspect the underlying SQL queries powering the UI.

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note on Database Connection**:
> - CineVerse includes an embedded **PostgreSQL WASM Engine (PGlite)** that runs automatically with zero external setup, supporting 100% genuine PostgreSQL SQL, Triggers, Views, and Functions out of the box!
> - Alternatively, if you want to connect to an external PostgreSQL server or Supabase/Neon instance, set `DATABASE_URL="postgresql://user:password@localhost:5432/cineverse_db"` in `.env.local`.

---

## 📋 DBMS Viva & Grading Demonstration Checklist

When demonstrating to your professor:
1. **Explore Home (`/`)**: Show Bayesian trending movies, filter by Sci-Fi & 9.0+ rating.
2. **Open "⚡ DBMS Inspector"**: Show the exact raw SQL query powering the active view.
3. **Write a Review on a Movie (`/movies/1`)**: Submit a 10.0 rating and show the live feedback highlighting `trg_update_movie_rating`.
4. **Check User Profile (`/profile/1`)**: Show `fn_get_user_analytics` rendering the rating histogram and watch time.
5. **Open DBMS Console (`/dbms-console`)**:
   - Run preset queries (Complex JOINs, Window Functions `DENSE_RANK()`).
   - Run the Live Trigger Tester to show atomic rating recalculation and audit logging.
