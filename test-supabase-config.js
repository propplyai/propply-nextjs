// Paste this in browser console to check Supabase configuration
console.log('=== Supabase Configuration Test ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || window._env_?.NEXT_PUBLIC_SUPABASE_URL || 'NOT FOUND');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || window._env_?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT FOUND');
console.log('\nSupabase client info:');
console.log('Client exists:', typeof supabase !== 'undefined');
if (typeof supabase !== 'undefined') {
  console.log('Client auth:', !!supabase.auth);
  console.log('Client from:', !!supabase.from);
}
