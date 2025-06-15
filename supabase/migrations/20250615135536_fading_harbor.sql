/*
  # Canvas Enhancements Migration

  1. New Tables
    - `canvas_shares` - For sharing canvases between users
  
  2. Schema Updates
    - Add `thumbnail_url` to canvases table
    - Add `is_public` to canvases table
    - Add `shared_with` array to canvases table
  
  3. Security
    - Enable RLS on canvas_shares table
    - Add policies for canvas sharing
*/

-- Add new columns to canvases table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canvases' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE canvases ADD COLUMN thumbnail_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canvases' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE canvases ADD COLUMN is_public boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'canvases' AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE canvases ADD COLUMN shared_with text[];
  END IF;
END $$;

-- Create canvas_shares table
CREATE TABLE IF NOT EXISTS canvas_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  shared_with_user_id text NOT NULL,
  shared_by_user_id text NOT NULL,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicate shares
ALTER TABLE canvas_shares ADD CONSTRAINT unique_canvas_share 
  UNIQUE (canvas_id, shared_with_user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_canvas_shares_canvas_id ON canvas_shares(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_shares_shared_with ON canvas_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_shares_shared_by ON canvas_shares(shared_by_user_id);

-- Enable Row Level Security
ALTER TABLE canvas_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for canvas sharing
CREATE POLICY "Users can view shares for their canvases"
  ON canvas_shares
  FOR SELECT
  TO authenticated
  USING (shared_by_user_id = auth.uid()::text OR shared_with_user_id = auth.uid()::text);

CREATE POLICY "Users can create shares for their canvases"
  ON canvas_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (shared_by_user_id = auth.uid()::text);

CREATE POLICY "Users can update shares for their canvases"
  ON canvas_shares
  FOR UPDATE
  TO authenticated
  USING (shared_by_user_id = auth.uid()::text);

CREATE POLICY "Users can delete shares for their canvases"
  ON canvas_shares
  FOR DELETE
  TO authenticated
  USING (shared_by_user_id = auth.uid()::text);

-- Allow anonymous access for now (since we're using a default user)
CREATE POLICY "Allow anonymous access for canvas shares"
  ON canvas_shares
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_canvas_shares_updated_at ON canvas_shares;
CREATE TRIGGER update_canvas_shares_updated_at
  BEFORE UPDATE ON canvas_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();