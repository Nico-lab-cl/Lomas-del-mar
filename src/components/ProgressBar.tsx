import { Lot } from '@/types';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

interface ProgressBarProps {
  lots: Lot[];
}

export const ProgressBar = ({ lots }: ProgressBarProps) => {
  const totalLots = lots.length;
  const soldLots = lots.filter(lot => lot.status === 'sold').length;
  const reservedLots = lots.filter(lot => lot.status === 'reserved').length;
  const availableLots = lots.filter(lot => lot.status === 'available').length;
  const soldPercentage = Math.round((soldLots / totalLots) * 100);
  const progressPercentage = Math.round(((soldLots + reservedLots) / totalLots) * 100);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-alimin-green via-[#2A454A] to-[#1E3337] p-8 md:p-12 shadow-2xl border-2 border-alimin-green/20">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_50%)]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                LOTES VENDIDOS
              </h3>
              <p className="text-sm text-white/80 font-medium flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-alimin-gold animate-pulse" />
                Actualización en tiempo real
              </p>
            </div>
          </div>

          {/* Big Percentage Display */}
          <div className="flex items-end gap-2">
            <span className="text-6xl md:text-7xl font-black text-white drop-shadow-lg">
              {soldPercentage}
            </span>
            <span className="text-3xl md:text-4xl font-bold text-white/60 mb-2">%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Vendidos</p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <p className="text-3xl font-black text-white">{soldLots}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Reservados</p>
            <p className="text-3xl font-black text-white">{reservedLots}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Disponibles</p>
            <p className="text-3xl font-black text-white">{availableLots}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-6 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm border-2 border-white/30">
            <div
              className="h-full bg-gradient-to-r from-white via-alimin-gold to-white transition-all duration-1000 ease-out relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite'
                }}
              />
            </div>
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-3 text-xs font-bold text-white/80">
            <span>L-01</span>
            <span className="text-white">{progressPercentage}% COMPLETADO</span>
            <span>L-{String(totalLots).padStart(2, '0')}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
