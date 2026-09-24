"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  FlaskConical,
  Timer,
  Activity,
  GitBranch,
  Users,
  Brain,
  Cpu,
  Sparkles,
  Sliders,
  CheckCircle,
  BarChart3,
  FileText,
  BookmarkCheck,
  Settings,
  LogOut,
  Dna,
  ChevronRight,
  Shield,
} from "lucide-react";
import { logoutUser, getCurrentUserSession } from "@/lib/supabase/auth";
import { UserSession } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: any;
  colorClass: string; // Subtle section color dot or badge
}

interface NavSection {
  title: string;
  colorTitle: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "RESEARCH",
    colorTitle: "text-blue-400",
    items: [
      {
        href: "/drug-formulation?tab=drug",
        label: "Drug & Compound Research",
        icon: Pill,
        colorClass: "text-blue-400 group-hover:text-blue-300",
      },
      {
        href: "/drug-formulation?tab=formulation",
        label: "Formulation & QbD",
        icon: FlaskConical,
        colorClass: "text-purple-400 group-hover:text-purple-300",
      },
      {
        href: "/dissolution",
        label: "Dissolution",
        icon: Timer,
        colorClass: "text-purple-400 group-hover:text-purple-300",
      },
      {
        href: "/absorption",
        label: "Absorption",
        icon: Activity,
        colorClass: "text-emerald-400 group-hover:text-emerald-300",
      },
      {
        href: "/pk-pbpk",
        label: "PK/PBPK",
        icon: GitBranch,
        colorClass: "text-emerald-400 group-hover:text-emerald-300",
      },
      {
        href: "/virtual-patients",
        label: "Virtual Patients",
        icon: Users,
        colorClass: "text-emerald-400 group-hover:text-emerald-300",
      },
    ],
  },
  {
    title: "AI & MODELING",
    colorTitle: "text-orange-400",
    items: [
      {
        href: "/ml",
        label: "Machine Learning",
        icon: Brain,
        colorClass: "text-orange-400 group-hover:text-orange-300",
      },
      {
        href: "/hybrid",
        label: "Hybrid Modeling",
        icon: Cpu,
        colorClass: "text-orange-400 group-hover:text-orange-300",
      },
      {
        href: "/explainable-ai",
        label: "Explainable AI",
        icon: Sparkles,
        colorClass: "text-orange-400 group-hover:text-orange-300",
      },
      {
        href: "/optimization",
        label: "Optimization",
        icon: Sliders,
        colorClass: "text-amber-400 group-hover:text-amber-300",
      },
    ],
  },
  {
    title: "VALIDATION",
    colorTitle: "text-rose-400",
    items: [
      {
        href: "/validation",
        label: "Model Validation",
        icon: CheckCircle,
        colorClass: "text-rose-400 group-hover:text-rose-300",
      },
      {
        href: "/validation#sensitivity",
        label: "Sensitivity Analysis",
        icon: BarChart3,
        colorClass: "text-rose-400 group-hover:text-rose-300",
      },
    ],
  },
  {
    title: "RESULTS",
    colorTitle: "text-slate-300",
    items: [
      {
        href: "/results",
        label: "Research Results",
        icon: BookmarkCheck,
        colorClass: "text-slate-300 group-hover:text-white",
      },
      {
        href: "/reports",
        label: "Reports",
        icon: FileText,
        colorClass: "text-slate-300 group-hover:text-white",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getCurrentUserSession());
  }, []);

  const handleLogout = async () => {
    if (confirm("End research session and sign out?")) {
      await logoutUser();
      router.replace("/login");
    }
  };

  const isItemActive = (href: string) => {
    const cleanHref = href.split("?")[0].split("#")[0];
    const cleanPath = pathname.split("?")[0];
    if (cleanHref === "/dashboard") {
      return cleanPath === "/dashboard";
    }
    return cleanPath.startsWith(cleanHref);
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
              AI RESEARCH PLATFORM
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Dashboard Link */}
        <div>
          <Link
            href="/dashboard"
            className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
              pathname === "/dashboard"
                ? "bg-pharma-primary text-white shadow-sm font-semibold"
                : "text-slate-300 hover:bg-surface-hover hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard
                className={`h-4 w-4 shrink-0 transition-colors ${
                  pathname === "/dashboard" ? "text-white" : "text-sky-400 group-hover:text-white"
                }`}
              />
              <span>Dashboard</span>
            </div>
            {pathname === "/dashboard" && <ChevronRight className="h-3.5 w-3.5 opacity-80 shrink-0" />}
          </Link>
        </div>

        {/* 4 Categorized Sections */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-bold tracking-wider font-mono uppercase flex items-center justify-between">
              <span className={section.colorTitle}>{section.title}</span>
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.href);

              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all group ${
                    active
                      ? "bg-pharma-primary text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:bg-surface-hover hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors ${active ? "text-white" : item.colorClass}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {active && <ChevronRight className="h-3.5 w-3.5 opacity-80 shrink-0" />}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Settings Link */}
        <div className="pt-2 border-t border-surface-border/50">
          <Link
            href="/settings"
            className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all group ${
              pathname === "/settings"
                ? "bg-pharma-primary text-white shadow-sm font-semibold"
                : "text-slate-300 hover:bg-surface-hover hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings
                className={`h-3.5 w-3.5 shrink-0 ${
                  pathname === "/settings" ? "text-white" : "text-slate-400 group-hover:text-white"
                }`}
              />
              <span>Settings</span>
            </div>
            {pathname === "/settings" && <ChevronRight className="h-3.5 w-3.5 opacity-80 shrink-0" />}
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-all cursor-pointer mt-1"
          >
            <div className="flex items-center gap-2.5">
              <LogOut className="h-3.5 w-3.5 text-rose-400" />
              <span>Logout</span>
            </div>
            <span className="text-[10px] font-mono uppercase opacity-70">Exit</span>
          </button>
        </div>
      </div>

      {/* User Session Footer */}
      <div className="border-t border-surface-border p-3 bg-background/60">
        <div className="flex items-center justify-between text-xs mb-1">
          <div className="flex items-center gap-1.5 font-medium text-white truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate text-xs font-mono">
              {session?.fullName || session?.email || "Researcher Session"}
            </span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-pharma-cyan font-bold shrink-0">
            RESEARCH
          </span>
        </div>
        <div className="text-[9px] font-mono text-slate-400 truncate">
          {session?.affiliation || "Private Pharmaceutical AI Platform"}
        </div>
      </div>
    </aside>
  );
}
