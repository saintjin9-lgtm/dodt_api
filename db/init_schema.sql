-- Full DB schema for dodt_api (Postgres)
-- Run this after creating the database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    role VARCHAR(50) DEFAULT 'MEMBER',
    hashed_password TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creations table
CREATE TABLE IF NOT EXISTS creations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL,
    prompt TEXT,
    gender VARCHAR(32),
    age_group VARCHAR(50),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_picked_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    analysis_text TEXT,
    recommendation_text TEXT,
    tags_array TEXT[],
    height INTEGER,
    body_type VARCHAR(50),
    style VARCHAR(50),
    colors VARCHAR(255)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creation_id INTEGER NOT NULL REFERENCES creations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_creation_like UNIQUE(user_id, creation_id)
);

-- Media files (user uploads)
CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    original_name TEXT,
    size_bytes BIGINT,
    description TEXT,
    tags_array TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_files_user_id ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_created_at ON media_files(created_at DESC);

-- Indexes to improve common queries
CREATE INDEX IF NOT EXISTS idx_creations_user_id ON creations(user_id);
CREATE INDEX IF NOT EXISTS idx_creations_created_at ON creations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creations_likes_count ON creations(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_creation_id ON likes(creation_id);

-- Optional: sample admin user insert (commented out)
-- INSERT INTO users (email, name, role, hashed_password) VALUES ('admin@example.com', 'Admin', 'ADMIN', '<hashed_password>');
