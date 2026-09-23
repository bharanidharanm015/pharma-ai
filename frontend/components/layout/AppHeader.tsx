"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, LogOut, Dna } from "lucide-react";
import { logoutAdmin, DESIGNATED_ADMIN_EMAIL } from "@/lib/supabase/auth";
import { useRouter } from "next/navigation";

export function AppHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const [selectedDrug, setSelectedDrug] = useState("Ibuprofen");

  const handleLogout = async () => {
    if (confirm("End administrator session and return to login?")) {
      await logoutAdmin();
      router.replace("/login");
    }
  };

  return (
    <header className="border-b border-surface-border bg-surface/80 backdrop-blur sticky top-0 z-30">
      {/* Top Prominent Notice Bar */}
      <div className="bg-pharma-primary/10 border-b border-pharma-primary/20 px-4 py-1 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 text-pharma-cyan font-bold tracking-wider uppercase">
          <ShieldCheck className="h-3.5 w-3.5 text-pharma-cyan" />
          <span>PRIVATE ADMIN RESEARCH ENVIRONMENT</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-semibold tracking-wider uppercase hidden sm:flex">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>RESEARCH SIMULATION — NOT CLINICALLY VALIDATED</span>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight font-mono">{title}</h1>
          </div>
          {subtitle && <p className="text-[11px] text-slate-400 hidden md:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Active Reference Drug Context */}
          <div className="flex items-center gap-2 text-xs bg-surface-card border border-surface-border rounded-md px-2.5 py-1.5">
            <span className="text-slate-400 font-mono text-[10px] uppercase font-bold">DRUG:</span>
            <select
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              className="bg-transparent text-pharma-cyan font-semibold text-xs focus:outline-none cursor-pointer font-mono"
            >
              <option value="Ibuprofen" className="bg-surface text-white">Ibuprofen (BCS II)</option>
              <option value="Metformin" className="bg-surface text-white">Metformin (BCS III)</option>
              <option value="Acetaminophen" className="bg-surface text-white">Acetaminophen (BCS I)</option>
              <option value="Atorvastatin" className="bg-surface text-white">Atorvastatin (BCS II)</option>
            </select>
          </div>

          {/* Single Admin Action */}
          <button
            onClick={handleLogout}
            title="Log Out"
            className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 rounded-md px-2.5 py-1.5 transition-colors cursor-pointer font-mono"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-400" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
