import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const STORAGE_KEY = 'alimin_legal_bases_seen_v1';

const PDF_URL =
  'https://drive.google.com/file/d/1Q7rZQAx7voDp4Qk8VWhTQmP0ezSDxJIu/view?usp=sharing';

const BASES_TEXT = `Bases promoción terrenos sin pie Alimin
Proyecto Lomas del Mar

Alimin Lomas del Mar Spa, Rut 78.174.613-4, correo inmobiliaria@aliminspa.cl, dirección del proyecto: Lote B1 Camino Antiguo El Tabo, comuna El Tabo, propiedad de Alimin, inscripción de fojas 4656v número 5484-2025, rol 680-806.

Alimin realizará el siguiente concurso, por motivo de su aniversario número 4 relacionado a la marca Alimin, cuyo representante legal se indica a continuación: Don Patricio Andrés Escobar Díaz, RUT 18.147.698-2, domiciliado en Estado 33 LC 14 Block #33 depto #14, comuna Santiago.

El objetivo principal de esta promoción es recaudar 200 clientes aproximadamente, para los cuales se otorgará el beneficio de no pagar pie. Es decir, el pago del terreno a promesar se realizará mediante cuotas mensuales hasta completar el valor total del terreno desde el inicio de la compra, cuyas cláusulas correspondientes se indicarán en la promesa de compraventa que se compartirá al participante para su revisión una vez que haya realizado la reserva de su terreno.

Para que esta promoción se lleve a cabo, se deberá concretar la reserva de 200 terrenos en un plazo de 7 días. Una vez completadas las reservas, los clientes serán contactados por el equipo de Alimin para firmar su promesa de compraventa dentro de los 10 días corridos, a contar del día en que fue contactado por Alimin. Si no se logra la meta, la reserva será devuelta mediante transferencia a la cuenta de la persona, con un descuento de $10.000 por gastos de procesamiento de pago en Transbank que se aplica al momento de realizar la reserva.

La inmobiliaria indicará en sus redes sociales Instagram, Facebook y TikTok el día de la promoción, para lo cual se dejará un link de pago con el plano del proyecto para realizar la reserva escogiendo el terreno que le interesa. De esta manera, el terreno quedará automáticamente bloqueado. El monto a pagar cuando esta plataforma sea activada es de $550.000 pesos chilenos mediante sistema Transbank.

Bases y Condiciones
- La vigencia del pie costo cero se celebrará solo si se alcanza el total de 200 personas.
- La reserva será por un monto de $550.000; esto será utilizado como la primera cuota.
- La segunda cuota se deberá cancelar al mes siguiente de realizada la reserva y así sucesivamente hasta completar el valor total del terreno.
- El proyecto es en verde, por lo cual es conocido por el promitente comprador.
- El proyecto en desarrollo es un condominio tipo B.
- El proyecto incluirá veredas, soleras, calles compactadas con maicillo, luminarias solares, agua de pozo certificada por la Seremi de Salud, empalme de luz. Este modelo de desarrollo ya ha sido desarrollado por Alimin en sus proyectos anteriores.
- El acceso al condominio será con portón automatizado.
- El condominio no cobra gastos comunes; los promitentes propietarios deberán cuidar y preservar el condominio a través de un reglamento de copropiedad una vez terminadas las obras de urbanización.
- La promesa de compraventa se deberá firmar dentro de 10 días corridos una vez realizada la reserva; de lo contrario quedará nula y se abrirá el cupo del terreno nuevamente. Para este proceso será contactado por el equipo de Alimin.
- La reserva no tendrá devolución si el promitente comprador desiste por voluntad propia de la compra.
- El beneficio será para 200 clientes aproximadamente, el cual aplicará bajo las condiciones ya señaladas.
- El plazo será limitado a 7 días indicados anteriormente para completar el total de las reservas. Si no se cumple con el total de 200 personas en esta cantidad de días, la reserva será devuelta al cliente con un descuento de $10.000 por concepto de procesamiento de pago Transbank en un plazo máximo de 30 días hábiles.
- La promoción no considera gastos operacionales. A la hora de firmar su promesa de compraventa deberá considerar los gastos operacionales cuyo valor es de $350.000 que consideran: Redacción del contrato por el abogado, traslados, pagos en notaría y honorarios.
- La fecha de entrega del proyecto será en un tiempo estimado de 2 a 4 años y/o una vez obtenido el permiso de obras que se encuentra en tramitación.
- La persona puede visitar el proyecto cuando desee mientras se encuentra en desarrollo. (Puede visitar Lomas del Mar o cualquiera de nuestros proyectos con el fin de dar fe. Todo siempre mediante previo agendamiento de visita a través de postventas).
- El cliente tendrá comunicación constante con la inmobiliaria a través de un servicio de postventa ofrecido por Alimin.

El valor final para terrenos de 200 m² es de $34.900.000 y para terrenos de 390 m² el valor final es de $42.900.000. El tiempo total de pago según valor cuota de $550.000 fijas en pesos, a tasa 0% de interés, es de 5 años y medio aproximadamente para terrenos de 200 m² y de 6 años y medio aproximadamente para terrenos de 390 m².

Alimin da fe de que no es su primer proyecto y abre a todos la oportunidad de acceder a un terreno sin pie en la comuna de El Tabo, sector El Membrillo.`;

export const LegalBasesPopup = () => {
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        setOpen(true);
      }
    } catch {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
    setAccepted(true);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!accepted && open && next === false) return;
        setOpen(next);
      }}
    >
      <DialogContent
        overlayClassName="bg-black/50 backdrop-blur-none data-[state=open]:backdrop-blur-md data-[state=closed]:backdrop-blur-none transition-[backdrop-filter,opacity] duration-300"
        hideClose={!accepted}
        className="max-w-2xl max-h-[85vh] overflow-y-auto sm:rounded-2xl"
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-3xl font-bold tracking-tight">Lee las bases</DialogTitle>
          <DialogDescription className="text-base">
            Antes de ingresar y reservar tu terreno, tienes que leer nuestras bases del concurso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild className="w-full sm:w-auto">
              <a href={PDF_URL} target="_blank" rel="noreferrer">
                Descargar PDF (Bases)
              </a>
            </Button>
            <div className="w-full sm:w-auto">
              <div className="flex items-start gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                <Checkbox
                  id="legal-bases-accept"
                  checked={accepted}
                  onCheckedChange={(v) => {
                    const next = v === true;
                    setAccepted(next);
                    if (next) handleAccept();
                  }}
                />
                <Label htmlFor="legal-bases-accept" className="text-sm leading-snug text-foreground">
                  He leído y acepto las bases, términos y condiciones de la promoción.
                  <span className="block text-xs text-muted-foreground">© Alimin Lomas del Mar SpA. Todos los derechos reservados.</span>
                </Label>
              </div>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="bases">
              <AccordionTrigger>(Click aquí para leer)</AccordionTrigger>
              <AccordionContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {BASES_TEXT}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
};
