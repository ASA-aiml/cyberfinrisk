"use client";

import React, { createContext, useContext, useState } from "react";
import { ORGANIZATIONS } from "@/lib/mock-data";
import type { Organization, Team } from "@/lib/mock-data";

interface OrgContextType {
    activeTenant: Organization;
    setActiveTenant: (tenant: Organization) => void;
    activeGroup: Organization;
    setActiveGroup: (group: Organization) => void;
    activeOrg: Team;
    setActiveOrg: (org: Team) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: React.ReactNode }) {
    // Default mock initializations matching Sidebar.tsx
    const [activeTenant, setActiveTenant] = useState<Organization>(ORGANIZATIONS[0]!);
    const [activeGroup, setActiveGroup] = useState<Organization>(ORGANIZATIONS[1]!);
    const [activeOrg, setActiveOrg] = useState<Team>(ORGANIZATIONS[1]!.teams[0]!);

    return (
        <OrgContext.Provider 
            value={{ 
                activeTenant, setActiveTenant, 
                activeGroup, setActiveGroup, 
                activeOrg, setActiveOrg 
            }}
        >
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const context = useContext(OrgContext);
    if (context === undefined) {
        throw new Error("useOrg must be used within an OrgProvider");
    }
    return context;
}
