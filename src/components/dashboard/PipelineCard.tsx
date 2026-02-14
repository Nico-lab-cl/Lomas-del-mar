"use client"

import { Reservation, Lot, User } from "@prisma/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { differenceInDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { Phone, Calendar, MapPin, DollarSign, ArrowRight, ArrowLeft } from "lucide-react"
import { updateReservationNotes } from "@/actions/dashboard"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type ReservationWithDetails = Reservation & {
    lot: Lot
    buyer: User | null
}

const STAGE_ORDER = ["RESERVA_PAGADA", "ESPERANDO_PIE", "PIE_PAGADO", "PAGO_CUOTAS", "VENTA_CERRADA"]

export function PipelineCard({ reservation, onMove }: { reservation: ReservationWithDetails, onMove: (stage: string) => void }) {
    const daysSince = differenceInDays(new Date(), new Date(reservation.created_at))
    const isLate = reservation.pipeline_stage === "ESPERANDO_PIE" && daysSince > 10
    const [notesOpen, setNotesOpen] = useState(false)
    const [notes, setNotes] = useState(reservation.notes || "")

    const currentStageIndex = STAGE_ORDER.indexOf(reservation.pipeline_stage)
    const nextStage = STAGE_ORDER[currentStageIndex + 1]
    const prevStage = STAGE_ORDER[currentStageIndex - 1]

    const handleSaveNotes = async () => {
        await updateReservationNotes(reservation.id, notes)
        toast.success("Notas guardadas")
        setNotesOpen(false)
    }

    return (
        <Card className={`text-sm shadow-sm hover:shadow-md transition-shadow relative ${isLate ? "border-red-500 border-2" : ""}`}>
            {isLate && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 z-10">
                    Atrasado ({daysSince} días)
                </Badge>
            )}
            <CardHeader className="p-3 pb-0">
                <CardTitle className="text-base font-semibold flex justify-between items-start">
                    <span>{reservation.name}</span>
                </CardTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Lote {reservation.lot.number} - Etapa {reservation.lot.stage}
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-2 space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{reservation.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(reservation.created_at), "dd MMM yyyy", { locale: es })}</span>
                </div>

                {reservation.pipeline_stage === "ESPERANDO_PIE" && (
                    <div className="text-xs font-medium text-orange-600">
                        {10 - daysSince > 0 ? `${10 - daysSince} días para el pie` : "Plazo vencido"}
                    </div>
                )}

                <div className="flex gap-2 pt-2">
                    <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs">
                                Notas
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Notas: {reservation.name}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Escribe notas aquí..."
                                    className="min-h-[150px]"
                                />
                            </div>
                            <Button onClick={handleSaveNotes}>Guardar Notas</Button>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={!prevStage}
                        onClick={() => onMove(prevStage)}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        Mover
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={!nextStage}
                        onClick={() => onMove(nextStage)}
                    >
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
