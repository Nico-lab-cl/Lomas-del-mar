"use client"

import { useState } from "react"
import { Reservation, Lot, User } from "@prisma/client"
import { AdminPipelineCard } from "./AdminPipelineCard"
import { updatePipelineStage, assignSeller } from "@/actions/dashboard"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ReservationWithDetails = Reservation & {
    lot: Lot
    buyer: User | null
    seller: User | null
}

const STAGES = [
    { id: "RESERVA_PAGADA", label: "Reserva Pagada", color: "bg-blue-100 text-blue-800" },
    { id: "ESPERANDO_PIE", label: "Esperando Pie", color: "bg-yellow-100 text-yellow-800" },
    { id: "PIE_PAGADO", label: "Pie Pagado / En Firma", color: "bg-purple-100 text-purple-800" },
    { id: "VENTA_CERRADA", label: "Venta Cerrada", color: "bg-green-100 text-green-800" }
]

export function AdminPipeline({ initialData, sellers }: { initialData: ReservationWithDetails[], sellers: any[] }) {
    const [reservations, setReservations] = useState(initialData)
    const [selectedSeller, setSelectedSeller] = useState<string>("ALL")

    const handleMove = async (id: string, newStage: string) => {
        setReservations(prev => prev.map(r => r.id === id ? { ...r, pipeline_stage: newStage } : r))
        const result = await updatePipelineStage(id, newStage)
        if (result.error) {
            toast.error(result.error)
            setReservations(initialData) // Revert or refetch ideally
        } else {
            toast.success("Etapa actualizada")
        }
    }

    const handleAssign = async (id: string, sellerId: string) => {
        const result = await assignSeller(id, sellerId)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("Vendedor reasignado")
            // Update local state to reflect new seller
            setReservations(prev => prev.map(r => r.id === id ? { ...r, seller_id: sellerId, seller: sellers.find(s => s.id === sellerId) } : r))
        }
    }

    const filteredReservations = selectedSeller === "ALL"
        ? reservations
        : reservations.filter(r => r.seller_id === selectedSeller)

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-end bg-white p-2 rounded shadow-sm">
                <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todos los vendedores</SelectItem>
                        {sellers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name || s.email}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
                {STAGES.map(stage => {
                    const items = filteredReservations.filter(r => r.pipeline_stage === stage.id)
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
                                    <AdminPipelineCard
                                        key={item.id}
                                        reservation={item}
                                        onMove={(newStage) => handleMove(item.id, newStage)}
                                        sellers={sellers}
                                        onAssign={(sellerId) => handleAssign(item.id, sellerId)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
