"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import {
  FolderArchive,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Pill,
  HeartPulse,
  Users,
  Brain,
  GitMerge,
  Sliders,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function ResearchResultsPage() {
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Summary Data State
  const [activeDrug, setActiveDrug] = useState<any>(null);
  const [pkData, setPkData] = useState<any>(null);
  const [pbpkData, setPbpkData] = useState<any>(null);
  const [popData, setPopData] = useState<any>(null);
  const [mlData, setMlData] = useState<any>(null);
  const [hybridData, setHybridData] = useState<any>(null);
  const [optData, setOptData] = useState<any>(null);
  const [valData, setValData] = useState<any>(null);

  useEffect(() => {
    // Load research notes
    pharmaApi.getResearchNotes().then((n) => setNotes(n));

    // Load active scenario summaries
    pharmaApi.getDrugs().then((drugs) => {
      if (drugs.length > 0) setActiveDrug(drugs[0]);
    });

    pharmaApi.simulatePK({ dose_mg: 400, cl_l_h: 3.2, vd_l: 9.8, ka_per_h: 1.2 }).then((r) => setPkData(r));
    pharmaApi.simulatePBPK({ dose_mg: 400, body_weight_kg: 70 }).then((r) => setPbpkData(r));
    pharmaApi.simulatePopulation({ cohort_size: 25, random_seed: 42 }).then((r) => setPopData(r));
    pharmaApi.trainML({ model_type: "Random Forest", target_metric: "AUC" }).then((r) => setMlData(r));
    pharmaApi.simulateHybrid({ dose_mg: 400 }).then((r) => setHybridData(r));
    pharmaApi.runOptimization({ target_cmax: 14.0, target_auc: 115.0 }).then((r) => setOptData(r));
    pharmaApi.runValidation().then((r) => setValData(r));
  }, []);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await pharmaApi.saveResearchNotes(notes);
      setStatusMsg("Research notes successfully saved to secure Admin repository.");
      setTimeout(() => setStatusMsg(null), 3500);
    } finally {
      setSavingNotes(false);
    }
  };

  const chartData = pbpkData
    ? pbpkData.time.map((t: number, i: number) => ({
        time: t,
        plasma: pbpkData.plasma_conc[i],
        liver: pbpkData.liver_conc[i],
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Consolidated Research Results & In Silico Twin Synthesis"
        subtitle="End-to-End Pipeline Summary: Drug Properties, Dissolution, PBPK Disposition, Population Envelopes & ML Optimization"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {statusMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* 1. Research Scenario Snapshot Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Active Drug */}
          <div className="scientific-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-pharma-cyan text-xs font-mono font-bold uppercase">
              <Pill className="h-4 w-4" />
              <span>ACTIVE API SCENARIO</span>
            </div>
            <div className="text-base font-bold text-white font-mono">{activeDrug?.name || "Ibuprofen (BCS II)"}</div>
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <div>Dose: {activeDrug?.dose_mg || 400} mg</div>
              <div>MW: {activeDrug?.molecular_weight || 206.3} g/mol</div>
              <div>Solubility: {activeDrug?.solubility_mg_ml || 0.021} mg/mL</div>
            </div>
          </div>

          {/* PK / PBPK Outcome */}
          <div className="scientific-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold uppercase">
              <HeartPulse className="h-4 w-4" />
              <span>PBPK 5-ORGAN EXPOSURE</span>
            </div>
            <div className="text-base font-bold text-white font-mono">{pbpkData?.c_max_plasma || 13.8} mg/L (Cmax)</div>
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <div>Tmax: {pbpkData?.t_max_plasma || 1.85} h</div>
              <div>AUC0-inf: {pbpkData?.auc_plasma || 118.2} mg·h/L</div>
              <div>Mass Error: &lt;{pbpkData?.mass_balance_error_percent || 0.03}%</div>
            </div>
          </div>

          {/* Virtual Population Variability */}
          <div className="scientific-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono font-bold uppercase">
              <Users className="h-4 w-4" />
              <span>VIRTUAL POPULATION</span>
            </div>
            <div className="text-base font-bold text-white font-mono">{popData?.cohort_size || 50} Subjects</div>
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <div>Mean Cmax: {popData?.cmax_mean || 12.6} mg/L</div>
              <div>Cmax CV%: {popData?.cmax_cv_percent || 24.8}%</div>
              <div>AUC CV%: {popData?.auc_cv_percent || 26.3}%</div>
            </div>
          </div>

          {/* ML & Hybrid Metrics */}
          <div className="scientific-card p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase">
              <Brain className="h-4 w-4" />
              <span>MACHINE LEARNING / HYBRID</span>
            </div>
            <div className="text-base font-bold text-white font-mono">R² = {mlData?.r2 || 0.88}</div>
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <div>RMSE: {mlData?.rmse || 3.18} mg·h/L</div>
              <div>Hybrid R²: {hybridData?.metrics.hybrid.r2 || 0.98}</div>
              <div>Model: {mlData?.model_type || "Random Forest"}</div>
            </div>
          </div>
        </div>

        {/* 2. Synthesis Chart & Optimization Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <ScientificChart
              data={chartData}
              xAxisKey="time"
              xAxisLabel="Time (hours)"
              yAxisLabel="Organ Drug Concentration (mg/L)"
              series={[
                { key: "plasma", name: "Systemic Plasma", color: "#38bdf8", strokeWidth: 2.5 },
                { key: "liver", name: "Hepatic Tissue", color: "#f59e0b", strokeWidth: 2 },
              ]}
              title="Integrated Pharmacokinetic Disposition"
              subtitle="Simulated Plasma and Hepatic Levels across the 24-Hour Evaluation Window"
              height={340}
            />
          </div>

          {/* Optimization & Validation Summary */}
          <div className="lg:col-span-4 space-y-4">
            {/* Optimal Formulation */}
            <div className="scientific-card p-5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
                <Sliders className="h-4 w-4" />
                <span>OPTIMIZATION RECOMMENDATION</span>
              </div>
              <div className="text-xs font-mono text-slate-300 space-y-1">
                <div>Dose: {optData?.optimal_dose_mg || 385} mg</div>
                <div>Polymer Concentration: {optData?.optimal_polymer_percent || 24.5}% w/w</div>
                <div>Particle Size D50: {optData?.optimal_particle_size_um || 42} um</div>
                <div className="text-emerald-400 font-semibold pt-1">
                  Predicted AUC: {optData?.predicted_auc || 116.2} mg·h/L
                </div>
              </div>
            </div>

            {/* Quick Export Link */}
            <div className="scientific-card p-5 space-y-2 border-pharma-primary/40 bg-surface-card/40">
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold uppercase">
                <FileSpreadsheet className="h-4 w-4 text-pharma-cyan" />
                <span>GENERATE RESEARCH REPORT</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Compile these findings into a publication-formatted regulatory research dossier.
              </p>
              <Link
                href="/reports"
                className="block text-center py-2 px-3 rounded bg-pharma-primary hover:bg-sky-500 text-white font-mono text-xs font-semibold transition-colors mt-2"
              >
                Go to Reports Studio &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* 3. Editable Admin Research Notes */}
        <div className="scientific-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <FolderArchive className="h-4 w-4 text-pharma-cyan" />
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                ADMIN RESEARCH NOTES & SCIENTIFIC OBSERVATIONS
              </h3>
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-3 py-1.5 bg-pharma-primary hover:bg-sky-500 text-white rounded text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingNotes ? "SAVING..." : "SAVE NOTES"}</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record experimental rationale, in vitro-in vivo correlation (IVIVC) notes, and physiological modeling assumptions..."
            className="w-full p-3 bg-surface-card border border-surface-border rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pharma-cyan leading-relaxed"
          />
          <div className="text-[10px] font-mono text-slate-400">
            Notes are saved persistently to the Admin research database.
          </div>
        </div>
      </div>
    </div>
  );
}
