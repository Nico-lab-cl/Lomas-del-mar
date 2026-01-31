import { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
const logo = '/logo.png';

interface WaitingRoomProps {
  blockedUntil: number;
  onUnblock: () => void;
}

export const WaitingRoom = ({ blockedUntil, onUnblock }: WaitingRoomProps) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, blockedUntil - now);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        onUnblock();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [blockedUntil, onUnblock]);

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const formatTime = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="fixed inset-0 bg-header z-50 flex items-center justify-center">
      <div className="text-center text-white max-w-lg px-6">
        {/* Logo with pulse effect */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse-ring" />
          <div className="absolute inset-0 flex items-center justify-center bg-primary/30 rounded-full logo-glow">
            <img
              src={logo}
              alt="Logo"
              className="w-16 h-16 object-contain brightness-0 invert"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-4">Sala de Espera</h1>
        <p className="text-white/70 mb-8">
          Tu sesión anterior ha expirado. Por favor, espera mientras preparamos una nueva sesión para ti.
          En este momento tenemos mucha demanda de clientes. No cierres la página; mantente en línea.
        </p>

        {/* Timer */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-primary" />
            <span className="text-sm uppercase tracking-wide text-white/50">Tiempo restante</span>
          </div>
          <div className="text-6xl font-bold tabular-nums text-primary">
            {formatTime(minutes)}:{formatTime(seconds)}
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>La página se recargará automáticamente</span>
        </div>
      </div>
    </div>
  );
};
