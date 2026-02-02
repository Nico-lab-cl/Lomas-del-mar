import { useEffect, useState, type ChangeEvent } from 'react';
import { Lot } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  Ruler,
  X,
  Maximize,
  Home,
  CheckCircle2,
  DollarSign,
  User,
  Mail,
  Phone,
  Loader2,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { OFFER_PRICE } from '@/services/mockData';
import { getLotSpec, getStageLotSpec } from '@/services/lotSpecs';
import { useToast } from '@/hooks/use-toast';
import { RutInput } from '@/components/RutInput';
import { z } from 'zod';
import { validateRutRaw } from '@/lib/rut';



interface LotReservationPopupProps {
  lot: Lot | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isTemporarilyLocked: boolean;
  sessionId: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  rut: string;
  rutRaw: string;
  address: string;
}

export const LotReservationPopup = ({ lot, isOpen, onClose, onConfirm, isTemporarilyLocked, sessionId }: LotReservationPopupProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onlinePeople, setOnlinePeople] = useState<number>(100);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    rut: '',
    rutRaw: '',
    address: '',
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const getTotalInstallments = (area: number | null | undefined) => {
    if (area == null) return null;
    if (area >= 200 && area <= 299) return 64;
    if (area >= 300 && area <= 399) return 78;
    return null;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El número de teléfono es requerido';
    } else if (!/^[+]?[\d\s-]{8,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Ingresa un número de teléfono válido';
    }

    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    } else if (validateRutRaw(formData.rut.trim()) !== true) {
      newErrors.rut = 'Ingresa un RUT válido (ej: 19.405.444-7)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'Ingresa una dirección válida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitToWebpay = (url: string, token: string) => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'token_ws';
    input.value = token;
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  };

  const handleSubmit = async () => {
    if (!lot) return;
    if (isTemporarilyLocked) {
      toast({
        title: 'Lote temporalmente bloqueado',
        description: 'Este lote está siendo procesado por otra persona. Intenta nuevamente en unos minutos.',
      });
      return;
    }
    if (!validateForm()) return;

    setIsSubmitting(true);

    const contactName = formData.name.trim();
    const contactEmail = formData.email.trim();
    const contactPhone = formData.phone.trim();
    const contactRut = formData.rut.trim();
    const contactAddress = formData.address.trim();

    try {
      const res = await fetch('/api/webpay/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lotId: lot.id,
          sessionId,
          name: contactName,
          email: contactEmail,
          phone: contactPhone,
          rut: contactRut,
          address: contactAddress,
        }),
      });

      const jsonUnknown: unknown = await res.json().catch(() => null);
      const parsed = z
        .object({
          ok: z.boolean().optional(),
          token: z.string().min(1).optional(),
          url: z.string().min(1).optional(),
          error: z.string().optional(),
        })
        .passthrough()
        .safeParse(jsonUnknown);

      const json = parsed.success ? parsed.data : null;
      if (!res.ok || !json?.ok || !json?.token || !json?.url) {
        const msg = typeof json?.error === 'string' ? json.error : 'No se pudo iniciar el pago. Intenta nuevamente.';
        throw new Error(msg);
      }

      toast({
        title: 'Datos registrados',
        description: 'Redirigiendo al pago...',
      });

      onConfirm();
      handleClose();
      submitToWebpay(json.url, json.token);
    } catch (error) {
      console.error('Error starting payment:', error);
      toast({
        title: 'No se pudo iniciar el pago',
        description: error instanceof Error ? error.message : 'Intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', rut: '', rutRaw: '', address: '' });
    setErrors({});
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const randomInt = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    setOnlinePeople(randomInt(20, 111));

    const interval = window.setInterval(() => {
      setOnlinePeople(randomInt(20, 111));
    }, randomInt(2500, 5500));

    return () => {
      window.clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen || !lot) return null;

  const isExplicitDisplayLabel =
    lot.displayLabel != null && String(lot.displayLabel).trim().length > 0 && lot.displayLabel !== lot.number;
  const fallbackStageLotNumber =
    lot.stageLotNumber != null
      ? String(lot.stageLotNumber)
      : (getLotSpec(lot.id)?.stageLotNumber != null ? String(getLotSpec(lot.id)!.stageLotNumber) : lot.number);
  const lotDisplay = isExplicitDisplayLabel ? String(lot.displayLabel) : fallbackStageLotNumber;
  const lotStageLabel = lot.displayStage ?? lot.stage;
  const lotLabel = `L-${lotDisplay}`;
  const parsedDisplay = Number.parseInt(String(lotDisplay), 10);
  const stageLotNumber = Number.isFinite(parsedDisplay) ? parsedDisplay : null;
  const lotSpec =
    lotStageLabel && stageLotNumber != null
      ? getStageLotSpec(lotStageLabel, stageLotNumber)
      : getLotSpec(lot.id);
  const dimensions = lotSpec?.dimensions;
  const lotArea = lotSpec?.area_m2 || lot.area;
  const totalInstallments = getTotalInstallments(lotArea);
  const offerPrice = OFFER_PRICE;
  const showOfferSection = totalInstallments != null;
  const whatsappHref = `https://wa.me/56948822607?text=${encodeURIComponent(
    `Promoción Lomas del Mar - ${lotStageLabel != null ? `Etapa ${lotStageLabel} - ` : ''}Quiero comprar mi terreno en Lomas del Mar, quiero consultar por el lote "${lotLabel}".`
  )}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Popup Content - Wider on tablets/desktops */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-lg md:max-w-3xl lg:max-w-4xl animate-scale-in border border-border max-h-[90vh] overflow-hidden flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content - Only mobile needs scroll */}
        <div className="overflow-y-auto md:overflow-y-visible flex-1 p-6 md:p-8">
          <div className="mb-4">
            <div className="relative w-full overflow-hidden rounded-xl bg-red-600 text-white px-4 py-2 text-sm font-semibold shadow-sm animate-urgent-pulse">
              <div className="pointer-events-none absolute inset-0 -skew-x-12 opacity-0.35 bg-gradient-to-r from-transparent via-white to-transparent animate-shine" />
              Apurate, que tenemos {onlinePeople} personas en linea.
            </div>
          </div>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg">
              <MapPin className="w-10 h-10 text-primary" />
            </div>

            {isTemporarilyLocked && (
              <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 text-sm">
                Este lote está temporalmente bloqueado por otra persona mientras procesa el pago.
                Puedes ver la información, pero no puedes continuar al pago por ahora.
              </div>
            )}
            <h2 className="text-3xl font-bold text-foreground">Lote {lotLabel}</h2>
            <p className="text-muted-foreground mt-1">Disponible para reserva</p>
            {lotStageLabel != null && (
              <span className="inline-block mt-3 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full transition-all duration-200 hover:bg-primary/20 hover:scale-105">
                Etapa {lotStageLabel}
              </span>
            )}
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {/* Área */}
            <div className="group p-4 bg-muted/50 rounded-xl border border-transparent transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:border-primary/30 hover:shadow-md cursor-default">
              <div className="flex items-center gap-2 mb-1">
                <Ruler className="w-4 h-4 text-primary transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs text-muted-foreground">Área Total</span>
              </div>
              <span className="text-lg font-bold text-foreground">{lotArea} m²</span>
            </div>

            {/* Lote */}
            <div className="group p-4 bg-muted/50 rounded-xl border border-transparent transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:border-primary/30 hover:shadow-md cursor-default">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-primary transition-transform duration-200 group-hover:scale-110" />
                <span className="text-xs text-muted-foreground">Lote</span>
              </div>
              <span className="text-lg font-bold text-foreground">{lotLabel}</span>
            </div>

            {/* Cuotas */}
            {totalInstallments != null && (
              <div className="group p-4 bg-muted/50 rounded-xl border border-transparent transition-all duration-200 hover:scale-105 hover:bg-primary/10 hover:border-primary/30 hover:shadow-md cursor-default">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-primary transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-xs text-muted-foreground">Cuotas</span>
                </div>
                <span className="text-lg font-bold text-foreground">{totalInstallments}</span>
              </div>
            )}
          </div>

          {/* Dimensions Section */}
          {dimensions && (dimensions.front_m || dimensions.depth_m) && (
            <div className="group mb-4 p-4 bg-muted/30 rounded-xl border border-transparent transition-all duration-200 hover:bg-muted/50 hover:border-border">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Maximize className="w-4 h-4 text-primary" />
                Dimensiones del terreno
              </p>
              <div className="grid grid-cols-2 gap-3">
                {dimensions.front_m && (
                  <div className="p-3 bg-background/50 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:scale-102">
                    <span className="text-xs text-muted-foreground block">Frente</span>
                    <span className="font-semibold text-foreground">{dimensions.front_m} m</span>
                  </div>
                )}
                {dimensions.depth_m && (
                  <div className="p-3 bg-background/50 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:scale-102">
                    <span className="text-xs text-muted-foreground block">Fondo</span>
                    <span className="font-semibold text-foreground">{dimensions.depth_m} m</span>
                  </div>
                )}
                {dimensions.width_m && dimensions.width_m !== dimensions.front_m && (
                  <div className="p-3 bg-background/50 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:scale-102">
                    <span className="text-xs text-muted-foreground block">Ancho</span>
                    <span className="font-semibold text-foreground">{dimensions.width_m} m</span>
                  </div>
                )}
                {dimensions.other_side_m && (
                  <div className="p-3 bg-background/50 rounded-lg transition-all duration-200 hover:bg-primary/10 hover:scale-102">
                    <span className="text-xs text-muted-foreground block">Otro lado</span>
                    <span className="font-semibold text-foreground">{dimensions.other_side_m} m</span>
                  </div>
                )}
              </div>
              {dimensions.notes && (
                <p className="text-xs text-muted-foreground italic mt-3 pt-3 border-t border-border/50">{dimensions.notes}</p>
              )}
            </div>
          )}

          {/* Price Section */}
          <div className="mb-4 space-y-2">
            <div className="group flex items-center justify-between p-4 bg-muted/50 rounded-xl transition-all duration-200 hover:bg-muted/70 hover:scale-[1.02]">
              <span className="text-muted-foreground">Precio Total</span>
              <span className="text-lg font-bold text-foreground">
                {lot.totalPrice ? formatCurrency(lot.totalPrice) : 'Consultar'}
              </span>
            </div>
            {showOfferSection && (
              <>
                <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-primary transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <span className="font-medium text-foreground">Primera cuota</span>
                    </div>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(offerPrice)}</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-block">
                    <Button
                      type="button"
                      className="bg-[#25D366] hover:bg-[#1EBE5D] text-white h-auto px-6 py-2 text-sm rounded-full"
                    >
                      <span className="flex items-center justify-center gap-3 leading-none">
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 448 512"
                          width="22"
                          height="22"
                          fill="currentColor"
                          className="block shrink-0"
                        >
                          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 222-99.6 222-222 0-59.3-25.2-115-65.1-157zm-157 341.6c-33.2 0-65.7-8.9-94.2-25.7l-6.7-4-69.8 18.3 18.6-68.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.2 130.5 0 101.7-82.8 184.5-184.5 184.5zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.7 23.5 9.1 31.5 11.6 13.2 4.2 25.2 3.6 34.7 2.2 10.6-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.4-5-3.8-10.5-6.6z" />
                        </svg>
                        Consultar por WhatsApp
                      </span>
                    </Button>
                  </a>
                </div>
              </>
            )}
          </div>
          {/* Features */}
          <div className="mb-6 space-y-2">
            {[
              { icon: CheckCircle2, text: 'Financiamiento con Crédito Directo - Proyecto en construcción (Proyecto en verde)' },
              { icon: CheckCircle2, text: 'Servicios básicos incluidos (Luz y agua)' },
              { icon: CheckCircle2, text: 'Rol individual' },
              { icon: Home, text: 'Terreno urbanizado a 8 min de la playa en auto' },
            ].map((feature, index) => (
              <div
                key={index}
                className="group flex items-center gap-3 p-2 rounded-lg transition-all duration-200 hover:bg-muted/50 hover:translate-x-1"
              >
                <feature.icon className="w-4 h-4 text-primary flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-200">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-card px-4 py-1 text-foreground font-semibold">Con este pago estás reservando tu terreno y pagando la primera cuota</span>
            </div>
          </div>


          {/* Contact Form - 2 columns on larger devices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="group space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                Nombre Completo
              </Label>
              <Input
                id="name"
                placeholder="Ingresa tu nombre completo"
                value={formData.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                className={`transition-all duration-200 focus:scale-[1.01] ${errors.name ? 'border-destructive' : ''}`}
                maxLength={100}
              />
              {errors.name && (
                <p className="text-sm text-destructive animate-fade-in">{errors.name}</p>
              )}
            </div>

            <div className="group space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary" />
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`transition-all duration-200 focus:scale-[1.01] ${errors.email ? 'border-destructive' : ''}`}
                maxLength={255}
              />
              {errors.email && (
                <p className="text-sm text-destructive animate-fade-in">{errors.email}</p>
              )}
            </div>

            <div className="group space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary" />
                Número de Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={formData.phone}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                className={`transition-all duration-200 focus:scale-[1.01] ${errors.phone ? 'border-destructive' : ''}`}
                maxLength={20}
              />
              {errors.phone && (
                <p className="text-sm text-destructive animate-fade-in">{errors.phone}</p>
              )}
            </div>

            <div className="group space-y-2">
              <Label htmlFor="rut" className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-primary" />
                RUT
              </Label>
              <RutInput
                id="rut"
                value={formData.rut}
                onChange={({ rutFormatted, rutRaw }) => {
                  setFormData({ ...formData, rut: rutFormatted, rutRaw });
                  if (errors.rut) setErrors({ ...errors, rut: undefined });
                }}
                disabled={isTemporarilyLocked}
                className="transition-all duration-200 focus:scale-[1.01]"
              />
              {errors.rut && <p className="text-sm text-destructive animate-fade-in">{errors.rut}</p>}
            </div>

            <div className="group space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                <Home className="w-4 h-4 text-primary" />
                Dirección
              </Label>
              <Input
                id="address"
                placeholder="Calle, número, comuna, región"
                value={formData.address}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: undefined });
                }}
                className={`transition-all duration-200 focus:scale-[1.01] ${errors.address ? 'border-destructive' : ''}`}
                maxLength={180}
              />
              {errors.address && (
                <p className="text-sm text-destructive animate-fade-in">{errors.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="p-4 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 transition-all duration-200 hover:scale-[1.02]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || isTemporarilyLocked}
              className="flex-1 gap-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Reservar y Pagar Primera Cuota
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
