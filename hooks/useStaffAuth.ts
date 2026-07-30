import { useRouter } from 'next/navigation';
import { useStaffAuthStore } from '@/store/staff-auth-store';
import staffAuthService from '@/services/staff-auth.service';

export function useStaffAuth() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, clearAuth } = useStaffAuthStore();

  const login = async (email: string, code: string) => {
    try {
      // Login to get tokens and user data
      // The login response already includes staff_profile with permissions
      const userData = await staffAuthService.login({
        email,
        code,
      });
      
      // Log the user data to debug
      console.log('Login response userData:', userData);
      console.log('Login response staff_profile:', userData.staff_profile);
      console.log('Login response permissions:', userData.staff_profile?.permissions || userData.permissions);
      
      // The login response should already have all the data we need
      // Only try to fetch current user if staff_profile is missing
      if (!userData.staff_profile && !userData.permissions) {
        console.log('No staff_profile or permissions in login response, fetching current user...');
        try {
          const fullUser = await staffAuthService.getCurrentUser();
          console.log('getCurrentUser response:', fullUser);
          setUser(fullUser);
          return fullUser;
        } catch (profileError) {
          console.warn('Failed to fetch full profile, using login response:', profileError);
          setUser(userData);
          return userData;
        }
      }
      
      // Use the login response directly (it should have staff_profile)
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    staffAuthService.logout();
    clearAuth();
    router.push('/admin/login');
  };

  return {
    user,
    isAuthenticated,
    login,
    logout,
    setUser,
  };
}

