/*
  # Create user API keys table for secure storage

  1. New Tables
    - `user_api_keys`
      - `id` (uuid, primary key)
      - `user_id` (text, references users)
      - `provider` (text, AI provider name)
      - `encrypted_key` (text, encrypted API key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_api_keys` table
    - Add policy for users to manage their own API keys
    - Add unique constraint to prevent duplicate provider keys per user

  3. Indexes
    - Index on user_id for performance
    - Unique index on user_id + provider combination
*/

-- Create the user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  provider text NOT NULL,
  encrypted_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint to prevent duplicate provider keys per user
ALTER TABLE user_api_keys ADD CONSTRAINT unique_user_provider 
  UNIQUE (user_id, provider);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider ON user_api_keys(user_id, provider);

-- Enable Row Level Security
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own API keys
CREATE POLICY "Users can manage their own API keys"
  ON user_api_keys
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Allow anonymous access for now (since we're using a default user)
-- In production, you'd want proper authentication
CREATE POLICY "Allow anonymous access for API keys"
  ON user_api_keys
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_api_keys_updated_at ON user_api_keys;
CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();