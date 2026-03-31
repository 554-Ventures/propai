# PropAI Deployment Guide

**Target:** Railway (API + DB) + Cloudflare Pages (Frontend) + GitHub Actions

---

## ✅ Phase 1: Push to GitHub

**From your terminal:**
```bash
cd /Users/anhbien/.openclaw/workspace/propai
git push -u origin main
```

---

## 🚂 Phase 2: Railway Setup

### Step 1: Create Railway Account & Project
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Click **"Provision PostgreSQL"**
5. ✅ PostgreSQL database created!

### Step 2: Get Database URL
1. Click on the **PostgreSQL** service
2. Go to **"Variables"** tab
3. Copy the **`DATABASE_URL`** value (starts with `postgresql://`)
4. Save it - you'll need it for the API

### Step 3: Deploy API Service
1. In the same Railway project, click **"New Service"**
2. Select **"GitHub Repo"**
3. Choose **`554Ventures/propai`**
4. Railway will auto-detect the repo

### Step 4: Configure API Service
1. Click on the newly created service
2. Go to **"Settings"**
3. Set:
   - **Root Directory:** `apps/api`
   - **Build Command:** `pnpm install`
   - **Start Command:** `pnpm start`
   - **Watch Paths:** `apps/api/**`

### Step 5: Add Environment Variables
Go to **"Variables"** tab and add:

```
DATABASE_URL=postgresql://... (from PostgreSQL service - use the "reference" feature)
JWT_SECRET=<generate-random-32-char-string>
OPENAI_API_KEY=<your-openai-key>
OPENAI_MODEL=gpt-4o-mini
PORT=3000
```

**For CORS_ORIGIN:** Leave blank for now, we'll add it after Cloudflare setup.

**To reference DATABASE_URL:**
- Click "+ New Variable"
- Select "Reference" → Choose PostgreSQL service → DATABASE_URL
- This auto-updates if DB credentials change

**To generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

### Step 6: Deploy!
1. Railway will auto-deploy after you add variables
2. Wait for build to complete (~2-3 minutes)
3. Check logs for errors

### Step 7: Run Database Migrations
1. In Railway dashboard → API service
2. Click **"..."** → **"View Logs"**
3. Once deployed, go to **"Settings"** → **"Service"**
4. Scroll to **"One-Off Commands"**
5. Run:
   ```bash
   npx prisma migrate deploy
   ```
6. Then run:
   ```bash
   npx prisma db seed
   ```

### Step 8: Get API URL
1. Go to API service → **"Settings"**
2. Click **"Generate Domain"** under **"Networking"**
3. Copy the URL (e.g., `https://propai-api-production.up.railway.app`)
4. Save it - you'll need it for Cloudflare Pages

### Step 9: Test API
```bash
curl https://your-api-url.railway.app/health
# Should return: {"status":"ok"}
```

---

## ☁️ Phase 3: Cloudflare Pages Setup

### Step 1: Connect GitHub
1. Go to https://dash.cloudflare.com
2. Select your account → **"Workers & Pages"**
3. Click **"Create Application"** → **"Pages"**
4. Click **"Connect to Git"**
5. Select **`554Ventures/propai`**

### Step 2: Configure Build Settings
1. **Project name:** `propai`
2. **Production branch:** `main`
3. **Framework preset:** Next.js
4. **Build command:** `cd apps/web && pnpm install && pnpm build`
5. **Build output directory:** `apps/web/.next`
6. **Root directory:** `/` (leave empty)

### Step 3: Add Environment Variables
Click **"Add environment variables"**:

```
NEXT_PUBLIC_API_URL=https://your-railway-api.up.railway.app
NODE_VERSION=18
```

### Step 4: Deploy!
1. Click **"Save and Deploy"**
2. Wait for build (~3-5 minutes)
3. Once complete, you'll get a URL: `https://propai.pages.dev`

### Step 5: Update CORS in Railway
1. Go back to Railway → API service → **"Variables"**
2. Add/update:
   ```
   CORS_ORIGIN=https://propai.pages.dev
   ```
3. Railway will auto-redeploy

