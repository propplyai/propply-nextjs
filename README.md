# Propply AI - Next.js Multi-Page Web Application

Modern, multi-page web application for property compliance management built with Next.js, featuring server-side rendering, individual URLs for each page, and outstanding modern design.

## 🚀 Features

- ✅ **Multi-Page Architecture** - Each feature has its own URL (no SPA caching issues)
- ✅ **Server-Side Rendering** - Fast page loads with SSR
- ✅ **Modern Design** - Beautiful UI with Tailwind CSS, glassmorphism, and neo-brutalism styles
- ✅ **Smooth Page Transitions** - Animated transitions between pages using Framer Motion
- ✅ **Supabase Integration** - Authentication and database
- ✅ **Property Management** - NYC and Philadelphia compliance tracking
- ✅ **Responsive Design** - Works perfectly on all devices

## 📋 Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth + Email)
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Update the following variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
propply-nextjs/
├── pages/                    # Each file = one URL route
│   ├── index.js             # / (Landing page)
│   ├── login.js             # /login
│   ├── dashboard.js         # /dashboard
│   ├── properties/
│   │   ├── index.js        # /properties (List all)
│   │   ├── add.js          # /properties/add
│   │   └── [id].js         # /properties/123 (Dynamic)
│   ├── compliance/
│   │   └── [propertyId].js # /compliance/123
│   ├── marketplace.js       # /marketplace
│   ├── analytics.js         # /analytics
│   ├── settings.js          # /settings
│   ├── auth/
│   │   └── callback.js     # OAuth callback
│   ├── api/                # API routes (backend)
│   │   ├── auth/
│   │   ├── properties/
│   │   └── compliance/
│   ├── _app.js             # App wrapper with transitions
│   └── _document.js        # HTML document structure
├── components/              # Reusable UI components
│   ├── Layout.js           # Main layout with navigation
│   └── ...
├── lib/                    # Utilities
│   ├── supabase.js         # Supabase client
│   └── utils.js            # Helper functions
├── styles/
│   └── globals.css         # Global styles with Tailwind
├── public/                 # Static assets
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind configuration
└── package.json
```

## 🎨 Design System

### Color Palette

- **Corporate Blue**: Primary brand color
- **Emerald**: Success, positive metrics
- **Gold**: Warnings, important info
- **Ruby**: Errors, critical issues
- **Navy**: Dark backgrounds
- **Brutal Colors**: Neo-brutalism accents (optional)

### Components

- **Buttons**: `btn-primary`, `btn-secondary`, `btn-outline`, `btn-brutal`
- **Cards**: `card`, `card-brutal`, `glass-card`
- **Inputs**: `input-modern`, `input-brutal`
- **Navigation**: `nav-link`, `nav-link-active`

### Typography

- **Sans-serif**: Inter, Outfit, Plus Jakarta Sans
- **Monospace**: JetBrains Mono, Space Mono
- **Display**: Space Grotesk, Outfit

## 🗺️ Page Routes

| URL | Description |
|-----|-------------|
| `/` | Landing page (public) |
| `/login` | Login/Signup page |
| `/dashboard` | Main dashboard (requires auth) |
| `/properties` | Property list |
| `/properties/add` | Add new property |
| `/properties/[id]` | Property details |
| `/compliance` | Compliance overview |
| `/compliance/[propertyId]` | Property compliance report |
| `/marketplace` | Vendor marketplace |
| `/analytics` | Analytics dashboard |
| `/settings` | User settings |
| `/profile` | User profile |

## 🔐 Authentication Flow

1. User visits `/login`
2. Signs in with Google OAuth or Email/Password
3. OAuth redirects to `/auth/callback`
4. Callback exchanges code for session
5. Redirects to `/dashboard`

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Environment Variables for Production

Add these to your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (optional)

## 🎯 Key Differences from React SPA

### Before (React SPA)
- ❌ Single HTML file, client-side routing
- ❌ Large JavaScript bundle
- ❌ Cache invalidation issues
- ❌ Slow initial page load

### After (Next.js Pages Router)
- ✅ Multiple HTML pages, each with unique URL
- ✅ Server-side rendering
- ✅ No cache issues (fresh page loads)
- ✅ Fast initial page load
- ✅ Better SEO
- ✅ Smooth page transitions

## 🛠️ Development Tips

### Adding a New Page

1. Create file in `pages/` directory
2. Export a React component
3. Use `Layout` component for consistent UI
4. Add navigation link if needed

Example:
```jsx
// pages/reports.js
import Layout from '@/components/Layout';

export default function ReportsPage() {
  return (
    <Layout>
      <div className="container-modern py-8">
        <h1 className="text-4xl font-bold">Reports</h1>
      </div>
    </Layout>
  );
}
```

### Adding an API Route

1. Create file in `pages/api/` directory
2. Export async handler function

Example:
```javascript
// pages/api/properties/list.js
export default async function handler(req, res) {
  // Your API logic here
  res.status(200).json({ data: [] });
}
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🤝 Support

For questions or issues, please check the documentation or contact the development team.

---

**Propply AI** - Modern Property Compliance Management 🏢✨
