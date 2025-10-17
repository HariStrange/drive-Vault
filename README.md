# Recruiting Company API

Multi-tenant authentication system for a recruiting company managing drivers, welders, and students.

## Features

- User registration with email verification
- Role-based access control (Admin, Driver, Welder, Student)
- JWT authentication
- Password reset functionality
- Admin dashboard capabilities

## Setup

### 1. Create PostgreSQL Database

First, create a database on your local PostgreSQL server:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE recruiting_db;

# Exit psql
\q
```

### 2. Run Database Setup

Run the SQL script to create all tables:

```bash
psql -U postgres -d recruiting_db -f database_setup.sql
```

This will create:
- **users** table (with default admin user)
- **verification_codes** table
- **password_reset_tokens** table
- All necessary indexes

**Default Admin Credentials:**
- Email: `admin@company.com`
- Password: `admin123`

### 3. Environment Variables

Update the `.env` file with your credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_NAME=recruiting_db

JWT_SECRET=your-secure-jwt-secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

FRONTEND_URL=http://localhost:5173
PORT=3000
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start Server

```bash
node index.js
```

Server runs on `http://localhost:3000`

## API Endpoints

### Authentication

#### 1. Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "phone": "1234567890",
  "name": "John Doe",
  "password": "securePassword123",
  "role": "driver"
}
```
Roles: `driver`, `welder`, `student`

#### 2. Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

#### 3. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### 4. Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### 5. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

#### 6. Admin Reset User Password
```http
POST /api/auth/admin/reset-user-password
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "userId": "user-uuid",
  "newPassword": "newPassword123"
}
```

### User Management

#### 1. Get Current User Profile
```http
GET /api/users/me
Authorization: Bearer <token>
```

#### 2. Get All Users (Admin Only)
```http
GET /api/users/admin/all-users?role=driver
Authorization: Bearer <admin-token>
```
Optional query param: `role` (driver, welder, student)

#### 3. Get User by ID (Admin Only)
```http
GET /api/users/admin/user/:userId
Authorization: Bearer <admin-token>
```

#### 4. Get Statistics (Admin Only)
```http
GET /api/users/admin/stats
Authorization: Bearer <admin-token>
```

## Database Schema

### Tables

1. **users** - User accounts with roles
2. **verification_codes** - Email verification codes (15 min expiry)
3. **password_reset_tokens** - Password reset tokens (1 hour expiry)

## Security Features

- Passwords hashed with bcrypt
- JWT tokens for authentication
- Email verification required before login
- Row Level Security (RLS) enabled
- Role-based authorization
- Secure password reset flow

## Email Configuration

For Gmail, enable 2-factor authentication and create an App Password:
1. Go to Google Account settings
2. Security > 2-Step Verification
3. App passwords > Generate new password
4. Use this password in `SMTP_PASS`

## User Roles

- **admin**: Full access to monitor all users and reset passwords
- **driver**: Access to own profile only
- **welder**: Access to own profile only
- **student**: Access to own profile only
