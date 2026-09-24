"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { AbsorptionResult, Drug } from "@/lib/types";
import { Activity, Play, Info, CheckCircle2, ArrowRight, Zap, Layers, RefreshCw } from "lucide-react";
import Link from "next/link";

const BENCHMARK_DRUGS = [
  { name: "Ibuprofen (BCS Class II)", dose: 400.0, sol: 0.021, peff: 4.2e-4, logp: 3.97, pka: 4.4 },
  { name: "Metformin (BCS Class III)", dose: 500.0, sol: 300.0, peff: 0.4e-4, logp: -1.43, pka: 12.4 },
  { name: "Acetaminophen (BCS Class I)", dose: 500.0, sol: 14.0, peff: 2.8e-4, logp: 0.46, pka: 9.5 },
  { name: "Atorvastatin (BCS Class II)", dose: 40.0, sol: 0.0004, peff: 3.5e-4, logp: 5.7, pka: 4.5 },
];

export default function AbsorptionPage() {
  const [doseMg, setDoseMg] = useState(400.0);
  const [solubility, setSolubility] = useState(0.021);
  const [peff, setPeff] = useState(4.2e-4);
  const [logp, setLogp] = useState(3.97);
  const [pka, setPka] = useState(4.4);
  const [durationH, setDurationH] = useState(12.0);
  const [timeStepH, setTimeStepH] = useState(0.1);
  const [gastricLag, setGastricLag] = useState(0.35);

  const [absorptionResult, setAbsorptionResult] = useState<AbsorptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<"fraction" | "rate">("fraction");

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.simulateAbsorption({
        dose_mg: doseMg,
        solubility_mg_ml: solubility,
        permeability_peff: peff,
        logp: logp,
        pka: pka,
        duration_h: durationH,
        time_step_h: timeStepH,
      });
      setAbsorptionResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [doseMg, solubility, peff, logp, pka, durationH, timeStepH, gastricLag]);

  const loadBenchmark = (b: typeof BENCHMARK_DRUGS[0]) => {
    setDoseMg(b.dose);
    setSolubility(b.sol);
    setPeff(b.peff);
    setLogp(b.logp);
    setPka(b.pka);
  };

  // Chart data
  const fractionChartData = absorptionResult
    ? absorptionResult.time.map((t, i) => ({
        time: t,
        fraction: Number((absorptionResult.fraction_absorbed[i] * 100).toFixed(2)),
      }))
    : [];

  const rateChartData = absorptionResult
    ? absorptionResult.time.map((t, i) => ({
        time: t,
        rate: absorptionResult.absorption_rate_mg_h[i],
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Gastrointestinal Absorption Simulator"
        subtitle="Physiologically-Based Multi-Segmental Intestinal Transit & Epithelial Permeation Kinetics"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Benchmark Presets */}
        <div className="p-4 rounded-xl bg-surface border border-surface-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-mono font-semibold text-slate-300 uppercase">
              Benchmark Reference Drugs:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {BENCHMARK_DRUGS.map((b) => (
              <button
                key={b.name}
                onClick={() => loadBenchmark(b)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-surface-card border border-surface-border text-slate-300 hover:text-white hover:border-emerald-500/50 transition-colors cursor-pointer"
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid: Parameters & Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="space-y-4">
            <div className="scientific-card p-5 space-y-4 border border-surface-border bg-surface">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Absorption Parameters
                  </h3>
                </div>
                <button
                  onClick={runSimulation}
                  disabled={loading}
                  className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                  Run
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Administered Dose</span>
                    <span className="text-emerald-400 font-bold">{doseMg} mg</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={doseMg}
                    onChange={(e) => setDoseMg(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Aqueous Solubility</span>
                    <span className="text-emerald-400 font-bold">{solubility} mg/mL</span>
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.0001"
                    value={solubility}
                    onChange={(e) => setSolubility(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Effective Permeability (Peff)</span>
                    <span className="text-emerald-400 font-bold">{(peff * 1e4).toFixed(2)} × 10⁻⁴ cm/s</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="10.0"
                    step="0.1"
                    value={peff * 1e4}
                    onChange={(e) => setPeff(Number(e.target.value) * 1e-4)}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      LogP (Lipophilicity)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={logp}
                      onChange={(e) => setLogp(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">
                      pKa (Ionization)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={pka}
                      onChange={(e) => setPka(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                    <span>Simulation Duration</span>
                    <span className="text-emerald-400 font-bold">{durationH} h</span>
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="24"
                    step="1"
                    value={durationH}
                    onChange={(e) => setDurationH(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* Rate Limiting Diagnostic */}
              {absorptionResult && (
                <div className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1.5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    BCS Absorption Limiting Factor:
                  </div>
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{absorptionResult.rate_limiting_step}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Transit rate governed by mucosal surface area, pH gradients, and compound lipophilicity.
                  </p>
                </div>
              )}
            </div>

            {/* Metrics Cards */}
            {absorptionResult && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-surface border border-surface-border space-y-1">
                  <div className="text-[10px] font-mono text-slate-400">Total Absorbed (Fa)</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">
                    {(absorptionResult.fa_infinity * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">Systemic Availability</div>
                </div>

                <div className="p-3 rounded-lg bg-surface border border-surface-border space-y-1">
                  <div className="text-[10px] font-mono text-slate-400">Gastric Lag (t_lag)</div>
                  <div className="text-lg font-mono font-bold text-white">
                    {absorptionResult.t_lag_h.toFixed(2)} h
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">Stomach Transit</div>
                </div>
              </div>
            )}
          </div>

          {/* Visualization Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="scientific-card p-5 space-y-4 border border-surface-border bg-surface">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveChart("fraction")}
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeChart === "fraction"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Fraction Absorbed Fa(t) %
                  </button>
                  <button
                    onClick={() => setActiveChart("rate")}
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      activeChart === "rate"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Absorption Flux Rate (mg/h)
                  </button>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {durationH} Hours In Silico
                </div>
              </div>

              {activeChart === "fraction" ? (
                <ScientificChart
                  data={fractionChartData}
                  xAxisKey="time"
                  xAxisLabel="Time (hours)"
                  yAxisLabel="Cumulative Absorbed (%)"
                  series={[
                    {
                      key: "fraction",
                      name: "Cumulative Absorbed %",
                      color: "#10b981",
                      strokeWidth: 2.5,
                    },
                  ]}
                  title="Cumulative Fraction Absorbed vs Time"
                  height={320}
                />
              ) : (
                <ScientificChart
                  data={rateChartData}
                  xAxisKey="time"
                  xAxisLabel="Time (hours)"
                  yAxisLabel="Absorption Rate (mg/h)"
                  series={[
                    {
                      key: "rate",
                      name: "Epithelial Flux Rate",
                      color: "#06b6d4",
                      strokeWidth: 2.5,
                    },
                  ]}
                  title="Systemic Absorption Rate vs Time"
                  height={320}
                />
              )}
            </div>

            {/* Segmental GI Tract Transit Table */}
            {absorptionResult && (
              <div className="scientific-card p-5 border border-surface-border bg-surface space-y-3">
                <div className="flex items-center gap-2 border-b border-surface-border pb-2.5">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                    Regional Gastrointestinal Transit & Flux Distribution
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-surface-border text-slate-400">
                        <th className="py-2 px-3 font-semibold">Compartment</th>
                        <th className="py-2 px-3 font-semibold">Physiological pH</th>
                        <th className="py-2 px-3 font-semibold">Transit Time</th>
                        <th className="py-2 px-3 font-semibold">Dissolved (mg)</th>
                        <th className="py-2 px-3 font-semibold">Absorption Flux (mg/h)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50 text-slate-300">
                      {absorptionResult.gi_transit_breakdown.map((row) => (
                        <tr key={row.segment} className="hover:bg-surface-hover">
                          <td className="py-2 px-3 font-bold text-white">{row.segment}</td>
                          <td className="py-2 px-3 text-slate-400">{row.ph.toFixed(1)}</td>
                          <td className="py-2 px-3 text-slate-400">{row.transit_time_h.toFixed(1)} h</td>
                          <td className="py-2 px-3 text-emerald-400 font-semibold">{row.dissolved_amount_mg}</td>
                          <td className="py-2 px-3 text-cyan-400 font-semibold">{row.absorbed_flux_rate_mg_h}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pipeline Step Forward Navigation */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-surface-border">
              <div className="text-xs text-slate-400">
                Next in Research Pipeline: <span className="text-white font-semibold">Whole-Body 5-Organ PBPK Simulation</span>
              </div>
              <Link
                href="/pk-pbpk"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-colors"
              >
                <span>Run PK/PBPK Simulation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
