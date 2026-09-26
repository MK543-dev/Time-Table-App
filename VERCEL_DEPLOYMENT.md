# Deploying TimeForge to Vercel

TimeForge is configured for instant full-stack deployment on [Vercel](https://vercel.com) with Vite static frontend hosting and Express Serverless API functions.

---

## 🚀 Quick Deployment Guide

### Option 1: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Configure TimeForge for Vercel deployment"
   git remote add origin https://github.com/<your-username>/timeforge.git
   git push -u origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository.
   - Vercel automatically detects **Vite** as the framework preset.

3. **Project Settings on Vercel**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Environment Variables**:
   In the Vercel project configuration screen under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key from Google AI Studio)*

5. Click **Deploy**!

---

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Run `vercel` from the root directory:
   ```bash
   vercel
   ```

3. When prompted, link the project and deploy.
   To deploy straight to production:
   ```bash
   vercel --prod
   ```

---

## ⚙️ How Vercel Configuration Works

- **`vercel.json`**:
  Configures route rewrites so `/api/*` and `/daily-tasks/*` routes are handled by the serverless function (`/api/index.ts`), while all frontend routes fall back to `/index.html` for single-page client routing.

- **`/api/index.ts`**:
  Vercel Serverless Function entry point that handles all API endpoints (authentication, AI agent chat, syllabus parsing, daily task progress, and streaks).

- **Resilient File Storage**:
  On Vercel, state persistence automatically switches to `/tmp/.data` to respect serverless read-only filesystem restrictions.

---

## 🔑 Default Institutional Credentials
- **Admin Email**: `218r1a0543@gmail.com`
- **Admin Password**: `Admin@0543`
