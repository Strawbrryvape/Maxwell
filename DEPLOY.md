# Maxwell — Deploy to Netlify (Step by Step)

**Time required:** ~10 minutes  
**Technical skill level:** Beginner (no coding required)  
**Cost:** Free tier sufficient to start

---

## Step 1: Get Your API Keys (5 minutes)

### Kimi API Key (Required)
1. Go to **https://platform.moonshot.cn**
2. Sign up / Log in
3. Go to **API Keys** section
4. Click **Create API Key**
5. Copy the key (starts with `sk-`)

### Gemini API Key (Required)
1. Go to **https://aistudio.google.com**
2. Sign in with your Google account
3. Click **Get API Key** in the top right
4. Click **Create API Key**
5. Copy the key

> **Note:** Gemini has a generous free tier (1,500 requests/day). Kimi is pay-per-use but very affordable (~$0.005-0.02 per call).

---

## Step 2: Create GitHub Repo (2 minutes)

### Option A: Use the ZIP file (easiest)
1. Download `maxwell-deploy.zip` from this package
2. Go to **https://github.com/new**
3. Name it `maxwell` (or any name)
4. Make it **Private** (recommended — contains your product)
5. **Do NOT** initialize with README (we provide one)
6. Click **Create repository**
7. Under "...or push an existing repository", copy the commands:
```bash
git init
git add .
git commit -m "Initial Maxwell deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/maxwell.git
git push -u origin main
```

### Option B: I'll do it for you
Just tell me your GitHub username and I'll guide you through the web upload.

---

## Step 3: Connect Netlify (3 minutes)

1. Go to **https://app.netlify.com**
2. Sign up (use GitHub login for easiest setup)
3. Click **Add new site** → **Import an existing project**
4. Select **GitHub** as your Git provider
5. Find and select your `maxwell` repo
6. Netlify auto-detects the build settings from `netlify.toml`
7. Click **Deploy site**

**Build settings should auto-fill:**
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

If they don't auto-fill, enter them manually.

---

## Step 4: Add Environment Variables (1 minute)

In your Netlify dashboard:

1. Go to **Site configuration** (left sidebar)
2. Click **Environment variables**
3. Click **Add a variable** → **Add a single variable**
4. Add each key:

| Key | Value |
|-----|-------|
| `KIMI_API_KEY` | Your Kimi key from Step 1 |
| `GEMINI_API_KEY` | Your Gemini key from Step 1 |
| `MAXWELL_ENV` | `production` |

5. Click **Save**
6. Go to **Deploys** → click **Trigger deploy** → **Deploy site**

---

## Step 5: Verify Deployment (1 minute)

1. Wait for the build to complete (watch the deploy log)
2. Netlify gives you a URL: `https://maxwell-XXXX.netlify.app`
3. Open it in your browser
4. You should see the Maxwell dashboard with all 8 V2 capabilities

**Test the search:** Type "When does my car registration expire?" — it should find the demo vehicle document.

---

## What Happens Automatically

Netlify handles all of this for you:

| Task | Status |
|------|--------|
| **Build the React app** | ✅ `npm run build` runs automatically on every push |
| **Bundle Netlify Functions** | ✅ All 11 API endpoints auto-deployed |
| **HTTPS certificate** | ✅ Auto-provisioned, auto-renewed |
| **CDN distribution** | ✅ Global edge network |
| **SPA routing** | ✅ React Router works with `/*` → `index.html` fallback |
| **API routing** | ✅ `/api/*` → `/.netlify/functions/*` |
| **CORS headers** | ✅ Pre-configured in `netlify.toml` |

---

## File Structure (What You're Deploying)

```
maxwell/
├── netlify/
│   └── functions/           # 11 serverless API endpoints
│       ├── auth-session.ts
│       ├── briefing.ts
│       ├── document.ts
│       ├── documents.ts
│       ├── export.ts
│       ├── identity.ts
│       ├── parse.ts
│       ├── search.ts
│       ├── upload.ts
│       └── validate.ts
├── src/
│   ├── components/          # 25+ React components
│   ├── pages/               # 3 main pages (Home, Detail, Search)
│   ├── lib/                 # API client, types, utilities
│   ├── data/                # Demo documents
│   ├── App.tsx              # Router + layout
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── netlify.toml             # Deployment config
├── .env.example             # Environment variable template
├── package.json             # Dependencies
├── vite.config.ts           # Build config
├── tailwind.config.js       # Design system
├── index.html               # HTML entry point
└── DEPLOY.md                # This file
```

---

## Optional: Custom Domain

After deploy succeeds:

1. Netlify dashboard → **Domain management**
2. Click **Add custom domain**
3. Enter your domain (e.g., `maxwell.yourname.com`)
4. Follow DNS instructions (add CNAME record)
5. SSL certificate auto-provisioned in ~5 minutes

---

## Optional: Upgrade Later

| Feature | When to Upgrade | Cost |
|---------|----------------|------|
| **Netlify Pro** | >125k API calls/month or team collaboration | $19/seat |
| **Kimi API** | Heavy usage beyond free credits | Pay-per-use |
| **Gemini API** | >1,500 requests/day | $0.50/million tokens |
| **Turso DB** | >9GB storage needed | $29/month |
| **Cloudflare R2** | >10GB document storage | $0.015/GB/month |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails with "npm error ERESOLVE" | Already handled — `netlify.toml` has `--legacy-peer-deps` |
| Functions return 404 | Check `netlify.toml` redirects section is present |
| Blank page | Check browser console — likely API 404 (normal before backend connect) |
| Search doesn't work | Backend not connected yet — demo mode shows mock data |
| CORS errors | `netlify.toml` headers section handles this automatically |

---

## Need Help?

When you have your API keys, just paste them in chat and I'll:
1. Fill in the exact values
2. Verify the build succeeds
3. Run a smoke test to confirm everything works

**You're 3 keys and 5 clicks away from a live Maxwell.**
