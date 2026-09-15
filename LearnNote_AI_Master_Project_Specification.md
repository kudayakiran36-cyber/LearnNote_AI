# LearnNote AI — Master Build Specification & Coding-AI Prompt

## 1. Purpose

LearnNote AI is a personal, web-based AI learning workspace.

The system lets a user provide learning material as a topic, pasted text, PDF, or image. AI converts that material into structured knowledge and generates a reusable question bank. The application then stores, searches, quizzes, scores, tracks progress, and supports revision without requiring AI at runtime.

**Core principle:**

> AI creates and structures knowledge. The application stores, retrieves, quizzes, scores, and tracks it.

This document is the authoritative product and engineering specification.

---

# 2. Scope

## Must Have

- User registration and login
- Three pre-populated demo accounts
- User-isolated data
- Dashboard
- Create Knowledge
- Topic input
- Text input
- PDF upload
- Image upload
- AI-generated structured notes
- AI-generated tags
- AI-generated question bank
- Knowledge library
- Basic search
- Topic/tag filtering
- Note viewing and editing
- Question management/editing
- Quiz configuration
- MCQ questions
- True/False questions
- Fill-in-the-blank questions
- Mixed quizzes
- Deterministic scoring
- Quiz explanations
- Quiz history
- Progress statistics
- Basic revision
- Settings
- Secure authentication
- Error handling
- Deployment configuration
- Documentation

## Explicitly Out of Scope

Do not add these unless the owner later requests them:

- Instagram/reel integration
- Social-media scraping
- Chatbot
- Voice assistant
- Social sharing
- Collaboration
- Leaderboards
- Gamification
- Mobile application
- AI adaptive questioning
- AI grading of free-form answers
- Short-answer questions
- Difficulty classification/selection
- User-selected question types
- Email OTP
- Automated email password reset
- Complex recommendation engine
- Vector database/semantic search as an MVP dependency
- Multiple AI providers without a demonstrated requirement

---

# 3. Technology Stack

Use:

- Frontend: React + Vite
- Backend: Python + FastAPI
- ORM: SQLAlchemy
- Database: Supabase PostgreSQL
- File storage: Supabase Storage
- AI: Groq API
- Authentication: JWT
- Password hashing: Argon2 or bcrypt
- Hosting: Render
- Source control: GitHub

Keep the architecture simple and maintainable. Do not introduce microservices or unnecessary infrastructure.

---

# 4. Product Structure

Authenticated application pages:

```text
Login
Register

Dashboard

Knowledge
├── Library
├── Create Knowledge
└── View/Edit Note

Quiz
├── Configure
├── Attempt
└── Result

Progress

Revision

Settings
```

Navigation should remain simple and consistent.

---

# 5. Registration and Authentication

Registration requires:

- Unique User ID
- Email
- Password

No OTP or email verification is required.

The registration page must clearly state that email verification is unavailable and that the user should enter their email correctly. Password recovery is manual/support-based in the MVP.

Store only password hashes.

Recommended password minimum: 8 characters.

Use JWT authentication.

The backend must derive the authenticated user's identity from the JWT. Never trust a user ID supplied by the frontend for authorization.

Every user-owned resource must be scoped to the authenticated user.

---

# 6. Demo Accounts

Create three normal database users with `is_demo = true`.

Suggested datasets:

### Python Demo
- Functions
- OOP
- Inheritance
- Exception Handling
- File Handling

### Data Demo
- NumPy
- Pandas
- Data Cleaning
- DataFrames
- Data Visualization

### CS Demo
- DBMS
- SQL JOINs
- Operating Systems
- Computer Networks
- Normalization

Each demo account should contain several high-quality notes, generated/stored questions, tags, and completed quiz history so the dashboard and progress pages are immediately useful.

The login page should provide visible demo-login actions.

Demo accounts should be protected from destructive operations that would ruin the prepared judging dataset.

---

# 7. Dashboard

The dashboard should be clean and useful, not a complex analytics dashboard.

