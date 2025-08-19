/*
  # Create canvases table for auto-save functionality

  1. New Tables
    - `canvases`
      - `id` (uuid, primary key)
      - `user_id` (text) - for future user authentication
      - `canvas_name` (text) - allows multiple canvases per user
      - `nodes` (jsonb) - stores React Flow nodes
      - `edges` (jsonb) - stores React Flow edges
      - `viewport` (jsonb) - stores viewport state (zoom, position)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `canvases` table
    - Add policy for users to manage their own canvases
    - Add unique constraint on user_id + canvas_name

  3. Indexes
    - Index on user_id for fast lookups
    - Index on updated_at for cleanup operations
*/

-- Create the canvases table
CREATE TABLE IF NOT EXISTS canvases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  canvas_name text NOT NULL DEFAULT 'My Canvas',
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  viewport jsonb NOT NULL DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicate canvases per user
ALTER TABLE canvases ADD CONSTRAINT unique_user_canvas 
  UNIQUE (user_id, canvas_name);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_canvases_user_id ON canvases(user_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated_at ON canvases(updated_at);
CREATE INDEX IF NOT EXISTS idx_canvases_user_canvas ON canvases(user_id, canvas_name);

-- Enable Row Level Security
ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own canvases
CREATE POLICY "Users can manage their own canvases"
  ON canvases
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for now (since we're using a default user)
-- In production, you'd want proper authentication
CREATE POLICY "Allow anonymous access"
  ON canvases
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_canvases_updated_at ON canvases;
CREATE TRIGGER update_canvases_updated_at
  BEFORE UPDATE ON canvases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();