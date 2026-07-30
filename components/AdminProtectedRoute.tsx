'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import staffAuthService from '@/services/staff-auth.service';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Staff portal only hosts /admin routes — never redirect to /client/*.
 */
export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!staffAuthService.isAuthenticated()) {
      router.replace('/admin/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
