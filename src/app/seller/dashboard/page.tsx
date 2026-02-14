import { getSellerPipeline } from "@/actions/dashboard"
import { SellerPipeline } from "@/components/dashboard/SellerPipeline"

export default async function SellerDashboard() {
    const result = await getSellerPipeline()

    if (result.error) {
        return <div className="p-8 text-center text-red-500 font-semibold">{result.error}</div>
    }

    return (
        <div className="h-full w-full">
            <h2 className="text-2xl font-bold mb-6 text-[#36595F]">Gestión de Ventas</h2>
            <SellerPipeline initialData={result.data as any} />
            {/* Type casting due to strict strict serialization, sometimes Date/Decimal needs clean up */}
        </div>
    )
}
