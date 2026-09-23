"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { ScientificChart } from "@/components/scientific/ScientificChart";
import { pharmaApi } from "@/lib/api-client";
import { MLResult, MLModelType } from "@/lib/types";
import { Brain, Play, BarChart3, Layers, CheckCircle2, Sliders, Dna, Info } from "lucide-react";
import Link from "next/link";

export default function MachineLearningPage() {
  const [modelType, setModelType] = useState<MLModelType>("Random Forest");
  const [targetMetric, setTargetMetric] = useState<"AUC" | "Cmax" | "Tmax">("AUC");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MLResult | null>(null);

  const handleTrain = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.trainML({
        model_type: modelType,
        target_metric: targetMetric,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleTrain();
  }, [modelType, targetMetric]);

  // Actual vs Predicted Chart Data
  const scatterData = result
    ? result.test_predictions.map((pt, i) => ({
        index: i + 1,
        actual: pt.actual,
        predicted: pt.predicted,
        residual: pt.residual,
      }))
    : [];

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Machine Learning & Biopharmaceutical Regressor Studio"
        subtitle="In Silico Dataset Generation, Scikit-Style Model Training, Empirical Loss Evaluation & Feature Importance"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-4 scientific-card p-6 space-y-5">
            <div className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase">ALGORITHM SETUP</h3>
                <Brain className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Select regression architecture and prediction target</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Regression Model Architecture
                </label>
                <select
                  value={modelType}
                  onChange={(e: any) => setModelType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono cursor-pointer"
                >
                  <option value="Random Forest">Random Forest Regressor (Ensemble)</option>
                  <option value="Gradient Boosting">Gradient Boosting Regressor</option>
                  <option value="Linear Regression">Ridge Linear Regression (L2 Regularized)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Pharmacokinetic Target Variable
                </label>
                <select
                  value={targetMetric}
                  onChange={(e: any) => setTargetMetric(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono cursor-pointer"
                >
                  <option value="AUC">AUC0-inf (Total Systemic Exposure, mg·h/L)</option>
                  <option value="Cmax">Cmax (Peak Plasma Concentration, mg/L)</option>
                  <option value="Tmax">Tmax (Time of Peak Concentration, h)</option>
                </select>
              </div>

              <div className="p-3 bg-surface-card border border-surface-border rounded space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-amber-400 font-bold">DATASET PROFILE</div>
                <div className="flex justify-between text-slate-300">
                  <span>Input Features:</span>
                  <span className="text-white font-bold">9 Covariates</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Training Set Size:</span>
                  <span className="text-white font-bold">{result?.train_size || 90} samples</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Held-Out Test Size:</span>
                  <span className="text-white font-bold">{result?.test_size || 30} samples</span>
                </div>
              </div>

              <button
                onClick={handleTrain}
                disabled={loading}
                className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>{loading ? "TRAINING MODEL..." : "RETRAIN & EVALUATE REGRESSOR"}</span>
              </button>
            </div>

            {/* Empirical Validation Metrics Cards */}
            {result && (
              <div className="p-4 bg-surface border border-surface-border rounded-lg space-y-3">
                <div className="text-[10px] font-mono uppercase text-pharma-cyan font-bold tracking-wider">
                  TEST SET EMPIRICAL METRICS
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-surface-card rounded border border-surface-border">
                    <div className="text-[9px] font-mono text-slate-400">MAE</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{result.mae}</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded border border-surface-border">
                    <div className="text-[9px] font-mono text-slate-400">RMSE</div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">{result.rmse}</div>
                  </div>
                  <div className="p-2 bg-surface-card rounded border border-surface-border">
                    <div className="text-[9px] font-mono text-slate-400">R² SCORE</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{result.r2}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Charts & Feature Importance */}
          <div className="lg:col-span-8 space-y-6">
            <ScientificChart
              data={scatterData}
              xAxisKey="actual"
              xAxisLabel={`Actual ${targetMetric} (Simulated Benchmark)`}
              yAxisLabel={`Predicted ${targetMetric} (Model Output)`}
              series={[
                { key: "predicted", name: "Model Prediction", color: "#f59e0b", strokeWidth: 2 },
                { key: "actual", name: "Ground Truth (Identity Line)", color: "#06b6d4", strokeWidth: 1.5, strokeDasharray: "4 4" },
              ]}
              title={`Actual vs Predicted Exposure (${modelType})`}
              subtitle={`Held-Out Test Set Generalization Evaluation for ${targetMetric}`}
              height={350}
            />

            {/* Feature Importance Bar List */}
            {result && (
              <div className="scientific-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-surface-border pb-2">
                  <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                    PERMUTATION FEATURE IMPORTANCE RANKING
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Normalized Permutation Variance Impact
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {result.feature_importance.map((item, idx) => (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">
                          {idx + 1}. {item.feature}
                        </span>
                        <span className="text-amber-400 font-semibold">
                          {(item.importance * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, item.importance * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
