import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Exchange code for session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/login?error=auth_failed');
        } else {
          // Successful authentication, redirect to dashboard
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
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
