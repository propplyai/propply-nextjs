import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have a code in the URL (OAuth callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
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
          
          // Check for stored redirect info from OAuth flow
          const storedRedirect = localStorage.getItem('auth_redirect');
          console.log('[Auth Callback] Stored redirect data:', storedRedirect);
          
          if (storedRedirect) {
            try {
              const { redirectUrl, planId } = JSON.parse(storedRedirect);
              console.log('[Auth Callback] Parsed redirect:', { redirectUrl, planId });
              localStorage.removeItem('auth_redirect');
              
              if (planId && redirectUrl) {
                // Redirect with auto-checkout
                const finalUrl = `${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}autoCheckout=${planId}`;
                console.log('[Auth Callback] Redirecting to:', finalUrl);
                router.push(finalUrl);
                return;
              } else if (redirectUrl) {
                console.log('[Auth Callback] Redirecting to:', redirectUrl);
                router.push(redirectUrl);
                return;
              }
            } catch (e) {
              console.error('[Auth Callback] Error parsing stored redirect:', e);
            }
          } else {
            console.log('[Auth Callback] No stored redirect found, going to dashboard');
          }
          
          router.push('/dashboard');
        } else {
          // No code found, check if we already have a valid session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('[Auth Callback] Existing session found');
            
            // Check for stored redirect info
            const storedRedirect = localStorage.getItem('auth_redirect');
            if (storedRedirect) {
              try {
                const { redirectUrl, planId } = JSON.parse(storedRedirect);
                localStorage.removeItem('auth_redirect');
                
                if (planId && redirectUrl) {
                  router.push(`${redirectUrl}${redirectUrl.includes('?') ? '&' : '?'}autoCheckout=${planId}`);
                  return;
                } else if (redirectUrl) {
                  router.push(redirectUrl);
                  return;
                }
              } catch (e) {
                console.error('[Auth Callback] Error parsing stored redirect:', e);
              }
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
  }, [router]);

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