Show:

- Create Knowledge
- Take Quiz
- Small learning summary
- Recent notes (approximately five)
- Recent quiz information
- Basic progress
- Revision items when applicable
- View All Knowledge/Search Knowledge

Do not display the entire knowledge base on the dashboard.

---

# 8. Knowledge Creation

The user can create knowledge in three modes.

## A. Topic

Example:

`Python decorators and generators`

Optional subject/topic metadata may be supplied.

The AI creates structured learning material.

Do not promise exhaustive web research in the MVP. Topic generation can use the model's available knowledge.

## B. Text

The user pastes existing notes or material.

The AI restructures and organizes the material.

## C. Upload

Support PDF and image input.

Process the material, then send appropriate extracted/understood content to the AI.

Use reasonable upload size/type limits.

Unsupported, empty, unreadable, or oversized files must produce clear user-facing errors.

---

# 9. AI Processing Pipeline

Use this sequence:

```text
User Input
    ↓
Validation
    ↓
File/Text Processing if needed
    ↓
Prepare AI Request
    ↓
Groq
    ↓
Structured JSON Response
    ↓
Validate AI Response
    ↓
Display Preview
    ↓
User Reviews/Edits
    ↓
User Saves
    ↓
Database
```

Do not blindly store malformed AI output.

AI generation should be isolated behind a backend service.

The Groq API key must never be exposed to the frontend.

---

# 10. AI Output Contract

The AI should return structured data equivalent to:

```text
title
subject
topic
summary
core_concepts[]
detailed_explanation
examples[]
common_mistakes[]
key_takeaways[]
tags[]
questions[]
sources[]
```

Question structure:

```text
question
question_type
options
correct_answer
explanation
```

Supported question types:

- `mcq`
- `true_false`
- `fill_blank`

Difficulty is not part of the MVP schema.

The backend must validate required fields, question types, MCQ options, and correct answers before persistence.

---

# 11. Question Generation

Questions are generated when knowledge is created, not when a quiz starts.

Target approximately 20 useful questions per knowledge item, but quality is more important than padding. Smaller material may reasonably produce fewer questions.

Questions should be varied across supported types where the material permits it.

Do not generate repetitive or obviously trivial questions merely to reach a numeric target.

Questions remain separate from normal note content.

Users can:

- View/manage questions
- Edit questions
- Delete questions
- Regenerate the question bank

Regeneration must be explicit and confirmed by the user.

---

# 12. Knowledge Notes

Standard note structure:

- Title
- Subject
- Topic
- Summary
- Core Concepts
- Detailed Explanation
- Examples
- Common Mistakes
- Key Takeaways
- Tags
- Sources where applicable

No formal difficulty classification.

Users can edit the current note.

No note version-history system is required.

Record `last_reviewed_at` for revision functionality.

---

# 13. Tags and Organization

Tags are AI-generated but editable.

Use a simple hierarchy conceptually:

```text
Subject
  ↓
Topic
  ↓
Concepts / Tags
```

Tags should be stored relationally rather than as a comma-separated string.

Basic filtering by topic and tags is required.

Related notes can initially be determined through matching topic/tags. No AI recommendation engine is required.

---

# 14. Knowledge Library

Provide a dedicated library page.

Required:

- Search by title/topic/content/tags
- Topic filtering
- Tag filtering
- Newest/oldest sorting
- Note cards
- Open note
- Edit note
- Delete note

Use ordinary database search for the MVP.

Semantic/vector search may be documented as future work but must not be required for the core application.

---

# 15. Quiz System

Quiz configuration requires only:

- Topic(s)/tag(s)
- Number of questions

Suggested question counts:

- 5
- 10
- 15
- 20

The user does not choose question type.

The user does not choose difficulty.

The backend randomly selects stored questions matching the selected scope.

The quiz engine must not call AI.

---

# 16. Quiz Execution

For each question:

