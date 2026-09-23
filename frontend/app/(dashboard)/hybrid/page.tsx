"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { HybridResult } from "@/lib/types";
import { GitMerge, Play, ShieldAlert, CheckCircle2, Info, ArrowRight } from "lucide-react";

export default function HybridPage() {
  const [doseMg, setDoseMg] = useState(400.0);
  const [bodyWeight, setBodyWeight] = useState(70.0);
  const [hasEhc, setHasEhc] = useState(true);
  const [result, setResult] = useState<HybridResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runBenchmark = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.simulateHybrid({
        dose_mg: doseMg,
        body_weight_kg: bodyWeight,
        has_enterohepatic_recirculation: hasEhc,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, [doseMg, bodyWeight, hasEhc]);

  const chartData = result
    ? result.time.map((t, i) => ({
        time: t,
        observed: result.observed_actual[i],
        pbpk: result.pbpk_predicted[i],
        ml: result.ml_predicted[i],
        hybrid: result.hybrid_predicted[i],
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Hybrid PBPK + ML Modeling & Cross-Benchmark"
        subtitle="Mechanistic Mass-Conserving Physiological ODEs Coupled with Empirical Machine Learning Residuals"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Critical Rule Notice */}
        <div className="p-3 bg-surface-card border border-surface-border rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-pharma-cyan shrink-0" />
            <span>OBJECTIVE BENCHMARK: Model superiority is determined strictly from calculated empirical metrics.</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">NO AUTOMATIC HYBRID BIAS</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 scientific-card p-6 space-y-5">
            <div className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase">BENCHMARK SETUP</h3>
                <GitMerge className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Parameters for multi-model empirical comparison</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Dose (mg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={doseMg}
                  onChange={(e) => setDoseMg(parseFloat(e.target.value) || 400)}
                  className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Subject Weight (kg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(parseFloat(e.target.value) || 70)}
                  className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-surface-card border border-surface-border rounded">
                <div>
                  <div className="text-xs font-semibold text-white">Enterohepatic Recirculation</div>
                  <div className="text-[10px] font-mono text-slate-400">Non-linear secondary biliary dump</div>
                </div>
                <input
                  type="checkbox"
                  checked={hasEhc}
                  onChange={(e) => setHasEhc(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-surface text-pharma-cyan focus:ring-0 cursor-pointer"
                />
              </div>

              <button
                onClick={runBenchmark}
                disabled={loading}
                className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>EXECUTE 3-WAY BENCHMARK</span>
              </button>
            </div>

            {/* Validation Metrics Comparison Table */}
            {result && (
              <div className="p-4 bg-surface border border-surface-border rounded-lg space-y-3">
                <div className="text-[10px] font-mono uppercase text-white font-bold tracking-wider">
                  VALIDATION METRICS COMPARISON
                </div>
                <div className="space-y-2 text-xs font-mono">
                  {/* PBPK */}
                  <div className="p-2.5 bg-surface-card rounded border border-surface-border">
                    <div className="flex justify-between font-bold text-sky-400">
                      <span>1. Mechanistic PBPK</span>
                      <span>R²: {result.metrics.pbpk.r2}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                      <span>RMSE: {result.metrics.pbpk.rmse} mg/L</span>
                      <span>MAE: {result.metrics.pbpk.mae} mg/L</span>
                    </div>
                  </div>

                  {/* ML */}
                  <div className="p-2.5 bg-surface-card rounded border border-surface-border">
                    <div className="flex justify-between font-bold text-amber-400">
                      <span>2. Pure Machine Learning</span>
                      <span>R²: {result.metrics.ml.r2}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                      <span>RMSE: {result.metrics.ml.rmse} mg/L</span>
                      <span>MAE: {result.metrics.ml.mae} mg/L</span>
                    </div>
                  </div>

                  {/* Hybrid */}
                  <div className="p-2.5 bg-surface-card rounded border border-rose-500/40 bg-rose-950/20">
                    <div className="flex justify-between font-bold text-rose-300">
                      <span>3. Hybrid PBPK + ML</span>
                      <span>R²: {result.metrics.hybrid.r2}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                      <span>RMSE: {result.metrics.hybrid.rmse} mg/L</span>
                      <span>MAE: {result.metrics.hybrid.mae} mg/L</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart & Scientific Verdict */}
          <div className="lg:col-span-8 space-y-6">
            <ScientificChart
              data={chartData}
              xAxisKey="time"
              xAxisLabel="Time (hours)"
              yAxisLabel="Plasma Concentration (mg/L)"
              series={[
                { key: "observed", name: "Simulated Observed Truth", color: "#f8fafc", strokeWidth: 1.5, strokeDasharray: "4 4" },
                { key: "pbpk", name: "PBPK Mechanistic Alone", color: "#38bdf8", strokeWidth: 2 },
                { key: "ml", name: "Pure ML Regressor Alone", color: "#f59e0b", strokeWidth: 2 },
                { key: "hybrid", name: "Hybrid PBPK + ML", color: "#f43f5e", strokeWidth: 2.5 },
              ]}
              title="3-Way Comparative Pharmacokinetic Profiles"
              subtitle="PBPK vs ML vs Hybrid PBPK + ML Overlaid on Observed Ground Truth"
              height={360}
            />

            {/* Scientific Interpretation */}
            {result && (
              <div className="scientific-card p-5 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold uppercase">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>SCIENTIFIC EVALUATION & VERDICT</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {result.scientific_verdict}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
