import { Lot } from '@/types';
import { MapPin, Ruler, DollarSign, Calculator, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OFFER_PRICE } from '@/services/mockData';

interface InvestmentDetailsProps {
  selectedLot: Lot | null;
  onReserve?: () => void;
  isSessionActive?: boolean;
}

export const InvestmentDetails = ({ selectedLot, onReserve, isSessionActive }: InvestmentDetailsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const lotStage = selectedLot?.displayStage ?? selectedLot?.stage;
  const lotDisplay = selectedLot?.displayLabel ?? selectedLot?.number;
  const lotLabel = selectedLot ? `L-${lotDisplay}` : '';
  const lotStageLabel = lotStage ? `Etapa ${lotStage}` : '';
  const whatsappHref = selectedLot
    ? `https://wa.me/56973077128?text=${encodeURIComponent(
      `${lotStageLabel ? `${lotStageLabel} - ` : ''}Quiero comprar mi terreno en Lomas del Mar, quiero consultar por el lote "${lotLabel}".`
    )}`
    : '';

  if (!selectedLot) {
    return (
      <div className="status-card flex items-center justify-center py-8">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <h3 className="font-semibold mb-1">Detalles de mi Inversión</h3>
          <p className="text-sm">Selecciona un lote para ver detalles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-card">
      <h3 className="font-bold text-foreground mb-4">Detalles de mi Inversión</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Lote</p>
            <p className="font-semibold truncate">{lotLabel}</p>
            {lotStageLabel && (
              <p className="text-xs text-muted-foreground truncate">{lotStageLabel}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <Ruler className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Área</p>
            <p className="font-semibold">{selectedLot.area != null ? `${selectedLot.area} m²` : 'Sin información'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
          <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Valor Único Oferta</p>
            <p className="font-semibold text-primary">{formatCurrency(OFFER_PRICE)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Calculator className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Precio Total</p>
            <p className="font-bold text-primary">
              {selectedLot.totalPrice ? formatCurrency(selectedLot.totalPrice) : 'Consultar'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        <Button asChild size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700">
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle className="w-4 h-4" />
            Consultar por WhatsApp
          </a>
        </Button>

        {onReserve && isSessionActive && (
          <Button onClick={onReserve} className="w-full" size="lg">
            Reservar este lote
          </Button>
        )}
      </div>
    </div>
  );
};
