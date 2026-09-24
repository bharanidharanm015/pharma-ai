"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import {
  FlaskConical,
  Activity,
  Cpu,
  Brain,
  Sliders,
  CheckCircle,
  FileText,
  ArrowRight,
  Plus,
  Play,
  Layers,
  Sparkles,
  Timer,
  GitBranch,
  Users,
  BookmarkCheck,
  ShieldAlert,
  Inbox,
  BarChart2,
} from "lucide-react";

interface PipelineStep {
  num: number;
  title: string;
  subtitle: string;
  href: string;
  icon: any;
  colorBorder: string;
  colorBg: string;
  colorText: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    num: 1,
    title: "Drug & Compound",
    subtitle: "Physicochemical & BCS profiling",
    href: "/drug-formulation?tab=drug",
    icon: FlaskConical,
    colorBorder: "border-blue-500/40 hover:border-blue-400",
    colorBg: "bg-blue-500/10",
    colorText: "text-blue-400",
  },
  {
    num: 2,
    title: "Formulation & QbD",
    subtitle: "Polymer matrix & release kinetics",
    href: "/drug-formulation?tab=formulation",
    icon: Layers,
    colorBorder: "border-purple-500/40 hover:border-purple-400",
    colorBg: "bg-purple-500/10",
    colorText: "text-purple-400",
  },
  {
    num: 3,
    title: "Dissolution",
    subtitle: "Noyes-Whitney & Korsmeyer-Peppas",
    href: "/dissolution",
    icon: Timer,
    colorBorder: "border-purple-500/40 hover:border-purple-400",
    colorBg: "bg-purple-500/10",
    colorText: "text-purple-400",
  },
  {
    num: 4,
    title: "Absorption",
    subtitle: "GI transit & mucosal permeation",
    href: "/absorption",
    icon: Activity,
    colorBorder: "border-emerald-500/40 hover:border-emerald-400",
    colorBg: "bg-emerald-500/10",
    colorText: "text-emerald-400",
  },
  {
    num: 5,
    title: "PK / PBPK",
    subtitle: "5-organ mass-balance RK4 solver",
    href: "/pk-pbpk",
    icon: GitBranch,
    colorBorder: "border-emerald-500/40 hover:border-emerald-400",
    colorBg: "bg-emerald-500/10",
    colorText: "text-emerald-400",
  },
  {
    num: 6,
    title: "Virtual Patients",
    subtitle: "Monte Carlo demographic variability",
    href: "/virtual-patients",
    icon: Users,
    colorBorder: "border-emerald-500/40 hover:border-emerald-400",
    colorBg: "bg-emerald-500/10",
    colorText: "text-emerald-400",
  },
  {
    num: 7,
    title: "Machine Learning",
    subtitle: "RF, GBDT & Linear regressors",
    href: "/ml",
    icon: Brain,
    colorBorder: "border-orange-500/40 hover:border-orange-400",
    colorBg: "bg-orange-500/10",
    colorText: "text-orange-400",
  },
  {
    num: 8,
    title: "Hybrid Modeling",
    subtitle: "Mechanistic PBPK + Residual ML",
    href: "/hybrid",
    icon: Cpu,
    colorBorder: "border-orange-500/40 hover:border-orange-400",
    colorBg: "bg-orange-500/10",
    colorText: "text-orange-400",
  },
  {
    num: 9,
    title: "Optimization",
    subtitle: "Pareto multi-objective formulation",
    href: "/optimization",
    icon: Sliders,
    colorBorder: "border-amber-500/40 hover:border-amber-400",
    colorBg: "bg-amber-500/10",
    colorText: "text-amber-400",
  },
  {
    num: 10,
    title: "Validation & Reports",
    subtitle: "Model sensitivity & audit logs",
    href: "/validation",
    icon: CheckCircle,
    colorBorder: "border-rose-500/40 hover:border-rose-400",
    colorBg: "bg-rose-500/10",
    colorText: "text-rose-400",
  },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    active_experiments: 0,
    simulations: 0,
    ml_experiments: 0,
    pbpk_runs: 0,
    virtual_patients: 0,
    validation_runs: 0,
  });
  const [recentSims, setRecentSims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tableStats, sims] = await Promise.all([
          pharmaApi.getTableStats(),
          pharmaApi.getRecentSimulations(),
        ]);
        setStats({
          active_experiments: tableStats.active_experiments || 0,
          simulations: tableStats.simulations || 0,
          ml_experiments: tableStats.ml_experiments || 0,
          pbpk_runs: tableStats.pbpk_runs || 0,
          virtual_patients: tableStats.virtual_patients || 0,
          validation_runs: tableStats.validation_runs || 0,
        });
        setRecentSims(sims || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalActivity =
    stats.active_experiments +
    stats.simulations +
    stats.ml_experiments +
    stats.pbpk_runs +
    stats.virtual_patients +
    stats.validation_runs;

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Pharmaceutical AI Research Command Center"
        subtitle="End-to-End Computational Biopharmaceutics, Mechanistic PBPK & Machine Learning Pipeline"
      />

      <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto">
        {/* Real User Statistics Strip */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-pharma-cyan" />
              <span>Telemetry & Execution Metrics (Real-Time)</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              User-isolated database telemetry
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Active Experiments</div>
              <div className="text-2xl font-mono font-bold text-white mt-1">
                {loading ? "..." : stats.active_experiments}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Saved workflows</div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Simulations Run</div>
              <div className="text-2xl font-mono font-bold text-pharma-cyan mt-1">
                {loading ? "..." : stats.simulations}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">In silico executions</div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-[10px] font-mono text-slate-400 uppercase">ML Experiments</div>
              <div className="text-2xl font-mono font-bold text-orange-400 mt-1">
                {loading ? "..." : stats.ml_experiments}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Trained models</div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-[10px] font-mono text-slate-400 uppercase">PBPK Runs</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                {loading ? "..." : stats.pbpk_runs}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">5-organ RK4 solver</div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Virtual Patients</div>
              <div className="text-2xl font-mono font-bold text-purple-400 mt-1">
                {loading ? "..." : stats.virtual_patients}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Monte Carlo cohort</div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Validation Runs</div>
              <div className="text-2xl font-mono font-bold text-rose-400 mt-1">
                {loading ? "..." : stats.validation_runs}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Cross-validated</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="p-4 rounded-xl bg-surface border border-surface-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-mono font-bold uppercase text-slate-300">
            Quick Actions:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/drug-formulation"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Experiment</span>
            </Link>
            <Link
              href="/pk-pbpk"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run PBPK Simulation</span>
            </Link>
            <Link
              href="/ml"
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Brain className="h-3.5 w-3.5" />
              <span>Train ML Model</span>
            </Link>
            <Link
              href="/optimization"
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Optimize Formulation</span>
            </Link>
            <Link
              href="/reports"
              className="px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border hover:border-slate-500 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-pharma-cyan" />
              <span>Export Report</span>
            </Link>
          </div>
        </div>

        {/* Visual Research Pipeline Progression */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-mono font-bold uppercase text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-pharma-cyan" />
                <span>Interactive In Silico Research Pipeline</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any stage to configure parameters, launch ODE solvers, or inspect predictive models.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              10 Modular Stages &rarr;
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {PIPELINE_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.num}
                  href={step.href}
                  className={`p-4 rounded-xl border bg-surface transition-all group flex flex-col justify-between hover:scale-[1.02] shadow-sm ${step.colorBorder}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-card border border-surface-border text-slate-400">
                        STAGE 0{step.num}
                      </span>
                      <div className={`h-7 w-7 rounded-lg ${step.colorBg} flex items-center justify-center ${step.colorText}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-pharma-cyan transition-colors">
                        {step.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {step.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-surface-border/50 flex items-center justify-between text-[11px] font-mono text-slate-400 group-hover:text-white">
                    <span>Configure & Run</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity or Empty State */}
        <div className="scientific-card p-5 border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-pharma-cyan" />
              <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                Recent Simulation Logs
              </h3>
            </div>
            <Link
              href="/results"
              className="text-xs font-mono text-pharma-cyan hover:underline flex items-center gap-1"
            >
              View All Results &rarr;
            </Link>
          </div>

          {recentSims.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-slate-500">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white">No Simulation Logs Recorded</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Your private simulation workspace is ready. Launch any solver from the pipeline above to track real-time outputs and telemetry.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/drug-formulation"
                  className="px-4 py-2 rounded-lg bg-pharma-primary hover:bg-sky-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Start First Experiment</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-3 font-semibold">Module</th>
                    <th className="py-2.5 px-3 font-semibold">Title / Description</th>
                    <th className="py-2.5 px-3 font-semibold">Drug Target</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-300">
                  {recentSims.map((sim, idx) => (
                    <tr key={sim.id || idx} className="hover:bg-surface-hover">
                      <td className="py-2.5 px-3 text-slate-400">
                        {sim.created_at ? new Date(sim.created_at).toLocaleString() : "Recent"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-pharma-cyan font-bold">
                          {sim.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">{sim.title}</td>
                      <td className="py-2.5 px-3 text-slate-300">{sim.drug_name || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[10px]">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Regulatory Research Disclaimer Notice */}
        <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-400 leading-relaxed">
            <span className="font-mono font-bold text-slate-300 uppercase">
              Regulatory Compliance & Research Scope:
            </span>
            <p>
              This platform generates purely computational, in silico biopharmaceutics simulations. All kinetics, numerical solutions (Noyes-Whitney, Runge-Kutta 4th-order ODE, Monte Carlo), and ML regression predictions are intended solely for academic, exploratory, and pre-formulation screening. Not clinically validated and not intended for direct patient treatment or medical diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