- Display question
- Display appropriate input
- Save answer locally until submission
- Allow navigation as appropriate
- Submit final answers

On submission:

```text
Selected Answer
    ↓
Stored Correct Answer
    ↓
Deterministic Comparison
    ↓
is_correct
    ↓
Score
```

Do not use AI for scoring.

---

# 17. Quiz Results

Display:

- Score
- Percentage
- Correct count
- Incorrect count
- Each missed question
- User answer
- Correct answer
- Stored explanation
- Option to review topic
- Option to take another quiz

Store completed attempts.

---

# 18. Quiz History

Store:

- User
- Score
- Total questions
- Date/time
- Individual answers

Historical results should remain useful even if a note is later deleted.

---

# 19. Progress

Calculate from real stored quiz data.

Show:

- Total quizzes
- Questions answered
- Average score
- Topic-level performance
- Recent quiz performance

No AI is required.

Topic performance should be calculated from actual answers/attempts rather than fabricated summaries.

---

# 20. Revision

Implement simple date-based revision.

Track `last_reviewed_at`.

A note that has never been reviewed or has not been reviewed for a configurable period can appear in Revision.

Revision does not require AI.

Do not implement a complex spaced-repetition algorithm in the MVP.

---

# 21. Editing

Users can edit:

- Note title
- Summary
- Note content
- Subject/topic
- Tags
- Individual questions
- Question options
- Correct answer
- Explanation

Editing should not require another AI call.

---

# 22. Database

Required entities:

## users

- id
- unique_id
- email
- password_hash
- is_demo
- created_at

## notes

- id
- user_id
- title
- subject
- topic
- summary
- content
- source_type
- source_reference
- last_reviewed_at
- created_at
- updated_at

## tags

- id
- name

## note_tags

- note_id
- tag_id

## questions

- id
- user_id
- note_id
- question
- question_type
- options (JSONB, nullable)
- correct_answer
- explanation
- created_at

## quiz_attempts

- id
- user_id
- score
- total_questions
- created_at

## quiz_answers

- id
- attempt_id
- question_id
- selected_answer
- is_correct

Use appropriate primary keys, foreign keys, indexes, uniqueness constraints, and timestamps.

Recommended relationships:

```text
User 1 ──── * Notes
User 1 ──── * Questions
User 1 ──── * QuizAttempts
Note 1 ──── * Questions
Note * ──── * Tags
QuizAttempt 1 ──── * QuizAnswers
Question 1 ──── * QuizAnswers
```

---

# 23. Delete Behavior

Deleting a note should:

- Delete its questions
- Delete note-tag relationships
- Preserve global tags
- Preserve historical quiz attempts/answers

Deleting a user should delete that user's owned application data according to appropriate cascading rules.

Demo users should have destructive actions restricted.

---

# 24. API Contract

At minimum provide:

```text
POST   /auth/register
POST   /auth/login
GET    /auth/me

POST   /notes
POST   /notes/generate
POST   /notes/upload
GET    /notes
GET    /notes/{id}
PUT    /notes/{id}
DELETE /notes/{id}
GET    /notes/search

GET    /quiz/topics
POST   /quiz/start
POST   /quiz/{attempt_id}/submit
GET    /quiz/history

GET    /progress

GET    /revision

GET    /settings
PUT    /settings/password
DELETE /account
```

The implementation may refine endpoint naming if consistency requires it, but the behavior must remain equivalent.

All protected endpoints require authentication.

---

# 25. Security

Required:

- Password hashing
- JWT authentication
- Authorization checks
- User-data isolation
- Input validation
- File validation
- Secure environment variables
- CORS configuration
- No secrets committed to GitHub
- Groq key backend-only
- Safe database queries through SQLAlchemy
- Appropriate production error handling

Never return sensitive internal exceptions directly to users.

---

# 26. AI Failure Behavior

If Groq fails:

- Existing notes remain accessible
- Existing questions remain usable
- Existing quizzes remain usable
- Progress/history remain usable
- New generation shows a clear retry/error state
- Do not save incomplete AI output

