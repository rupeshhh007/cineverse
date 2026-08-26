'use client';

import React, { useState } from 'react';
import { 
  Key, 
  Link2, 
  Terminal, 
  Layers, 
  Database,
  Info
} from 'lucide-react';

interface TableNode {
  id: string;
  name: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  color: string;
  description: string;
  columns: { name: string; type: string; key?: 'PK' | 'FK' | 'UK' | 'PK, FK' }[];
  ddl: string;
}

const TABLES: TableNode[] = [
  {
    id: 'users',
    name: 'users',
    x: 72,
    y: 40,
    color: '#a78bfa', // Purple
    description: 'Core user profiles containing authentication credentials, bio, and visual assets.',
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
    x: 38,
    y: 35,
    color: '#60a5fa', // Blue
    description: 'Core metadata for films including release dates, runtime, director, and trigger-cached aggregates.',
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
    color: '#f87171', // Red
    description: 'List of movie categories/genres used for collaborative filtering algorithms.',
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
    x: 22,
    y: 10,
    color: '#f87171',
    description: 'Many-to-many bridge linking movies to genres.',
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
    y: 60,
    color: '#fbbf24', // Amber
    description: 'Cast and crew registry (actors, directors) associated with films.',
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
    x: 22,
    y: 60,
    color: '#fbbf24',
    description: 'Bridge table connecting movies to actors/directors with character and job roles.',
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
    x: 55,
    y: 10,
    color: '#34d399', // Emerald
    description: 'Reviews written by users for movies. Syncs movie stats using triggers.',
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
    UNIQUE (user_id, movie_id) -- 1 review per user/film
);`
  },
  {
    id: 'review_likes',
    name: 'review_likes',
    x: 72,
    y: 10,
    color: '#34d399',
    description: 'Bridge tracking which users liked which reviews. Triggers sync likes_count.',
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
    x: 55,
    y: 75,
    color: '#f472b6', // Pink
    description: 'Custom public or private movie lists curated by users.',
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
    x: 38,
    y: 75,
    color: '#f472b6',
    description: 'Bridge table connecting watchlists to the selected movies.',
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
    x: 88,
    y: 40,
    color: '#a78bfa',
    description: 'Self-referencing relationship mapping user-to-user follows.',
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
    x: 72,
    y: 75,
    color: '#2dd4bf', // Teal
    description: 'Unified action logs mapping user activity. Employs JSONB for dynamic metadata.',
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
    activity_type VARCHAR(50) NOT NULL, -- e.g., 'NEW_REVIEW', 'CREATE_LIST'
    target_id INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`
  }
];

interface Connection {
  from: string;
  to: string;
  key: string;
  type: '1:N' | 'M:N' | '1:1';
}

const CONNECTIONS: Connection[] = [
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
];

