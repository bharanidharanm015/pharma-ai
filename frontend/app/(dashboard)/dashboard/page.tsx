"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import {
  Pill,
  FlaskConical,
  Activity,
  Users,
  Brain,
  GitMerge,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Play,
  Layers,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  User,
  HeartPulse,
  Scale,
  Ruler,
  Phone,
  Mail,
  Edit3,
  Calendar,
} from "lucide-react";
import { pharmaApi } from "@/lib/api-client";
import { Drug, AdminProfile } from "@/lib/types";

const WORKFLOW_STEPS = [
  { step: 1, name: "Drug", path: "/drug-formulation", tag: "Physicochemical" },
  { step: 2, name: "Formulation", path: "/drug-formulation", tag: "Polymer Matrix" },
  { step: 3, name: "Dissolution", path: "/dissolution", tag: "In Vitro Kinetics" },
  { step: 4, name: "Absorption", path: "/dissolution", tag: "Intestinal Flux" },
  { step: 5, name: "PK / PBPK", path: "/pk-pbpk", tag: "5-Organ ODEs" },
  { step: 6, name: "Virtual Patients", path: "/virtual-patients", tag: "Monte Carlo" },
  { step: 7, name: "ML", path: "/ml", tag: "Empirical Models" },
  { step: 8, name: "Hybrid", path: "/hybrid", tag: "Physics + ML" },
  { step: 9, name: "Optimization", path: "/optimization", tag: "In Silico Search" },
  { step: 10, name: "Explainability", path: "/explainable-ai", tag: "XAI Attributions" },
  { step: 11, name: "Validation", path: "/validation", tag: "Model Diagnostics" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    drugs: 4,
    formulations: 2,
    simulations: 18,
    virtualPatients: 120,
    mlExperiments: 6,
    hybridExperiments: 4,
    optimizationRuns: 7,
  });
  const [recentSims, setRecentSims] = useState<any[]>([]);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    pharmaApi.getTableStats().then((s) => {
      setStats({
        drugs: s.drugs,
        formulations: s.formulations,
        simulations: s.simulations,
        virtualPatients: s.virtual_patients,
        mlExperiments: s.ml_experiments,
        hybridExperiments: s.hybrid_experiments,
        optimizationRuns: s.optimization_runs,
      });
    });

    pharmaApi.getRecentSimulations().then((sims) => {
      setRecentSims(sims);
    });

    pharmaApi.getAdminProfile().then((p) => {
      setProfile(p);
    });
  }, []);

  // Automatic Age Calculation from DOB
  const adminAge = useMemo(() => {
    if (!profile?.date_of_birth) return null;
    const birthDate = new Date(profile.date_of_birth);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 130 ? age : null;
  }, [profile?.date_of_birth]);

  // Automatic BMI Calculation from Weight and Height
  const adminBmi = useMemo(() => {
    if (!profile?.weight_kg || !profile?.height_cm || profile.weight_kg <= 0 || profile.height_cm <= 0) return null;
    const heightM = profile.height_cm / 100;
    const val = Number((profile.weight_kg / (heightM * heightM)).toFixed(1));
    let cat = "Standard Reference";
    if (val < 18.5) cat = "Lower Range";
    else if (val < 25.0) cat = "Standard Range";
    else if (val < 30.0) cat = "Elevated Range";
    else cat = "High Range";
    return { val, cat };
  }, [profile?.weight_kg, profile?.height_cm]);

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Admin Research Dashboard"
        subtitle="Computational Biopharmaceutics, Mechanistic Pharmacometrics & Machine Learning Studio"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Row of 7 Dashboard Cards required by spec */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              PLATFORM ASSET & SIMULATION METRICS
            </h3>
            <span className="text-[10px] font-mono text-pharma-cyan font-bold">
              SINGLE-ADMIN REPOSITORY
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Drugs */}
            <Link
              href="/drug-formulation"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">DRUGS</span>
                <Pill className="h-3.5 w-3.5 text-pharma-cyan group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{stats.drugs}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">Cataloged APIs</div>
            </Link>

            {/* 2. Formulations */}
            <Link
              href="/drug-formulation"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">FORMULATIONS</span>
                <FlaskConical className="h-3.5 w-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{stats.formulations}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">Active Matrices</div>
            </Link>

            {/* 3. Simulations */}
            <Link
              href="/pk-pbpk"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">SIMULATIONS</span>
                <Activity className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{stats.simulations}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">Runs Executed</div>
            </Link>

            {/* 4. Virtual Patients */}
            <Link
              href="/virtual-patients"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">VIRTUAL PATIENTS</span>
                <Users className="h-3.5 w-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{stats.virtualPatients}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">Cohort Subjects</div>
            </Link>

            {/* 5. ML Experiments */}
            <Link
              href="/ml"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">ML EXPERIMENTS</span>
                <Brain className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{stats.mlExperiments}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">Trained Regressors</div>
            </Link>

            {/* 6. Hybrid Experiments */}
            <Link
              href="/hybrid"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">HYBRID EXPERIMENTS</span>
                <GitMerge className="h-3.5 w-3.5 text-rose-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{stats.hybridExperiments}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">PBPK + ML Benchmarks</div>
            </Link>

            {/* 7. Optimization Runs */}
            <Link
              href="/optimization"
              className="scientific-card p-3 hover:border-pharma-cyan/50 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-mono uppercase">OPTIMIZATION</span>
                <Sliders className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{stats.optimizationRuns}</div>
              <div className="text-[9px] text-slate-400 mt-0.5 truncate">Param Searches</div>
            </Link>
          </div>
        </div>

        {/* Private Admin Research Profile Card */}
        <div className="scientific-card p-5 border-pharma-cyan/40 bg-gradient-to-br from-surface-card via-surface-card/90 to-surface relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-4 border-b border-surface-border/80 gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-pharma-cyan/10 border border-pharma-cyan/30 flex items-center justify-center text-pharma-cyan">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-pharma-cyan font-bold">
                  AUTHENTICATED ADMINISTRATOR PROFILE
                </span>
                <span className="ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-semibold">
                  SINGLE-ADMIN SECURE
                </span>
              </div>
            </div>

            <Link
              href="/settings/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-surface-border hover:border-pharma-cyan text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm group"
            >
              <Edit3 className="h-3.5 w-3.5 text-pharma-cyan group-hover:scale-110 transition-transform" />
              <span>Edit Personal Details</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Identity & Basic Info */}
            <div className="lg:col-span-4 flex items-start gap-4">
              <div className="relative shrink-0">
                {profile?.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt={profile.full_name}
                    className="h-16 w-16 rounded-xl object-cover border-2 border-pharma-cyan/50 shadow-md shadow-pharma-cyan/10"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-surface border-2 border-pharma-cyan/40 flex items-center justify-center text-pharma-cyan shadow-md">
                    <User className="h-8 w-8 opacity-80" />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-surface flex items-center justify-center shadow-sm" title="Active Admin Session" />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="text-base font-bold text-white truncate flex items-center gap-2">
                  <span className="truncate">{profile?.full_name || "Lead Research Administrator"}</span>
                </div>
                <div className="text-xs font-mono text-pharma-cyan truncate flex items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0" />
                  <span className="truncate">{profile?.email_address || profile?.admin_email || "admin@pharma.ai"}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-slate-500" />
                  <span>{profile?.contact_number || "+1 (555) 019-2834"}</span>
                </div>
                {profile?.address && (
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {profile.address}
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Biometric & Physiological Indices */}
            <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-surface/70 border border-surface-border/60">
              {/* Age */}
              <div className="space-y-1">
                <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Calendar className="h-2.5 w-2.5 text-pharma-cyan" />
                  <span>Age</span>
                </div>
                <div className="text-sm font-bold text-white font-mono">
                  {adminAge !== null ? `${adminAge} yrs` : "—"}
                </div>
                <div className="text-[8px] font-mono text-slate-400 truncate">
                  {profile?.date_of_birth || "DOB"}
                </div>
              </div>

              {/* Blood Group */}
              <div className="space-y-1">
                <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <HeartPulse className="h-2.5 w-2.5 text-rose-400" />
                  <span>Blood</span>
                </div>
                <div className="text-sm font-bold text-rose-400 font-mono">
                  {profile?.blood_group || "—"}
                </div>
                <div className="text-[8px] font-mono text-slate-400">
                  {profile?.gender || "Gender"}
                </div>
              </div>

              {/* Height & Weight */}
              <div className="space-y-1">
                <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Scale className="h-2.5 w-2.5 text-sky-400" />
                  <span>Mass / Ht</span>
                </div>
                <div className="text-sm font-bold text-white font-mono truncate">
                  {profile?.weight_kg ?? "—"}kg
                </div>
                <div className="text-[8px] font-mono text-slate-400 truncate">
                  {profile?.height_cm ?? "—"} cm
                </div>
              </div>

              {/* Calculated BMI */}
              <div className="space-y-1">
                <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Ruler className="h-2.5 w-2.5 text-emerald-400" />
                  <span>BMI</span>
                </div>
                <div className="text-sm font-bold text-emerald-400 font-mono">
                  {adminBmi ? `${adminBmi.val}` : "—"}
                </div>
                <div className="text-[8px] font-mono text-emerald-400 truncate">
                  {adminBmi ? adminBmi.cat : "Reference"}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-4 pt-1 border-t border-surface-border/40 text-[8px] font-mono text-slate-400 italic">
                *Computational body mass index. Administrative laboratory reference only — not clinical diagnosis.
              </div>
            </div>

            {/* Emergency Laboratory Contact */}
            <div className="lg:col-span-3 p-3 rounded-xl bg-surface/70 border border-surface-border/60 space-y-1.5">
              <div className="text-[9px] font-mono uppercase text-slate-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="h-3 w-3 text-amber-400" />
                <span>Emergency Contact</span>
              </div>
              <div className="text-xs font-bold text-white truncate">
                {profile?.emergency_contact_name || "Emergency Contact Not Set"}
              </div>
              <div className="text-[10px] font-mono text-slate-300 truncate">
                {profile?.emergency_contact_relationship || "Lab Colleague"}
              </div>
              <div className="text-[10px] font-mono text-pharma-cyan truncate">
                {profile?.emergency_contact_number || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Research Workflow Bar */}
        <div className="scientific-card p-5 border-pharma-primary/40 bg-surface-card/60">
          <div className="flex items-center justify-between mb-3 border-b border-surface-border pb-2">
            <div>
              <span className="text-[10px] font-mono text-pharma-cyan uppercase font-bold tracking-wider">
                COMPREHENSIVE BIOPHARMACEUTICAL PIPELINE
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Research Simulation Workflow
              </h3>
            </div>
            <Link
              href="/drug-formulation"
              className="text-xs font-mono font-medium text-pharma-cyan hover:underline flex items-center gap-1"
            >
              <span>Launch Step 1</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Workflow Steps Horizontal Flow */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 pt-2">
            {WORKFLOW_STEPS.map((step, idx) => (
              <Link
                key={step.step}
                href={step.path}
                className="group relative flex flex-col p-2.5 rounded-lg bg-surface border border-surface-border hover:border-pharma-cyan transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="h-4 w-4 rounded-full bg-pharma-primary/20 text-pharma-cyan text-[10px] font-mono font-bold flex items-center justify-center border border-pharma-primary/40">
                    {step.step}
                  </span>
                  <ChevronRight className="h-3 w-3 text-slate-600 group-hover:text-pharma-cyan transition-colors" />
                </div>
                <div className="text-xs font-bold text-white group-hover:text-pharma-cyan transition-colors truncate">
                  {step.name}
                </div>
                <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                  {step.tag}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Launch Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="scientific-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-pharma-cyan">
              <Activity className="h-5 w-5" />
              <h4 className="text-sm font-bold text-white">Dissolution & Absorption</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Model Noyes-Whitney dissolution kinetics through multi-segmental intestinal transit and epithelial permeability flux.
            </p>
            <Link
              href="/dissolution"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-pharma-cyan hover:text-white transition-colors"
            >
              <span>Run Dissolution Study</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="scientific-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Cpu className="h-5 w-5" />
              <h4 className="text-sm font-bold text-white">5-Organ Continuous PBPK</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Runge-Kutta 4th Order continuous numerical ODE solver modeling Liver, Kidney, and Peripheral disposition with &lt;0.05% mass error.
            </p>
            <Link
              href="/pk-pbpk"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-white transition-colors"
            >
              <span>Simulate PBPK Organ Curves</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="scientific-card p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-400">
              <Brain className="h-5 w-5" />
              <h4 className="text-sm font-bold text-white">Machine Learning & Hybrid</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empirical ML regressors (Random Forest, Gradient Boosting) cross-benchmarked against mechanistic PBPK with objective metrics.
            </p>
            <Link
              href="/hybrid"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-purple-400 hover:text-white transition-colors"
            >
              <span>Evaluate Hybrid Model</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
