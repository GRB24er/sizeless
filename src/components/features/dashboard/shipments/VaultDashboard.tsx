"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/VaultDashboard.tsx
// Admin Vault Command Center — Tabbed hub for all vault operations
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  Vault,
  Receipt,
  BarChart3,
  Gem,
  PlusCircle,
} from "lucide-react";

import VaultPanel from "./VaultPanel";
import BillingPanel from "./BillingPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import { AdminVaultCreate } from "@/components/features/dashboard/admin-vault-create";

const TABS = [
  {
    id: "deposits",
    label: "All Deposits",
    shortLabel: "Deposits",
    icon: Vault,
  },
  {
    id: "create",
    label: "New Deposit",
    shortLabel: "Create",
    icon: PlusCircle,
  },
  {
    id: "billing",
    label: "Billing & Invoicing",
    shortLabel: "Billing",
    icon: Receipt,
  },
  {
    id: "analytics",
    label: "Reports & Analytics",
    shortLabel: "Analytics",
    icon: BarChart3,
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function VaultDashboard({ adminId }: { adminId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("deposits");

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#0a1628] via-[#0d1f35] to-[#0a1628] border-b border-gray-800">
        <div className="px-4 lg:px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4A853] to-[#C09740] flex items-center justify-center shadow-lg">
              <Gem className="w-5 h-5 text-[#0a1628]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Vault Management
              </h1>
              <p className="text-xs text-gray-400">
                Gold custody, billing, analytics & compliance
              </p>
            </div>
          </div>
        </div>

        {/* ─── Tab Navigation ────────────────────────────────── */}
        <div className="px-4 lg:px-6">
          <div className="flex gap-1 overflow-x-auto pb-0 scrollbar-hide">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group relative flex items-center gap-2 px-4 py-3 text-sm font-medium 
                    whitespace-nowrap transition-all duration-200 rounded-t-lg
                    ${
                      isActive
                        ? "bg-gray-50/50 text-[#0a1628] shadow-sm"
                        : tab.id === "create"
                        ? "text-[#D4A853] hover:bg-white/10"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }
                  `}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? "text-[#D4A853]"
                        : tab.id === "create"
                        ? "text-[#D4A853]"
                        : "text-gray-500 group-hover:text-gray-300"
                    }`}
                  />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>

                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#D4A853] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Tab Content ──────────────────────────────────── */}
      <div className="p-4 lg:p-6">
        {activeTab === "deposits" && <VaultPanel adminId={adminId} />}
        {activeTab === "create" && <AdminVaultCreate />}
        {activeTab === "billing" && <BillingPanel adminId={adminId} />}
        {activeTab === "analytics" && <AnalyticsPanel adminId={adminId} />}
      </div>
    </div>
  );
}
