"use client";

import { useEffect, useState } from 'react';
import { HelpCircle, MousePointerClick, ClipboardList, CreditCard, CheckCircle2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'alimin_purchase_tutorial_seen_v1';
const OPEN_EVENT = 'alimin:open-purchase-tutorial';

export const openPurchaseTutorial = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(OPEN_EVENT));
};

type Step = {
  title: string;
  body: string;
  Icon: typeof HelpCircle;
};

const STEPS: Step[] = [
  {
    title: 'Elige un lote disponible (verde)',
    body: 'Haz clic en un lote verde del plano para ver sus detalles.',
    Icon: MousePointerClick,
  },
  {
    title: 'Completa tus datos',
    body: 'Ingresa nombre, correo, celular, RUT y dirección para asociar la reserva.',
    Icon: ClipboardList,
  },
  {
    title: 'Paga la reserva con Webpay',
    body: 'Te redirigiremos a Webpay para pagar la reserva de forma segura.',
    Icon: CreditCard,
  },
  {
    title: 'Confirmación',
    body: 'Si el pago es exitoso, el lote quedará marcado como vendido y ya no se podrá seleccionar.',
    Icon: CheckCircle2,
  },
  {
    title: 'Éxito, ya tienes tu terreno.',
    body: 'Te llegará un mail a tu bandeja de entrada con los datos de confirmación de tu compra.',
    Icon: MailCheck,
  },
];

export const PurchaseTutorial = () => {
  const [open, setOpen] = useState(false);

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (open && next === false) markSeen();
        setOpen(next);
      }}
    >
      <DialogContent
        overlayClassName="bg-black/40 backdrop-blur-sm"
        className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto overscroll-contain sm:rounded-2xl"
        aria-label="Cómo comprar tu terreno"
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
            Cómo comprar tu terreno en Lomas del Mar
          </DialogTitle>
          <DialogDescription className="text-base">
            Sigue estos pasos y reserva tu lote en minutos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3">
            {STEPS.map((step, idx) => (
              <div
                key={step.title}
                className="flex gap-3 rounded-xl border border-border bg-muted/30 p-4"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Paso {idx + 1}</span>
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="font-semibold text-foreground mb-2">Leyenda de colores</div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Verde: disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Amarillo: reservado temporalmente</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>Rojo: vendido / no disponible</span>
              </div>
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              La reserva temporal dura solo 5 minutos. Si no finalizas el pago, el lote vuelve a estar disponible.
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                markSeen();
                setOpen(false);
              }}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              onClick={() => {
                markSeen();
                setOpen(false);
              }}
            >
              Entendido, quiero elegir mi lote
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
