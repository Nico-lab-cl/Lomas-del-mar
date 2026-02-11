import { CheckCircle2, AlertCircle } from 'lucide-react';
import { UserSession } from '@/types';

interface UserStatusMessageProps {
  session: UserSession;
}

export const UserStatusMessage = ({ session }: UserStatusMessageProps) => {
  const isActive = session.isActive && !session.isBlocked;

  return (
    <div className={`status-card ${isActive ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-destructive'}`}>
      <div className="flex items-start gap-3">
        {isActive ? (
          <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
        ) : (
          <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
        )}
        <div>
          <h3 className={`font-semibold ${isActive ? 'text-primary' : 'text-destructive'}`}>
            Estado: {isActive ? 'Activo' : 'Bloqueado'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isActive 
              ? 'Estás habilitado para reservar. Selecciona cualquier lote disponible para iniciar tu compra.'
              : 'Tu sesión ha expirado. Por favor espera para poder continuar.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};
