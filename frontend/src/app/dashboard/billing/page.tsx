"use client";

import { CreditCard, Download, CheckCircle, Zap } from "lucide-react";
import { ORGANIZATIONS } from "@/lib/mock-data";
import { fmtMoney } from "@/lib/utils";

const INVOICES = [
    { id: "INV-2026-003", date: "Mar 01, 2026", amount: 24900, status: "Paid" },
    { id: "INV-2026-002", date: "Feb 01, 2026", amount: 24900, status: "Paid" },
    { id: "INV-2026-001", date: "Jan 01, 2026", amount: 24900, status: "Paid" },
];

export default function BillingPage() {
    // In a real app, this would be the actual org from context/state
    const org = ORGANIZATIONS[1]!;
    
    const usage = {
        scans: { used: 840, limit: 1000 },
        projects: { used: 12, limit: 25 },
        members: { used: 5, limit: 10 }
    };

    return (
        <div className="px-6 md:px-10 py-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-extrabold tracking-tight mb-1">Billing & Plans</h1>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Manage your subscription and billing details for {org.name}
                </p>
            </div>

            {/* Current Plan Card */}
            <div 
                className="rounded-xl overflow-hidden mb-8 relative"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
                {/* Decorative background element */}
                <div 
                    className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 translate-x-1/3 -translate-y-1/3 pointer-events-none"
                    style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
                />

                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold">{org.plan} Plan</h2>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)" }}>
                                <CheckCircle size={12} /> Active
                            </span>
                        </div>
                        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                            You are currently on the {org.plan} plan. Next billing date is April 1, 2026.
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--foreground)" }}>$249</span>
                            <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>/ month</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <button 
                            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ background: "var(--accent)" }}
                        >
                            <Zap size={16} /> Upgrade Plan
                        </button>
                        <button 
                            className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors hover:bg-zinc-800"
                            style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                        >
                            Cancel Subscription
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Usage Limits */}
                <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h3 className="text-lg font-bold mb-5">Usage Limits</h3>
                    
                    <div className="space-y-5">
                        {/* Scans */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Monthly Scan Minutes</span>
                                <span style={{ color: "var(--muted-foreground)" }}>{usage.scans.used} / {usage.scans.limit}</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                                <div 
                                    className="h-full rounded-full transition-all" 
                                    style={{ width: `${(usage.scans.used / usage.scans.limit) * 100}%`, background: "var(--accent)" }}
                                />
                            </div>
                        </div>

                        {/* Projects */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Active Projects</span>
                                <span style={{ color: "var(--muted-foreground)" }}>{usage.projects.used} / {usage.projects.limit}</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                                <div 
                                    className="h-full rounded-full transition-all" 
                                    style={{ width: `${(usage.projects.used / usage.projects.limit) * 100}%`, background: "var(--blue)" }}
                                />
                            </div>
                        </div>

                        {/* Members */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium">Organization Members</span>
                                <span style={{ color: "var(--muted-foreground)" }}>{usage.members.used} / {usage.members.limit}</span>
                            </div>
                            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface)" }}>
                                <div 
                                    className="h-full rounded-full transition-all" 
                                    style={{ width: `${(usage.members.used / usage.members.limit) * 100}%`, background: "var(--orange)" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <h3 className="text-lg font-bold mb-5">Payment Method</h3>
                    
                    <div className="p-4 rounded-lg flex items-center justify-between mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-8 rounded bg-white flex items-center justify-center">
                                {/* Simulated Visa Logo */}
                                <div className="text-[#1a1f71] font-black italic text-lg tracking-tighter">VISA</div>
                            </div>
                            <div>
                                <div className="font-medium text-sm">•••• •••• •••• 4242</div>
                                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Expires 12/28</div>
                            </div>
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)" }}>
                            Default
                        </span>
                    </div>

                    <p className="text-xs leading-relaxed mb-5" style={{ color: "var(--muted-foreground)" }}>
                        This is your default payment method. It will be charged automatically at the start of each billing cycle.
                    </p>

                    <button 
                        className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-zinc-800 flex items-center justify-center gap-2"
                        style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
                    >
                        <CreditCard size={16} style={{ color: "var(--muted)" }} /> Update Payment Method
                    </button>
                </div>
            </div>

            {/* Invoices Table */}
            <h3 className="text-lg font-bold mb-4">Billing History</h3>
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Invoice</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Date</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Amount</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Status</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: "var(--muted-foreground)" }}>Download</th>
                            </tr>
                        </thead>
                        <tbody>
                            {INVOICES.map((inv, i) => (
                                <tr 
                                    key={inv.id} 
                                    className="hover:bg-zinc-800/50 transition-colors"
                                    style={{ borderBottom: i < INVOICES.length - 1 ? "1px solid var(--border)" : "none" }}
                                >
                                    <td className="px-5 py-4 font-medium" style={{ color: "var(--foreground)" }}>{inv.id}</td>
                                    <td className="px-5 py-4" style={{ color: "var(--muted-foreground)" }}>{inv.date}</td>
                                    <td className="px-5 py-4 font-medium">{fmtMoney(inv.amount)}</td>
                                    <td className="px-5 py-4">
                                        <span className="text-[11px] font-semibold px-2 py-1 rounded-md" style={{ background: "rgba(34,197,94,0.1)", color: "var(--green)" }}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <button 
                                            className="p-1.5 rounded-md transition-colors hover:bg-zinc-700 inline-flex items-center justify-center"
                                            style={{ color: "var(--muted)" }}
                                        >
                                            <Download size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
