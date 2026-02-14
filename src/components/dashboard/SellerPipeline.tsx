"use client"

import { useState } from "react"
import { Reservation, Lot, User } from "@prisma/client"
import { PipelineCard } from "./PipelineCard"
import { updatePipelineStage } from "@/actions/dashboard"
import { toast } from "sonner"

type ReservationWithDetails = Reservation & {
    lot: Lot
    buyer: User | null
}

const STAGES = [
    { id: "RESERVA_PAGADA", label: "Reserva Pagada", color: "bg-blue-100 text-blue-800" },
    { id: "ESPERANDO_PIE", label: "Esperando Pie", color: "bg-yellow-100 text-yellow-800" },
    { id: "PIE_PAGADO", label: "Pie Pagado", color: "bg-purple-100 text-purple-800" },
    { id: "PAGO_CUOTAS", label: "Pago de Cuotas", color: "bg-indigo-100 text-indigo-800" },
    { id: "VENTA_CERRADA", label: "Venta Cerrada", color: "bg-green-100 text-green-800" }
]

export function SellerPipeline({ initialData }: { initialData: ReservationWithDetails[] }) {
    const [reservations, setReservations] = useState(initialData)

    const handleMove = async (id: string, newStage: string) => {
        // Optimistic update
        setReservations(prev => prev.map(r => r.id === id ? { ...r, pipeline_stage: newStage } : r))

        const result = await updatePipelineStage(id, newStage)
        if (result.error) {
            toast.error(result.error)
            // Revert
            setReservations(initialData)
        } else {
            toast.success("Etapa actualizada")
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
            {STAGES.map(stage => {
                const items = reservations.filter(r => r.pipeline_stage === stage.id)
                return (
                    <div key={stage.id} className="flex flex-col gap-4 bg-gray-50/50 rounded-lg p-2 min-h-[500px] border border-gray-100">
                        <div className={`p-3 rounded-md font-medium text-sm flex justify-between items-center ${stage.color}`}>
                            {stage.label}
                            <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs">
                                {items.length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-3 overflow-y-auto flex-1">
                            {items.map(item => (
                                <PipelineCard
                                    key={item.id}
                                    reservation={item}
                                    onMove={(newStage) => handleMove(item.id, newStage)}
                                // Pass simpler function to avoid complex logic in card potentially
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
