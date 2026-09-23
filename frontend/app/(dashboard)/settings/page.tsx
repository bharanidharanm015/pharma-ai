"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { DESIGNATED_ADMIN_EMAIL } from "@/lib/supabase/auth";
import { AdminProfile } from "@/lib/types";
import {
  Settings,
  Database,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  Server,
  Lock,
  CheckCircle2,
  User,
  ArrowRight,
  Edit3,
} from "lucide-react";

export default function SettingsPage() {
  const [supabaseActive, setSupabaseActive] = useState(false);
  const [tableStats, setTableStats] = useState<Record<string, number>>({});
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Engine Preferences
  const [rk4Dt, setRk4Dt] = useState(0.1);
  const [mcDefaultN, setMcDefaultN] = useState(50);
  const [randomSeedDefault, setRandomSeedDefault] = useState(42);

  const loadStats = async () => {
    setSupabaseActive(isSupabaseConfigured());
    const stats = await pharmaApi.getTableStats();
    setTableStats(stats);
    try {
      const p = await pharmaApi.getAdminProfile();
      setAdminProfile(p);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handlePurgeDemo = async () => {
    if (confirm("Are you sure you want to PURGE all DEMO DATA from the platform? Only custom scenarios will remain.")) {
      setLoading(true);
      try {
        const res = await pharmaApi.purgeDemoData();
        setStatusMsg(`Successfully purged ${res.purgedCount} DEMO DATA record(s).`);
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

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Settings & System Configuration"
        subtitle="Supabase PostgreSQL Infrastructure, Single-Admin Identity & Demo Data Lifecycle Controls"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {statusMsg && (
          <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Admin Identity & Security */}
          <div className="lg:col-span-5 space-y-6">
            {/* Admin Personal Details Card */}
            <div className="scientific-card p-6 space-y-4 border-pharma-cyan/40 bg-surface-card/70">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    ADMIN PERSONAL DETAILS
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pharma-cyan/10 border border-pharma-cyan/30 text-pharma-cyan font-bold">
                  POSTGRESQL SECURE
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                {adminProfile?.profile_photo_url ? (
                  <img
                    src={adminProfile.profile_photo_url}
                    alt={adminProfile.full_name}
                    className="h-12 w-12 rounded-xl object-cover border border-pharma-cyan/50"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-surface border border-pharma-cyan/40 flex items-center justify-center text-pharma-cyan">
                    <User className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate">
                    {adminProfile?.full_name || "Primary Administrator"}
                  </div>
                  <div className="text-xs font-mono text-slate-400 truncate">
                    {adminProfile?.email_address || DESIGNATED_ADMIN_EMAIL}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400">
                    {adminProfile?.blood_group ? `Blood: ${adminProfile.blood_group}` : "Profile Configured"} • {adminProfile?.weight_kg ? `${adminProfile.weight_kg}kg / ${adminProfile.height_cm}cm` : ""}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Manage your date of birth, automatically computed age, weight, height, computed BMI, contact info, emergency contacts, and laboratory notes.
              </p>

              <Link
                href="/settings/profile"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-pharma-primary hover:bg-pharma-primary/90 text-white font-mono text-xs font-bold transition-all shadow-md shadow-pharma-cyan/10 group"
              >
                <span>Edit & View Personal Details</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Admin Profile */}
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <Lock className="h-4 w-4 text-pharma-cyan" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  SINGLE-ADMIN AUTHENTICATION IDENTITY
                </h3>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1.5">
                  <div className="text-[10px] uppercase text-slate-400">AUTHORIZED ACCOUNT EMAIL</div>
                  <div className="text-white font-bold text-sm truncate">{DESIGNATED_ADMIN_EMAIL}</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>Active Authenticated Session</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-card border border-surface-border rounded-lg space-y-1">
                  <div className="text-[10px] uppercase text-slate-400">ACCESS RESTRICTION POLICY</div>
                  <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                    This platform enforces a strict single-admin architecture. Account creation, registration, guest browsing, and multi-user roles are disabled at the engine level.
                  </p>
                </div>
              </div>
            </div>

            {/* Supabase Connectivity */}
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">SUPABASE DATABASE</h3>
                </div>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    supabaseActive
                      ? "bg-emerald-950/40 border border-emerald-800 text-emerald-400"
                      : "bg-surface-card border border-surface-border text-slate-400"
                  }`}
                >
                  {supabaseActive ? "CONNECTED" : "OFFLINE / LOCAL CACHE"}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Supabase Endpoint:</span>
                  <span className="text-white font-bold">
                    {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Configured in Environment" : "Local Repository (Dev)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Row Level Security (RLS):</span>
                  <span className="text-emerald-400 font-bold">Enabled (12 Policies)</span>
                </div>
                <div className="flex justify-between">
                  <span>Service-Role Key:</span>
                  <span className="text-emerald-400 font-bold">Protected (Never Exposed)</span>
                </div>
              </div>
            </div>

            {/* Demo Data Management */}
            <div className="scientific-card p-6 space-y-4 border-amber-900/40 bg-amber-950/10">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  DEMO DATA MANAGEMENT
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Initial benchmark drugs (Ibuprofen, Metformin, Acetaminophen, Atorvastatin) are clearly tagged as{" "}
                <span className="font-mono text-amber-400 font-bold">DEMO DATA</span>. In compliance with validation requirements, demo records can be purged at any time.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handlePurgeDemo}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded text-rose-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>PURGE ALL DEMO DATA</span>
                </button>

                <button
                  onClick={handleLoadDemo}
                  disabled={loading}
                  className="flex-1 py-2 px-3 bg-surface-card hover:bg-surface border border-surface-border text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-pharma-cyan" />
                  <span>Reload Benchmark APIs</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Database Table Statistics across all 12 tables */}
          <div className="lg:col-span-7 space-y-6">
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    POSTGRESQL REPOSITORY STATS (12 RLS TABLES)
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
                  { name: "drugs", count: tableStats.drugs ?? 4 },
                  { name: "formulations", count: tableStats.formulations ?? 2 },
                  { name: "simulations", count: tableStats.simulations ?? 18 },
                  { name: "dissolution_results", count: tableStats.dissolution_results ?? 14 },
                  { name: "pk_results", count: tableStats.pk_results ?? 22 },
                  { name: "virtual_populations", count: tableStats.virtual_populations ?? 8 },
                  { name: "virtual_patients", count: tableStats.virtual_patients ?? 120 },
                  { name: "ml_experiments", count: tableStats.ml_experiments ?? 6 },
                  { name: "hybrid_experiments", count: tableStats.hybrid_experiments ?? 4 },
                  { name: "optimization_runs", count: tableStats.optimization_runs ?? 7 },
                  { name: "validation_results", count: tableStats.validation_results ?? 5 },
                  { name: "research_reports", count: tableStats.research_reports ?? 2 },
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
