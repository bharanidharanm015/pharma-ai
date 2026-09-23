"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { ClassicalPKResult, PBPKResult } from "@/lib/types";
import { HeartPulse, Activity, ShieldCheck, Play, Info, Sliders, Dna } from "lucide-react";

export default function PKPBPKPage() {
  const [activeEngine, setActiveEngine] = useState<"pk" | "pbpk">("pbpk");

  // Classical PK Parameters
  const [pkModelType, setPkModelType] = useState<"1-Compartment Oral" | "1-Compartment IV" | "2-Compartment Oral">("1-Compartment Oral");
  const [doseMg, setDoseMg] = useState(400.0);
  const [clLH, setClLH] = useState(3.2);
  const [vdL, setVdL] = useState(9.8);
  const [kaPerH, setKaPerH] = useState(1.2);
  const [bioavailF, setBioavailF] = useState(0.95);

  // PBPK Parameters (Transparent & Configurable)
  const [bodyWeightKg, setBodyWeightKg] = useState(70.0);
  const [durationH, setDurationH] = useState(24.0);
  const [timeStepH, setTimeStepH] = useState(0.1);
  const [kpLiver, setKpLiver] = useState(1.85);
  const [kpKidney, setKpKidney] = useState(2.1);
  const [kpTissue, setKpTissue] = useState(1.25);
  const [clHepLH, setClHepLH] = useState(2.8);
  const [clRenalLH, setClRenalLH] = useState(0.4);

  // Results
  const [pkResult, setPkResult] = useState<ClassicalPKResult | null>(null);
  const [pbpkResult, setPbpkResult] = useState<PBPKResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulations = async () => {
    setLoading(true);
    try {
      const pk = await pharmaApi.simulatePK({
        model_type: pkModelType,
        dose_mg: doseMg,
        cl_l_h: clLH,
        vd_l: vdL,
        ka_per_h: kaPerH,
        bioavailability_f: bioavailF,
        duration_h: durationH,
      });
      setPkResult(pk);

      const pbpk = await pharmaApi.simulatePBPK({
        dose_mg: doseMg,
        body_weight_kg: bodyWeightKg,
        ka_per_h: kaPerH,
        f_oral: bioavailF,
        cl_hep_l_h: clHepLH,
        cl_renal_l_h: clRenalLH,
        kp_liver: kpLiver,
        kp_kidney: kpKidney,
        kp_tissue: kpTissue,
        duration_h: durationH,
        time_step_h: timeStepH,
      });
      setPbpkResult(pbpk);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulations();
  }, [
    pkModelType,
    doseMg,
    clLH,
    vdL,
    kaPerH,
    bioavailF,
    bodyWeightKg,
    durationH,
    timeStepH,
    kpLiver,
    kpKidney,
    kpTissue,
    clHepLH,
    clRenalLH,
  ]);

  // Chart Data preparation
  const pkChartData = pkResult
    ? pkResult.time.map((t, i) => ({
        time: t,
        conc: pkResult.concentration[i],
      }))
    : [];

  const pbpkChartData = pbpkResult
    ? pbpkResult.time.map((t, i) => ({
        time: t,
        plasma: pbpkResult.plasma_conc[i],
        liver: pbpkResult.liver_conc[i],
        kidney: pbpkResult.kidney_conc[i],
        tissue: pbpkResult.tissue_conc[i],
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Modular PK & PBPK Simulation Engine"
        subtitle="Classical Compartmental Pharmacokinetics & 5-Organ Continuous Runge-Kutta 4th Order (RK4) PBPK"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Engine Switcher */}
        <div className="flex border-b border-surface-border gap-4">
          <button
            onClick={() => setActiveEngine("pbpk")}
            className={`pb-3 px-1 text-sm font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeEngine === "pbpk"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <HeartPulse className="h-4 w-4" />
            <span>1. 5-ORGAN CONTINUOUS PBPK (RK4 SOLVER)</span>
          </button>
          <button
            onClick={() => setActiveEngine("pk")}
            className={`pb-3 px-1 text-sm font-mono font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeEngine === "pk"
                ? "border-pharma-cyan text-pharma-cyan"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>2. CLASSICAL PHARMACOKINETICS (1C / 2C)</span>
          </button>
        </div>

        {/* 1. PBPK Tab */}
        {activeEngine === "pbpk" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls Panel */}
            <div className="lg:col-span-4 scientific-card p-6 space-y-5">
              <div className="border-b border-surface-border pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white font-mono uppercase">PHYSIOLOGICAL PARAMETERS</h3>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">RK4 CONTINUOUS</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Configurable blood flows, partition coefficients & clearance</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                      Body Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={bodyWeightKg}
                      onChange={(e) => setBodyWeightKg(parseFloat(e.target.value) || 70)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Absorption ka (1/h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={kaPerH}
                      onChange={(e) => setKaPerH(parseFloat(e.target.value) || 1.2)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Duration (h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={durationH}
                      onChange={(e) => setDurationH(parseFloat(e.target.value) || 24)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                {/* Organ Partition Coefficients */}
                <div className="p-3 bg-surface-card border border-surface-border rounded space-y-2">
                  <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                    ORGAN PARTITION COEFFICIENTS (Kp)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400">Kp Liver</label>
                      <input
                        type="number"
                        step="0.05"
                        value={kpLiver}
                        onChange={(e) => setKpLiver(parseFloat(e.target.value) || 1.85)}
                        className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400">Kp Kidney</label>
                      <input
                        type="number"
                        step="0.05"
                        value={kpKidney}
                        onChange={(e) => setKpKidney(parseFloat(e.target.value) || 2.1)}
                        className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-slate-400">Kp Tissue</label>
                      <input
                        type="number"
                        step="0.05"
                        value={kpTissue}
                        onChange={(e) => setKpTissue(parseFloat(e.target.value) || 1.25)}
                        className="w-full px-2 py-1 bg-surface border border-surface-border rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Clearances */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Hepatic CL (L/h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={clHepLH}
                      onChange={(e) => setClHepLH(parseFloat(e.target.value) || 2.8)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Renal CL (L/h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={clRenalLH}
                      onChange={(e) => setClRenalLH(parseFloat(e.target.value) || 0.4)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                {/* Mass Conservation Guarantee Badge */}
                {pbpkResult && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Mass Conservation Error:</span>
                    </div>
                    <span className="font-bold text-emerald-400">
                      {pbpkResult.mass_balance_error_percent}% (&lt;0.05%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart & Organ Breakdown */}
            <div className="lg:col-span-8 space-y-6">
              <ScientificChart
                data={pbpkChartData}
                xAxisKey="time"
                xAxisLabel="Time (hours)"
                yAxisLabel="Concentration (mg/L)"
                series={[
                  { key: "plasma", name: "Central Plasma", color: "#38bdf8", strokeWidth: 2.5 },
                  { key: "liver", name: "Liver Tissue", color: "#f59e0b", strokeWidth: 2 },
                  { key: "kidney", name: "Kidney Tissue", color: "#10b981", strokeWidth: 2 },
                  { key: "tissue", name: "Peripheral Tissue", color: "#8b5cf6", strokeWidth: 1.5, strokeDasharray: "3 3" },
                ]}
                title="5-Organ Continuous PBPK Distribution"
                subtitle="Runge-Kutta 4th Order ODE Multi-Compartment Physiological Concentration-Time Profiles"
                height={350}
              />

              {/* Exposure Metrics Cards */}
              {pbpkResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Plasma Cmax</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{pbpkResult.c_max_plasma} mg/L</div>
                  </div>
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Plasma Tmax</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{pbpkResult.t_max_plasma} h</div>
                  </div>
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Plasma AUC0-inf</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{pbpkResult.auc_plasma} mg·h/L</div>
                  </div>
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Cardiac Flow</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">
                      {pbpkResult.physiological_parameters.cardiac_output_l_h} L/h
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Classical PK Tab */}
        {activeEngine === "pk" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* PK Inputs */}
            <div className="lg:col-span-4 scientific-card p-6 space-y-5">
              <div className="border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold text-white font-mono uppercase">CLASSICAL PK INPUTS</h3>
                <p className="text-xs text-slate-400 mt-0.5">1-Compartment & 2-Compartment Analytical Models</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Compartment Model & Route
                  </label>
                  <select
                    value={pkModelType}
                    onChange={(e: any) => setPkModelType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono cursor-pointer"
                  >
                    <option value="1-Compartment Oral">1-Compartment Oral (Bateman)</option>
                    <option value="1-Compartment IV">1-Compartment IV Bolus</option>
                    <option value="2-Compartment Oral">2-Compartment Oral (Distribution & Elimination)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Dose (mg)</label>
                    <input
                      type="number"
                      step="any"
                      value={doseMg}
                      onChange={(e) => setDoseMg(parseFloat(e.target.value) || 400)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Clearance CL (L/h)</label>
                    <input
                      type="number"
                      step="any"
                      value={clLH}
                      onChange={(e) => setClLH(parseFloat(e.target.value) || 3.2)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Volume Vd (L)</label>
                    <input
                      type="number"
                      step="any"
                      value={vdL}
                      onChange={(e) => setVdL(parseFloat(e.target.value) || 9.8)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Absorption ka (1/h)</label>
                    <input
                      type="number"
                      step="any"
                      value={kaPerH}
                      onChange={(e) => setKaPerH(parseFloat(e.target.value) || 1.2)}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Bioavailability F</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    max="1.0"
                    value={bioavailF}
                    onChange={(e) => setBioavailF(parseFloat(e.target.value) || 0.95)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Mathematical Equation Box */}
              {pkResult && (
                <div className="p-3 bg-surface-card border border-surface-border rounded space-y-1.5 text-[11px] font-mono text-slate-300">
                  <div className="text-[10px] uppercase text-pharma-cyan font-bold">MATHEMATICAL FORMULATION</div>
                  <div>{pkResult.equations.ode}</div>
                  <div className="text-[10px] text-slate-400">{pkResult.equations.analytical}</div>
                </div>
              )}
            </div>

            {/* PK Chart & Summary Cards */}
            <div className="lg:col-span-8 space-y-6">
              <ScientificChart
                data={pkChartData}
                xAxisKey="time"
                xAxisLabel="Time (hours)"
                yAxisLabel="Systemic Plasma Concentration (mg/L)"
                series={[{ key: "conc", name: "Plasma Concentration", color: "#06b6d4", strokeWidth: 2.5 }]}
                title={`Classical Pharmacokinetic Profile (${pkModelType})`}
                subtitle="Simulated Concentration vs Time Curve with Exact Kinetic Parameters"
                height={350}
              />

              {/* Classical PK Metrics Grid */}
              {pkResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Cmax</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{pkResult.c_max} mg/L</div>
                  </div>
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Tmax</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{pkResult.t_max} h</div>
                  </div>
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">AUC 0-inf</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{pkResult.auc_0_inf} mg·h/L</div>
                  </div>
                  <div className="scientific-card p-3 text-center">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Half-Life t1/2</div>
                    <div className="text-lg font-bold text-white font-mono mt-0.5">{pkResult.half_life_h} h</div>
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
