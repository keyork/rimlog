-- RimLog Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Log entries table
CREATE TABLE IF NOT EXISTS log_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title         TEXT,
  content       TEXT NOT NULL,
  observer_note TEXT,
  
  -- Classification
  timescale     VARCHAR(10) NOT NULL CHECK (timescale IN ('1d', '100d', '1y', '10y', '100y', '1000y')),
  tag           VARCHAR(20) NOT NULL CHECK (tag IN ('routine', 'anomaly', 'insight', 'critical')),
  tag_label     VARCHAR(50) NOT NULL,
  
  -- Time
  display_time  VARCHAR(50) NOT NULL,
  publish_at    TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  is_published  BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_timescale_published ON log_entries(timescale, is_published, publish_at DESC);
CREATE INDEX IF NOT EXISTS idx_publish_at ON log_entries(publish_at) WHERE is_published = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_log_entries_updated_at
  BEFORE UPDATE ON log_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (optional, enable if needed)
-- ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Public read access" ON log_entries FOR SELECT USING (is_published = true);
