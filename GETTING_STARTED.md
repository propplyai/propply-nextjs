# Getting Started with Propply Next.js

This guide will help you get your new Next.js multi-page application up and running.

## 📦 Step 1: Install Dependencies

Navigate to the project directory and install dependencies:

```bash
cd /Users/art3a/dev/propply-nextjs
npm install
```

## 🔑 Step 2: Set Up Environment Variables

1. Copy the environment file:
```bash
cp .env.example .env.local
```

2. Open `.env.local` and fill in your credentials from the old project:

```env
# Copy these from your old project's .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://vlnnvxlgzhtaorpixsay.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Add if you have them
NYC_APP_TOKEN=your_nyc_token_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

**To find your Supabase keys:**
- Go to your Supabase project dashboard
- Navigate to Settings → API
- Copy the "URL" and "anon public" key

## 🚀 Step 3: Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 🎯 Step 4: Test the Application

### Test Routes (Open in Browser):

1. **Landing Page**: `http://localhost:3000/`
2. **Login Page**: `http://localhost:3000/login`
3. **Dashboard**: `http://localhost:3000/dashboard` (requires login)
4. **Properties**: `http://localhost:3000/properties` (requires login)
5. **Add Property**: `http://localhost:3000/properties/add` (requires login)

### Test Authentication:

1. Go to `/login`
2. Try signing up with email/password or Google OAuth
3. You should be redirected to `/dashboard` after successful login
4. Each page has its own unique URL!

## 🗄️ Step 5: Database Setup (If Needed)

If you need to set up the database schema, run the SQL from your old project:

```bash
# Copy the setup SQL from your old project
cat ../Propply_MVP/setup_supabase_tables.sql
```

Then execute it in your Supabase SQL Editor.

## 🎨 Step 6: Customize Design

The app comes with two design themes ready to use:

### Modern Dark Mode (Current Default)
- Sleek gradients
- Corporate blue & emerald colors
- Glassmorphism effects

### Neo-Brutalism (Optional)
To switch to neo-brutalism style, replace classes in components:
- `card` → `card-brutal`
- `btn-primary` → `btn-brutal`
- `input-modern` → `input-brutal`

## 📱 Key Features Implemented

✅ **Multi-Page Architecture**
- Each page has its own URL
- No caching issues
- Server-side rendering

✅ **Pages Created:**
- `/` - Landing page
- `/login` - Authentication
- `/dashboard` - Main dashboard
- `/properties` - Property list
- `/properties/add` - Add new property
- `/properties/[id]` - Property details

✅ **Modern Design:**
- Smooth page transitions
- Responsive layout
- Beautiful UI components
- Dark mode optimized

## 🔧 Next Steps

### Add More Pages

To add a new page, create a file in the `pages/` directory:

```jsx
// pages/reports.js
import Layout from '@/components/Layout';

export default function ReportsPage() {
  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="container-modern py-8">
        <h1 className="text-4xl font-bold text-white">Reports</h1>
      </div>
    </Layout>
  );
}
```

The file will automatically be available at `/reports`!

### Connect NYC Data API

Create API routes in `pages/api/` to integrate your NYC data services:

```javascript
// pages/api/nyc-data.js
export default async function handler(req, res) {
  // Your NYC API logic here
  res.status(200).json({ data: [] });
}
```

### Add Marketplace Page

Create `/pages/marketplace.js` to show vendors

### Add Compliance Page

Create `/pages/compliance/[propertyId].js` for compliance reports

## 🚀 Deploy to Production

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy!

```bash
npm install -g vercel
vercel
```

### Option 2: Other Platforms

Build the app:
```bash
npm run build
npm start
```

## 📊 Comparing to Old React SPA

| Feature | Old (React SPA) | New (Next.js) |
|---------|----------------|---------------|
| Routing | Client-side | Server-side |
| Page URLs | Single URL | Unique URLs |
| Caching | Issues | No issues |
| SEO | Poor | Excellent |
| Performance | Slower | Faster |
| Design | Good | Outstanding |

## 🎯 Migration Checklist

- [x] Project structure created
- [x] Landing page
- [x] Login/Auth page
- [x] Dashboard
- [x] Properties list
- [x] Add property form
- [x] Property details
- [ ] Compliance reports (TODO)
- [ ] Marketplace (TODO)
- [ ] Analytics (TODO)
- [ ] Settings (TODO)
- [ ] API routes (TODO)

## 💡 Tips

1. **Each page is independent** - No shared state unless you use Context
2. **Use Link component** - For navigation between pages
3. **API routes** - Create backend endpoints in `pages/api/`
4. **Server-side data** - Use `getServerSideProps` for SSR
5. **Static pages** - Use `getStaticProps` for static generation

## 🆘 Troubleshooting

### Port already in use?
```bash
lsof -ti:3000 | xargs kill
npm run dev
```

### Dependencies not installing?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection issues?
- Check your .env.local file
- Verify URLs have no trailing slashes
- Ensure anon key is correct

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**You're all set!** 🎉 Start building your multi-page application with outstanding modern design!