The system should never become unusable merely because AI is temporarily unavailable.

---

# 27. Empty/Edge States

Design explicit behavior for:

- No notes
- No questions
- No quiz history
- No revision items
- Search returns nothing
- Selected topic has insufficient questions
- Invalid file
- Unsupported file
- Empty file
- AI malformed response
- AI timeout
- Database/network error
- Expired JWT
- Deleted note
- Duplicate note

Duplicate notes should be allowed. Optional warnings are acceptable, but automatic merging is not required.

If fewer questions exist than requested, tell the user how many are available and allow them to proceed or change the selection.

---

# 28. UI/UX

Design principles:

- Clean
- Simple
- Efficient
- Responsive
- Accessible
- Consistent

Avoid:

- Flashy animations
- Excessive cards
- Giant dashboards
- Unnecessary charts
- Complex navigation
- Decorative features that do not improve learning

Provide:

- Loading states
- Empty states
- Error states
- Success feedback
- Disabled states while processing
- Accessible form labels
- Keyboard-friendly interactions
- Readable typography
- Mobile-responsive layouts

---

# 29. File Storage

Use Supabase Storage for uploaded PDFs/images.

Database stores file metadata/reference rather than binary file content.

Implement:

```text
Upload
 ↓
Validate
 ↓
Store
 ↓
Process
 ↓
Generate Knowledge
```

Define reasonable file size and MIME-type restrictions.

Do not allow arbitrary executable uploads.

---

# 30. Deployment

Target architecture:

```text
GitHub
  │
  ├── Frontend → Render Static Site
  │
  └── Backend → Render Web Service
                     │
                     ├── Supabase PostgreSQL
                     ├── Supabase Storage
                     └── Groq API
```

The owner will manually configure Render, Supabase, API keys, domains, environment variables, and deployment settings.

The project must therefore include clear README instructions for every manual configuration step.

Never hard-code deployment credentials.

---

# 31. README Requirements

The repository README must contain:

1. Project overview
2. Features
3. Architecture diagram
4. Technology stack
5. Repository structure
6. Local setup
7. Environment variables
8. Supabase setup
9. Database migration/setup
10. Storage bucket setup
11. Groq API setup
12. Running frontend
13. Running backend
14. Demo accounts
15. Render deployment
16. Frontend/backend URL configuration
17. Troubleshooting
18. Testing
19. Security notes
20. AI-use disclosure
21. Known limitations
22. Future improvements

Clearly mark values that the owner must manually replace.

Example:

```text
DATABASE_URL=<YOUR_SUPABASE_DATABASE_URL>
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
JWT_SECRET=<YOUR_RANDOM_SECRET>
```

Do not provide fake credentials.

---

# 32. Render Manual Setup Instructions

The final repository README must explain, step by step:

### Backend

- Create a Render Web Service
- Connect GitHub repository
- Select backend directory if using a monorepo
- Configure Python runtime/build/start commands
- Add environment variables
- Configure allowed frontend origin
- Deploy
- Verify health endpoint

### Frontend

- Create a Render Static Site
- Connect repository
- Configure frontend directory
- Configure build command
- Configure publish directory
- Set backend API base URL
- Deploy
- Verify application

Document exactly which values are manually supplied by the owner.

Do not require the coding AI to log into Render or Supabase.

---

# 33. Supabase Manual Setup

README must explain:

- Create project
- Obtain PostgreSQL connection details
- Configure database URL
- Run migrations
- Create Storage bucket
- Configure appropriate storage policies
- Confirm database connectivity
- Confirm file upload functionality

Never commit Supabase secrets.

---

# 34. Environment Variables

Provide `.env.example` files.

Backend should include variables equivalent to:

