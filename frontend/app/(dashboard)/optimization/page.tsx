"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { OptimizationResult, CandidateScenario } from "@/lib/types";
import { Sliders, AlertTriangle, Play, CheckCircle2, ShieldCheck, ArrowRight, Dna } from "lucide-react";

export default function OptimizationPage() {
  const [targetCmax, setTargetCmax] = useState(14.0);
  const [targetAuc, setTargetAuc] = useState(115.0);
  const [doseMin, setDoseMin] = useState(100.0);
  const [doseMax, setDoseMax] = useState(800.0);
  const [polyMin, setPolyMin] = useState(15.0);
  const [polyMax, setPolyMax] = useState(45.0);
  const [d50Min, setD50Min] = useState(20.0);
  const [d50Max, setD50Max] = useState(80.0);

  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.runOptimization({
        target_cmax: targetCmax,
        target_auc: targetAuc,
        dose_min_mg: doseMin,
        dose_max_mg: doseMax,
        polymer_min_percent: polyMin,
        polymer_max_percent: polyMax,
        particle_size_min_um: d50Min,
        particle_size_max_um: d50Max,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleOptimize();
  }, [targetCmax, targetAuc]);

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Formulation & Dosing Multi-Objective Optimizer"
        subtitle="Computational Parameter Space Exploration to Match Target In Vivo Pharmacokinetic Exposures"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Prominent Required Disclaimer */}
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5 text-amber-300 font-bold uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>COMPUTATIONAL RESEARCH — NOT CLINICAL DOSING ADVICE</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            IN SILICO FORMULATION SEARCH
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Targets & Parameter Bounds */}
          <div className="lg:col-span-4 scientific-card p-6 space-y-5">
            <div className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase">OPTIMIZATION TARGETS</h3>
                <Sliders className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Desired target exposure and allowable parameter constraints</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Target Cmax (mg/L)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={targetCmax}
                    onChange={(e) => setTargetCmax(parseFloat(e.target.value) || 14)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:border-pharma-cyan"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Target AUC (mg·h/L)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={targetAuc}
                    onChange={(e) => setTargetAuc(parseFloat(e.target.value) || 115)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:border-pharma-cyan"
                  />
                </div>
              </div>

              {/* Parameter Constraints Range */}
              <div className="p-3 bg-surface-card border border-surface-border rounded space-y-3">
                <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                  SEARCH SPACE CONSTRAINTS
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400">Dose Min (mg)</label>
                    <input
                      type="number"
                      value={doseMin}
                      onChange={(e) => setDoseMin(parseFloat(e.target.value) || 100)}
                      className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Dose Max (mg)</label>
                    <input
                      type="number"
                      value={doseMax}
                      onChange={(e) => setDoseMax(parseFloat(e.target.value) || 800)}
                      className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">Polymer Min (%)</label>
                    <input
                      type="number"
                      value={polyMin}
                      onChange={(e) => setPolyMin(parseFloat(e.target.value) || 15)}
                      className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Polymer Max (%)</label>
                    <input
                      type="number"
                      value={polyMax}
                      onChange={(e) => setPolyMax(parseFloat(e.target.value) || 45)}
                      className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400">D50 Min (um)</label>
                    <input
                      type="number"
                      value={d50Min}
                      onChange={(e) => setD50Min(parseFloat(e.target.value) || 20)}
                      className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">D50 Max (um)</label>
                    <input
                      type="number"
                      value={d50Max}
                      onChange={(e) => setD50Max(parseFloat(e.target.value) || 80)}
                      className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleOptimize}
                disabled={loading}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>SEARCH PARAMETER SPACE</span>
              </button>
            </div>

            {/* Optimal Formulation Recipe Card */}
            {result && (
              <div className="p-4 bg-surface border border-cyan-500/40 bg-cyan-950/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">
                    RECOMMENDED CANDIDATE
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                    {result.convergence_status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Optimal Dose:</span>
                    <span className="text-white font-bold">{result.optimal_dose_mg} mg</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Polymer Matrix:</span>
                    <span className="text-white font-bold">{result.optimal_polymer_percent}% w/w</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Particle Size D50:</span>
                    <span className="text-white font-bold">{result.optimal_particle_size_um} um</span>
                  </div>
                  <div className="border-t border-cyan-800/40 pt-1.5 flex justify-between text-slate-300">
                    <span>Predicted Cmax:</span>
                    <span className="text-emerald-400 font-bold">{result.predicted_cmax} mg/L</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Predicted AUC:</span>
                    <span className="text-emerald-400 font-bold">{result.predicted_auc} mg·h/L</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Multi-Objective Loss:</span>
                    <span className="text-white">{result.loss_score}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Scenarios Evaluated Table */}
          <div className="lg:col-span-8 space-y-6">
            <div className="scientific-card p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-2">
                <div>
                  <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                    EVALUATED CANDIDATE SCENARIOS (RANKED BY OBJECTIVE LOSS)
                  </h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Target: Cmax = {targetCmax} mg/L | AUC = {targetAuc} mg·h/L
                  </p>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {result?.candidate_scenarios.length || 0} Evaluated
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-surface-border text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="pb-2">Candidate</th>
                      <th className="pb-2">Dose (mg)</th>
                      <th className="pb-2">Polymer (%)</th>
                      <th className="pb-2">D50 (um)</th>
                      <th className="pb-2">Pred Cmax</th>
                      <th className="pb-2">Pred AUC</th>
                      <th className="pb-2">Pred Tmax</th>
                      <th className="pb-2 text-right">Loss Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border/50 text-slate-300">
                    {result?.candidate_scenarios.map((cand, idx) => (
                      <tr
                        key={cand.candidate_id}
                        className={idx === 0 ? "bg-cyan-950/40 text-white font-semibold" : "hover:bg-surface-card"}
                      >
                        <td className="py-2.5 text-cyan-400">
                          {cand.candidate_id}
                          {idx === 0 && <span className="ml-1 text-[9px] text-emerald-400 font-bold">&#9733;</span>}
                        </td>
                        <td className="py-2.5">{cand.dose_mg}</td>
                        <td className="py-2.5">{cand.polymer_percent}%</td>
                        <td className="py-2.5">{cand.particle_size_um}</td>
                        <td className="py-2.5">{cand.predicted_cmax}</td>
                        <td className="py-2.5 text-emerald-400">{cand.predicted_auc}</td>
                        <td className="py-2.5">{cand.predicted_tmax} h</td>
                        <td className="py-2.5 text-right font-mono text-slate-400">{cand.loss}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
