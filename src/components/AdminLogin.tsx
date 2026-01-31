import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, LogOut } from 'lucide-react';

export const AdminLogin = () => {
  const { isAdmin, login, logout } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      setPassword('');
      setError(false);
      setShowLogin(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogin(false);
  };

  if (isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleLogout}
          className="gap-2 shadow-lg"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión Admin
        </Button>
      </div>
    );
  }

  if (!showLogin) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowLogin(true)}
          className="gap-2 shadow-lg opacity-50 hover:opacity-100"
        >
          <Lock className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <form onSubmit={handleLogin} className="bg-card border border-border rounded-lg p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Acceso Administrador</h3>
        </div>
        <div className="flex gap-2">
          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-40 ${error ? 'border-red-500' : ''}`}
            autoFocus
          />
          <Button type="submit" size="sm">
            Entrar
          </Button>
          <Button 
            type="button" 
            size="sm" 
            variant="ghost"
            onClick={() => setShowLogin(false)}
          >
            ✕
          </Button>
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-2">Contraseña incorrecta</p>
        )}
      </form>
    </div>
  );
};
