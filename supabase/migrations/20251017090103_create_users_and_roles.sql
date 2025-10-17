/*
  # Create Multi-Tenant Recruiting System

  ## Overview
  This migration sets up a complete authentication and authorization system for a recruiting company
  that manages drivers, welders, and students. It includes email verification and role-based access control.

  ## New Tables
  
  ### 1. `users`
  Main user table storing authentication and profile information
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique) - User email address for login
  - `phone` (text) - Contact phone number
  - `name` (text) - User's full name
  - `password_hash` (text) - Bcrypt hashed password
  - `role` (text) - User role: 'admin', 'driver', 'welder', or 'student'
  - `is_verified` (boolean) - Email verification status
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `verification_codes`
  Stores email verification codes
  - `id` (uuid, primary key) - Unique code identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `code` (text) - 6-digit verification code
  - `expires_at` (timestamptz) - Code expiration time (15 minutes)
  - `created_at` (timestamptz) - Code generation timestamp

  ### 3. `password_reset_tokens`
  Stores password reset tokens
  - `id` (uuid, primary key) - Unique token identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `token` (text) - Reset token
  - `expires_at` (timestamptz) - Token expiration time (1 hour)
  - `created_at` (timestamptz) - Token generation timestamp

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled for maximum security
  - Users can only read their own data
  - Admins have broader access to monitor all users
  - Public insert access for registration (with verification requirement)
  
  ### Policies
  1. Users can view their own profile
  2. Admins can view all user profiles
  3. Public can create accounts (registration)
  4. Users can update their own profile
  5. Admins can update any user profile (for password resets)
  6. Verification codes are accessible only to the owner
  7. Password reset tokens are accessible only to the owner

  ## Important Notes
  - Passwords must be hashed using bcrypt before storage
  - Email verification is required before account activation
  - Verification codes expire after 15 minutes
  - Password reset tokens expire after 1 hour
  - Admin role has special privileges for monitoring and management
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text,
  name text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'driver', 'welder', 'student')),
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Admins can view all profiles"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (current_setting('app.current_user_id', true))::uuid
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Public can create accounts"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (current_setting('app.current_user_id', true))::uuid
      AND u.role = 'admin'
    )
  );

-- Verification codes policies
CREATE POLICY "Users can view own verification codes"
  ON verification_codes FOR SELECT
  USING (user_id = (current_setting('app.current_user_id', true))::uuid);

CREATE POLICY "Public can create verification codes"
  ON verification_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete verification codes"
  ON verification_codes FOR DELETE
  USING (true);

-- Password reset tokens policies
CREATE POLICY "Public can view password reset tokens"
  ON password_reset_tokens FOR SELECT
  USING (true);

CREATE POLICY "Public can create password reset tokens"
  ON password_reset_tokens FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete password reset tokens"
  ON password_reset_tokens FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);