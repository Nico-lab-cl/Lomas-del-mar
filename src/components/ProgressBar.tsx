import { Lot } from '@/types';

interface ProgressBarProps {
  lots: Lot[];
}

export const ProgressBar = ({ lots }: ProgressBarProps) => {
  const totalLots = lots.length;
  const soldLots = lots.filter(lot => lot.status === 'sold').length;
  const reservedLots = lots.filter(lot => lot.status === 'reserved').length;
  const soldPercentage = Math.round((soldLots / totalLots) * 100);
  const progressPercentage = Math.round(((soldLots + reservedLots) / totalLots) * 100);

  return (
    <div className="status-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-foreground">AVANCE DE NUESTRA META</h3>
          <p className="text-xs text-muted-foreground">Actualización en tiempo real</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{soldPercentage}%</span>
          <span className="text-sm text-muted-foreground ml-1">Vendido</span>
        </div>
      </div>
      
      <div className="progress-track">
        <div 
          className="progress-fill progress-shimmer"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>L-01</span>
        <span>L-{String(totalLots).padStart(2, '0')}</span>
      </div>
    </div>
  );
};
