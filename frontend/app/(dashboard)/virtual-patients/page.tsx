"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { VirtualPopulationResult, VirtualPatient } from "@/lib/types";
import { Users, AlertTriangle, Play, Sliders, Dna, Info, ShieldAlert } from "lucide-react";

export default function VirtualPatientsPage() {
  const [cohortSize, setCohortSize] = useState(50);
  const [randomSeed, setRandomSeed] = useState(42);
  const [weightMean, setWeightMean] = useState(72.0);
  const [weightCv, setWeightCv] = useState(16.0);
  const [clearanceCv, setClearanceCv] = useState(24.0);
  const [volumeCv, setVolumeCv] = useState(18.0);
  const [doseMg, setDoseMg] = useState(400.0);

  const [population, setPopulation] = useState<VirtualPopulationResult | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<VirtualPatient | null>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.simulatePopulation({
        cohort_size: cohortSize,
        random_seed: randomSeed,
        dose_mg: doseMg,
        weight_mean_kg: weightMean,
        weight_cv_percent: weightCv,
        clearance_cv_percent: clearanceCv,
        volume_cv_percent: volumeCv,
      });
      setPopulation(res);
      if (res.patients.length > 0) {
        setSelectedPatient(res.patients[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [cohortSize, randomSeed, weightMean, weightCv, clearanceCv, volumeCv, doseMg]);

  // Format chart data with percentile bands (5th, 25th, Median 50th, 75th, 95th)
  const chartData = population
    ? population.time.map((t, idx) => ({
        time: t,
        p5: population.percentile_5[idx],
        p25: population.percentile_25[idx],
        p50: population.percentile_50[idx],
        p75: population.percentile_75[idx],
        p95: population.percentile_95[idx],
        mean: population.mean_profile[idx],
        selectedPatient: selectedPatient && selectedPatient.trajectory ? selectedPatient.trajectory[idx] : undefined,
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Virtual Patients & Cohort Generator"
        subtitle="Monte Carlo Pharmacokinetic Variability Sampling Across Simulated Demographic & Metabolic Covariates"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Prominent Required Disclaimer */}
        <div className="p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300 font-mono font-bold tracking-wider uppercase">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>SIMULATED VIRTUAL POPULATION — NOT REAL PATIENT DATA</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            SYNTHETIC COHORT SAMPLING
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 scientific-card p-6 space-y-5">
            <div className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase">MONTE CARLO SAMPLING</h3>
                <Users className="h-4 w-4 text-purple-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Statistical variability parameters & random seed</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Cohort Size (N)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={cohortSize}
                    onChange={(e) => setCohortSize(parseInt(e.target.value) || 50)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Random Seed
                  </label>
                  <input
                    type="number"
                    value={randomSeed}
                    onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Mean Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={weightMean}
                    onChange={(e) => setWeightMean(parseFloat(e.target.value) || 72)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Weight CV (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={weightCv}
                    onChange={(e) => setWeightCv(parseFloat(e.target.value) || 16)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Clearance CV (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={clearanceCv}
                    onChange={(e) => setClearanceCv(parseFloat(e.target.value) || 24)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Volume CV (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={volumeCv}
                    onChange={(e) => setVolumeCv(parseFloat(e.target.value) || 18)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={runSimulation}
                disabled={loading}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>GENERATE VIRTUAL COHORT</span>
              </button>
            </div>

            {/* Population Statistics */}
            {population && (
              <div className="p-3 bg-surface-card border border-surface-border rounded space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-purple-400 font-bold">COHORT EXPOSURE SUMMARY</div>
                <div className="flex justify-between text-slate-300">
                  <span>Mean Cmax:</span>
                  <span className="text-white font-bold">{population.cmax_mean} mg/L ({population.cmax_cv_percent}% CV)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Mean AUC:</span>
                  <span className="text-emerald-400 font-bold">{population.auc_mean} mg·h/L ({population.auc_cv_percent}% CV)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Subject Count:</span>
                  <span className="text-white font-bold">{population.cohort_size} synthetic subjects</span>
                </div>
              </div>
            )}
          </div>

          {/* Chart & Subject Inspector */}
          <div className="lg:col-span-8 space-y-6">
            <ScientificChart
              data={chartData}
              xAxisKey="time"
              xAxisLabel="Time (hours)"
              yAxisLabel="Plasma Concentration (mg/L)"
              series={[
                { key: "p50", name: "Median (50th Percentile)", color: "#a855f7", strokeWidth: 2.5 },
                { key: "p95", name: "95th Percentile", color: "#38bdf8", strokeWidth: 1.5, strokeDasharray: "3 3" },
                { key: "p5", name: "5th Percentile", color: "#64748b", strokeWidth: 1.5, strokeDasharray: "3 3" },
                ...(selectedPatient ? [{ key: "selectedPatient", name: `Subject ${selectedPatient.patient_code}`, color: "#10b981", strokeWidth: 2 }] : []),
              ]}
              title={`Simulated Population Concentration Envelopes (N = ${cohortSize})`}
              subtitle="5th, 25th, 50th, 75th, and 95th Percentile Exposure Bands with Individual Subject Trajectory"
              height={360}
            />

            {/* Individual Virtual Patients Table */}
            {population && (
              <div className="scientific-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                    SIMULATED VIRTUAL PATIENTS (CLICK TO INSPECT PROFILE)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Showing first 10 of {population.patients.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b border-surface-border text-slate-400 text-[10px] uppercase">
                      <tr>
                        <th className="pb-2">Code</th>
                        <th className="pb-2">Sex</th>
                        <th className="pb-2">Age</th>
                        <th className="pb-2">Weight</th>
                        <th className="pb-2">CL (L/h)</th>
                        <th className="pb-2">Cmax (mg/L)</th>
                        <th className="pb-2">AUC (mg·h/L)</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border/50 text-slate-300">
                      {population.patients.slice(0, 10).map((pt) => {
                        const isSelected = selectedPatient?.id === pt.id;
                        return (
                          <tr
                            key={pt.id}
                            onClick={() => setSelectedPatient(pt)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-purple-950/30 text-white" : "hover:bg-surface-card"
                            }`}
                          >
                            <td className="py-2 font-semibold text-purple-300">{pt.patient_code}</td>
                            <td className="py-2">{pt.sex}</td>
                            <td className="py-2">{pt.age_years} y</td>
                            <td className="py-2">{pt.weight_kg} kg</td>
                            <td className="py-2">{pt.scaled_clearance_l_h}</td>
                            <td className="py-2">{pt.c_max}</td>
                            <td className="py-2 font-semibold text-emerald-400">{pt.auc}</td>
                            <td className="py-2 text-right">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSelected ? "bg-purple-600 text-white" : "bg-surface-card text-slate-400"}`}>
                                {isSelected ? "ACTIVE" : "VIEW"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
