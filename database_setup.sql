-- Database Setup Script for Recruiting Company
-- Run this script on your local PostgreSQL database

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- You should change this password after first login
INSERT INTO users (email, name, password_hash, role, is_verified)
VALUES (
  'admin@company.com',
  'System Admin',
  '$2b$10$h5EM4lr3thFIbnB/vxl0meSeGRkLf73HVQx2gnDKwu8nH9QV/HHiK',
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Display success message
SELECT 'Database tables created successfully!' as message;
SELECT 'Default admin user: admin@company.com | password: sholas33' as credentials;


-- Create passport_details table
CREATE TABLE IF NOT EXISTS passport_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  passport_type TEXT NOT NULL,
  country_code TEXT NOT NULL,
  passport_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  sex TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth TEXT,
  date_of_issue DATE NOT NULL,
  date_of_expiry DATE NOT NULL,
  place_of_issue TEXT,
  father_name TEXT,
  spouse_name TEXT,
  address TEXT,
  passport_photo TEXT,
  signature TEXT,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for better lookup
CREATE INDEX IF NOT EXISTS idx_passport_user_id ON passport_details(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_number ON passport_details(passport_number);



CREATE TABLE question_sets (
    id SERIAL PRIMARY KEY,
    set_name VARCHAR(50) NOT NULL,               -- e.g., 'Set A'
    category VARCHAR(100) NOT NULL,              -- e.g., 'driver', 'welder'
    total_questions INT DEFAULT 0,
    created_by UUID,                              -- admin user id
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_set_id INT NOT NULL REFERENCES question_sets(id) ON DELETE CASCADE,
    question_text TEXT,                          -- text question
    question_image_url TEXT,                     -- image path/url
    question_type VARCHAR(20) DEFAULT 'text',    -- 'text' | 'image'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE question_options (
    id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE user_question_sets (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_set_id INT NOT NULL REFERENCES question_sets(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
