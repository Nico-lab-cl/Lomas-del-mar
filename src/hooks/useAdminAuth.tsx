import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Contraseña de administrador - Cambiar esto por tu contraseña segura
const ADMIN_PASSWORD = 'admin2026';
const ADMIN_KEY = 'lomas_admin_auth';

const ADMIN_AUTH_ENABLED = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SHOW_ADMIN === 'true';

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (!ADMIN_AUTH_ENABLED) return false;
    try {
      const stored = localStorage.getItem(ADMIN_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!ADMIN_AUTH_ENABLED) return;
    try {
      localStorage.setItem(ADMIN_KEY, isAdmin.toString());
    } catch (e) {
      console.error('Error saving admin auth:', e);
    }
  }, [isAdmin]);

  const login = (password: string): boolean => {
    if (!ADMIN_AUTH_ENABLED) return false;
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (!ADMIN_AUTH_ENABLED) return;
    setIsAdmin(false);
    localStorage.removeItem(ADMIN_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
