import { BackToSiteButton } from "@/components/BackToSiteButton";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {children}
            <BackToSiteButton />
        </div>
    );
}
