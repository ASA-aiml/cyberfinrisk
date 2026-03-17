"use client";

import { useState } from "react";
import { Building2, Shield, CheckCircle, Loader2, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

interface OnboardingOverlayProps {
    onSuccess: () => void;
}

export default function OnboardingOverlay({ onSuccess }: OnboardingOverlayProps) {
    const { user } = useAuth();
    const [form, setForm] = useState({
        name: "",
        slug: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!form.name || form.name.length < 3) return;
        if (!user) {
            setError("You must be logged in to create an organization.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.createOrganization({
                name: form.name,
                slug: form.slug,
                plan: "pro", // Default to pro for new users as per existing logic
                creator_uuid: user.uid
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Failed to create organization");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 py-12 bg-[#09090b]">
            {/* Background decoration */}
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
                style={{ background: "radial-gradient(circle, #e63946 0%, transparent 70%)" }}
            />

            <div className="w-full max-w-xl relative animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2.5 mb-8">
                        <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-[#e6394622]"
                            style={{ background: "linear-gradient(135deg, #e63946, #c1121f)" }}
                        >
                            C
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-white">CyberFinRisk</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-3">Welcome to the future of risk</h1>
                    <p className="text-zinc-400 text-lg">
                        To get started, let's set up your organization workspace.
                    </p>
                </div>

                <div 
                    className="rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-md"
                    style={{ 
                        background: "rgba(18, 18, 21, 0.8)", 
                        border: "1px solid rgba(39, 39, 42, 0.8)" 
                    }}
                >
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-zinc-500">
                                Organization Name
                            </label>
                            <input 
                                type="text" 
                                placeholder="e.g. Acme Corporation"
                                value={form.name}
                                onChange={e => {
                                    const val = e.target.value;
                                    setForm({ name: val, slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-') });
                                }}
                                className="w-full rounded-xl px-5 h-14 text-base outline-none transition-all"
                                style={{ 
                                    background: "rgba(39, 39, 42, 0.5)", 
                                    border: "1px solid rgba(63, 63, 70, 0.5)", 
                                    color: "white"
                                }}
                                onFocus={e => {
                                    e.target.style.borderColor = "#e63946";
                                    e.target.style.background = "rgba(39, 39, 42, 0.8)";
                                }}
                                onBlur={e => {
                                    e.target.style.borderColor = "rgba(63, 63, 70, 0.5)";
                                    e.target.style.background = "rgba(39, 39, 42, 0.5)";
                                }}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black mb-2 uppercase tracking-[0.2em] text-zinc-500">
                                Organization Slug
                            </label>
                            <div className="flex rounded-xl items-stretch overflow-hidden h-14 transition-all" style={{ background: "rgba(39, 39, 42, 0.5)", border: "1px solid rgba(63, 63, 70, 0.5)" }} >
                                <div className="px-5 text-sm font-bold flex items-center whitespace-nowrap bg-zinc-900/50 text-zinc-500 border-r border-zinc-800">
                                    cyberfinrisk.app/
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="acme-corp"
                                    value={form.slug}
                                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '') }))}
                                    className="w-full bg-transparent px-5 text-base outline-none h-full text-white"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button 
                                onClick={handleCreate}
                                disabled={loading || form.name.length < 3}
                                className="w-full px-6 py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
                                style={{ 
                                    background: "linear-gradient(135deg, #e63946, #c1121f)",
                                    boxShadow: "0 10px 30px -10px rgba(230, 57, 70, 0.4)"
                                }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : <Building2 size={20} />}
                                {loading ? "Initializing workspace..." : "Create Workspace"}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                        <div className="h-px flex-1 bg-zinc-800" />
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-600">Why an organization?</span>
                        <div className="h-px flex-1 bg-zinc-800" />
                    </div>

                    <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                        <Info className="w-5 h-5 text-[#e63946] shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Organizations are mandatory to provide enterprise-grade isolation, team collaboration, and unified billing. You can always rename it or add teammates later.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
