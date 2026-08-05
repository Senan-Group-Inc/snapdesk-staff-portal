'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import staffAuthService from '@/services/staff-auth.service';
import { isAdminSubdomain } from '@/utils/subdomain';

/**
 * Root path: send staff users into the admin section.
 * (When the staff app is on its own origin, this is usually just `/`.)
 */
export default function StaffHomePage() {
  const router = useRouter();

  useEffect(() => {
    const onAdminHost = isAdminSubdomain();

    if (onAdminHost) {
      if (staffAuthService.isAuthenticated()) {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/admin/login');
      }
      return;
    }

    if (staffAuthService.isAuthenticated()) {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-admin" />
        <p className="mt-4 text-gray-600">Loading…</p>
      </div>
    </div>
  );
}