export default function InteractiveErDiagram() {
  const [selectedTable, setSelectedTable] = useState<TableNode>(TABLES[1]); // Default to 'movies'
  const [hoveredTable, setHoveredTable] = useState<string | null>(null);

  // Layout width & height of the scrollable canvas
  const canvasWidth = 1200;
  const canvasHeight = 700;
  const cardWidth = 160;
  const cardHeight = 160; // Estimated card height with headers + columns

  // Calculate coordinates where connection lines touch the border of the card
  const getEdgeCoordinates = (fromId: string, toId: string) => {
    const from = TABLES.find((t) => t.id === fromId);
    const to = TABLES.find((t) => t.id === toId);
    if (!from || !to) return { sx: 0, sy: 0, tx: 0, ty: 0 };

    const sx_c = (from.x / 100) * canvasWidth + cardWidth / 2;
    const sy_c = (from.y / 100) * canvasHeight + cardHeight / 3; // Vertically slightly higher
    const tx_c = (to.x / 100) * canvasWidth + cardWidth / 2;
    const ty_c = (to.y / 100) * canvasHeight + cardHeight / 3;

    const dx = tx_c - sx_c;
    const dy = ty_c - sy_c;

    let sx = sx_c;
    let sy = sy_c;
    let tx = tx_c;
    let ty = ty_c;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Connect horizontally
      if (dx > 0) {
        sx = (from.x / 100) * canvasWidth + cardWidth;
        tx = (to.x / 100) * canvasWidth;
      } else {
        sx = (from.x / 100) * canvasWidth;
        tx = (to.x / 100) * canvasWidth + cardWidth;
      }
    } else {
      // Connect vertically
      if (dy > 0) {
        sy = (from.y / 100) * canvasHeight + 110; // Use estimated column section bottom
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
      
      {/* Scrollable Canvas Box (Columns 1-8) */}
      <div className="lg:col-span-8 flex flex-col bg-gray-950 border border-gray-900 rounded-3xl overflow-hidden shadow-2xl relative">
        
        {/* Canvas Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900/50 border-b border-gray-900 z-20">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Standard Crow's Foot ERD Topology (Scrollable)
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            Key: | = One, ⋿ = Many
          </span>
        </div>

        {/* Scroll wrapper to prevent cut-off */}
        <div className="w-full overflow-auto bg-black p-4">
          <div 
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }} 
            className="relative select-none"
          >
            
            {/* SVG Connection Lines Layer with Markers */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-0" 
              viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            >
              <defs>
                {/* Crow's Foot "Many" Marker */}
                <marker 
                  id="crowfoot" 
                  viewBox="0 0 10 10" 
                  refX="0" 
                  refY="5" 
                  markerWidth="8" 
                  markerHeight="8" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 M 8 5 L 0 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </marker>
                
                {/* "One" Vertical Line Marker */}
                <marker 
                  id="one" 
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
                
                const isDoubleMatch = 
                  (hoveredTable === conn.from && selectedTable.id === conn.to) ||
                  (hoveredTable === conn.to && selectedTable.id === conn.from);

                // Curve styling
                const dx = Math.abs(tx - sx) * 0.4;
                const dy = Math.abs(ty - sy) * 0.4;
                const pathD = sx === tx || sy === ty 
                  ? `M ${sx} ${sy} L ${tx} ${ty}` // Straight line
                  : `M ${sx} ${sy} C ${sx + (tx > sx ? dx : -dx)} ${sy}, ${tx + (tx > sx ? -dx : dx)} ${ty}, ${tx} ${ty}`; // Curve

                const color = isHighlighted 
                  ? (isDoubleMatch ? '#ffffff' : selectedTable.color) 
                  : '#1f2937';

                return (
                  <g key={idx} className="transition-all duration-300">
                    {/* Shadow/Glow path */}
                    {isHighlighted && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeOpacity="0.2"
                      />
                    )}
                    {/* Visual relation path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={color}
                      strokeWidth={isHighlighted ? 2.5 : 1.2}
                      markerStart="url(#one)"
                      markerEnd="url(#crowfoot)"
                      className="text-gray-700 transition-colors duration-300"
                      style={{ color }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* HTML Table Nodes Layer */}
            {TABLES.map((table) => {
              const isHovered = hoveredTable === table.id;
              const isSelected = selectedTable.id === table.id;
              const isRelatedToSelected = isRelated(selectedTable.id, table.id);
              
              let borderStyle = 'border-gray-900';
              if (isSelected) borderStyle = 'border-white ring-2 ring-white/10 scale-102';
              else if (isHovered) borderStyle = 'border-gray-600';
              else if (isRelatedToSelected) borderStyle = 'border-gray-800';

              return (
                <div
                  key={table.id}
                  style={{ 
                    left: `${(table.x / 100) * canvasWidth}px`, 
                    top: `${(table.y / 100) * canvasHeight}px`,
                    width: `${cardWidth}px`
                  }}
                  className={`absolute rounded-xl bg-gray-950/95 border backdrop-blur-md shadow-2xl transition-all duration-300 cursor-pointer z-10 select-none overflow-hidden ${borderStyle}`}
                  onMouseEnter={() => setHoveredTable(table.id)}
                  onMouseLeave={() => setHoveredTable(null)}
                  onClick={() => setSelectedTable(table)}
                >
                  {/* Standard ER Header (PK Section divider style) */}
                  <div className="p-2.5 bg-gray-900/60 flex items-center justify-between border-b border-gray-900">
                    <span className="font-mono font-bold text-xs tracking-tight text-white truncate">
                      {table.name}
                    </span>
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: table.color }}
                    />
                  </div>

                  {/* Standard Attribute Partition Box */}
                  <div className="p-2.5 space-y-1 font-mono text-[9px] text-gray-400 bg-black/40">
                    
                    {/* PK Section at the top */}
                    {table.columns.filter(c => c.key?.includes('PK')).map((col) => (
                      <div key={col.name} className="flex items-center justify-between font-bold text-white border-b border-gray-900/50 pb-0.5 mb-0.5">
                        <span className="flex items-center gap-1">
                          <Key className="w-2.5 h-2.5 text-amber-400" />
                          {col.name}
                        </span>
                        <span className="text-[8px] text-amber-400">PK</span>
                      </div>
                    ))}

                    {/* Regular Section */}
                    {table.columns.filter(c => !c.key?.includes('PK')).slice(0, 3).map((col) => (
                      <div key={col.name} className="flex items-center justify-between text-gray-500 hover:text-gray-300">
                        <span className="truncate">{col.name}</span>
                        <span className="text-[8px] text-gray-700">{col.key || ''}</span>
                      </div>
                    ))}
                    
                    {/* Count Ellipsis */}
                    {table.columns.filter(c => !c.key?.includes('PK')).length > 3 && (
                      <div className="text-[8px] text-center pt-1 font-sans text-gray-600">
                        + {table.columns.filter(c => !c.key?.includes('PK')).length - 3} more cols
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

      </div>

      {/* Details Sidepanel Block (Columns 9-12) */}
      <div className="lg:col-span-4 flex flex-col bg-gray-950 border border-gray-900 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Panel Header */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white tracking-tight">Relation Details</h3>
          </div>
          <p className="text-xs text-gray-500">
            Selected Entity definitions and physical mappings.
          </p>
        </div>

        {/* Selected Table Identity */}
        <div className="p-4 rounded-2xl bg-gray-900/50 border border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-extrabold text-lg text-white">
              {selectedTable.name}
            </span>
            <span 
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-black"
              style={{ backgroundColor: selectedTable.color }}
            >
              Table Schema
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {selectedTable.description}
          </p>
        </div>

        {/* Columns Grid */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" /> Schema Columns
          </div>

          <div className="rounded-2xl border border-gray-900 overflow-hidden bg-black/50 max-h-52 overflow-y-auto">
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400">
                  <th className="p-2 font-bold">Field</th>
                  <th className="p-2 font-bold">Type</th>
                  <th className="p-2 font-bold text-right">Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {selectedTable.columns.map((col) => (
                  <tr key={col.name} className="hover:bg-gray-900/30 transition-colors">
                    <td className="p-2 text-white font-semibold flex items-center gap-1">
                      {col.key?.includes('PK') && <Key className="w-3 h-3 text-amber-400" />}
                      {col.key?.includes('FK') && <Link2 className="w-3 h-3 text-cyan-400" />}
                      <span>{col.name}</span>
                    </td>
                    <td className="p-2 text-gray-500">{col.type}</td>
                    <td className="p-2 text-right text-gray-400 font-bold">
                      {col.key || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Code / DDL Dumper */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> DDL SQL Definition
          </div>
          <div className="rounded-2xl bg-black border border-gray-900 p-4 font-mono text-[11px] text-gray-400 overflow-x-auto leading-relaxed max-h-40">
            <pre>{selectedTable.ddl}</pre>
          </div>
        </div>

      </div>

    </div>
  );
}
