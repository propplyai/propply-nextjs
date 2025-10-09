import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Only run when router is ready to avoid running with stale query params
    if (!router.isReady) return;
    
    const handleCallback = async () => {
      try {
        // Check if we have a code in the URL (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        console.log('[Auth Callback] Full URL:', window.location.href);
        console.log('[Auth Callback] Search params:', window.location.search);
        console.log('[Auth Callback] Hash params:', window.location.hash);

        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, error_description);
          router.push(`/login?error=${encodeURIComponent(error_description || error)}`);
          return;
        }

        // If we have a code, the session should be automatically established
        // by Supabase's detectSessionInUrl option in the client config
        if (code) {
          console.log('[Auth Callback] Code detected, waiting for session...');
          
          // Wait a bit for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify the session was established
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            console.error('[Auth Callback] Failed to establish session:', sessionError);
            router.push('/login?error=session_failed');
            return;
          }
          
          console.log('[Auth Callback] Session established successfully');
          
          // Check for redirect info from URL params
          const redirectUrl = searchParams.get('redirect');
          const planId = searchParams.get('plan');
          console.log('[Auth Callback] URL params:', { redirectUrl, planId });
          
          if (planId && redirectUrl) {
            // Redirect with auto-checkout
            // Handle hash fragments correctly (e.g., /#pricing -> /?autoCheckout=planId#pricing)
            let finalUrl;
            if (redirectUrl.includes('#')) {
              const [path, hash] = redirectUrl.split('#');
              const separator = path.includes('?') ? '&' : '?';
              finalUrl = `${path}${separator}autoCheckout=${planId}#${hash}`;
            } else {
              const separator = redirectUrl.includes('?') ? '&' : '?';
              finalUrl = `${redirectUrl}${separator}autoCheckout=${planId}`;
            }
            console.log('[Auth Callback] Redirecting to:', finalUrl);
            router.push(finalUrl);
            return;
          } else if (redirectUrl) {
            console.log('[Auth Callback] Redirecting to:', redirectUrl);
            router.push(redirectUrl);
            return;
          }
          
          console.log('[Auth Callback] No redirect params, going to dashboard');
          router.push('/dashboard');
        } else {
          // No code found, check if we already have a valid session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('[Auth Callback] Existing session found');
            
            // Check for redirect info from URL params
            const redirectUrl = searchParams.get('redirect');
            const planId = searchParams.get('plan');
            console.log('[Auth Callback] URL params:', { redirectUrl, planId });
            
            if (planId && redirectUrl) {
              // Handle hash fragments correctly (e.g., /#pricing -> /?autoCheckout=planId#pricing)
              let finalUrl;
              if (redirectUrl.includes('#')) {
                const [path, hash] = redirectUrl.split('#');
                const separator = path.includes('?') ? '&' : '?';
                finalUrl = `${path}${separator}autoCheckout=${planId}#${hash}`;
              } else {
                const separator = redirectUrl.includes('?') ? '&' : '?';
                finalUrl = `${redirectUrl}${separator}autoCheckout=${planId}`;
              }
              router.push(finalUrl);
              return;
            } else if (redirectUrl) {
              router.push(redirectUrl);
              return;
            }
            
            router.push('/dashboard');
          } else {
            console.log('[Auth Callback] No session found, redirecting to login');
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('[Auth Callback] Unexpected error:', err);
        router.push('/login?error=unexpected');
      }
    };

    handleCallback();
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-corporate-500 to-corporate-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-enterprise animate-glow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        <p className="text-slate-400">Completing sign in...</p>
      </div>
    </div>
  );
}
