"use client";

import React, { useState, useEffect } from "react";
import { 
    Github, 
    Search, 
    RefreshCw, 
    Trash2, 
    History, 
    ShieldAlert, 
    Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import { useOrg } from "@/context/OrgContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Project } from "@/lib/types";
import { fmtMoney } from "@/lib/utils";

// ── Components ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const { activeOrg, activeGroup } = useOrg();
    const { user } = useAuth();
    const router = useRouter();
    
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanningAll, setScanningAll] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchProjects = async () => {
        if (!activeOrg) return;
        setLoading(true);
        try {
            const data = await api.listProjects(activeOrg.id, activeGroup?.id, user?.uid);
            setProjects(data);
        } catch (err) {
            console.error("Failed to fetch projects", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, [activeOrg?.id, activeGroup?.id, user?.uid]);

    const handleScanAll = async () => {
        if (!activeOrg || scanningAll) return;
        setScanningAll(true);
        try {
            await api.scanAllProjects(activeOrg.id, activeGroup?.id, user?.uid);
            await fetchProjects();
        } catch (err) {
            console.error("Scan all failed", err);
        } finally {
            setScanningAll(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this project? Results will be permanently removed.")) return;
        try {
            await api.deleteProject(id);
            setProjects((prev: Project[]) => prev.filter((p: Project) => p.id !== id));
        } catch (err) {
            console.error("Failed to delete project", err);
        }
    };

    const filteredProjects = projects.filter((p: Project) => 
        p.repo_url.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRepoName = (url: string) => {
        try {
            const parts = url.replace(/\/$/, "").split("/");
            return parts[parts.length - 1];
        } catch {
            return url;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0d0f11]">
            <TopBar 
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleScanAll}
                            disabled={scanningAll || projects.length === 0}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold text-white transition-all hover:bg-zinc-800 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: scanningAll ? "var(--accent)" : "transparent" }}
                        >
                            {scanningAll ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            {scanningAll ? "Scanning..." : "Scan all projects"}
                        </button>
                    </div>
                }
            />
            
            <div className="px-8 py-8 md:py-10 max-w-5xl mx-auto w-full flex-1">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2 italic uppercase">
                            {activeGroup ? `${activeGroup.name} Assets` : `${activeOrg?.name} Portfolio`}
                        </h1>
                        <p className="text-sm text-zinc-500 font-medium">
                            Managing high-stakes security risk across your infrastructure.
                        </p>
                    </div>
                    
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                        <input 
                            type="text"
                            placeholder="Search repositories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[#0d0f11] border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 size={40} className="animate-spin text-[var(--accent)] mb-4" />
                        <p className="text-zinc-400 animate-pulse">Scanning database...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800 border-dashed p-20 text-center bg-[#15171a]/20">
                        <div className="bg-zinc-800/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800/50">
                            <Github size={30} className="text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">No active projects</h3>
                        <p className="text-zinc-500 max-w-sm mx-auto mb-8 text-sm">
                            {searchTerm ? "No projects match your search criteria." : "Infrastructure monitoring is currently inactive. Run a scan to initiate risk tracking."}
                        </p>
                        {!searchTerm && (
                            <a 
                                href="/dashboard/scan"
                                className="inline-flex items-center gap-3 px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-black transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-red-500/20"
                            >
                                <RefreshCw size={18} /> Initiate New Scan
                            </a>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProjects.map((project: Project) => (
                            <div 
                                key={project.id}
                                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                                className="group relative rounded-2xl border border-zinc-800 bg-[#15171a] p-6 hover:border-zinc-600 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-black/50 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent group-hover:via-[var(--accent)] transition-all" />
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-zinc-900 w-12 h-12 rounded-xl flex items-center justify-center border border-zinc-800 shadow-xl group-hover:border-zinc-700 transition-colors">
                                        <Github size={24} className="text-zinc-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Impact Level</div>
                                        <div className="text-xl font-black text-[var(--accent)] font-mono leading-none">
                                            {fmtMoney(project.total_expected_loss)}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-[var(--accent)] transition-colors">
                                        {getRepoName(project.repo_url)}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-zinc-500">{project.branch}</span>
                                        {project.gemini_enabled && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-black uppercase tracking-tighter">
                                                AI Reduced
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-bold uppercase tracking-tight">
                                        <span className="flex items-center gap-1">
                                            <ShieldAlert size={12} className={project.vulnerability_count > 0 ? "text-red-500" : "text-green-500"} />
                                            {project.vulnerability_count} RISKS
                                        </span>
                                        <span>|</span>
                                        <span className="flex items-center gap-1">
                                            <History size={12} /> {new Date(project.last_scanned_at || project.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => handleDelete(e, project.id)}
                                        className="p-2 rounded-lg text-zinc-700 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

