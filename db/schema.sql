CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NULL,
    name VARCHAR(255),
    picture VARCHAR(512),
    role VARCHAR(50) DEFAULT 'MEMBER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id),
    filename VARCHAR(255),
    filelink VARCHAR(512),
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL,
    prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to creations table
ALTER TABLE creations ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE creations ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE creations ADD COLUMN IF NOT EXISTS age_group VARCHAR(50);
ALTER TABLE creations ADD COLUMN IF NOT EXISTS is_picked_by_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE creations ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create a table for likes
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    creation_id INTEGER REFERENCES creations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, creation_id) -- A user can like a creation only once
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255) NULL;

ALTER TABLE creations ADD COLUMN IF NOT EXISTS analysis_text TEXT;
ALTER TABLE creations ADD COLUMN IF NOT EXISTS recommendation_text TEXT;
ALTER TABLE creations ADD COLUMN IF NOT EXISTS tags_array TEXT[];