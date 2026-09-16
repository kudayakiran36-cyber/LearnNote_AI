# Render Deployment Guide — LearnNote AI

This guide walks you step-by-step through deploying **LearnNote AI** on [Render](https://render.com/).

Architecture:
- **Backend**: Render Web Service (Python 3.12 + FastAPI + Uvicorn)
- **Frontend**: Render Static Site (Vite + React)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **AI**: Groq API (`llama-3.3-70b-versatile`)

---

## Part 1: Deploy Backend Web Service

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **"New +"** and select **"Web Service"**.
3. Connect your GitHub repository: `your-username/LearnNote_AI`.
4. Configure the Web Service details:
   - **Name**: `learnnote-ai-backend` (or your preferred name)
   - **Region**: Select the region nearest to your Supabase project (e.g. `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan**: `Free` or `Starter`

5. In the **Environment Variables** section, add the following:

   > [!IMPORTANT]
   > **IPv4 Pooler Required on Render**: Render web services do not have outbound IPv6 routing. Because Supabase direct connections (`db.[PROJECT-REF].supabase.co`) resolve to IPv6, connecting to the direct host causes `psycopg2.OperationalError: Network is unreachable`. You **MUST use the Supabase Session Pooler** URL (`aws-0-[REGION].pooler.supabase.com:5432`).

   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   GROQ_API_KEY=[YOUR_GROQ_API_KEY]
   JWT_SECRET=[YOUR_RANDOMLY_GENERATED_32_CHAR_SECRET]
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   FRONTEND_URL=https://learnnote-ai-frontend.onrender.com
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_KEY=[YOUR_SUPABASE_SERVICE_KEY]
   SUPABASE_BUCKET=learnnote-files
   ```

   ### Generating your `JWT_SECRET` (32+ characters)
   Run this one-line command in your terminal or PowerShell to generate an instant, cryptographically secure secret to paste:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   *(Or if using OpenSSL: `openssl rand -hex 32`)*

   ### Finding your Supabase Session Pooler URL
   1. In your Supabase Dashboard, click the green **Connect** button at top right (or go to **Project Settings** -> **Database**).
   2. Under **Connection Method**, choose **Session Pooler** (or **IPv4**).
   3. Select **URI** mode and copy the string. Replace `[YOUR-PASSWORD]` with your database password.

6. Click **"Create Web Service"** to start the build and deployment.
7. Once deployed, note down your backend URL (e.g. `https://learnnote-ai-backend.onrender.com`).
8. Verify deployment health by navigating to:
   ```text
   https://learnnote-ai-backend.onrender.com/health
   ```
   It should return: `{"status": "ok"}`.

---

## Part 2: Deploy Frontend Static Site

1. In your Render Dashboard, click **"New +"** and select **"Static Site"**.
2. Connect your GitHub repository: `your-username/LearnNote_AI`.
3. Configure the Static Site details:
   - **Name**: `learnnote-ai-frontend` (or your preferred name)
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `dist`

4. In the **Environment Variables** section, add:
   ```env
   VITE_API_BASE_URL=https://learnnote-ai-backend.onrender.com
   ```
   *(Ensure this matches your real deployed backend Web Service URL).*

5. Under **Redirects / Rewrites** in the Render Static Site settings, add a rewrite rule for single-page application routing:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`

6. Click **"Create Static Site"**.
7. Once deployed, visit your frontend URL (e.g. `https://learnnote-ai-frontend.onrender.com`).

---

## Part 3: Final CORS Origin Verification

1. Go back to your Render Backend Web Service settings -> **Environment Variables**.
2. Make sure `FRONTEND_URL` contains your live frontend URL:
   ```env
   FRONTEND_URL=https://learnnote-ai-frontend.onrender.com
   ```
3. If you make changes, click **"Save Changes"** to trigger a fast redeploy.
4. Open the frontend URL in your browser:
   - Test logging into the **Python Demo** account with 1 click.
   - Verify the notes and quiz history display.
   - Test creating a topic note and generating questions.

---

## Common Deployment Pitfalls & Troubleshooting

### 1. DNS Failure: `could not translate host name "db.[PROJECT-REF].supabase.co"`
- **Cause**: Literal placeholder text `[PROJECT-REF]` was copied from `.env.example` into Render environment variables.
- **Fix**: Retrieve your project ID from Supabase (**Project Settings** -> **General** -> **Reference ID**) and substitute it into the URL.

### 2. Runtime Failures: Placeholders in `GROQ_API_KEY`, `JWT_SECRET`, or `SUPABASE_SERVICE_KEY`
- **Cause**: Placeholder tokens left unconfigured.
- **Fix**:
  - `GROQ_API_KEY`: Generate a key at [console.groq.com/keys](https://console.groq.com/keys).
  - `JWT_SECRET`: Generate a 32+ char secret in terminal: `python -c "import secrets; print(secrets.token_hex(32))"`.
  - `SUPABASE_SERVICE_KEY`: Found in Supabase -> **Project Settings** -> **API** -> `service_role` key (secret).

### 3. Network Failure: `psycopg2.OperationalError: ... Network is unreachable` (IPv6 Incompatibility)
- **Cause**: Supabase's direct connection (`db.<ref>.supabase.co:5432`) uses IPv6. Render Web Services only route outbound traffic over IPv4.
- **Fix**: Switch to the Supabase **Session Pooler** (IPv4). In Supabase, click **Connect** -> **Connection Method: Session Pooler**, and copy the URI:
  ```env
  DATABASE_URL=postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres
  ```
