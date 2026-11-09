import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { User, LevelInfo, Badge } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  levelInfo: LevelInfo | null;
  badges: Badge[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchDemoUser: (userId: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  showUnlockedBadge: (badge: Badge) => void;
  celebratingBadge: Badge | null;
  closeBadgeModal: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register';
  setAuthModalMode: (mode: 'login' | 'register') => void;
  cartCount: number;
  refreshCartCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [celebratingBadge, setCelebratingBadge] = useState<Badge | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = async () => {
    try {
      const data = await api.getCart();
      setCartCount(data.itemCount || 0);
    } catch {
      // ignore
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setLevelInfo(data.levelInfo);
      setBadges(data.badges);
    } catch (err) {
      console.warn('Could not refresh user session:', err);
    }
  };

  useEffect(() => {
    // Initial load: check token or initialize with Ramesh Patel demo user if first time
    const initAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('agrix_token');
      const demoId = localStorage.getItem('agrix_demo_user_id');

      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          setLevelInfo(data.levelInfo);
          setBadges(data.badges);
        } catch {
          localStorage.removeItem('agrix_token');
        }
      } else if (!demoId) {
        // Set default demo user as Ramesh Patel for immediate friction-free prototype evaluation
        try {
          const res = await api.switchDemoUser('user_ramesh');
          localStorage.setItem('agrix_token', res.token);
          localStorage.setItem('agrix_demo_user_id', 'user_ramesh');
          setUser(res.user);
          await refreshUser();
        } catch {
          // ignore
        }
      } else {
        try {
          const res = await api.switchDemoUser(demoId);
          localStorage.setItem('agrix_token', res.token);
          setUser(res.user);
          await refreshUser();
        } catch {
          // ignore
        }
      }

      await refreshCartCount();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('agrix_token', res.token);
    localStorage.removeItem('agrix_demo_user_id');
    setUser(res.user);
    await refreshUser();
    await refreshCartCount();
    setAuthModalOpen(false);
  };

  const register = async (formData: any) => {
    const res = await api.register(formData);
    localStorage.setItem('agrix_token', res.token);
    localStorage.removeItem('agrix_demo_user_id');
    setUser(res.user);
    await refreshUser();
    await refreshCartCount();
    setAuthModalOpen(false);
    // Confetti for new farmer registration
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
  };

  const logout = () => {
    localStorage.removeItem('agrix_token');
    localStorage.removeItem('agrix_demo_user_id');
    setUser(null);
    setLevelInfo(null);
    setBadges([]);
    setCartCount(0);
  };

  const switchDemoUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemoUser(userId);
      localStorage.setItem('agrix_token', res.token);
      localStorage.setItem('agrix_demo_user_id', userId);
      setUser(res.user);
      await refreshUser();
      await refreshCartCount();
    } finally {
      setIsLoading(false);
    }
  };

  const showUnlockedBadge = (badge: Badge) => {
    setCelebratingBadge(badge);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#f59e0b', '#6ee7b7', '#3b82f6'],
    });
  };

  const closeBadgeModal = () => {
    setCelebratingBadge(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        levelInfo,
        badges,
        isLoading,
        login,
        register,
        logout,
        switchDemoUser,
        refreshUser,
        showUnlockedBadge,
        celebratingBadge,
        closeBadgeModal,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        cartCount,
        refreshCartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
