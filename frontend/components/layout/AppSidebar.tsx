"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  Timer,
  HeartPulse,
  Users,
  Brain,
  GitMerge,
  Sliders,
  Sparkles,
  CheckCircle2,
  FolderArchive,
  FileSpreadsheet,
  Settings,
  LogOut,
  Dna,
  Shield,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { logoutAdmin, DESIGNATED_ADMIN_EMAIL } from "@/lib/supabase/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/drug-formulation", label: "Drug & Formulation", icon: Pill },
  { href: "/dissolution", label: "Dissolution", icon: Timer },
  { href: "/pk-pbpk", label: "PK / PBPK", icon: HeartPulse },
  { href: "/virtual-patients", label: "Virtual Patients", icon: Users },
  { href: "/ml", label: "Machine Learning", icon: Brain },
  { href: "/hybrid", label: "Hybrid Modeling", icon: GitMerge },
  { href: "/optimization", label: "Optimization", icon: Sliders },
  { href: "/explainable-ai", label: "Explainable AI", icon: Sparkles },
  { href: "/validation", label: "Validation", icon: CheckCircle2 },
  { href: "/results", label: "Research Results", icon: FolderArchive },
  { href: "/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to end your Private Admin session?")) {
      await logoutAdmin();
      router.replace("/login");
    }
  };

  return (
    <aside className="w-64 shrink-0 border-r border-surface-border bg-surface flex flex-col h-screen sticky top-0 overflow-hidden select-none">
      {/* Brand Header */}
      <div className="h-16 border-b border-surface-border flex items-center px-4 justify-between bg-background/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-card border border-pharma-cyan/40 text-pharma-cyan group-hover:border-pharma-cyan shadow-sm shadow-pharma-cyan/10 transition-colors">
            <Dna className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1 font-mono">
              PHARMA <span className="text-pharma-cyan">AI</span>
            </div>
            <div className="text-[9px] font-mono text-pharma-accent font-semibold tracking-wider">
              DRUG DELIVERY PLATFORM
            </div>
          </div>
        </Link>
      </div>

      {/* Prominent Environment Badge */}
      <div className="px-3 pt-3 pb-1">
        <div className="px-2.5 py-1.5 rounded bg-pharma-primary/10 border border-pharma-primary/30 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-pharma-cyan shrink-0" />
          <div className="text-[10px] font-mono font-bold text-pharma-accent tracking-wider uppercase truncate">
            PRIVATE ADMIN ENVIRONMENT
          </div>
        </div>
      </div>

      {/* Navigation List — Exactly 14 items */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 font-mono uppercase">
          RESEARCH MODULES
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? "bg-pharma-primary text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:bg-surface-hover hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? "text-white" : "text-pharma-cyan/80 group-hover:text-pharma-cyan"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="h-3.5 w-3.5 opacity-80" />}
            </Link>
          );
        })}

        {/* 14. Logout Item */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all cursor-pointer mt-2 border-t border-surface-border/50 pt-3"
        >
          <div className="flex items-center gap-2.5">
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>Logout</span>
          </div>
          <span className="text-[10px] font-mono uppercase opacity-70">Exit</span>
        </button>
      </div>

      {/* Admin User Footer — Strict Single Admin & Profile Shortcut */}
      <Link
        href="/settings/profile"
        className="border-t border-surface-border p-3 bg-background/60 hover:bg-surface-card transition-all block group cursor-pointer border-l-2 border-l-transparent hover:border-l-pharma-cyan"
        title="View & Edit Private Admin Profile"
      >
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-1.5 font-medium text-white truncate group-hover:text-pharma-cyan transition-colors">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate text-xs font-mono">{DESIGNATED_ADMIN_EMAIL}</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-pharma-cyan font-bold group-hover:border-pharma-cyan/60 transition-colors">
            ADMIN
          </span>
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
          <span>SINGLE-ADMIN AUTHENTICATED</span>
          <span className="text-pharma-cyan opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 font-semibold">
            Details →
          </span>
        </div>
      </Link>
    </aside>
  );
}
