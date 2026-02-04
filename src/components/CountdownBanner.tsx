import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CountdownBannerProps {
  expiresAt: number;
  onExpire: () => void;
  isBlurred?: boolean;
}

export const CountdownBanner = ({ expiresAt, onExpire, isBlurred = false }: CountdownBannerProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, expiresAt - now);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onExpire();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const isUrgent = timeLeft < 60000; // Less than 1 minute

  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <div 
      className={`countdown-banner sticky z-50 transition-colors duration-300 ${
        isUrgent ? 'countdown-urgent countdown-pulse' : ''
      } ${isBlurred ? 'countdown-blurred' : ''}`}
      style={{ top: 'var(--header-height)' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${isUrgent ? 'animate-pulse' : ''}`} />
            <div>
              <p className="font-semibold text-sm">
                {isUrgent ? '⚠️ ¡TIEMPO CASI AGOTADO!' : 'TIEMPO DE SESIÓN'}
              </p>
              <p className="text-xs opacity-80">
                {isUrgent ? 'Reserva ahora antes de perder tu lote' : 'Completa tu reserva antes del cierre'}
              </p>
            </div>
          </div>
          <div className={`text-3xl font-bold tabular-nums countdown-heartbeat ${isUrgent ? 'countdown-timer-urgent' : ''}`}>
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>
        </div>
      </div>
    </div>
  );
};
