# Supabase Setup Guide — LearnNote AI

This guide walks you through manually setting up Supabase PostgreSQL and Supabase Storage for **LearnNote AI**.

---

## 1. Create a Supabase Project

1. Log in to [Supabase](https://supabase.com/).
2. Click **"New Project"**.
3. Choose an organization, enter a project name (e.g. `learnnote-ai`), and set a secure database password.
4. Choose a region close to your Render deployment region.
5. Click **"Create new project"** and wait for provisioning to complete.

---

## 2. Obtain PostgreSQL Connection URL

> [!IMPORTANT]
> **For Render deployments, use the Session Pooler (IPv4)**. Render web services do not route IPv6 outbound traffic. The Supabase direct connection (`db.[PROJECT-REF].supabase.co`) resolves to IPv6 and causes `psycopg2.OperationalError: Network is unreachable`. The Session Pooler resolves to IPv4 and connects seamlessly.

1. In your Supabase Dashboard, click the **Connect** button at the top (or navigate to **Project Settings** -> **Database**).
2. Under **Connection Method**, select **Session Pooler** (or IPv4).
3. Under **Connection string**, select **URI** mode.
4. Copy the connection string. It will look like:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   *(Port `5432` for Session Pooler, or port `6543` for Transaction Pooler).*
5. Replace `[YOUR-PASSWORD]` with your real database password. If your password contains special symbols (like `@`, `#`, `%`), ensure they are URL-encoded.
6. In your backend `.env` or Render environment settings, set:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```

---

## 3. Database Schema & Tables

LearnNote AI automatically creates and manages all tables on startup via SQLAlchemy `create_tables()` during FastAPI lifespan initialization. 

If you prefer to execute the raw SQL DDL manually in the Supabase **SQL Editor**, you can run:

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    unique_id VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    topic VARCHAR(150) NOT NULL,
    summary TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_type VARCHAR(50) DEFAULT 'topic' NOT NULL,
    source_reference VARCHAR(255),
    last_reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Note-Tags Junction Table
CREATE TABLE IF NOT EXISTS note_tags (
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

-- Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE NOT NULL,
    question TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    score INTEGER DEFAULT 0 NOT NULL,
    total_questions INTEGER DEFAULT 0 NOT NULL,
    topic_scope VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Quiz Answers Table
CREATE TABLE IF NOT EXISTS quiz_answers (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE NOT NULL,
    question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
    selected_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    question_text TEXT,
    question_type VARCHAR(50),
    correct_answer TEXT,
    explanation TEXT
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic);
CREATE INDEX IF NOT EXISTS idx_notes_last_reviewed ON notes(last_reviewed_at);
CREATE INDEX IF NOT EXISTS idx_questions_user_id ON questions(user_id);
CREATE INDEX IF NOT EXISTS idx_questions_note_id ON questions(note_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt_id ON quiz_answers(attempt_id);
```

---

## 4. Supabase Storage Bucket Setup

1. In the Supabase Dashboard, go to **Storage**.
2. Click **"New Bucket"**.
3. Name the bucket: `learnnote-files`.
4. Choose whether to make it public or private (private is recommended).
5. Under **Project Settings** -> **API**, copy:
   - **Project URL** (`https://[PROJECT-REF].supabase.co`)
   - **service_role secret** key (keep this secret; do not share or commit).
6. In your backend `.env` or Render environment settings, configure:
   ```env
   SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   SUPABASE_SERVICE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]
   SUPABASE_BUCKET=learnnote-files
   ```
*(Note: If Supabase Storage variables are omitted, LearnNote AI automatically stores uploaded files safely in local backend storage).*

---

## 5. Verifying Database Connectivity

1. Start the backend:
   ```bash
   uvicorn app.main:app --port 8000
   ```
2. Check terminal output: you should see:
   ```text
   [INFO] learnnote: Initializing LearnNote AI backend...
   [INFO] learnnote: Demo accounts seeded successfully.
   ```
3. Visit `http://127.0.0.1:8000/health` to confirm `{"status": "ok"}`.