```text
DATABASE_URL=
GROQ_API_KEY=
JWT_SECRET=
JWT_EXPIRE_MINUTES=
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

Only include variables actually required by the final implementation.

Frontend should contain only public configuration such as the backend API base URL.

Never expose private keys in frontend variables.

---

# 35. GitHub Structure

Prefer a simple monorepo:

```text
learnnote-ai/
├── frontend/
├── backend/
├── docs/
├── .gitignore
├── README.md
└── LICENSE
```

Backend and frontend should have their own dependency/configuration files.

Keep documentation under `docs/` when it becomes too large for README.

---

# 36. Testing Requirements

Test at minimum:

### Authentication
- Registration
- Duplicate ID
- Duplicate email
- Login
- Wrong password
- Protected routes

### Authorization
- User A cannot access User B's notes/questions/quizzes

### Knowledge
- Topic generation
- Text generation
- Upload processing
- Editing
- Deletion
- Tags

### Questions
- Valid AI output
- Invalid AI output
- Question editing
- Question deletion

### Quiz
- Random selection
- Insufficient questions
- Answer comparison
- Score calculation
- Result persistence

### Progress
- Correct aggregate calculations
- Topic performance

### Revision
- Review timestamps
- Revision selection

### Failure handling
- AI unavailable
- Invalid files
- Database errors
- Expired authentication

---

# 37. Responsible AI

The application should make clear that AI-generated material may contain errors.

The user can review and edit generated notes/questions before saving.

For user-provided source material, preserve source information where practical.

Do not claim that generated information is guaranteed correct.

The application should disclose its use of AI in the README and hackathon submission materials.

---

# 38. Performance Principles

Avoid unnecessary AI calls.

AI is used primarily during knowledge creation/regeneration.

Quiz execution, scoring, search, progress, and revision should use stored/database information.

Do not regenerate content on every page load.

Use pagination where the knowledge base becomes large.

Use database indexes for commonly searched/filtered fields.

---

# 39. Future Improvements

Document but do not implement unless explicitly requested:

- Web research with source collection
- Semantic/vector search
- Advanced spaced repetition
- More question types
- Adaptive learning
- Advanced analytics
- Multiple AI providers
- Collaboration
- Mobile app
- Voice ingestion
- Additional media sources
- More sophisticated recommendations

---

# 40. Acceptance Criteria

The project is considered complete when:

- A new user can register
- A user can log in
- Three demo accounts work
- Users cannot access each other's data
- A user can create knowledge from a topic
- A user can create knowledge from text
- A user can upload supported PDFs/images
- AI returns structured notes
- AI generates stored questions
- Notes can be edited
- Questions can be edited
- Notes can be searched
- Notes can be filtered
- Users can configure quizzes
- Quizzes use stored questions
- MCQ/True-False/Fill-blank work
- Scoring is deterministic
- Explanations appear in results
- Quiz history is stored
- Progress is calculated from real data
- Revision works
- AI failure does not break existing functionality
- Authentication is secure
- Deployment works
- README allows the owner to configure Render/Supabase/Groq independently
- No secrets are committed
- The application is responsive and usable

---

# 41. MASTER PROMPT FOR THE CODING AI

You are the lead software engineer responsible for implementing the project described in this document.

Treat the entire document as the authoritative source of truth.

## Your responsibilities

Build the complete LearnNote AI application according to this specification.

You are responsible for:

- Project scaffolding
- Frontend
- Backend
- Database models
- Database migrations
- Authentication
- Authorization
- AI integration
- File processing
- Knowledge generation
- Question generation
- Quiz engine
- Progress
- Revision
- Demo accounts
- Testing
- Error handling
- Documentation
- Local development configuration
- Deployment configuration

## Critical instructions

1. Do not invent major product features.
2. Do not add excluded features.
3. Do not introduce unnecessary complexity.
4. Do not create a chatbot.
5. Do not add adaptive AI quizzes.
6. Do not add AI free-text grading.
7. Do not add question difficulty.
8. Do not allow the frontend to access the Groq secret.
9. Do not call AI during quiz execution or scoring.
10. Do not make the application dependent on AI for existing knowledge and quizzes.
11. Do not store plaintext passwords.
12. Do not trust frontend-provided user IDs for authorization.
13. Do not commit secrets.
14. Use environment variables.
15. Keep the UI clean and simple.
16. Make the application responsive.
17. Validate AI JSON before database persistence.
18. Provide meaningful errors rather than raw stack traces.
19. Create `.env.example` files.
20. Write a complete README with manual Render/Supabase configuration instructions.
21. The owner will manually perform Render/Supabase configuration and deployment. Do not assume you can access those services.
22. Use placeholders for credentials and deployment-specific values.
23. Include seed/demo data.
24. Test the important workflows.
25. If an implementation detail is unspecified, choose the simplest robust industry-standard solution consistent with this specification.
26. If a product-level decision is genuinely required and cannot be safely inferred, document the decision needed rather than silently changing the product.
27. Keep the code maintainable and understandable for an intermediate Python developer.
28. Prefer a modular monolith over unnecessary microservices.

## Required development order

Build in logical dependency order:

```text
1. Repository structure
2. Backend configuration
3. Database models/migrations
4. Authentication
5. Authorization
6. Knowledge models/API
7. Groq integration
8. File processing
9. AI response validation
10. Question bank
11. Quiz engine
12. History/progress/revision
13. Frontend authentication
14. Dashboard
15. Knowledge UI
16. Quiz UI
17. Progress/revision UI
18. Settings
19. Demo data
20. Testing
21. Production configuration
22. README
23. Final verification
```

## AI implementation rule

Use structured JSON output.

The AI should produce notes and questions according to the schema defined above.

Never assume AI output is valid.

Validate it before persistence.

If validation fails, return a controlled error and allow retry.

## Database rule

All user-owned entities must be associated with the authenticated user where appropriate.

Every query involving private user data must enforce ownership.

Test cross-user access explicitly.

## Quiz rule

Quiz selection must be based on stored questions.

The quiz must not generate new questions during execution.

Scoring must compare answers against stored correct answers.

## Deployment rule

Prepare the project so that the owner can manually configure:

- Supabase
- Supabase Storage
- Groq API
- Render backend
- Render frontend
- Environment variables

The README must explain these processes clearly.

## Final deliverable

Produce a complete working repository, not merely snippets or pseudocode.

The repository must include:

- Working frontend
- Working backend
- Database configuration/migrations
- AI integration
- Demo data
- Tests
- `.env.example`
- `.gitignore`
- README
- Deployment instructions

Before declaring completion, verify the acceptance criteria in this document one by one.

If something cannot be completed because it requires an external credential or manual service configuration, implement everything possible locally and clearly document the exact manual step required from the owner.

---

# 42. Owner's Manual Deployment Checklist

After receiving the completed repository:

```text
[ ] Create Supabase project
[ ] Create/configure database
[ ] Create Storage bucket
[ ] Obtain required Supabase values
[ ] Obtain Groq API key
[ ] Create production JWT secret
[ ] Configure backend environment variables
[ ] Push repository to GitHub
[ ] Create Render backend service
[ ] Deploy backend
[ ] Verify backend health
[ ] Configure frontend API URL
[ ] Create Render frontend service
[ ] Deploy frontend
[ ] Configure CORS/frontend origin
[ ] Test registration
[ ] Test login
[ ] Test demo account
[ ] Test AI generation
[ ] Test file upload
[ ] Test quiz
[ ] Test progress
[ ] Test revision
[ ] Test mobile/responsive UI
[ ] Verify no secrets are exposed
[ ] Verify README
```

This checklist is intentionally manual so the owner remains in control of external services and credentials.

---

# 43. Final Instruction

Build the product as specified.

Do not optimize for adding features.

Optimize for:

- Correctness
- Security
- Maintainability
- Reliability
- Simple UX
- Clear architecture
- Good AI integration
- Strong separation between AI generation and deterministic application logic

The final application should feel like a real personal learning product, not a collection of AI demos.
