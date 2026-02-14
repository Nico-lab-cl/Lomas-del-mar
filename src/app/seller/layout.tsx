import { DashboardLayout } from "@/components/layout/DashboardLayout"

export default function SellerLayout({ children }: { children: React.ReactNode }) {
    return <DashboardLayout role="SELLER">{children}</DashboardLayout>
}
