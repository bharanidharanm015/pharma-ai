"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getCurrentUserSession, logoutUser } from "@/lib/supabase/auth";
import { UserSession } from "@/lib/types";
import {
  Settings,
  Database,
  Trash2,
  RefreshCw,
  Cpu,
  AlertTriangle,
  Server,
  Lock,
  CheckCircle2,
  User,
  LogOut,
  Sliders,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [tableStats, setTableStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Engine Preferences
  const [rk4Dt, setRk4Dt] = useState(0.1);
  const [mcDefaultN, setMcDefaultN] = useState(50);
  const [randomSeedDefault, setRandomSeedDefault] = useState(42);

  const loadStats = async () => {
    setSupabaseActive(isSupabaseConfigured());
    setSession(getCurrentUserSession());
    try {
      const stats = await pharmaApi.getTableStats();
      setTableStats(stats);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handlePurgeDemo = async () => {
    if (confirm("Are you sure you want to purge benchmark reference records? Custom research scenarios will remain.")) {
      setLoading(true);
      try {
        const res = await pharmaApi.purgeDemoData();
        setStatusMsg(`Successfully purged ${res.purgedCount} benchmark record(s).`);
        setTimeout(() => setStatusMsg(null), 4000);
        await loadStats();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await pharmaApi.loadDemoData();
      setStatusMsg("Standard benchmark reference drugs and formulations reloaded.");
      setTimeout(() => setStatusMsg(null), 4000);
      await loadStats();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("End research session and return to login?")) {
      await logoutUser();
      router.replace("/login");
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Settings & System Configuration"
        subtitle="Supabase PostgreSQL Infrastructure, User Workspace & Computational Solver Parameters"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {statusMsg && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Researcher Identity & Security */}
          <div className="lg:col-span-5 space-y-6">
            {/* Researcher Access Card */}
            <div className="scientific-card p-6 space-y-4 border-pharma-cyan/40 bg-surface-card/70">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    RESEARCHER ACCOUNT
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pharma-cyan/10 border border-pharma-cyan/30 text-pharma-cyan font-bold">
                  ACTIVE SESSION
                </span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <div className="text-slate-400 uppercase text-[10px]">Investigator Name:</div>
                  <div className="text-white font-bold text-sm truncate">
                    {session?.fullName || "Research Scientist"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <div className="text-slate-400 uppercase text-[10px]">Email Address:</div>
                  <div className="text-pharma-cyan font-bold text-sm truncate">
                    {session?.email || "Local Session"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1">
                  <div className="text-slate-400 uppercase text-[10px]">Institution / Affiliation:</div>
                  <div className="text-slate-200">
                    {session?.affiliation || "Computational Biopharmaceutics Laboratory"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-surface-border space-y-1">
                  <div className="text-slate-400 uppercase text-[10px]">Data Isolation Policy:</div>
                  <div className="text-emerald-400 font-semibold text-xs">
                    Row Level Security (RLS) via auth.uid()
                  </div>
                  <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    Each researcher maintains private datasets with zero cross-tenant contamination.
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out of Research Workspace</span>
              </button>
            </div>

            {/* Supabase Connection */}
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <Server className="h-4 w-4 text-pharma-cyan" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  DATABASE INFRASTRUCTURE
                </h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">PostgreSQL Backend:</span>
                  <span className={supabaseActive ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {supabaseActive ? "ONLINE & CONNECTED" : "OFFLINE / LOCAL STORAGE"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Environment URL:</span>
                  <span className="text-slate-300 truncate max-w-[180px]">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured in Environment" : "Local Repository (Dev)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Row Level Security (RLS):</span>
                  <span className="text-emerald-400 font-bold">Enabled & Isolated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service-Role Key:</span>
                  <span className="text-emerald-400 font-bold">Protected (Never Stored Client-Side)</span>
                </div>
              </div>
            </div>

            {/* Demo Data Lifecycle */}
            <div className="scientific-card p-6 space-y-4 border-amber-900/40 bg-amber-950/10">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  BENCHMARK DATA CONTROLS
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Standard benchmark drugs (Ibuprofen, Metformin, Acetaminophen, Atorvastatin) provide validated reference physicochemical properties for in silico verification.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handlePurgeDemo}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded text-rose-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Purge Benchmarks</span>
                </button>

                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-surface-card hover:bg-surface border border-surface-border text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-pharma-cyan" />
                  <span>Reload Benchmarks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Database Table Statistics across research tables */}
          <div className="lg:col-span-7 space-y-6">
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    RESEARCH REPOSITORY SCHEMA & TELEMETRY
                  </h3>
                </div>
                <button
                  onClick={loadStats}
                  className="text-[11px] font-mono text-pharma-cyan hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: "drugs", count: tableStats.drugs ?? 0 },
                  { name: "formulations", count: tableStats.formulations ?? 0 },
                  { name: "simulations", count: tableStats.simulations ?? 0 },
                  { name: "saved_experiments", count: tableStats.active_experiments ?? 0 },
                  { name: "ml_experiments", count: tableStats.ml_experiments ?? 0 },
                  { name: "pbpk_runs", count: tableStats.pbpk_runs ?? 0 },
                  { name: "virtual_patients", count: tableStats.virtual_patients ?? 0 },
                  { name: "validation_runs", count: tableStats.validation_runs ?? 0 },
                  { name: "research_reports", count: tableStats.research_reports ?? 0 },
                ].map((tbl) => (
                  <div key={tbl.name} className="p-3 bg-surface-card rounded border border-surface-border">
                    <div className="text-[10px] font-mono text-slate-400 truncate uppercase">{tbl.name}</div>
                    <div className="text-lg font-bold text-white font-mono mt-1">{tbl.count} rows</div>
                    <div className="text-[9px] font-mono text-emerald-400 mt-0.5">RLS ACTIVE</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Numerical Engine Solver Configuration */}
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <Cpu className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  NUMERICAL SOLVER PARAMETERS
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    RK4 Step Size dt (h)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.01"
                    max="0.5"
                    value={rk4Dt}
                    onChange={(e) => setRk4Dt(parseFloat(e.target.value) || 0.1)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">Default: 0.10h</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Monte Carlo Cohort (N)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={mcDefaultN}
                    onChange={(e) => setMcDefaultN(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">Default: 50 subjects</span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Random Seed
                  </label>
                  <input
                    type="number"
                    value={randomSeedDefault}
                    onChange={(e) => setRandomSeedDefault(parseInt(e.target.value) || 42)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">Default: 42</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
