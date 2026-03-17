"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import { OrgProvider, useOrg } from "@/context/OrgContext";
import OnboardingOverlay from "@/components/dashboard/OnboardingOverlay";
import { Loader2 } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { organizations, loading, refetchOrgs } = useOrg();

    if (loading && organizations.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
            </div>
        );
    }

    if (!loading && organizations.length === 0) {
        return <OnboardingOverlay onSuccess={() => refetchOrgs()} />;
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-y-auto">
                {children}
            </main>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrgProvider>
            <DashboardContent>
                {children}
            </DashboardContent>
        </OrgProvider>
    );
}


