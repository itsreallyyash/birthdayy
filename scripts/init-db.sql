-- Create messages table for chat room
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP,
  avatar_color TEXT DEFAULT '#ff6b6b',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create images metadata table
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blob_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create music tracks table
CREATE TABLE IF NOT EXISTS music_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blob_url TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  duration INTEGER,
  sort_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Create upload logs table
CREATE TABLE IF NOT EXISTS upload_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('image', 'music', 'transcript')),
  filename TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_images_sort_order ON images(sort_order);
CREATE INDEX IF NOT EXISTS idx_music_sort_order ON music_tracks(sort_order);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_upload_logs_created_at ON upload_logs(created_at);

-- Enable Row Level Security (optional - for future security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_logs ENABLE ROW LEVEL SECURITY;
