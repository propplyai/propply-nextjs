/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['vlnnvxlgzhtaorpixsay.supabase.co'],
  },
  // Enable server-side rendering for all pages
  pageExtensions: ['js', 'jsx'],
  // Optimize for production
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
