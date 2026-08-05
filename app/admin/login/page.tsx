'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import staffAuthService from '@/services/staff-auth.service';
import { useStaffAuthStore } from '@/store/staff-auth-store';
import { handleApiError } from '@/utils/error-handler';
import toast from 'react-hot-toast';

interface LoginFormData {
  email: string;
  code: string;
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useStaffAuthStore();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>();

  // Step 1: Email and send verification code
  const handleEmailSubmit = async (data: { email: string }) => {
    setIsSendingCode(true);
    try {
      await staffAuthService.sendVerificationCode({
        email: data.email,
      });
      setEmail(data.email);
      setValue('email', data.email);
      toast.success('Verification code sent to your email!');
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsSendingCode(false);
    }
  };

  // Step 2: Code verification and login
  const handleCodeSubmit = async (data: { code: string }) => {
    setIsLoading(true);
    try {
      const userData = await staffAuthService.login({
        email: email,
        code: data.code,
      });
      setUser(userData);
      toast.success('Welcome back');
      router.prefetch('/admin/dashboard');
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast.error(handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#F2F5F8' }}>
      <div className="max-w-lg w-full">
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Service Desk</h1>
          <h2 className="text-xl font-semibold text-gray-700">
            Staff Login
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to manage organisations and the Senan team
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-10 sm:p-12">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center">
              {/* Step 1: Email */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    currentStep >= 1
                      ? 'bg-admin border-admin text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > 1 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">1</span>
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= 1 ? 'text-admin' : 'text-gray-400'}`}>
                  Email
                </span>
              </div>

              {/* Connector */}
              <div className={`w-16 h-1 mx-2 mt-[-20px] rounded-full transition-colors ${currentStep >= 2 ? 'bg-admin' : 'bg-gray-200'}`} />

              {/* Step 2: Verify */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    currentStep >= 2
                      ? 'bg-admin border-admin text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  <span className="text-sm font-semibold">2</span>
                </div>
                <span className={`mt-2 text-xs font-medium ${currentStep >= 2 ? 'text-admin' : 'text-gray-400'}`}>
                  Verify
                </span>
              </div>
            </div>
          </div>

          {/* Step 1: Email */}
          {currentStep === 1 && (
            <form
              onSubmit={handleSubmit(handleEmailSubmit)}
              className="space-y-8"
            >
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  type="email"
                  id="email"
                  className="block w-full px-4 py-4 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin transition-all bg-white"
                  placeholder="you@senangroupafrica.com"
                />
                {errors.email && (
                  <p className="mt-3 text-sm text-red-600">{errors.email.message}</p>
                )}
                <p className="mt-4 text-xs text-gray-500 leading-relaxed">
                  We'll send you a 6-digit verification code via email
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSendingCode}
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-admin hover:bg-admin-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-admin transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSendingCode ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Code'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Code Verification */}
          {currentStep === 2 && (
            <form
              onSubmit={handleSubmit(handleCodeSubmit)}
              className="space-y-8"
            >
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-3">
                  Verification Code <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('code', {
                    required: 'Verification code is required',
                    minLength: {
                      value: 6,
                      message: 'Verification code must be 6 digits',
                    },
                    maxLength: {
                      value: 6,
                      message: 'Verification code must be 6 digits',
                    },
                  })}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  id="code"
                  className="block w-full px-4 py-6 border-2 border-gray-300 rounded-xl placeholder-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-admin focus:border-admin text-center text-4xl tracking-[0.3em] font-bold transition-all bg-white"
                  placeholder="000000"
                />
                {errors.code && (
                  <p className="mt-4 text-sm text-red-600">{errors.code.message}</p>
                )}
                <p className="mt-5 text-sm text-gray-600 text-center">
                  Enter the 6-digit code sent to <span className="font-semibold text-gray-900">{email}</span>
                </p>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={async () => {
                      if (email) {
                        setIsSendingCode(true);
                        try {
                          await staffAuthService.sendVerificationCode({
                            email: email,
                          });
                          toast.success('Verification code resent!');
                        } catch (error: any) {
                          toast.error(handleApiError(error));
                        } finally {
                          setIsSendingCode(false);
                        }
                      }
                    }}
                    disabled={isSendingCode}
                    className="mt-2 text-sm font-medium text-admin hover:text-admin-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingCode ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-4 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-admin hover:bg-admin-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[44px]"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 text-center">
            Senan Service Desk staff access only
          </p>
        </div>
      </div>
    </div>
  );
}

