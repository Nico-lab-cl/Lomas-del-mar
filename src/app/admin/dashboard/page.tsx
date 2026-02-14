import { getAdminPipeline, getSellers } from "@/actions/dashboard"
import { AdminPipeline } from "@/components/dashboard/AdminPipeline"

export default async function AdminDashboard() {
    const [pipelineResult, sellersResult] = await Promise.all([
        getAdminPipeline(),
        getSellers()
    ])

    if (pipelineResult.error) {
        return <div className="p-8 text-center text-red-500 font-semibold">{pipelineResult.error}</div>
    }

    return (
        <div className="h-full w-full">
            <h2 className="text-2xl font-bold mb-6 text-[#36595F]">Control Global de Ventas</h2>
            <AdminPipeline
                initialData={pipelineResult.data as any}
                sellers={sellersResult.data || []}
            />
        </div>
    )
}
