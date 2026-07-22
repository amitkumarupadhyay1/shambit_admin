'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { signIn } from 'next-auth/react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [totpRequired, setTotpRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    turnstile_token: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!totpRequired) {
        if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !formData.turnstile_token) {
          toast.error('Please complete the CAPTCHA verification.');
          setIsLoading(false);
          return;
        }

        const res = await axios.post('/api/auth/pre-login', formData, {
          validateStatus: () => true
        });

        if (res.status === 200) {
          if (res.data.totp_required) {
            setTempToken(res.data.temp_token || '');
            setTotpRequired(true);
          } else if (res.data.access) {
            // No TOTP required
            const result = await signIn("credentials", {
              redirect: false,
              type: 'tokens',
              ...res.data.user,
              access: res.data.access,
              refresh: res.data.refresh,
            }) as { error?: string } | undefined;

            if (result?.error) {
              toast.error(result.error);
            } else {
              toast.success('Login successful!');
              router.push('/dashboard');
              router.refresh();
            }
          }
        } else {
          toast.error(res.data.error || res.data.detail || 'Login failed');
        }
      } else {
        // Submit TOTP code
        const res = await signIn("credentials", {
          redirect: false,
          type: 'totp',
          temp_token: tempToken,
          totp_code: totpCode,
        }) as { error?: string } | undefined;

        if (res?.error) {
          toast.error(res.error === "TOTP_FAILED" ? "Invalid authenticator code" : res.error);
        } else {
          toast.success('Login successful!');
          router.push('/dashboard');
          router.refresh();
        }
      }
    } catch (error: unknown) {
      console.error('Login error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ShamBit Admin
          </h1>
          <p className="text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!totpRequired ? (
                <>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                    />
                  </div>

                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div className="flex justify-center my-4">
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                        onSuccess={(token) => setFormData({ ...formData, turnstile_token: token })}
                        onError={() => toast.error('CAPTCHA verification failed to load. Please disable your adblocker or tracking protection.')}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label htmlFor="totpCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Authenticator Code (2FA)
                  </label>
                  <Input
                    id="totpCode"
                    type="text"
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="text-center text-xl tracking-[0.5em]"
                  />
                  <button 
                    type="button" 
                    onClick={() => { setTotpRequired(false); setTotpCode(''); }}
                    className="mt-4 text-sm text-blue-600 hover:underline block text-center w-full"
                  >
                    Back to login
                  </button>
                </div>
              )}

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>


            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                <strong>Admin Access Only</strong><br />
                This dashboard is restricted to authorized administrators.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          © 2024 ShamBit. All rights reserved.
        </p>
      </div>
    </div>
  );
}
