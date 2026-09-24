"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { DissolutionCurveResult, AbsorptionResult, DissolutionModelType } from "@/lib/types";
import { Timer, Activity, Play, Info, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DissolutionPage() {
  const [activeTab, setActiveTab] = useState<"dissolution" | "absorption">("dissolution");

  // Dissolution Inputs
  const [modelType, setModelType] = useState<DissolutionModelType>("korsmeyer_peppas");
  const [durationH, setDurationH] = useState(12.0);
  const [timeStepH, setTimeStepH] = useState(0.2);
  const [polymerConc, setPolymerConc] = useState(28.0);
  const [particleSize, setParticleSize] = useState(45.0);

  // Absorption Inputs
  const [doseMg, setDoseMg] = useState(400.0);
  const [solubility, setSolubility] = useState(0.021);
  const [peff, setPeff] = useState(4.2e-4);
  const [logp, setLogp] = useState(3.97);

  // Results
  const [dissolutionResult, setDissolutionResult] = useState<DissolutionCurveResult | null>(null);
  const [absorptionResult, setAbsorptionResult] = useState<AbsorptionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulations = async () => {
    setLoading(true);
    try {
      const diss = await pharmaApi.simulateDissolution({
        model_type: modelType,
        duration_h: durationH,
        time_step_h: timeStepH,
        polymer_concentration: polymerConc,
        particle_size_d50_um: particleSize,
      });
      setDissolutionResult(diss);

      const abs = await pharmaApi.simulateAbsorption({
        dose_mg: doseMg,
        solubility_mg_ml: solubility,
        permeability_peff: peff,
        logp: logp,
        duration_h: durationH,
        time_step_h: timeStepH,
      });
      setAbsorptionResult(abs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulations();
  }, [modelType, durationH, timeStepH, polymerConc, particleSize, doseMg, solubility, peff, logp]);

  // Chart data formatting
  const dissolutionChartData = dissolutionResult
    ? dissolutionResult.time.map((t, i) => ({
        time: t,
        dissolved: dissolutionResult.percent_dissolved[i],
      }))
    : [];

  const absorptionChartData = absorptionResult
    ? absorptionResult.time.map((t, i) => ({
        time: t,
        fraction: Number((absorptionResult.fraction_absorbed[i] * 100).toFixed(2)),
        rate: absorptionResult.absorption_rate_mg_h[i],
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Dissolution & GI Absorption Simulator"
        subtitle="In Vitro Release Kinetics Coupled to Multi-Segmental Intestinal Transit & Epithelial Permeation Flux"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex border-b border-surface-border gap-4">
          <button
            onClick={() => setActiveTab("dissolution")}
            className={`pb-3 px-1 text-sm font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "dissolution"
                ? "border-pharma-cyan text-pharma-cyan"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Timer className="h-4 w-4" />
            <span>1. DISSOLUTION KINETICS</span>
          </button>
          <button
            onClick={() => setActiveTab("absorption")}
            className={`pb-3 px-1 text-sm font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === "absorption"
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>2. GI ABSORPTION MODEL (GI &rarr; BLOOD)</span>
          </button>
        </div>

        {/* Tab 1: Dissolution */}
        {activeTab === "dissolution" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs Panel */}
            <div className="lg:col-span-4 scientific-card p-6 space-y-5">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">KINETICS INPUTS</h3>
                <p className="text-xs text-slate-400 mt-0.5">Formulation parameters & simulation duration</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Kinetic Mathematical Model
                  </label>
                  <select
                    value={modelType}
                    onChange={(e: any) => setModelType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan cursor-pointer"
                  >
                    <option value="korsmeyer_peppas">Korsmeyer-Peppas Power Law</option>
                    <option value="higuchi">Higuchi Square-Root Matrix</option>
                    <option value="first_order">First-Order Noyes-Whitney</option>
                    <option value="zero_order">Zero-Order Reservoir / Osmotic</option>
                    <option value="hixson_crowell">Hixson-Crowell Diminishing Sphere</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Duration (h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="72"
                      value={durationH}
                      onChange={(e) => setDurationH(parseFloat(e.target.value) || 12)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Time Step dt (h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.05"
                      max="1.0"
                      value={timeStepH}
                      onChange={(e) => setTimeStepH(parseFloat(e.target.value) || 0.2)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Polymer Conc (% w/w)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="80"
                      value={polymerConc}
                      onChange={(e) => setPolymerConc(parseFloat(e.target.value) || 25)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Particle Size D50 (um)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="300"
                      value={particleSize}
                      onChange={(e) => setParticleSize(parseFloat(e.target.value) || 45)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={runSimulations}
                  disabled={loading}
                  className="w-full py-2 bg-pharma-primary hover:bg-sky-500 text-white rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>RECOMPUTE DISSOLUTION PROFILE</span>
                </button>
              </div>

              {/* Kinetic Parameter Summary */}
              {dissolutionResult && (
                <div className="p-3 bg-surface-card border border-surface-border rounded space-y-2 text-xs font-mono">
                  <div className="text-[10px] uppercase text-pharma-cyan font-bold">MODEL FIT PARAMETERS</div>
                  <div className="flex justify-between text-slate-300">
                    <span>Rate Constant (k):</span>
                    <span className="text-white font-bold">{dissolutionResult.rate_constant_k}</span>
                  </div>
                  {dissolutionResult.release_exponent_n !== undefined && (
                    <div className="flex justify-between text-slate-300">
                      <span>Diffusion Exponent (n):</span>
                      <span className="text-white font-bold">{dissolutionResult.release_exponent_n}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>Goodness of Fit (R²):</span>
                    <span className="text-emerald-400 font-bold">{dissolutionResult.r_squared}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chart & Table */}
            <div className="lg:col-span-8 space-y-6">
              <ScientificChart
                data={dissolutionChartData}
                xAxisKey="time"
                xAxisLabel="Time (hours)"
                yAxisLabel="Percentage Dissolved (%)"
                series={[{ key: "dissolved", name: "Percentage Dissolved (% w/w)", color: "#06b6d4", strokeWidth: 2.5 }]}
                title="In Vitro Dissolution Profile"
                subtitle={dissolutionResult?.model_name || "Dissolution Kinetics Curve"}
                height={350}
              />

              {/* Mechanism note */}
              {dissolutionResult && (
                <div className="scientific-card p-4 flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                  <Info className="h-4 w-4 text-pharma-cyan shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Mechanistic Interpretation: </span>
                    {dissolutionResult.assumptions}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-surface-border">
                <div className="text-xs text-slate-400">
                  Next in Pipeline: <span className="text-white font-semibold">Gastrointestinal Absorption Kinetics</span>
                </div>
                <Link
                  href="/absorption"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors"
                >
                  <span>Proceed to Absorption Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Absorption Model */}
        {activeTab === "absorption" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inputs Panel */}
            <div className="lg:col-span-4 scientific-card p-6 space-y-5">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">ABSORPTION MODEL INPUTS</h3>
                <p className="text-xs text-slate-400 mt-0.5">Dissolution &rarr; GI Tract &rarr; Absorption &rarr; Blood</p>
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
                    Solubility (mg/mL)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={solubility}
                    onChange={(e) => setSolubility(parseFloat(e.target.value) || 0.021)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Permeability Peff (10^-4 cm/s)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={peff}
                    onChange={(e) => setPeff(parseFloat(e.target.value) || 4.2e-4)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Partition Coefficient (LogP)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={logp}
                    onChange={(e) => setLogp(parseFloat(e.target.value) || 3.97)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>

                {absorptionResult && (
                  <div className="p-3 bg-surface-card border border-surface-border rounded space-y-2 text-xs font-mono">
                    <div className="text-[10px] uppercase text-sky-400 font-bold">ABSORPTION OUTCOMES</div>
                    <div className="flex justify-between text-slate-300">
                      <span>Fraction Absorbed (Fa):</span>
                      <span className="text-emerald-400 font-bold">{absorptionResult.fa_infinity * 100}%</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Rate-Limiting Step:</span>
                      <span className="text-white font-semibold text-[10px] truncate max-w-[130px]">{absorptionResult.rate_limiting_step}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Gastric Lag (t_lag):</span>
                      <span className="text-white font-bold">{absorptionResult.t_lag_h} h</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chart & GI Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              <ScientificChart
                data={absorptionChartData}
                xAxisKey="time"
                xAxisLabel="Time (hours)"
                yAxisLabel="Fraction Absorbed (%) / Rate (mg/h)"
                series={[
                  { key: "fraction", name: "Fraction Absorbed (% Fa)", color: "#38bdf8", strokeWidth: 2.5 },
                  { key: "rate", name: "Absorption Rate (mg/h)", color: "#10b981", strokeWidth: 2, strokeDasharray: "4 4" },
                ]}
                title="GI Absorption Dynamics"
                subtitle="Cumulative Intestinal Mucosal Uptake & Absorption Rate vs Time"
                height={350}
              />

              {/* Segmental Intestinal Breakdown Table */}
              {absorptionResult && (
                <div className="scientific-card p-5 space-y-3">
                  <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                    SEGMENTAL GASTROINTESTINAL TRANSIT & FLUX BREAKDOWN
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-surface-border text-slate-400 text-[10px] uppercase">
                        <tr>
                          <th className="pb-2">Segment</th>
                          <th className="pb-2">Luminal pH</th>
                          <th className="pb-2">Transit (h)</th>
                          <th className="pb-2">Dissolved (mg)</th>
                          <th className="pb-2">Undissolved (mg)</th>
                          <th className="pb-2 text-right">Mucosal Flux (mg/h)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border/50 text-slate-300">
                        {absorptionResult.gi_transit_breakdown.map((seg) => (
                          <tr key={seg.segment}>
                            <td className="py-2 font-semibold text-white">{seg.segment}</td>
                            <td className="py-2">{seg.ph}</td>
                            <td className="py-2">{seg.transit_time_h}</td>
                            <td className="py-2">{seg.dissolved_amount_mg}</td>
                            <td className="py-2">{seg.undissolved_amount_mg}</td>
                            <td className="py-2 text-right text-emerald-400">{seg.absorbed_flux_rate_mg_h}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
