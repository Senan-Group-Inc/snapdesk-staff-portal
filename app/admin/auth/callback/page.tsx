'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import staffAuthService from '@/services/staff-auth.service';
import { useStaffAuthStore } from '@/store/staff-auth-store';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';

const OAUTH_PROVIDER_KEY = 'staff_oauth_provider';

export default function StaffAuthCallbackPage() {
  const router = useRouter();
  const { setUser } = useStaffAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const code = qs.get('code');
    const state = qs.get('state');

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing code or state from Microsoft sign-in.');
      return;
    }

    const provider =
      typeof window !== 'undefined' ? sessionStorage.getItem(OAUTH_PROVIDER_KEY) : null;
    if (provider !== 'microsoft') {
      setStatus('error');
      setErrorMessage(
        'Invalid or expired sign-in session. Please try again from the login page.'
      );
      return;
    }

    (async () => {
      try {
        const userData = await staffAuthService.exchangeCode({ code, state });
        sessionStorage.removeItem(OAUTH_PROVIDER_KEY);
        setUser(userData);
        setStatus('success');
        toast.success('Welcome back');
        router.replace('/admin/dashboard');
      } catch (err) {
        setStatus('error');
        setErrorMessage(handleApiError(err));
        toast.error(handleApiError(err));
      }
    })();
  }, [router, setUser]);

  if (status === 'loading') {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: '#F2F5F8' }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-admin" />
          <p className="mt-4 text-sm text-gray-600">Completing Microsoft sign-in...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: '#F2F5F8' }}
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign-in failed</h1>
          <p className="text-sm text-gray-600 mb-6">{errorMessage}</p>
          <a
            href="/admin/login"
            className="inline-block px-6 py-3 bg-admin text-white rounded-xl text-sm font-semibold hover:bg-admin-600"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return null;
}
