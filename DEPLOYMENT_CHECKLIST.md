# Railway Deployment Checklist

## ✅ Pre-Deployment

- [x] Flask backend already deployed on Railway
- [x] Repository connected to Railway
- [x] Configuration files created (`railway.json`, `nixpacks.toml`)

## 📋 Next Steps

### 1. Add Next.js Frontend Service to Railway

**In Railway Dashboard:**
1. Click **"+ New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository
4. Configure:
   - **Service Name**: `propply-frontend`
   - **Root Directory**: `/` (root)
   - **Watch Paths**: `**` (exclude `python/**`)

### 2. Configure Environment Variables

**For Next.js Frontend Service:**

Copy these to Railway dashboard → Service → Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0
SUPABASE_SERVICE_ROLE_KEY=<GET_FROM_SUPABASE_DASHBOARD>

# NYC Open Data
NYC_APP_TOKEN=1qbkti8iywuiu2kiuddln3oa8

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA4gSJ9LDVqQ9AVxw3zVoHSQQVr_9W2V54

# Stripe (Get from Stripe Dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>

# App Config
NEXT_PUBLIC_APP_NAME=Propply AI
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_SUPPORTED_CITIES=NYC,Philadelphia
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Backend API (Reference your Flask service)
NEXT_PUBLIC_PYTHON_API_URL=https://${{web.RAILWAY_STATIC_URL}}
```

**For Flask Backend Service (Already configured):**
- ✅ API_KEY_ID
- ✅ API_KEY_SECRET
- ✅ FLASK_ENV
- ✅ GOOGLE_MAPS_API_KEY
- ✅ PORT
- ✅ WEBHOOK_URL

### 3. Update Flask Backend Settings

**In Railway Dashboard → Flask Service:**
1. Go to **Settings → Deploy**
2. Set **Root Directory**: `python`
3. Set **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
4. Set **Watch Paths**: `python/**`

### 4. Deploy

**Option A: Push to Git (Recommended)**
```bash
git add .
git commit -m "Add Railway configuration"
git push origin main
```
Railway will auto-deploy both services.

**Option B: Manual Deploy**
- Click **"Deploy"** button in Railway dashboard for each service

### 5. Post-Deployment Verification

**Test Flask Backend:**
```bash
# Get your Flask backend URL from Railway
curl https://YOUR-FLASK-SERVICE.railway.app/health
```

**Test Next.js Frontend:**
- Visit: `https://YOUR-NEXTJS-SERVICE.railway.app`
- Test authentication
- Test property search
- Test compliance report generation

### 6. Update External Services

**Stripe Webhooks:**
1. Go to Stripe Dashboard → Webhooks
2. Update webhook URL to: `https://YOUR-NEXTJS-SERVICE.railway.app/api/webhooks/stripe`

**Supabase (if needed):**
1. Update allowed redirect URLs
2. Add Railway domains to allowed origins

### 7. Domain Configuration (Optional)

**Add Custom Domain:**
1. Railway Dashboard → Service → Settings → Domains
2. Click **"+ Custom Domain"**
3. Add your domain (e.g., `app.propply.ai`)
4. Update DNS records as instructed

## 🔍 Troubleshooting

**Build Fails:**
- Check Railway logs
- Verify `package.json` and `requirements.txt`
- Ensure Node.js >= 18.0.0

**Runtime Errors:**
- Check environment variables
- Verify service URLs
- Check CORS settings in Flask

**Can't Connect Services:**
- Verify `NEXT_PUBLIC_PYTHON_API_URL` is set
- Check Flask backend is running
- Test backend health endpoint

## 📊 Monitoring

**Railway Dashboard:**
- Monitor deployments
- Check logs
- View metrics (CPU, memory, network)

**Set up alerts:**
- Deployment failures
- High resource usage
- Error rates

## 💰 Cost Estimate

**Starter Plan ($5/month):**
- $5 credit included
- Pay for usage beyond credit

**Typical Usage:**
- 2 services (Next.js + Flask)
- ~$10-20/month depending on traffic

## 🚀 Ready to Deploy?

1. Commit and push the configuration files
2. Add Next.js service in Railway dashboard
3. Configure environment variables
4. Test both services
5. Update webhooks and external integrations

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
