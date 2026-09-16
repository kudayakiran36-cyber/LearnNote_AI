# LearnNote AI — Personal AI Learning Workspace

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg?logo=react&logoColor=black)](https://vitejs.dev)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3%2070B-F55036.svg)](https://groq.com)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy%202.0-D71F00.svg)](https://www.sqlalchemy.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Core Principle:** AI creates and structures knowledge. The application stores, retrieves, quizzes, scores, and tracks it.

---

## 1. Project Overview

**LearnNote AI** is a personal, web-based AI learning workspace.

The system lets a user provide learning material as a topic name, pasted study notes, or uploaded PDFs/images. The backend AI engine (powered by Groq's high-speed inference running `llama-3.3-70b-versatile`) converts that material into a comprehensive, structured learning module with core concepts, detailed explanations, practical code examples, common pitfalls, key takeaways, and a reusable question bank.

The application then stores, searches, quizzes, scores, and tracks the material deterministically **without requiring AI at runtime**.

---

## 2. Features

- **Multi-Modal Knowledge Ingestion**:
  - **Topic Mode**: Generate structured notes and questions from a topic name.
  - **Pasted Text Mode**: Synthesize lecture notes, documentation, or textbooks.
  - **Document Upload Mode**: Extract text from PDFs and technical images.
- **Structured Knowledge Notes**:
  - Title, Subject, Topic, Summary
  - Core Concepts, Detailed Markdown Explanation, Examples
  - Common Mistakes & Traps, Key Takeaways, Tags, Sources
  - Full note editing without AI calls
- **Reusable Question Bank**:
  - ~15-20 questions generated at creation time across Multiple Choice (MCQ), True/False, and Fill-in-the-Blank.
  - Individual question viewing, editing, and deletion.
  - Re-generate question bank upon explicit user confirmation.
- **Deterministic Quiz Engine**:
  - Select topics/tags and question count (5, 10, 15, 20).
  - Randomly selects stored questions from the database.
  - Answer comparison is completely deterministic without AI runtime cost or hallucinations.
  - Detailed result view with scores, percentage, and stored educational explanations.
- **Spaced Date-Based Revision**:
  - Tracks `last_reviewed_at` on notes.
  - Automatically queues notes that are never reviewed or overdue (>3 days) to combat the forgetting curve.
  - 1-click "Mark as Reviewed" or "Practice Quiz on this Note".
- **Empirical Progress Analytics**:
  - Lifetime statistics: total quizzes, questions answered, average score %.
  - Topic-level accuracy breakdown calculated strictly from real quiz answers.
  - Complete history of past quiz sessions.
- **Pre-Seeded Demo Accounts**:
  - 3 pre-populated accounts (Python Demo, Data Demo, CS Demo) for 1-click judging.
  - Protected from destructive actions (account deletion / password modification).
- **Security & Data Isolation**:
  - Strict user-isolated queries; users cannot view, edit, or delete another user's data.
  - Bcrypt password hashing & JWT token authentication.
  - Safe production error handling; Groq API keys are never exposed to the frontend.

---

## 3. Architecture Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                 │
│         Dashboard • Knowledge Library • Quiz Engine         │
│          Progress Analytics • Date-Based Revision           │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON API (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI Monolith)               │
│        Auth • Notes API • File Service • Quiz Service       │
│               Deterministic Answer Comparator               │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        SQLAlchemy ORM                 Structured JSON
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│     Supabase PostgreSQL      │ │          Groq API           │
│   (SQLite Local Fallback)    │ │   llama-3.3-70b-versatile   │
│  Users • Notes • Questions   │ │  (Knowledge & Question Gen) │
│   QuizAttempts • Answers     │ └─────────────────────────────┘
└──────────────────────────────┘
```

---

## 4. Technology Stack

- **Frontend**: React 18, Vite, Lucide-React icons, Vanilla CSS Design System.
- **Backend**: Python 3.12, FastAPI, Uvicorn, Pydantic v2.
- **ORM & Database**: SQLAlchemy 2.0 (Supabase PostgreSQL in production, SQLite local dev fallback).
- **AI Model**: Groq API (`llama-3.3-70b-versatile` with JSON response mode, and `llama-3.2-11b-vision-preview` for images).
- **Authentication**: JWT (`python-jose`) and password hashing via `bcrypt`.
- **Document Processing**: `pypdf` (PDF extraction) and `Pillow` (image verification).
- **Deployment**: Render Web Service (Backend) and Render Static Site (Frontend).

---

## 5. Repository Structure

```text
LearnNote_AI/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routers (auth, notes, quiz, progress, revision, settings)
│   │   ├── core/            # Config, security (bcrypt/JWT), database session
│   │   ├── models/          # SQLAlchemy ORM models (User, Note, Tag, Question, Quiz)
│   │   ├── schemas/         # Pydantic schemas & AI JSON contracts
│   │   ├── services/        # Groq client, file processor, quiz grader, demo seeder
│   │   └── main.py          # Application entrypoint & CORS middleware
│   ├── tests/               # Pytest test suite (22 automated test cases)
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                 # Local dev config
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, Layout, Modal, Alert banners
│   │   ├── context/         # AuthContext (JWT state, demo logins)
│   │   ├── pages/           # Dashboard, Library, Create, Detail, Quiz, Progress, Revision, Settings
│   │   ├── services/        # API client fetch wrapper
│   │   ├── App.jsx          # Main routing & application state
│   │   ├── main.jsx
│   │   └── index.css        # Pure Vanilla CSS design tokens
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.example
│   └── index.html
├── docs/
│   ├── SUPABASE_SETUP.md    # Manual Supabase PostgreSQL & Storage configuration
│   └── RENDER_DEPLOYMENT.md # Manual Render Web Service & Static Site deployment
├── .gitignore
├── LICENSE
└── README.md
```

---

## 6. Local Setup

### Prerequisites
- Python 3.10+ (tested on Python 3.12)
- Node.js 18+ and npm
- Git

### Clone the Repository
```bash
git clone https://github.com/<YOUR_USERNAME>/LearnNote_AI.git
cd LearnNote_AI
```

---

## 7. Environment Variables

### Backend (`backend/.env`)
Copy the template:
```bash
cp backend/.env.example backend/.env
```
Fill in the values:
```env
# Database: SQLite for local dev, or your Supabase PostgreSQL connection URL
DATABASE_URL=sqlite:///./learnnote.db

# Groq API Key (get your free key at https://console.groq.com/keys)
GROQ_API_KEY=<YOUR_GROQ_API_KEY>

# JWT Security
JWT_SECRET=<YOUR_RANDOM_SECRET_MIN_32_CHARS>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Optional: Supabase Storage (local fallback used if omitted)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_BUCKET=learnnote-files
```

### Frontend (`frontend/.env`)
Copy the template:
```bash
cp frontend/.env.example frontend/.env
```
Contents:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 8. Supabase Setup

Follow the complete step-by-step guide in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) to:
1. Create a project on [Supabase](https://supabase.com).
2. Retrieve your PostgreSQL connection string. For Render deployments, use the IPv4-compatible **Session Pooler** URI (`postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres`).
3. Set `DATABASE_URL` in your backend environment settings.

---

## 9. Database Migration / Setup

When the backend starts up, it executes `create_tables()` during its lifespan event, automatically creating all required tables and indexes across SQLite or PostgreSQL.

For manual SQL execution in the Supabase SQL Editor, reference the DDL script in [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md).

---

## 10. Storage Bucket Setup

1. In Supabase Dashboard -> **Storage**, click **"New Bucket"**.
2. Name the bucket `learnnote-files`.
3. Retrieve your Supabase Project URL and `service_role` secret key from **Project Settings** -> **API**.
4. Set `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and `SUPABASE_BUCKET` in your environment.
*(Note: If omitted, uploads default to local backend storage).*

---

## 11. Groq API Setup

1. Register for a free developer account at [console.groq.com](https://console.groq.com/).
2. Create an API key in **API Keys**.
3. Set `GROQ_API_KEY=<YOUR_GROQ_API_KEY>` in `backend/.env`.
*(Note: If GROQ_API_KEY is not set or times out, LearnNote AI seamlessly falls back to a deterministic generator for offline testing).*

---

## 12. Running Backend Locally

```bash
cd backend

# Create virtual environment and install dependencies
uv venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Visit `http://127.0.0.1:8000/docs` to view the interactive OpenAPI documentation.

---

## 13. Running Frontend Locally

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 14. Demo Accounts

LearnNote AI includes **3 pre-populated demo accounts** with rich notes, questions, tags, and quiz history. They can be launched with 1-click from the Login page or accessed with credentials:

| Account | Email / User ID | Password | Focus Areas |
| :--- | :--- | :--- | :--- |
| **Python Demo** | `python_demo@learnnote.ai` / `python_demo` | `PythonDemo123!` | Functions, OOP, Inheritance, Exception Handling, File Handling |
| **Data Demo** | `data_demo@learnnote.ai` / `data_demo` | `DataDemo123!` | NumPy, Pandas, Data Cleaning, DataFrames, Data Visualization |
| **CS Demo** | `cs_demo@learnnote.ai` / `cs_demo` | `CSDemo123!` | DBMS, SQL JOINs, Operating Systems, Networks, Normalization |

*Note: Demo accounts are protected against destructive modifications (e.g. deleting notes or accounts) to preserve evaluation data for judges.*

---

## 15. Render Deployment

Follow the complete step-by-step guide in [`docs/RENDER_DEPLOYMENT.md`](docs/RENDER_DEPLOYMENT.md):
- **Backend Web Service**:
  - Root directory: `backend`
  - Build command: `pip install -r requirements.txt`
  - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Frontend Static Site**:
  - Root directory: `frontend`
  - Build command: `npm install && npm run build`
  - Publish directory: `dist`
  - Rewrite rule: `/*` -> `/index.html`

---

## 16. Frontend / Backend URL Configuration

- **Backend CORS**: Set `FRONTEND_URL` in the backend environment variables to match your live Render Static Site URL (e.g. `https://learnnote-ai-frontend.onrender.com`).
- **Frontend API**: Set `VITE_API_BASE_URL` in the frontend environment variables to point to your live Render Backend Web Service (e.g. `https://learnnote-ai-backend.onrender.com`).

---

## 17. Troubleshooting

- **CORS Errors in Browser**: Verify `FRONTEND_URL` on the backend matches your exact frontend domain, including `https://` and without trailing slashes.
- **Database Connection Failure / `Network is unreachable` on Render**: Render web services do not have outbound IPv6 routing. The direct Supabase connection (`db.[PROJECT-REF].supabase.co`) resolves to IPv6. Always use the **Session Pooler** (`aws-0-[REGION].pooler.supabase.com:5432/postgres`) which connects over IPv4. Also ensure passwords with special characters (like `@`, `#`) are URL-encoded.
- **JWT Secret Generation**: Generate a cryptographically secure 32+ character secret quickly using:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **Groq Rate Limits or Network Failures**: LearnNote AI gracefully catches Groq API exceptions and falls back to deterministic structured knowledge generation without crashing.

---

## 18. Testing

Run the automated test suite covering authentication, cross-user authorization isolation, note CRUD, deterministic quiz scoring, and progress calculations:

```bash
cd backend
pytest -v
```

All 22 test cases pass:
```text
tests/test_auth.py ................ [PASSED]
tests/test_authorization.py ........ [PASSED]
tests/test_notes.py ................ [PASSED]
tests/test_quiz.py ................. [PASSED]
tests/test_progress_revision.py .... [PASSED]
======================= 22 passed in 6.21s =======================
```

---

## 19. Security Notes

- **Password Hashing**: Stored exclusively using standard `bcrypt` hashing with unique per-user salts.
- **JWT Authorization**: All private endpoints verify ownership based on token claims. User IDs supplied in client bodies are never trusted for authorization.
- **Secret Isolation**: Groq API keys and Supabase service keys are strictly isolated on the backend.
- **Cascading Cleanup**: Deleting a note automatically cleans up its questions and junction tags while safely preserving historical quiz attempts for progress accuracy.

---

## 20. Responsible AI Disclosure

- **Educational Disclaimer**: AI-generated notes and questions may contain errors or omissions. LearnNote AI allows users to review, edit, and adjust all content before saving it to the database.
- **Deterministic Evaluation**: AI is never used for quiz scoring or grading. Answers are evaluated deterministically using exact and normalized string/boolean comparisons.
- **Model Usage**: Uses Groq-hosted open weights (`llama-3.3-70b-versatile`) under Meta Llama 3.3 community license.

---

## 21. Known Limitations

- **Free-text Grading**: Short-answer free-text responses are intentionally excluded from the MVP to preserve deterministic reliability.
- **Email Delivery**: Email verification and automated password reset emails are omitted in this MVP; passwords are user-managed with support fallback.

---

## 22. Future Improvements

- Vector database integration for semantic similarity search across notes.
- Complex SuperMemo / SM-2 spaced repetition algorithms.
- Additional question types (matching pairs, ordering sequences).
- Export notes and question decks to Anki (.apkg).
