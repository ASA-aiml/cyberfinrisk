"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, Clock, Wand2, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import TopBar from "@/components/dashboard/TopBar";
import { api } from "@/lib/api";
import type { ProjectDetail, VulnerabilityResult } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
    if (!n) return "$0";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
}

const SEV_COLORS: Record<string, string> = {
    error: "#e63946",
    critical: "#e63946",
    high: "#f97316",
    warning: "#eab308",
    medium: "#eab308",
    low: "#22c55e",
    info: "#3b82f6",
};

function SevBadge({ sev }: { sev: string }) {
    const color = SEV_COLORS[sev?.toLowerCase()] ?? "#888";
    return (
        <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
        >
            {sev}
        </span>
    );
}

// ── AI Solve panel ─────────────────────────────────────────────────────────────

type SolveResult = {
    fix_summary: string;
    fix_code: string;
    explanation: string;
    fix_complexity: string;
    additional_steps: string;
};

function AISolvePanel({ projectId, vuln }: { projectId: string; vuln: VulnerabilityResult }) {
    const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [result, setResult] = useState<SolveResult | null>(null);
    const [error, setError] = useState("");
    const [open, setOpen] = useState(false);

    async function handleSolve() {
        setState("loading");
        setOpen(true);
        setError("");
        try {
            const data = await api.solveVulnerability(projectId, vuln.vulnerability_id);
            setResult(data);
            setState("done");
        } catch (e: any) {
            setError(e.message || "AI solve failed");
            setState("error");
        }
    }

    return (
        <div className="mt-2">
            {/* Button row */}
            <div className="flex items-center gap-2">
                {state === "idle" && (
                    <button
                        onClick={handleSolve}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 active:scale-95"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }}
                    >
                        <Wand2 size={12} /> AI Solve
                    </button>
                )}
                {state === "loading" && (
                    <div className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>
                        <Loader2 size={12} className="animate-spin" /> Analyzing with Gemini…
                    </div>
                )}
                {(state === "done" || state === "error") && (
                    <button
                        onClick={() => setOpen(o => !o)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                        style={{ background: state === "done" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: state === "done" ? "#22c55e" : "#ef4444" }}
                    >
                        {state === "done" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                        {state === "done" ? "Fix ready" : "Error"}
                        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                )}
            </div>

            {/* Result panel */}
            {open && state === "done" && result && (
                <div className="mt-3 rounded-xl p-4 space-y-3 text-sm" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}>
                    {/* Summary + complexity */}
                    <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold" style={{ color: "#c4b5fd" }}>{result.fix_summary}</p>
                        <span className="text-[11px] whitespace-nowrap px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                            {result.fix_complexity}
                        </span>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{result.explanation}</p>

                    {/* Fix code */}
                    {result.fix_code && (
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#7c3aed" }}>Fix</p>
                            <pre className="text-xs rounded-lg p-3 overflow-x-auto leading-relaxed" style={{ background: "rgba(0,0,0,0.4)", color: "#e2e8f0", border: "1px solid rgba(124,58,237,0.2)" }}>
                                {result.fix_code}
                            </pre>
                        </div>
                    )}

                    {/* Additional steps */}
                    {result.additional_steps && (
                        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", color: "#fbbf24" }}>
                            <strong>Additional steps:</strong> {result.additional_steps}
                        </div>
                    )}
                </div>
            )}

            {open && state === "error" && (
                <div className="mt-3 rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                    {error}
                </div>
            )}
        </div>
    );
}

// ── Vuln row ───────────────────────────────────────────────────────────────────

function VulnRow({ vuln, projectId, isLast }: { vuln: VulnerabilityResult; projectId: string; isLast: boolean }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <>
            <tr
                className="transition-colors hover:bg-zinc-900 cursor-pointer"
                style={{ borderBottom: !expanded && !isLast ? "1px solid var(--border)" : undefined }}
                onClick={() => setExpanded(e => !e)}
            >
                <td className="px-5 py-3.5 font-medium">
                    <div className="flex items-center gap-2">
                        {expanded ? <ChevronUp size={13} style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown size={13} style={{ color: "var(--muted-foreground)" }} />}
                        {vuln.bug_type.replace(/_/g, " ")}
                    </div>
                </td>
                <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                    {vuln.file}:{vuln.line}
                </td>
                <td className="px-5 py-3.5"><SevBadge sev={vuln.severity} /></td>
                <td className="px-5 py-3.5 font-bold" style={{ color: "var(--accent)" }}>
                    {fmtMoney(vuln.expected_loss)}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: "#22c55e" }}>
                    {fmtMoney(vuln.fix_cost_usd)}
                </td>
                <td className="px-5 py-3.5 font-semibold" style={{ color: "#f97316" }}>
                    {vuln.roi_of_fixing.toFixed(1)}×
                </td>
            </tr>
            {expanded && (
                <tr style={{ borderBottom: !isLast ? "1px solid var(--border)" : undefined }}>
                    <td colSpan={6} className="px-6 pb-5">
                        <div className="space-y-3">
                            {/* Scanner message */}
                            {vuln.message && (
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                    <strong style={{ color: "var(--foreground)" }}>Scanner:</strong> {vuln.message}
                                </p>
                            )}
                            {/* Gemini analysis */}
                            {vuln.gemini_analysis && (
                                <div className="text-xs rounded-lg px-3 py-2 space-y-1" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
                                    <p style={{ color: "#93c5fd" }}><strong>Gemini:</strong> {vuln.gemini_analysis.exploitability_reasoning}</p>
                                    {vuln.gemini_analysis.recommended_fix && (
                                        <p style={{ color: "#86efac" }}><strong>Suggested fix:</strong> {vuln.gemini_analysis.recommended_fix}</p>
                                    )}
                                </div>
                            )}
                            {/* Business brief */}
                            {vuln.business_brief && (
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{vuln.business_brief}</p>
                            )}
                            {/* AI Solve */}
                            <AISolvePanel projectId={projectId} vuln={vuln} />
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<ProjectDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        api.getProject(id)
            .then(setProject)
            .catch((e: any) => setError(e.message || "Failed to load project"))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex flex-col h-full">
            <TopBar />
            <div className="flex flex-1 items-center justify-center gap-3" style={{ color: "var(--muted-foreground)" }}>
                <Loader2 size={20} className="animate-spin" /> Loading project…
            </div>
        </div>
    );

    if (error || !project) return (
        <div className="flex flex-col h-full">
            <TopBar />
            <div className="px-10 py-16 text-center">
                <p className="text-lg font-semibold mb-2">{error || "Project not found"}</p>
                <Link href="/dashboard/projects" className="text-sm" style={{ color: "var(--accent)" }}>← Back to Projects</Link>
            </div>
        </div>
    );

    const vulns: VulnerabilityResult[] = project.scan_results ?? [];
    const repoName = project.repo_url?.split("/").pop() ?? "Project";

    return (
        <div className="flex flex-col h-full">
            <TopBar />
            <div className="px-6 md:px-10 py-8 max-w-7xl mx-auto w-full">

                {/* Back */}
                <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:opacity-80" style={{ color: "var(--muted-foreground)" }}>
                    <ArrowLeft size={14} /> Back to Projects
                </Link>

                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight mb-1">{repoName}</h1>
                        <div className="flex items-center gap-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                            <span className="flex items-center gap-1"><GitBranch size={12} /> {project.repo_url}</span>
                            {project.last_scanned_at && (
                                <span className="flex items-center gap-1"><Clock size={12} /> {new Date(project.last_scanned_at).toLocaleDateString()}</span>
                            )}
                        </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                        {project.status}
                    </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Total Expected Loss", val: fmtMoney(project.total_expected_loss), color: "var(--accent)" },
                        { label: "Total Fix Cost", val: fmtMoney(project.total_fix_cost), color: "#22c55e" },
                        { label: "Vulnerabilities", val: String(project.vulnerability_count) },
                        { label: "AI Powered", val: project.gemini_enabled ? "Yes" : "No", color: project.gemini_enabled ? "#a78bfa" : undefined },
                    ].map(m => (
                        <div key={m.label} className="rounded-xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                            <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{m.label}</div>
                            <div className="text-xl font-extrabold" style={{ color: m.color || "var(--foreground)" }}>{m.val}</div>
                        </div>
                    ))}
                </div>

                {/* Executive summary */}
                {project.executive_summary && (
                    <div className="rounded-xl p-5 mb-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                        <h2 className="font-bold text-sm mb-2">Executive Summary</h2>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{project.executive_summary}</p>
                    </div>
                )}

                {/* Vulnerability Table */}
                <div className="rounded-xl overflow-hidden mb-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <h2 className="font-bold text-sm">Vulnerabilities</h2>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            Click a row to expand details and get an AI fix · {vulns.length} found
                        </p>
                    </div>
                    {vulns.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No vulnerabilities recorded.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                                        {["Vulnerability", "File / Line", "Severity", "Expected Loss", "Fix Cost", "ROI"].map(h => (
                                            <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {vulns.map((v, i) => (
                                        <VulnRow key={v.vulnerability_id} vuln={v} projectId={id} isLast={i === vulns.length - 1} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Financial footer */}
                {vulns.length > 0 && (
                    <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            Fixing all <strong style={{ color: "var(--foreground)" }}>{vulns.length}</strong> vulnerabilities costs{" "}
                            <strong style={{ color: "#22c55e" }}>{fmtMoney(project.total_fix_cost)}</strong> and could save an estimated{" "}
                            <strong style={{ color: "var(--accent)" }}>{fmtMoney(project.total_expected_loss)}</strong> in expected losses.
                            {project.total_fix_cost > 0 && (
                                <> That&apos;s a <strong style={{ color: "#f97316" }}>{Math.round(project.total_expected_loss / project.total_fix_cost)}× ROI.</strong></>
                            )}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
