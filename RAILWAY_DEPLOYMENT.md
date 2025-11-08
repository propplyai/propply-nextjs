# Railway Deployment Guide

## Architecture Overview

Your application consists of **TWO services** that need to be deployed:

1. **Next.js Frontend** (Main App) - Root directory
2. **Flask Backend API** (Python Service) - `/python` directory

## Current Setup

✅ Flask Backend is already deployed (shown in your screenshot)
- Service name: `web`
- Has environment variables configured

## Deployment Steps

### Step 1: Add Next.js Frontend Service

1. Go to your Railway project dashboard
2. Click **"+ New Service"**
3. Select **"GitHub Repo"**
4. Choose your `propply-nextjs` repository
5. Configure the service:
   - **Name**: `propply-frontend` (or `nextjs-app`)
   - **Root Directory**: `/` (leave empty or set to root)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Step 2: Configure Flask Backend Service

Your existing Flask service should be configured with:
- **Root Directory**: `/python`
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### Step 3: Environment Variables

#### Flask Backend (Already configured ✅)
```
API_KEY_ID=<your_value>
API_KEY_SECRET=<your_value>
FLASK_ENV=production
GOOGLE_MAPS_API_KEY=<your_value>
PORT=<auto_assigned_by_railway>
WEBHOOK_URL=<your_value>
```

#### Next.js Frontend (Need to add)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsbm52eGxnemh0YW9ycGl4c2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMTE1NjgsImV4cCI6MjA3NDc4NzU2OH0.yGC82Qop5M_CSA48nXpwC15HxrqqW7CugFIb-17nxG0
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>

# NYC Open Data
NYC_APP_TOKEN=1qbkti8iywuiu2kiuddln3oa8

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyA4gSJ9LDVqQ9AVxw3zVoHSQQVr_9W2V54

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your_stripe_publishable_key>
STRIPE_SECRET_KEY=<your_stripe_secret_key>
STRIPE_WEBHOOK_SECRET=<your_stripe_webhook_secret>

# App Configuration
NEXT_PUBLIC_APP_NAME=Propply AI
NEXT_PUBLIC_APP_VERSION=2.0.0
NEXT_PUBLIC_SUPPORTED_CITIES=NYC,Philadelphia
NODE_ENV=production
GENERATE_SOURCEMAP=false

# Backend API URL (IMPORTANT!)
NEXT_PUBLIC_API_URL=${{web.RAILWAY_PUBLIC_DOMAIN}}
# Or if you want to reference by service name:
# NEXT_PUBLIC_API_URL=https://${{web.RAILWAY_STATIC_URL}}
```

### Step 4: Connect Frontend to Backend

After both services are deployed, you'll need to update the frontend to use the Flask backend URL:

1. Get the Flask backend URL from Railway (e.g., `https://web-production-xxxx.up.railway.app`)
2. Add it as an environment variable in the Next.js service:
   ```
   NEXT_PUBLIC_PYTHON_API_URL=https://your-flask-backend.railway.app
   ```

### Step 5: Update CORS in Flask Backend

Make sure your Flask backend allows requests from your Next.js frontend domain.

The current setup has `CORS(app)` which allows all origins. For production, you may want to restrict it:

```python
CORS(app, origins=[
    "https://your-nextjs-app.railway.app",
    "http://localhost:3000"  # for local development
])
```

## Railway Service Configuration

### Service 1: Flask Backend (Python)
- **Root Directory**: `python`
- **Watch Paths**: `python/**`
- **Build Command**: Auto-detected
- **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### Service 2: Next.js Frontend
- **Root Directory**: `/` (root)
- **Watch Paths**: `**` (exclude `python/**`)
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## Auto-Deploy Configuration

Railway will automatically deploy when you push to your connected Git branch.

To deploy specific services only when their files change:
1. Go to Service Settings → Deployments
2. Configure **Watch Paths**:
   - Flask: `python/**`
   - Next.js: Exclude `python/**`

## Testing the Deployment

### 1. Test Flask Backend
```bash
curl https://your-flask-backend.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Property Compliance API",
  "supported_cities": ["NYC", "Philadelphia"]
}
```

### 2. Test Next.js Frontend
Visit: `https://your-nextjs-frontend.railway.app`

### 3. Test Integration
The Next.js app should be able to call the Flask API for property compliance reports.

## Troubleshooting

### Build Failures
- Check Railway build logs
- Ensure all dependencies are in `package.json` and `requirements.txt`
- Verify Node.js version (>=18.0.0)

### Runtime Errors
- Check Railway deployment logs
- Verify all environment variables are set
- Check CORS configuration

### Connection Issues
- Ensure `NEXT_PUBLIC_PYTHON_API_URL` is set correctly
- Verify Flask backend is running and accessible
- Check network policies and firewall rules

## Migration from Render

Since you're migrating from Render:
1. Keep Render services running until Railway is fully tested
2. Update DNS/domain settings after verification
3. Update webhook URLs (Stripe, etc.) to point to Railway
4. Test all integrations thoroughly

## Cost Optimization

Railway pricing is based on:
- **Compute**: $0.000231/GB-hour
- **Network**: $0.10/GB

Tips:
- Use appropriate instance sizes
- Enable auto-sleep for development environments
- Monitor usage in Railway dashboard
