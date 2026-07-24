'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { authService } from '@/services/auth';
import api from '@/lib/api';

export function TwoFactorSettings() {
  const [isTotpEnabled, setIsTotpEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const [password, setPassword] = useState('');
  const [isDisabling, setIsDisabling] = useState(false);
  
  const [view, setView] = useState<'status' | 'setup' | 'disable'>('status');

  async function fetchStatus() {
    try {
      setIsLoading(true);
      const profile = await authService.getProfile();
      setIsTotpEnabled(!!profile.is_totp_enabled);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
      toast.error('Failed to load security settings.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await api.post('/auth/totp/generate/');
      setProvisioningUri(res.data.provisioning_uri);
      setSecret(res.data.secret);
      setView('setup');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initiate 2FA setup.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      toast.error('Please enter a valid 6-digit code.');
      return;
    }

    try {
      setIsVerifying(true);
      await api.post('/auth/totp/verify/', { code });
      toast.success('Two-Factor Authentication enabled successfully!');
      setIsTotpEnabled(true);
      setView('status');
      setCode('');
      setProvisioningUri(null);
      setSecret(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid 2FA code.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Password is required to disable 2FA.');
      return;
    }

    try {
      setIsDisabling(true);
      await api.post('/auth/totp/disable/', { password });
      toast.success('Two-Factor Authentication disabled.');
      setIsTotpEnabled(false);
      setView('status');
      setPassword('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to disable 2FA.');
    } finally {
      setIsDisabling(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Two-Factor Authentication (2FA)
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account using an authenticator app.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {view === 'status' && (
          <div className="flex items-center justify-between p-4 bg-slate-50 border rounded-lg">
            <div className="flex items-center gap-3">
              {isTotpEnabled ? (
                <ShieldCheck className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldAlert className="h-8 w-8 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-slate-900">
                  {isTotpEnabled ? '2FA is Enabled' : '2FA is Disabled'}
                </p>
                <p className="text-sm text-slate-500">
                  {isTotpEnabled
                    ? 'Your account is protected.'
                    : 'We strongly recommend enabling 2FA.'}
                </p>
              </div>
            </div>
            
            <div>
              {isTotpEnabled ? (
                <button
                  onClick={() => setView('disable')}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-2"
                >
                  {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enable 2FA
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'setup' && provisioningUri && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Step 1: Scan QR Code</h3>
              <p className="text-sm text-blue-700 mb-4">
                Open your authenticator app (e.g., Google Authenticator, Authy) and scan this QR code.
              </p>
              <div className="flex justify-center p-4 bg-white rounded-lg border border-blue-100 max-w-fit mx-auto">
                <QRCodeSVG value={provisioningUri} size={200} />
              </div>
              <p className="text-xs text-center text-blue-600 mt-3 font-mono">
                Secret: {secret}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Step 2: Enter 6-digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 tracking-widest text-center text-lg"
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isVerifying || code.length !== 6}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isVerifying && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verify and Enable
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView('status');
                    setProvisioningUri(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'disable' && (
          <form onSubmit={handleDisable} className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800">
                Disabling 2FA will make your account less secure. Please enter your password to confirm.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isDisabling || !password}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 flex items-center gap-2"
              >
                {isDisabling && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Disable
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('status');
                  setPassword('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
