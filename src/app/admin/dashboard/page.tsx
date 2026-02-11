import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminDashboard() {
    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-[#36595F]">Panel de Administración</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Bienvenido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Has iniciado sesión correctamente en el sistema.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
