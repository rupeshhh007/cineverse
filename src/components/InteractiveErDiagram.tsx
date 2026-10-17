'use client';

import React, { useState, useMemo } from 'react';
import { 
  Key, 
  Link2, 
  Terminal, 
  Layers, 
  Database,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Table as TableIcon
} from 'lucide-react';

export interface TableNode {
  id: string;
  name: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  color: string;
  description: string;
  columns: { name: string; type: string; key?: 'PK' | 'FK' | 'UK' | 'PK, FK' }[];
  ddl: string;
}

export const TABLES: TableNode[] = [
  {
    id: 'users',
    name: 'users',
    x: 68,
    y: 38,
    color: '#dd7058', // Moss
    description: 'Core member profiles containing authentication credentials, bio, and visual assets.',
    columns: [
      { name: 'user_id', type: 'SERIAL', key: 'PK' },
      { name: 'username', type: 'VARCHAR(50)', key: 'UK' },
      { name: 'email', type: 'VARCHAR(100)', key: 'UK' },
      { name: 'password_hash', type: 'VARCHAR(255)' },
      { name: 'display_name', type: 'VARCHAR(100)' },
      { name: 'bio', type: 'TEXT' },
      { name: 'avatar_url', type: 'VARCHAR(255)' },
      { name: 'banner_url', type: 'VARCHAR(255)' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(255),
    banner_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'movies',
    name: 'movies',
    x: 36,
    y: 35,
    color: '#dd7058',
    description: 'Film registry storing release dates, runtime, director, poster URLs, and trigger-cached aggregate ratings.',
    columns: [
      { name: 'movie_id', type: 'SERIAL', key: 'PK' },
      { name: 'tmdb_id', type: 'INTEGER', key: 'UK' },
      { name: 'title', type: 'VARCHAR(255)' },
      { name: 'tagline', type: 'TEXT' },
      { name: 'overview', type: 'TEXT' },
      { name: 'release_date', type: 'DATE' },
      { name: 'runtime', type: 'INTEGER' },
      { name: 'poster_url', type: 'VARCHAR(255)' },
      { name: 'backdrop_url', type: 'VARCHAR(255)' },
      { name: 'trailer_url', type: 'VARCHAR(255)' },
      { name: 'director', type: 'VARCHAR(255)' },
      { name: 'avg_rating', type: 'NUMERIC(3,2)' },
      { name: 'review_count', type: 'INTEGER' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    tagline TEXT,
    overview TEXT,
    release_date DATE,
    runtime INTEGER,
    poster_url VARCHAR(255),
    backdrop_url VARCHAR(255),
    trailer_url VARCHAR(255),
    director VARCHAR(255),
    avg_rating NUMERIC(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'genres',
    name: 'genres',
    x: 6,
    y: 10,
    color: '#e58e74',
    description: 'Taxonomy of film categories used for classification and collaborative filtering.',
    columns: [
      { name: 'genre_id', type: 'SERIAL', key: 'PK' },
      { name: 'name', type: 'VARCHAR(50)', key: 'UK' },
      { name: 'slug', type: 'VARCHAR(50)', key: 'UK' },
      { name: 'icon_name', type: 'VARCHAR(50)' }
    ],
    ddl: `CREATE TABLE genres (
    genre_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    icon_name VARCHAR(50)
);`
  },
  {
    id: 'movie_genres',
    name: 'movie_genres',
    x: 21,
    y: 10,
    color: '#e58e74',
    description: 'Many-to-many bridge linking movies with multiple normalized genres.',
    columns: [
      { name: 'movie_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'genre_id', type: 'INTEGER', key: 'PK, FK' }
    ],
    ddl: `CREATE TABLE movie_genres (
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(genre_id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);`
  },
  {
    id: 'people',
    name: 'people',
    x: 6,
    y: 62,
    color: '#d4bb7e',
    description: 'Cast and crew directory of directors, actors, and writers.',
    columns: [
      { name: 'person_id', type: 'SERIAL', key: 'PK' },
      { name: 'name', type: 'VARCHAR(255)' },
      { name: 'profile_path', type: 'VARCHAR(255)' },
      { name: 'known_for_department', type: 'VARCHAR(100)' },
      { name: 'biography', type: 'TEXT' }
    ],
    ddl: `CREATE TABLE people (
    person_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    profile_path VARCHAR(255),
    known_for_department VARCHAR(100),
    biography TEXT
);`
  },
  {
    id: 'movie_cast',
    name: 'movie_cast',
    x: 21,
    y: 62,
    color: '#d4bb7e',
    description: 'Bridge linking movies to actors/directors with billing order and character names.',
    columns: [
      { name: 'movie_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'person_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'character_name', type: 'VARCHAR(255)' },
      { name: 'job_role', type: 'VARCHAR(100)' },
      { name: 'cast_order', type: 'INTEGER' }
    ],
    ddl: `CREATE TABLE movie_cast (
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES people(person_id) ON DELETE CASCADE,
    character_name VARCHAR(255),
    job_role VARCHAR(100) DEFAULT 'Actor',
    cast_order INTEGER,
    PRIMARY KEY (movie_id, person_id)
);`
  },
  {
    id: 'reviews',
    name: 'reviews',
    x: 52,
    y: 10,
    color: '#dd7058',
    description: 'Reviews and 10-point ratings submitted by users. Triggers recalculate movie stats.',
    columns: [
      { name: 'review_id', type: 'SERIAL', key: 'PK' },
      { name: 'user_id', type: 'INTEGER', key: 'FK' },
      { name: 'movie_id', type: 'INTEGER', key: 'FK' },
      { name: 'rating', type: 'NUMERIC(3,1)' },
      { name: 'review_text', type: 'TEXT' },
      { name: 'has_spoilers', type: 'BOOLEAN' },
      { name: 'likes_count', type: 'INTEGER' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'updated_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    rating NUMERIC(3,1) CHECK (rating >= 1.0 AND rating <= 10.0),
    review_text TEXT,
    has_spoilers BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, movie_id)
);`
  },
  {
    id: 'review_likes',
    name: 'review_likes',
    x: 68,
    y: 10,
    color: '#dd7058',
    description: 'Audit bridge recording helpful votes cast by users on member reviews.',
    columns: [
      { name: 'user_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'review_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE review_likes (
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    review_id INTEGER REFERENCES reviews(review_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, review_id)
);`
  },
  {
    id: 'watchlists',
    name: 'watchlists',
    x: 52,
    y: 72,
    color: '#c29b7f',
    description: 'Curated public or private collections of films assembled by cinephiles.',
    columns: [
      { name: 'watchlist_id', type: 'SERIAL', key: 'PK' },
      { name: 'user_id', type: 'INTEGER', key: 'FK' },
      { name: 'name', type: 'VARCHAR(100)' },
      { name: 'description', type: 'TEXT' },
      { name: 'is_public', type: 'BOOLEAN' },
      { name: 'is_system_default', type: 'BOOLEAN' },
      { name: 'likes_count', type: 'INTEGER' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE watchlists (
    watchlist_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_system_default BOOLEAN DEFAULT FALSE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'watchlist_items',
    name: 'watchlist_items',
    x: 36,
    y: 72,
    color: '#c29b7f',
    description: 'Bridge linking watchlists to member-selected movies with optional notes.',
    columns: [
      { name: 'watchlist_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'movie_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'notes', type: 'VARCHAR(255)' },
      { name: 'added_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE watchlist_items (
    watchlist_id INTEGER REFERENCES watchlists(watchlist_id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    notes VARCHAR(255),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (watchlist_id, movie_id)
);`
  },
  {
    id: 'follows',
    name: 'follows',
    x: 84,
    y: 38,
    color: '#dd7058',
    description: 'Directed graph relationship mapping follower/following edges between users.',
    columns: [
      { name: 'follower_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'following_id', type: 'INTEGER', key: 'PK, FK' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE follows (
    follower_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);`
  },
  {
    id: 'activity_logs',
    name: 'activity_logs',
    x: 68,
    y: 72,
    color: '#7fb5b0',
    description: 'Unified immutable audit log recording reviews, list creations, and watchlist updates via JSONB.',
    columns: [
      { name: 'log_id', type: 'SERIAL', key: 'PK' },
      { name: 'user_id', type: 'INTEGER', key: 'FK' },
      { name: 'activity_type', type: 'VARCHAR(50)' },
      { name: 'target_id', type: 'INTEGER' },
      { name: 'metadata', type: 'JSONB' },
      { name: 'created_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    target_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'app_meta',
    name: 'app_meta',
    x: 84,
    y: 72,
    color: '#8da38a',
    description: 'Schema version control, migration history, and metadata registry for idempotent database initialization.',
    columns: [
      { name: 'key', type: 'VARCHAR(100)', key: 'PK' },
      { name: 'value', type: 'TEXT' },
      { name: 'updated_at', type: 'TIMESTAMP' }
    ],
    ddl: `CREATE TABLE app_meta (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    id: 'db_action_traces',
    name: 'db_action_traces',
    x: 84,
    y: 10,
    color: '#dd7058',
    description: 'CineTrace transaction lineage registry capturing authenticated mutation events, trigger executions, and state deltas.',
    columns: [
      { name: 'trace_id', type: 'SERIAL', key: 'PK' },
      { name: 'user_id', type: 'INTEGER', key: 'FK' },
      { name: 'action_type', type: 'VARCHAR(50)' },
      { name: 'target_type', type: 'VARCHAR(50)' },
      { name: 'target_id', type: 'INTEGER' },
      { name: 'mutation_op', type: 'VARCHAR(20)' },
      { name: 'initial_score', type: 'NUMERIC(3,1)' },
      { name: 'final_score', type: 'NUMERIC(3,1)' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'metadata', type: 'JSONB' }
    ],
    ddl: `CREATE TABLE db_action_traces (
    trace_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INT NOT NULL,
    mutation_op VARCHAR(20) NOT NULL,
    initial_score NUMERIC(3, 1),
    final_score NUMERIC(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb
);`
  }
];

export interface Connection {
  from: string;
  to: string;
  key: string;
  type: '1:N' | 'M:N' | '1:1';
}

export const CONNECTIONS: Connection[] = [
  { from: 'movie_genres', to: 'movies', key: 'movie_id', type: '1:N' },
  { from: 'movie_genres', to: 'genres', key: 'genre_id', type: '1:N' },
  { from: 'movie_cast', to: 'movies', key: 'movie_id', type: '1:N' },
  { from: 'movie_cast', to: 'people', key: 'person_id', type: '1:N' },
  { from: 'reviews', to: 'movies', key: 'movie_id', type: '1:N' },
  { from: 'reviews', to: 'users', key: 'user_id', type: '1:N' },
  { from: 'review_likes', to: 'reviews', key: 'review_id', type: '1:N' },
  { from: 'review_likes', to: 'users', key: 'user_id', type: '1:N' },
  { from: 'watchlists', to: 'users', key: 'user_id', type: '1:N' },
  { from: 'watchlist_items', to: 'watchlists', key: 'watchlist_id', type: '1:N' },
  { from: 'watchlist_items', to: 'movies', key: 'movie_id', type: '1:N' },
  { from: 'follows', to: 'users', key: 'follower_id', type: '1:N' },
  { from: 'activity_logs', to: 'users', key: 'user_id', type: '1:N' },
  { from: 'db_action_traces', to: 'users', key: 'user_id', type: '1:N' },
];

export default function InteractiveErDiagram() {
  const [selectedTable, setSelectedTable] = useState<TableNode>(TABLES[1]); // 'movies' default
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [copiedDdl, setCopiedDdl] = useState(false);

  // Dimensions
  const canvasWidth = 1240;
  const canvasHeight = 740;
  const cardWidth = 168;
  const cardHeight = 160;

  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return TABLES;
    const q = searchQuery.toLowerCase();
    return TABLES.filter(t => t.name.toLowerCase().includes(q) || t.columns.some(c => c.name.toLowerCase().includes(q)));
  }, [searchQuery]);

  const getEdgeCoordinates = (fromId: string, toId: string) => {
    const from = TABLES.find((t) => t.id === fromId);
    const to = TABLES.find((t) => t.id === toId);
    if (!from || !to) return { sx: 0, sy: 0, tx: 0, ty: 0 };

    const sx_c = (from.x / 100) * canvasWidth + cardWidth / 2;
    const sy_c = (from.y / 100) * canvasHeight + cardHeight / 3;
    const tx_c = (to.x / 100) * canvasWidth + cardWidth / 2;
    const ty_c = (to.y / 100) * canvasHeight + cardHeight / 3;

    const dx = tx_c - sx_c;
    const dy = ty_c - sy_c;

    let sx = sx_c;
    let sy = sy_c;
    let tx = tx_c;
    let ty = ty_c;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        sx = (from.x / 100) * canvasWidth + cardWidth;
        tx = (to.x / 100) * canvasWidth;
      } else {
        sx = (from.x / 100) * canvasWidth;
        tx = (to.x / 100) * canvasWidth + cardWidth;
      }
    } else {
      if (dy > 0) {
        sy = (from.y / 100) * canvasHeight + 110;
        ty = (to.y / 100) * canvasHeight;
      } else {
        sy = (from.y / 100) * canvasHeight;
        ty = (to.y / 100) * canvasHeight + 110;
      }
    }

    return { sx, sy, tx, ty };
  };

  const isRelated = (table1: string, table2: string) => {
    return CONNECTIONS.some(
      (c) => 
        (c.from === table1 && c.to === table2) || 
        (c.from === table2 && c.to === table1)
    );
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(selectedTable.ddl);
    setCopiedDdl(true);
    setTimeout(() => setCopiedDdl(false), 1500);
  };

  // Find foreign keys for selected table
  const selectedTableFks = useMemo(() => {
    return CONNECTIONS.filter(c => c.from === selectedTable.id).map(c => ({
      column: c.key,
      targetTable: c.to,
      type: c.type
    }));
  }, [selectedTable]);

  // Find incoming relations (referencing tables)
  const incomingFks = useMemo(() => {
    return CONNECTIONS.filter(c => c.to === selectedTable.id).map(c => ({
      sourceTable: c.from,
      column: c.key,
      type: c.type
    }));
  }, [selectedTable]);

  return (
    <div className="space-y-4">
      {/* Visual Canvas Subheader */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-cv-shell border border-cv-border/30">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-cv-muted">
            The Projection Room / Relational Architecture
          </div>
          <h2 className="text-lg font-serif font-bold text-cv-text mt-0.5">
            Schema Relationship Map
          </h2>
          <p className="text-xs text-cv-muted">
            Foreign-key connections across the 3NF relational model. Select a table to inspect columns, constraints, and dependencies.
          </p>
        </div>

        {/* Canvas Toolbar */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-cv-surface border border-cv-border/40 rounded-xl p-1 text-xs">
            <button
              onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
              className="p-1.5 hover:bg-cv-shell rounded-lg text-cv-muted hover:text-cv-text transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-cv-text select-none">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
              className="p-1.5 hover:bg-cv-shell rounded-lg text-cv-muted hover:text-cv-text transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-2 bg-cv-surface border border-cv-border/40 hover:bg-cv-shell rounded-xl text-cv-muted hover:text-cv-text text-xs transition-colors flex items-center gap-1.5"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Reset</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Left Table Rail | Center Interactive Canvas | Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Column 1: Left Table Rail (2.5 cols on lg) */}
        <div className="lg:col-span-3 bg-cv-shell border border-cv-border/30 rounded-2xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-cv-border/20">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cv-text">
              <TableIcon className="w-3.5 h-3.5 text-cv-moss" />
              <span>Tables</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cv-surface border border-cv-border/30 text-cv-muted">
              {TABLES.length} tables
            </span>
          </div>

          {/* Search Table */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-cv-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tables & cols..."
              className="w-full bg-cv-surface border border-cv-border/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-cv-text placeholder-cv-muted/60 focus:outline-none focus:border-cv-moss transition-colors font-mono"
            />
          </div>

          {/* Table List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[580px] pr-1">
            {filteredTables.map((table) => {
              const isSelected = selectedTable.id === table.id;
              const isHovered = hoveredTable === table.id;
              const isConn = isRelated(selectedTable.id, table.id);

              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  onMouseEnter={() => setHoveredTable(table.id)}
                  onMouseLeave={() => setHoveredTable(null)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-cv-surface border-cv-moss text-cv-text shadow-sm'
                      : isHovered
                      ? 'bg-cv-surface/60 border-cv-border text-cv-text'
                      : isConn
                      ? 'bg-cv-surface/30 border-cv-border/40 text-cv-text/90'
                      : 'bg-cv-shell/50 border-transparent text-cv-muted hover:text-cv-text hover:bg-cv-surface/40'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: table.color }}
                    />
                    <span className="font-mono text-xs font-semibold truncate">
                      {table.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cv-muted shrink-0">
                    {table.columns.length} cols
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Center Interactive SVG Canvas (6 cols on lg) */}
        <div className="lg:col-span-6 bg-cv-surface-2 border border-cv-border/40 rounded-2xl overflow-hidden relative flex flex-col shadow-inner">
          <div className="flex items-center justify-between px-4 py-2.5 bg-cv-shell/70 border-b border-cv-border/30 z-20">
            <div className="flex items-center gap-2 text-[11px] font-mono text-cv-muted">
              <Layers className="w-3.5 h-3.5 text-cv-moss" />
              <span>3NF Physical Topology (Crow&apos;s Foot)</span>
            </div>
            <div className="text-[10px] font-mono text-cv-muted/80 flex items-center gap-2">
              <span>| = One</span>
              <span>⋿ = Many</span>
            </div>
          </div>

          {/* Scrollable Canvas Box */}
          <div className="w-full overflow-auto bg-[#0d130d] p-4 flex-1 min-h-[580px]">
            <div 
              style={{ 
                width: `${canvasWidth}px`, 
                height: `${canvasHeight}px`,
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top left'
              }} 
              className="relative select-none transition-transform duration-150"
            >
              {/* Background Subtle Dotted Grid */}
              <div 
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, #566451 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              {/* SVG Foreign-Key Connection Lines Layer */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-0" 
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
              >
                <defs>
                  <marker 
                    id="cv-crowfoot" 
                    viewBox="0 0 10 10" 
                    refX="0" 
                    refY="5" 
                    markerWidth="8" 
                    markerHeight="8" 
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 M 8 5 L 0 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </marker>
                  
                  <marker 
                    id="cv-one" 
                    viewBox="0 0 10 10" 
                    refX="4" 
                    refY="5" 
                    markerWidth="8" 
                    markerHeight="8" 
                    orient="auto-start-reverse"
                  >
                    <path d="M 3 1 L 3 9 M 7 1 L 7 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </marker>
                </defs>

                {CONNECTIONS.map((conn, idx) => {
                  const { sx, sy, tx, ty } = getEdgeCoordinates(conn.from, conn.to);
                  
                  const isHighlighted = 
                    hoveredTable === conn.from || 
                    hoveredTable === conn.to ||
                    selectedTable.id === conn.from ||
                    selectedTable.id === conn.to;
                  
                  const isDirectPair = 
                    (selectedTable.id === conn.from && hoveredTable === conn.to) ||
                    (selectedTable.id === conn.to && hoveredTable === conn.from);

                  const dx = Math.abs(tx - sx) * 0.4;
                  const dy = Math.abs(ty - sy) * 0.4;
                  const pathD = sx === tx || sy === ty 
                    ? `M ${sx} ${sy} L ${tx} ${ty}`
                    : `M ${sx} ${sy} C ${sx + (tx > sx ? dx : -dx)} ${sy}, ${tx + (tx > sx ? -dx : dx)} ${ty}, ${tx} ${ty}`;

                  const strokeColor = isHighlighted 
                    ? (isDirectPair ? '#efece3' : '#dd7058') 
                    : '#2b3628';

                  return (
                    <g key={idx}>
                      {isHighlighted && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="4"
                          strokeOpacity="0.25"
                        />
                      )}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 2 : 1}
                        markerStart="url(#cv-one)"
                        markerEnd="url(#cv-crowfoot)"
                        style={{ color: strokeColor }}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Table Nodes */}
              {TABLES.map((table) => {
                const isHovered = hoveredTable === table.id;
                const isSelected = selectedTable.id === table.id;
                const isRelatedToSelected = isRelated(selectedTable.id, table.id);

                let borderStyle = 'border-cv-border/30 bg-cv-shell/95';
                if (isSelected) borderStyle = 'border-cv-moss ring-2 ring-cv-moss/20 bg-cv-surface';
                else if (isHovered) borderStyle = 'border-cv-text/60 bg-cv-surface/90';
                else if (isRelatedToSelected) borderStyle = 'border-cv-border bg-cv-shell';

                return (
                  <div
                    key={table.id}
                    style={{ 
                      left: `${(table.x / 100) * canvasWidth}px`, 
                      top: `${(table.y / 100) * canvasHeight}px`,
                      width: `${cardWidth}px`
                    }}
                    className={`absolute rounded-xl border backdrop-blur-md shadow-xl transition-all duration-150 cursor-pointer z-10 select-none overflow-hidden ${borderStyle}`}
                    onMouseEnter={() => setHoveredTable(table.id)}
                    onMouseLeave={() => setHoveredTable(null)}
                    onClick={() => setSelectedTable(table)}
                  >
                    {/* Card Header */}
                    <div className="px-3 py-2 bg-cv-shell/80 flex items-center justify-between border-b border-cv-border/30">
                      <span className="font-mono font-bold text-xs tracking-tight text-cv-text truncate">
                        {table.name}
                      </span>
                      <div 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: table.color }}
                      />
                    </div>

                    {/* Columns Preview */}
                    <div className="p-2 space-y-1 font-mono text-[9px] text-cv-muted bg-cv-surface-2/60">
                      {/* PK items */}
                      {table.columns.filter(c => c.key?.includes('PK')).map((col) => (
                        <div key={col.name} className="flex items-center justify-between font-bold text-cv-text border-b border-cv-border/20 pb-0.5 mb-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <Key className="w-2.5 h-2.5 text-cv-moss" />
                            {col.name}
                          </span>
                          <span className="text-[8px] text-cv-moss">PK</span>
                        </div>
                      ))}

                      {/* FK / Regular items */}
                      {table.columns.filter(c => !c.key?.includes('PK')).slice(0, 3).map((col) => (
                        <div key={col.name} className="flex items-center justify-between text-cv-muted/80">
                          <span className="truncate">{col.name}</span>
                          <span className="text-[8px] text-cv-muted/50">{col.key || ''}</span>
                        </div>
                      ))}
                      
                      {table.columns.filter(c => !c.key?.includes('PK')).length > 3 && (
                        <div className="text-[8px] text-center pt-0.5 text-cv-muted/50">
                          +{table.columns.filter(c => !c.key?.includes('PK')).length - 3} more cols
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        {/* Column 3: Right Inspector Panel (3.5 cols on lg) */}
        <div className="lg:col-span-3 bg-cv-shell border border-cv-border/30 rounded-2xl p-4 flex flex-col space-y-4">
          
          {/* Selected Table Identity */}
          <div className="p-3.5 rounded-xl bg-cv-surface border border-cv-border/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cv-muted">
                  public.{selectedTable.name}
                </span>
                <h3 className="font-mono font-bold text-base text-cv-text">
                  {selectedTable.name}
                </h3>
              </div>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-cv-ink"
                style={{ backgroundColor: selectedTable.color }}
              >
                3NF Table
              </span>
            </div>
            <p className="text-xs text-cv-muted leading-relaxed">
              {selectedTable.description}
            </p>
          </div>

          {/* Relational Constraints */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase tracking-wider text-cv-muted flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-cv-moss" /> Foreign Keys & Dependencies
            </div>

            {selectedTableFks.length === 0 && incomingFks.length === 0 ? (
              <div className="p-2.5 rounded-xl bg-cv-surface-2 border border-cv-border/30 text-[11px] text-cv-muted font-mono">
                Root table with no outgoing foreign keys.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {selectedTableFks.map((fk, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-cv-surface-2 border border-cv-border/30 text-[10px] font-mono flex items-center justify-between">
                    <span className="text-cv-text">
                      <strong className="text-cv-moss">{fk.column}</strong> → {fk.targetTable}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cv-shell text-cv-muted">{fk.type}</span>
                  </div>
                ))}
                {incomingFks.map((fk, idx) => (
                  <div key={`in-${idx}`} className="p-2 rounded-xl bg-cv-surface-2/60 border border-cv-border/20 text-[10px] font-mono flex items-center justify-between">
                    <span className="text-cv-muted">
                      {fk.sourceTable} references <strong className="text-cv-text">{fk.column}</strong>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-cv-shell text-cv-muted">Referenced</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column Catalog */}
          <div className="space-y-2 flex-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-cv-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cv-moss" /> Column Catalog ({selectedTable.columns.length})
            </div>

            <div className="rounded-xl border border-cv-border/30 overflow-hidden bg-cv-surface-2 max-h-52 overflow-y-auto">
              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="bg-cv-shell border-b border-cv-border/30 text-cv-muted">
                    <th className="p-2 font-semibold">Column</th>
                    <th className="p-2 font-semibold">Type</th>
                    <th className="p-2 font-semibold text-right">Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cv-border/20">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-cv-shell/40 transition-colors">
                      <td className="p-2 text-cv-text font-medium flex items-center gap-1">
                        {col.key?.includes('PK') && <Key className="w-2.5 h-2.5 text-cv-moss" />}
                        {col.key?.includes('FK') && <Link2 className="w-2.5 h-2.5 text-cv-muted" />}
                        <span>{col.name}</span>
                      </td>
                      <td className="p-2 text-cv-muted">{col.type}</td>
                      <td className="p-2 text-right text-cv-moss font-semibold">
                        {col.key || ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DDL SQL Block */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-cv-muted">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> DDL Definition
              </div>
              <button
                onClick={handleCopyDdl}
                className="text-[10px] text-cv-moss hover:text-cv-text flex items-center gap-1 transition-colors"
              >
                {copiedDdl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedDdl ? 'Copied' : 'Copy DDL'}</span>
              </button>
            </div>
            <div className="rounded-xl bg-[#0d130d] border border-cv-border/40 p-3 font-mono text-[10px] text-cv-muted overflow-x-auto leading-relaxed max-h-36">
              <pre>{selectedTable.ddl}</pre>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
