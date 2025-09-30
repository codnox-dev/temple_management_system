import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

const FuturisticTempleLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const { loginWithGoogle } = useAuth() as any;
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Load Google Identity Services script
    const scriptId = 'google-identity-services';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      script.onload = () => initGoogle();
      document.body.appendChild(script);
    } else {
      initGoogle();
    }
    function initGoogle() {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      const w: any = window as any;
      if (!clientId) {
        setSetupError('Google client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID.');
        return;
      }
      if (!w.google) {
        setSetupError('Google services failed to load. Please refresh the page.');
        return;
      }
      const google = w.google;
      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          setIsLoading(true);
          try {
            const idToken = response.credential;
            const ok = await loginWithGoogle(idToken);
            if (ok) {
              toast.success('Login successful! Redirecting...');
              navigate('/admin');
            } else {
              toast.error('Login failed');
            }
          } catch (e: any) {
            toast.error(e?.message || 'Login failed');
          } finally {
            setIsLoading(false);
          }
        },
        auto_select: false,
        ux_mode: 'popup',
      });
      setGisReady(true);
      if (googleBtnRef.current) {
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
          logo_alignment: 'left'
        });
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-900 text-white p-4" style={{
      backgroundImage: `url('https://www.transparenttextures.com/patterns/az-subtle.png'), linear-gradient(to right bottom, #1a202c, #2d3748, #4a5568)`,
      backgroundAttachment: 'fixed',
    }}>
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      
      <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-sm border-purple-500/30 shadow-2xl shadow-purple-500/10 z-10">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
                <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Sanctum Access
          </CardTitle>
          <CardDescription className="text-gray-400">
            Sign in with your Google-administered account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center text-gray-400 text-sm">
              Use your Google account that’s linked to your admin profile to enter the sanctum.
            </div>
            {setupError && (
              <div className="text-center text-red-400 text-sm">
                {setupError}
              </div>
            )}
            <div className="flex justify-center">
              <div ref={googleBtnRef} className="min-h-[44px]" />
            </div>
            {!gisReady && !setupError && (
              <div className="text-center text-xs text-gray-500">Loading Google Sign-In…</div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center text-sm text-gray-300">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating with Google...
              </div>
            )}
            <div className="text-center text-xs text-gray-500">
              Having trouble? Contact your administrator to ensure your Google email is linked.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuturisticTempleLogin;