### Step 6: Test Frontend
1. Visit `https://propai.pages.dev`
2. Try logging in with:
   - Email: `demo@propai.com`
   - Password: `Password123!`
3. Test the AI chatbot
4. Create a property, add units, assign tenants

---

## 🤖 Phase 4: GitHub Actions CI/CD

### Step 1: Create Workflow Files

We'll create 2 workflows:
1. **API Deploy** (on push to `main`, changes in `apps/api/`)
2. **Frontend Deploy** (on push to `main`, changes in `apps/web/`)

Railway auto-deploys from GitHub by default, so we just need Cloudflare Pages webhook.

### Step 2: Get Cloudflare Deploy Hook
1. In Cloudflare Pages → `propai` project
2. Go to **"Settings"** → **"Builds & deployments"**
3. Scroll to **"Build hooks"**
4. Click **"Add build hook"**
   - Name: `GitHub Actions`
   - Branch: `main`
5. Copy the webhook URL

### Step 3: Add GitHub Secret
1. Go to GitHub → `554Ventures/propai`
2. **"Settings"** → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**
   - Name: `CLOUDFLARE_DEPLOY_HOOK`
   - Value: (paste webhook URL)

### Step 4: Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy PropAI

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-frontend:
    name: Deploy Frontend (Cloudflare Pages)
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cloudflare Pages Deploy
        if: contains(github.event.head_commit.modified, 'apps/web/') || github.event_name == 'workflow_dispatch'
        run: |
          curl -X POST "${{ secrets.CLOUDFLARE_DEPLOY_HOOK }}"
  
  # Railway auto-deploys, but you can add a notification job if needed
  notify:
    name: Deployment Notification
    runs-on: ubuntu-latest
    needs: [deploy-frontend]
    steps:
      - name: Notify
        run: echo "✅ PropAI deployed successfully!"
```

### Step 5: Commit and Push
```bash
cd /Users/anhbien/.openclaw/workspace/propai
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions deployment workflow"
git push
```

---

## ✅ Production Checklist

- [ ] Railway PostgreSQL provisioned
- [ ] Railway API deployed and healthy (`/health` returns OK)
- [ ] Database migrations run successfully
- [ ] Demo data seeded
- [ ] Cloudflare Pages deployed
- [ ] Frontend connects to API (check browser console for errors)
- [ ] Login works with demo credentials
- [ ] AI chatbot responds
- [ ] Can create properties, units, tenants
- [ ] Can create leases
- [ ] CORS configured correctly
- [ ] GitHub Actions workflow added
- [ ] Custom domain configured (optional)

---

## 🐛 Troubleshooting

### API Issues
**"Database connection failed"**
- Check `DATABASE_URL` in Railway variables
- Ensure PostgreSQL service is running
- Check API logs for errors

**"CORS error" in browser console**
- Verify `CORS_ORIGIN` matches Cloudflare Pages URL exactly
- Include `https://` prefix
- No trailing slash

**"Health check fails"**
- Check Railway logs for startup errors
- Verify `PORT` is set to `3000`
- Ensure migrations ran successfully

### Frontend Issues
**"Failed to fetch" errors**
- Check `NEXT_PUBLIC_API_URL` in Cloudflare Pages env vars
- Verify API is deployed and healthy
- Check browser Network tab for blocked requests

**"Authentication not persisting"**
- Check that auth is using localStorage correctly
- Verify JWT_SECRET is set in API
- Check for console errors

**Build fails**
- Verify `NODE_VERSION=18` in Cloudflare env
- Check build logs for specific errors
- Ensure all dependencies are in package.json

---

## 🎉 You're Live!

Your PropAI MVP is now deployed:
- **API:** `https://your-app.railway.app`
- **Frontend:** `https://propai.pages.dev`
- **Repo:** `https://github.com/554Ventures/propai`

**Next Steps:**
1. Share with beta testers
2. Monitor Railway logs for errors
3. Set up custom domain (optional)
4. Add monitoring/alerting
5. Plan next features!

---

Need help? Check:
- Railway docs: https://docs.railway.app
- Cloudflare Pages docs: https://developers.cloudflare.com/pages
- PropAI docs: See `docs/` folder in repo
