import { BackToSiteButton } from "@/components/BackToSiteButton";

export default function UserLayout({
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
