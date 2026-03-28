"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { OrgProvider } from "@/context/OrgContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    // Show loading spinner while Firebase checks auth state
    if (loading) {
        return (
            <div
                className="flex h-screen items-center justify-center"
                style={{ background: "var(--background)" }}
            >
                <Loader2
                    size={28}
                    className="animate-spin"
                    style={{ color: "var(--accent)" }}
                />
            </div>
        );
    }

    // Not logged in — useEffect will redirect, render nothing
    if (!user) return null;

    return (
        <OrgProvider>
            <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-y-auto">
                    {children}
                </main>
            </div>
        </OrgProvider>
    );
}
