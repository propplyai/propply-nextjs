import { createClient } from '@supabase/supabase-js';

// Browser client (for client-side operations)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'Accept-Profile': 'public',
        'Content-Profile': 'public'
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Setup auth state listener to handle session changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Supabase] Auth state changed:', event, session ? 'session exists' : 'no session');
    
    // Handle different auth events
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Supabase] Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('[Supabase] User signed out');
      // Clear any cached data
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    } else if (event === 'SIGNED_IN') {
      console.log('[Supabase] User signed in');
    } else if (event === 'USER_UPDATED') {
      console.log('[Supabase] User data updated');
    }
    
    // Handle auth errors (including PKCE token refresh failures)
    if (!session && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION') {
      console.warn('[Supabase] Session lost unexpectedly, event:', event);
      // Don't redirect on pages that don't require auth
      const publicPages = ['/', '/login', '/signup', '/forgot-password'];
      if (!publicPages.includes(window.location.pathname)) {
        console.log('[Supabase] Redirecting to login due to lost session');
        setTimeout(() => {
          window.location.href = '/login?error=session_expired';
        }, 100);
      }
    }
  });
}

// Server client (for API routes and SSR)
export const createServerSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

// Auth helpers
export const authHelpers = {
  // Sign up with email
  async signUp(email, password, metadata = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Sign in with email
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with Google OAuth
  async signInWithGoogle(redirectUrl = null, planId = null) {
    // Build the redirect URL with query params
    let callbackUrl = `${window.location.origin}/auth/callback`;
    if (redirectUrl || planId) {
      const params = new URLSearchParams();
      if (redirectUrl) params.append('redirect', redirectUrl);
      if (planId) params.append('plan', planId);
      callbackUrl += `?${params.toString()}`;
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user with session validation
  async getUser() {
    try {
      // First check if we have a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[Auth] Session error:', sessionError);
        // Clear potentially corrupted session
        await supabase.auth.signOut();
        return { user: null, error: sessionError };
      }
      
      if (!session) {
        console.log('[Auth] No active session found');
        return { user: null, error: null };
      }
      
      // Now get the user details
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[Auth] User fetch error:', error);
        // If user fetch fails but we had a session, clear it
        await supabase.auth.signOut();
        return { user: null, error };
      }
      
      return { user, error: null };
    } catch (error) {
      console.error('[Auth] Unexpected error in getUser:', error);
      return { user: null, error };
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },
};

export default supabase;
