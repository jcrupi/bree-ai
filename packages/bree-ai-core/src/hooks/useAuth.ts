import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import breeAPI from '../utils/breeAPI';

export interface User {
  id: number;
  email: string;
  name: string;
  roles: Array<{
    role: 'super_org' | 'org' | 'admin' | 'member';
    organizationId?: number;
    organizationSlug?: string;
    organizationName?: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (role: string, organizationId?: number) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
}

// Create context
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  hasRole: () => false,
  hasAnyRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

/**
 * Auth Provider Hook
 * Manages authentication state and logic
 */
export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('bree_jwt');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { success, user: userData } = await breeAPI.auth.me();
        if (success && userData) {
          setUser(userData);
        } else {
          // Token invalid
          localStorage.removeItem('bree_jwt');
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('bree_jwt');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback((userData: User, token: string) => {
    localStorage.setItem('bree_jwt', token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('bree_jwt');
    setUser(null);
  }, []);

  const hasRole = useCallback((role: string, organizationId?: number) => {
    if (!user) return false;
    
    return user.roles.some(r => {
      if (r.role === 'super_org') return true;
      if (organizationId) {
        return r.role === role && r.organizationId === organizationId;
      }
      return r.role === role;
    });
  }, [user]);

  const hasAnyRole = useCallback((roles: string[]) => {
    if (!user) return false;
    return user.roles.some(r => roles.includes(r.role));
  }, [user]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasAnyRole
  };
}
