'use server'

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"

export async function getSellerPipeline() {
    const session = await auth()
    if (!session?.user?.id) return { error: "No autorizado" }

    try {
        const reservations = await prisma.reservation.findMany({
            where: { seller_id: session.user.id },
            include: {
                lot: true,
                buyer: true
            },
            orderBy: { created_at: 'desc' }
        })
        return { success: true, data: reservations }
    } catch (error) {
        console.error("Error getting seller pipeline:", error)
        return { error: "Error al cargar el pipeline" }
    }
}

export async function getAdminPipeline() {
    const session = await auth()
    if (session?.user?.role !== Role.ADMIN) return { error: "No autorizado" }

    try {
        const reservations = await prisma.reservation.findMany({
            include: {
                lot: true,
                buyer: true,
                seller: true
            },
            orderBy: { created_at: 'desc' }
        })
        return { success: true, data: reservations }
    } catch (error) {
        console.error("Error getting admin pipeline:", error)
        return { error: "Error al cargar el pipeline global" }
    }
}

export async function updatePipelineStage(reservationId: string, stage: string) {
    const session = await auth()
    if (!session?.user) return { error: "No autorizado" }

    // Validate access: Admin or the assigned Seller
    const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        select: { seller_id: true }
    })

    if (!reservation) return { error: "Reserva no encontrada" }

    if (session.user.role !== Role.ADMIN && reservation.seller_id !== session.user.id) {
        return { error: "No tienes permiso para modificar esta reserva" }
    }

    try {
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { pipeline_stage: stage }
        })
        revalidatePath('/seller/dashboard')
        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Error updating stage:", error)
        return { error: "Error al actualizar la etapa" }
    }
}

export async function updateReservationNotes(reservationId: string, notes: string) {
    const session = await auth()
    if (!session?.user) return { error: "No autorizado" }

    // Validate access
    const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        select: { seller_id: true }
    })

    if (!reservation) return { error: "Reserva no encontrada" }

    if (session.user.role !== Role.ADMIN && reservation.seller_id !== session.user.id) {
        return { error: "No tienes permiso" }
    }

    try {
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { notes }
        })
        revalidatePath('/seller/dashboard')
        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Error updating notes:", error)
        return { error: "Error al guardar notas" }
    }
}

export async function assignSeller(reservationId: string, sellerId: string) {
    const session = await auth()
    if (session?.user?.role !== Role.ADMIN) return { error: "No autorizado" }

    try {
        await prisma.reservation.update({
            where: { id: reservationId },
            data: { seller_id: sellerId }
        })
        revalidatePath('/admin/dashboard')
        return { success: true }
    } catch (error) {
        console.error("Error assigning seller:", error)
        return { error: "Error al reasignar vendedor" }
    }
}

export async function getSellers() {
    const session = await auth()
    if (session?.user?.role !== Role.ADMIN) return { error: "No autorizado" }

    try {
        const sellers = await prisma.user.findMany({
            where: { role: Role.SELLER },
            select: { id: true, name: true, email: true }
        })
        return { success: true, data: sellers }
    } catch (error) {
        return { error: "Error al cargar vendedores" }
    }
}
