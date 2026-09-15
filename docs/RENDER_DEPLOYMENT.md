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
   ```env
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   GROQ_API_KEY=[YOUR_GROQ_API_KEY]
   JWT_SECRET=[YOUR_RANDOMLY_GENERATED_32_CHAR_SECRET]
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   FRONTEND_URL=https://learnnote-ai-frontend.onrender.com
   SUPABASE_URL=https://[PROJECT-REF].supabase.co
   SUPABASE_SERVICE_KEY=[YOUR_SUPABASE_SERVICE_KEY]
   SUPABASE_BUCKET=learnnote-files
   ```

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
