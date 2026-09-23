"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { ValidationReport } from "@/lib/types";
import { CheckCircle2, AlertCircle, Play, BarChart2, Info, Sliders, Dna } from "lucide-react";

export default function ValidationPage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.runValidation();
      setReport(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const residualChartData = report
    ? report.residuals.map((r, i) => ({
        index: i + 1,
        predicted: r.predicted,
        residual: r.residual,
        zero: 0,
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Model Validation, Residual Diagnostics & Sensitivity Studio"
        subtitle="Empirical Multi-Model Error Assessment, Residual Normality Verification & One-At-a-Time (OAT) Elasticity"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Validation Status Banner */}
        {report && (
          <div className="p-3.5 bg-surface-card border border-surface-border rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-xs font-mono font-bold text-white uppercase">
                  VALIDATION STATUS: {report.validation_status}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Evaluated on {report.test_sample_size} independent held-out pharmacokinetic benchmark scenarios
                </div>
              </div>
            </div>
            <button
              onClick={runValidation}
              disabled={loading}
              className="px-3 py-1.5 bg-pharma-primary/20 hover:bg-pharma-primary/30 border border-pharma-primary/40 rounded text-xs font-mono text-pharma-accent cursor-pointer transition-colors"
            >
              {loading ? "Recomputing..." : "Rerun Diagnostics"}
            </button>
          </div>
        )}

        {/* Comparative Validation Metrics Table */}
        {report && (
          <div className="scientific-card p-5 space-y-3">
            <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
              CROSS-MODEL EMPIRICAL BENCHMARK METRICS
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-surface-border text-slate-400 text-[10px] uppercase">
                  <tr>
                    <th className="pb-2">Model Architecture</th>
                    <th className="pb-2">MAE (mg/L)</th>
                    <th className="pb-2">RMSE (mg/L)</th>
                    <th className="pb-2">R² Score</th>
                    <th className="pb-2 text-right">MAPE (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-300">
                  {report.metrics_table.map((m) => (
                    <tr key={m.model} className="hover:bg-surface-card">
                      <td className="py-2.5 font-semibold text-white">{m.model}</td>
                      <td className="py-2.5">{m.mae}</td>
                      <td className="py-2.5">{m.rmse}</td>
                      <td className="py-2.5 font-bold text-emerald-400">{m.r2}</td>
                      <td className="py-2.5 text-right">{m.mape}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Residuals and Error Distribution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Residual Plot */}
          <ScientificChart
            data={residualChartData}
            xAxisKey="predicted"
            xAxisLabel="Predicted Concentration / Exposure (mg·h/L)"
            yAxisLabel="Residual (ei = Observed - Predicted)"
            series={[
              { key: "residual", name: "Residual (ei)", color: "#f43f5e", strokeWidth: 1.5 },
              { key: "zero", name: "Zero Line", color: "#64748b", strokeDasharray: "3 3", strokeWidth: 1 },
            ]}
            title="Residual Scatter Diagnostics"
            subtitle="Evaluating Homoscedasticity & Absence of Systematic Model Bias"
            height={320}
          />

          {/* Error Distribution Histogram */}
          {report && (
            <div className="scientific-card p-5 space-y-4">
              <div className="border-b border-surface-border pb-2">
                <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                  RESIDUAL ERROR DISTRIBUTION HISTOGRAM
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                  Verifying Gaussian Normality of Prediction Errors (ei &sim; N(0, &sigma;²))
                </p>
              </div>

              <div className="space-y-2 pt-2">
                {report.error_histogram.map((bin) => (
                  <div key={bin.bin} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-300">{bin.bin}</span>
                      <span className="text-pharma-cyan font-semibold">{bin.count} pts</span>
                    </div>
                    <div className="h-2 w-full bg-surface-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pharma-cyan rounded-full"
                        style={{ width: `${Math.min(100, (bin.count / 15) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* One-At-a-Time (OAT) Sensitivity Analysis */}
        {report && (
          <div className="scientific-card p-5 space-y-4">
            <div className="border-b border-surface-border pb-2">
              <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                ONE-AT-A-TIME (OAT) LOCAL PARAMETER SENSITIVITY ANALYSIS
              </h4>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                Elasticity Index S_&theta; = (% &Delta; Exposure) / (% &Delta; Parameter) across &plusmn;50% Perturbations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.sensitivities.map((sens) => (
                <div key={sens.parameter} className="p-4 rounded-lg bg-surface-card border border-surface-border space-y-2">
                  <div className="text-xs font-bold text-white font-mono">{sens.parameter}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Baseline: {sens.baseline} {sens.unit}
                  </div>
                  <div className="pt-1 border-t border-surface-border/60 text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Elasticity AUC:</span>
                      <span className="text-emerald-400 font-bold">{sens.elasticity_auc}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Elasticity Cmax:</span>
                      <span className="text-sky-400 font-bold">{sens.elasticity_cmax}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
