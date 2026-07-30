'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import staffAuthService from '@/services/staff-auth.service';
import { isAdminSubdomain, getOrganizationSubdomain } from '@/utils/subdomain';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // In production, only allow admin routes on admin subdomain
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const isLocalhost = hostname.includes('localhost') || hostname === '127.0.0.1';
        
        // If not localhost and not on admin subdomain, redirect to client
        if (!isLocalhost && !isAdminSubdomain()) {
          router.push('/client/login');
          return;
        }
      }

      if (!staffAuthService.isAuthenticated()) {
        router.push('/admin/login');
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
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

