"use client";

import { useState } from "react";
import { 
    UserPlus, 
    MoreHorizontal, 
    Shield, 
    Mail,
    Search
} from "lucide-react";
import { ORGANIZATIONS } from "@/lib/mock-data";

// ── Mock Data for Members ───────────────────────────────────────────────────

const MOCK_MEMBERS = [
    {
        id: "usr_1",
        name: "Alice Administrator",
        email: "alice@acme.com",
        role: "Owner",
        status: "Active",
        teams: ["Frontend Team", "Backend Team", "DevOps"],
        lastActive: "2 mins ago"
    },
    {
        id: "usr_2",
        name: "Bob Builder",
        email: "bob@acme.com",
        role: "Admin",
        status: "Active",
        teams: ["Frontend Team", "Backend Team"],
        lastActive: "1 hour ago"
    },
    {
        id: "usr_3",
        name: "Charlie Charlie",
        email: "charlie@acme.com",
        role: "Developer",
        status: "Active",
        teams: ["Backend Team"],
        lastActive: "Yesterday"
    },
    {
        id: "usr_4",
        name: "Diana Developer",
        email: "diana@acme.com",
        role: "Developer",
        status: "Active",
        teams: ["Frontend Team"],
        lastActive: "3 days ago"
    },
    {
        id: "usr_5",
        name: "Eve External",
        email: "eve@external.com",
        role: "Viewer",
        status: "Invited",
        teams: ["Frontend Team"],
        lastActive: "Never"
    }
];

const TABS = ["All Members", "Admins", "Pending Invites"];

export default function MembersPage() {
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [searchQuery, setSearchQuery] = useState("");
    
    // In a real app, this would be the actual org from context/state
    const org = ORGANIZATIONS[1]!;

    const filteredMembers = MOCK_MEMBERS.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              m.email.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === "Admins") return matchesSearch && (m.role === "Owner" || m.role === "Admin");
        if (activeTab === "Pending Invites") return matchesSearch && m.status === "Invited";
        return matchesSearch;
    });

    return (
        <div className="px-6 md:px-10 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight mb-1">Organization Members</h1>
                    <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        Manage access and roles for {org.name}
                    </p>
                </div>
                <button
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 text-white"
                    style={{ background: "var(--accent)" }}
                >
                    <UserPlus size={16} /> Invite Member
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div className="flex p-1 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                            style={{
                                background: activeTab === tab ? "var(--card)" : "transparent",
                                color: activeTab === tab ? "var(--foreground)" : "var(--muted-foreground)",
                                boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: "var(--muted)" }} />
                    <input 
                        type="text" 
                        placeholder="Search members..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg pl-9 pr-4 py-2 text-sm outline-none transition-colors"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        onFocus={e => e.target.style.borderColor = "var(--accent)"}
                        onBlur={e => e.target.style.borderColor = "var(--border)"}
                    />
                </div>
            </div>

            {/* Members Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.2)" }}>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Member</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Role</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Teams</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Status</th>
                                <th className="px-5 py-3 font-semibold text-xs uppercase tracking-wider text-right" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map((member, i) => (
                                    <tr 
                                        key={member.id} 
                                        className="hover:bg-zinc-800/50 transition-colors"
                                        style={{ borderBottom: i < filteredMembers.length - 1 ? "1px solid var(--border)" : "none" }}
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div 
                                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                                                    style={{ background: "var(--surface2)", color: "var(--muted-foreground)" }}
                                                >
                                                    {member.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{member.name}</div>
                                                    <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted)" }}>
                                                        <Mail size={10} /> {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {(member.role === "Owner" || member.role === "Admin") && 
                                                    <Shield size={12} style={{ color: member.role === "Owner" ? "var(--accent)" : "var(--blue)" }} />
                                                }
                                                <span className="font-medium" style={{ color: member.role === "Owner" ? "var(--accent)" : "var(--foreground)" }}>
                                                    {member.role}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                {member.teams.slice(0, 2).map(t => (
                                                    <span 
                                                        key={t}
                                                        className="text-[10px] px-2 py-0.5 rounded-full border"
                                                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted-foreground)" }}
                                                    >
                                                        {t}
                                                    </span>
                                                ))}
                                                {member.teams.length > 2 && (
                                                    <span 
                                                        className="text-[10px] px-2 py-0.5 rounded-full border"
                                                        style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted-foreground)" }}
                                                    >
                                                        +{member.teams.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span 
                                                className="text-[11px] font-semibold px-2 py-1 rounded-md"
                                                style={{ 
                                                    background: member.status === "Active" ? "rgba(34,197,94,0.1)" : "rgba(249,115,22,0.1)", 
                                                    color: member.status === "Active" ? "var(--green)" : "var(--orange)",
                                                }}
                                            >
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button 
                                                className="p-1.5 rounded-md transition-colors hover:bg-zinc-700"
                                                style={{ color: "var(--muted)" }}
                                            >
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                                        No members found matching your search criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
        </div>
    );
}
