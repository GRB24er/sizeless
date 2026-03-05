"use client";

// ═══════════════════════════════════════════════════════════════
// src/components/features/dashboard/shipments/AnalyticsPanel.tsx
// Vault Analytics Dashboard — Stats, charts, portfolios, revenue
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import {
  Activity,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Briefcase,
  CheckCircle,
  Clock,
  DollarSign,
  Gem,
  Globe,
  Layers,
  Loader2,
  Lock,
  Package,
  PieChart,
  RefreshCw,
  Scale,
  Shield,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  getVaultOverview,
  getClientPortfolios,
  getRevenueAnalytics,
  getVaultActivityLog,
  getWithdrawalAnalytics,
} from "@/app/(root)/shipments/vault-analytics-actions";

// ─── TYPES ───────────────────────────────────────────────────

type VaultOverview = Awaited<ReturnType<typeof getVaultOverview>>;
type ClientPortfolio = Awaited<ReturnType<typeof getClientPortfolios>>;
type RevenueData = Awaited<ReturnType<typeof getRevenueAnalytics>>;
type WithdrawalData = Awaited<ReturnType<typeof getWithdrawalAnalytics>>;
type ActivityData = Awaited<ReturnType<typeof getVaultActivityLog>>;

// ─── HELPERS ─────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const fmtCurrencyExact = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtWeight = (g: number) =>
  g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${g.toFixed(1)} g`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

// ─── MINI BAR CHART ──────────────────────────────────────────

function MiniBarChart({
  data,
  dataKey,
  label,
  color,
  height = 120,
}: {
  data: { month: string; [key: string]: any }[];
  dataKey: string;
  label: string;
  color: string;
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d[dataKey] || 0), 1);

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((d, i) => {
          const h = ((d[dataKey] || 0) / max) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t-sm transition-all hover:opacity-80"
                style={{
                  height: `${Math.max(h, 2)}%`,
                  backgroundColor: color,
                  minHeight: 2,
                }}
              />
              <span className="text-[9px] text-gray-400 truncate w-full text-center">
                {d.month}
              </span>
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                {d.month}: {typeof d[dataKey] === "number" && d[dataKey] > 100
                  ? fmtCurrency(d[dataKey])
                  : d[dataKey]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── PROGRESS BAR ────────────────────────────────────────────

function ProgressBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

// ─── STATUS LABEL MAP ────────────────────────────────────────

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING_KYC: { label: "Pending KYC", color: "#f59e0b" },
  KYC_APPROVED: { label: "KYC Approved", color: "#3b82f6" },
  KYC_REJECTED: { label: "KYC Rejected", color: "#ef4444" },
  INTAKE_SCHEDULED: { label: "Intake Scheduled", color: "#8b5cf6" },
  INTAKE_IN_PROGRESS: { label: "Intake In Progress", color: "#6366f1" },
  PENDING_VERIFICATION: { label: "Pending Verification", color: "#f97316" },
  ASSAY_IN_PROGRESS: { label: "Assay In Progress", color: "#a855f7" },
  VERIFICATION_COMPLETE: { label: "Verified", color: "#10b981" },
  DOCUMENTED: { label: "Documented", color: "#0ea5e9" },
  IN_STORAGE: { label: "In Storage", color: "#059669" },
  RELEASE_REQUESTED: { label: "Release Requested", color: "#d97706" },
  RELEASE_APPROVED: { label: "Release Approved", color: "#2563eb" },
  RELEASED: { label: "Released", color: "#6b7280" },
  LIQUIDATED: { label: "Liquidated", color: "#64748b" },
  SUSPENDED: { label: "Suspended", color: "#dc2626" },
};

const feeTypeLabels: Record<string, string> = {
  STORAGE_FEE: "Storage Fees",
  INTAKE_FEE: "Intake Fees",
  ASSAY_FEE: "Assay Fees",
  INSURANCE_FEE: "Insurance",
  ESCORT_FEE: "Security Escort",
  WITHDRAWAL_FEE: "Withdrawal Fees",
  LIQUIDATION_COMMISSION: "Liquidation Commission",
  WIRE_TRANSFER_FEE: "Wire Transfer",
  KYC_FEE: "KYC Processing",
  DOCUMENTATION_FEE: "Documentation",
  LATE_FEE: "Late Fees",
  OTHER: "Other",
};

// ═══════════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════════

type Tab = "overview" | "clients" | "revenue" | "activity";

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYTICS PANEL
// ═══════════════════════════════════════════════════════════════

export default function AnalyticsPanel({ adminId }: { adminId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<VaultOverview>(null);
  const [portfolios, setPortfolios] = useState<ClientPortfolio>({ portfolios: [] });
  const [revenue, setRevenue] = useState<RevenueData>(null);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalData>(null);
  const [activities, setActivities] = useState<ActivityData>({ activities: [] });

  const loadAll = async () => {
    setLoading(true);
    const [o, p, r, w, a] = await Promise.all([
      getVaultOverview(),
      getClientPortfolios(),
      getRevenueAnalytics(),
      getWithdrawalAnalytics(),
      getVaultActivityLog({ limit: 30 }),
    ]);
    setOverview(o);
    setPortfolios(p);
    setRevenue(r);
    setWithdrawalData(w);
    setActivities(a);
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const tabs: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "clients", label: "Client Portfolios", icon: Users },
    { key: "revenue", label: "Revenue", icon: DollarSign },
    { key: "activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vault Analytics</h2>
            <p className="text-xs text-gray-500">Real-time vault utilization, portfolios & revenue</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {activeTab === "overview" && overview && <OverviewTab overview={overview} withdrawalData={withdrawalData} />}
          {activeTab === "clients" && <ClientsTab portfolios={portfolios} />}
          {activeTab === "revenue" && revenue && <RevenueTab revenue={revenue} />}
          {activeTab === "activity" && <ActivityTab activities={activities} />}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════

function OverviewTab({ overview, withdrawalData }: { overview: NonNullable<VaultOverview>; withdrawalData: WithdrawalData }) {
  const s = overview.summary;

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1628] to-[#122041] border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-[#D4A853]" />
              <span className="text-xs text-gray-400 uppercase tracking-wide">Total Weight</span>
            </div>
            <p className="text-2xl font-bold text-white">{fmtWeight(s.totalWeightGrams)}</p>
            <p className="text-xs text-gray-500 mt-1">{s.totalWeightOz} troy oz</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Gem className="w-4 h-4 text-amber-700" />
              <span className="text-xs text-amber-700 uppercase tracking-wide">Custodied Value</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{fmtCurrency(s.totalValue)}</p>
            <p className="text-xs text-amber-600 mt-1">{s.inStorageCount} deposits</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span className="text-xs text-emerald-700 uppercase tracking-wide">Monthly Revenue</span>
            </div>
            <p className="text-2xl font-bold text-emerald-900">{fmtCurrencyExact(s.monthlyRevenue)}</p>
            <p className="text-xs text-emerald-600 mt-1">Projected: {fmtCurrency(s.annualProjected)}/yr</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-700" />
              <span className="text-xs text-blue-700 uppercase tracking-wide">Insurance Coverage</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{s.insuranceCoverage}%</p>
            <p className="text-xs text-blue-600 mt-1">Insured: {fmtCurrency(s.totalInsured)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deposit Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Deposit Trend (12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={overview.monthlyTrend}
              dataKey="deposits"
              label="New deposits per month"
              color="#D4A853"
            />
          </CardContent>
        </Card>

        {/* Value Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Value Inflow (12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart
              data={overview.monthlyTrend}
              dataKey="value"
              label="Value deposited per month"
              color="#059669"
            />
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChart className="w-4 h-4" /> Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(overview.statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const cfg = statusLabels[status] || { label: status, color: "#6b7280" };
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cfg.color }}
                      />
                      <span className="text-xs text-gray-700">{cfg.label}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-900">{count}</span>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Asset Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Asset Breakdown (In Storage)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(overview.assetBreakdown).map(([type, data]) => (
              <div key={type} className="p-3 rounded-lg bg-gray-50">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold">{type}</span>
                  <span className="text-xs text-gray-500">{data.count} deposits</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{fmtWeight(data.weight)}</span>
                  <span className="font-semibold text-amber-700">{fmtCurrency(data.value)}</span>
                </div>
              </div>
            ))}
            {Object.keys(overview.assetBreakdown).length === 0 && (
              <p className="text-xs text-gray-400 italic">No assets in storage</p>
            )}
          </CardContent>
        </Card>

        {/* Vault Locations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" /> Vault Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(overview.locationDist).map(([loc, data]) => (
              <div key={loc} className="p-3 rounded-lg bg-gray-50">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold">{loc}</span>
                  <span className="text-xs text-gray-500">{data.count} deposits</span>
                </div>
                <p className="text-xs text-gray-600">{fmtWeight(data.weight)}</p>
              </div>
            ))}
            {Object.keys(overview.locationDist).length === 0 && (
              <p className="text-xs text-gray-400 italic">No location data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Summary */}
      {withdrawalData && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4" /> Withdrawal Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <p className="text-2xl font-bold text-gray-800">{withdrawalData.totalWithdrawals}</p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-700">{withdrawalData.completed}</p>
                <p className="text-xs text-emerald-600">Completed</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50">
                <p className="text-2xl font-bold text-amber-700">{withdrawalData.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-50">
                <p className="text-2xl font-bold text-blue-700">{fmtCurrency(withdrawalData.totalLiquidated)}</p>
                <p className="text-xs text-blue-600">Liquidated Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CLIENT PORTFOLIOS TAB
// ═══════════════════════════════════════════════════════════════

function ClientsTab({ portfolios }: { portfolios: ClientPortfolio }) {
  if (portfolios.portfolios.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Active Clients</h3>
          <p className="text-sm text-gray-500 mt-1">Client portfolios appear when deposits are in storage.</p>
        </CardContent>
      </Card>
    );
  }

  const totalValue = portfolios.portfolios.reduce((s, p) => s + p.totalValue, 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {portfolios.portfolios.length} active client{portfolios.portfolios.length !== 1 ? "s" : ""} •
        Total custodied: <strong className="text-amber-700">{fmtCurrency(totalValue)}</strong>
      </p>

      {portfolios.portfolios.map((p, i) => (
        <Card key={p.client.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0a1628] to-[#122041] flex items-center justify-center text-white font-bold text-sm">
                  {p.client.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{p.client.name}</p>
                  <p className="text-xs text-gray-500">{p.client.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.depositCount} deposit{p.depositCount !== 1 ? "s" : ""} •
                    {fmtWeight(p.totalWeight)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-[#D4A853]">{fmtCurrency(p.totalValue)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Fees: {fmtCurrencyExact(p.monthlyFees)}/mo
                </p>
              </div>
            </div>

            {/* Portfolio bar */}
            <div className="mt-4 space-y-2">
              <ProgressBar
                value={p.totalInsured}
                max={p.totalValue}
                color="#3b82f6"
                label={`Insurance coverage: ${fmtCurrency(p.totalInsured)} of ${fmtCurrency(p.totalValue)}`}
              />
              <ProgressBar
                value={p.totalValue}
                max={totalValue}
                color="#D4A853"
                label={`Portfolio share`}
              />
            </div>

            {/* Asset chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {p.assets.map((a, j) => (
                <span
                  key={j}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-700"
                >
                  <Gem className="w-3 h-3" />
                  {a.type}: {fmtWeight(a.weight)}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// REVENUE TAB
// ═══════════════════════════════════════════════════════════════

function RevenueTab({ revenue }: { revenue: NonNullable<RevenueData> }) {
  const s = revenue.summary;

  return (
    <div className="space-y-6">
      {/* Revenue Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#0a1628] to-[#122041] border-0">
          <CardContent className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Total Invoiced</p>
            <p className="text-2xl font-bold text-white mt-2">{fmtCurrency(s.totalInvoiced)}</p>
            <p className="text-xs text-gray-500 mt-1">{s.invoiceCount} invoices</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-5">
            <p className="text-xs text-emerald-700 uppercase tracking-wide">Collected</p>
            <p className="text-2xl font-bold text-emerald-800 mt-2">{fmtCurrency(s.totalCollected)}</p>
            <p className="text-xs text-emerald-600 mt-1">{s.paidCount} paid</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-5">
            <p className="text-xs text-amber-700 uppercase tracking-wide">Outstanding</p>
            <p className="text-2xl font-bold text-amber-800 mt-2">{fmtCurrency(s.totalOutstanding)}</p>
            <p className="text-xs text-amber-600 mt-1">Collection rate: {s.collectionRate}%</p>
          </CardContent>
        </Card>
        <Card className={s.overdueCount > 0 ? "bg-red-50 border-red-200" : ""}>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Overdue</p>
            <p className={`text-2xl font-bold mt-2 ${s.overdueCount > 0 ? "text-red-700" : "text-gray-400"}`}>
              {s.overdueCount}
            </p>
            <p className="text-xs text-gray-400 mt-1">Avg invoice: {fmtCurrencyExact(s.avgInvoiceValue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Monthly Revenue (12 months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniBarChart
            data={revenue.monthlyRevenue}
            dataKey="collected"
            label="Collected revenue per month"
            color="#059669"
            height={140}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Fee Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" /> Revenue by Fee Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(revenue.revenueByType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, amount]) => {
                const total = Object.values(revenue.revenueByType).reduce((s, v) => s + v, 0);
                const pct = total > 0 ? (amount / total) * 100 : 0;
                return (
                  <div key={type} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-gray-700">{feeTypeLabels[type] || type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-900 w-20 text-right">
                        {fmtCurrencyExact(amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            {Object.keys(revenue.revenueByType).length === 0 && (
              <p className="text-xs text-gray-400 italic">No revenue data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(revenue.paymentMethods)
              .sort((a, b) => b[1] - a[1])
              .map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-xs font-medium text-gray-700">
                    {method.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-bold">{fmtCurrencyExact(amount)}</span>
                </div>
              ))}
            {Object.keys(revenue.paymentMethods).length === 0 && (
              <p className="text-xs text-gray-400 italic">No payment data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY LOG TAB
// ═══════════════════════════════════════════════════════════════

function ActivityTab({ activities }: { activities: ActivityData }) {
  const actionColors: Record<string, string> = {
    STATUS_CHANGED: "bg-blue-100 text-blue-700",
    KYC_SUBMITTED: "bg-purple-100 text-purple-700",
    KYC_APPROVED: "bg-emerald-100 text-emerald-700",
    KYC_REJECTED: "bg-red-100 text-red-700",
    INTAKE_SCHEDULED: "bg-indigo-100 text-indigo-700",
    ASSAY_COMPLETED: "bg-violet-100 text-violet-700",
    ASSAY_FAILED: "bg-red-100 text-red-700",
    INSURANCE_ACTIVATED: "bg-blue-100 text-blue-700",
    PLACED_IN_STORAGE: "bg-emerald-100 text-emerald-700",
    WITHDRAWAL_REQUESTED: "bg-orange-100 text-orange-700",
    WITHDRAWAL_APPROVED: "bg-blue-100 text-blue-700",
    WITHDRAWAL_COMPLETED: "bg-gray-100 text-gray-700",
    LIQUIDATION_COMPLETED: "bg-emerald-100 text-emerald-700",
    NOTE_ADDED: "bg-gray-100 text-gray-600",
  };

  if (activities.activities.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No Activity Yet</h3>
          <p className="text-sm text-gray-500 mt-1">Vault activity will appear here as deposits are processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-500 mb-4">
        Showing last {activities.activities.length} vault activities
      </p>
      {activities.activities.map((a: any, i: number) => {
        const colorClass = actionColors[a.action] || "bg-gray-100 text-gray-600";
        return (
          <div
            key={a.id || i}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className={`shrink-0 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>
              {a.action.replace(/_/g, " ")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800">{a.description}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                <span className="font-mono">{a.deposit?.depositNumber || "—"}</span>
                <span>{fmtDate(a.createdAt)}</span>
                {a.performedBy && <span>by {a.performedBy}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
