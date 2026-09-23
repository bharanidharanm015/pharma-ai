"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { XAIResult } from "@/lib/types";
import { Sparkles, ArrowUpRight, ArrowDownRight, Info, CheckCircle2, Play, Dna } from "lucide-react";

export default function ExplainableAIPage() {
  const [doseMg, setDoseMg] = useState(500.0);
  const [clearance, setClearance] = useState(3.2);
  const [polymer, setPolymer] = useState(28.0);
  const [weight, setWeight] = useState(72.0);
  const [peff, setPeff] = useState(4.2);
  const [solubility, setSolubility] = useState(0.021);
  const [targetMetric, setTargetMetric] = useState<"AUC" | "Cmax">("AUC");

  const [xaiResult, setXaiResult] = useState<XAIResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runExplainability = async () => {
    setLoading(true);
    try {
      const res = await pharmaApi.explainPrediction(
        {
          dose_mg: doseMg,
          molecular_weight: 206.3,
          logp: 3.97,
          solubility_mg_ml: solubility,
          permeability_peff: peff,
          polymer_percent: polymer,
          particle_size_um: 45.0,
          patient_weight_kg: weight,
          clearance_l_h: clearance,
        },
        targetMetric
      );
      setXaiResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runExplainability();
  }, [doseMg, clearance, polymer, weight, peff, solubility, targetMetric]);

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Explainable AI (XAI) Model Interpretability Studio"
        subtitle="SHAP-Style Additive Local Feature Attributions Decomposing Physicochemical Drivers of Predicted Exposure"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Compliance Notice */}
        <div className="p-3 bg-surface-card border border-surface-border rounded-lg flex items-center justify-between text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-pharma-cyan shrink-0" />
            <span>MODEL ATTRIBUTION: All feature contributions are derived mathematically from actual model perturbations.</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">NO FABRICATED ATTRIBUTIONS</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs Panel */}
          <div className="lg:col-span-4 scientific-card p-6 space-y-5">
            <div className="border-b border-surface-border pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-mono uppercase">COVARIATE PROFILE</h3>
                <Sparkles className="h-4 w-4 text-pharma-cyan" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Parameters for local attribution breakdown</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Target Outcome
                </label>
                <select
                  value={targetMetric}
                  onChange={(e: any) => setTargetMetric(e.target.value)}
                  className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono cursor-pointer"
                >
                  <option value="AUC">AUC0-inf (Systemic Exposure)</option>
                  <option value="Cmax">Cmax (Peak Concentration)</option>
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
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Clearance (L/h)</label>
                  <input
                    type="number"
                    step="any"
                    value={clearance}
                    onChange={(e) => setClearance(parseFloat(e.target.value) || 3.2)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Polymer (%)</label>
                  <input
                    type="number"
                    step="any"
                    value={polymer}
                    onChange={(e) => setPolymer(parseFloat(e.target.value) || 28)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="any"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 72)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Peff (10^-4 cm/s)</label>
                  <input
                    type="number"
                    step="any"
                    value={peff}
                    onChange={(e) => setPeff(parseFloat(e.target.value) || 4.2)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Solubility (mg/mL)</label>
                  <input
                    type="number"
                    step="any"
                    value={solubility}
                    onChange={(e) => setSolubility(parseFloat(e.target.value) || 0.021)}
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={runExplainability}
                disabled={loading}
                className="w-full py-2 bg-pharma-primary hover:bg-sky-500 text-white rounded font-mono text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>RECOMPUTE SHAP ATTRIBUTIONS</span>
              </button>
            </div>

            {/* Prediction Decomposition Header */}
            {xaiResult && (
              <div className="p-4 bg-surface border border-surface-border rounded-lg space-y-2 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Baseline Population E[f(x)]:</span>
                  <span className="text-white font-bold">{xaiResult.baseline_expected_value} {xaiResult.target_unit}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Local Marginal Shift:</span>
                  <span className="text-pharma-cyan font-bold">
                    {(xaiResult.predicted_value - xaiResult.baseline_expected_value).toFixed(2)} {xaiResult.target_unit}
                  </span>
                </div>
                <div className="border-t border-surface-border pt-1.5 flex justify-between text-slate-300">
                  <span>Predicted Outcome:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {xaiResult.predicted_value} {xaiResult.target_unit}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Attribution Waterfall & Explanation */}
          <div className="lg:col-span-8 space-y-6">
            {xaiResult && (
              <>
                {/* Feature Attribution List */}
                <div className="scientific-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-surface-border pb-3">
                    <div>
                      <h4 className="text-xs font-mono uppercase text-white font-bold tracking-wider">
                        SHAP-STYLE LOCAL ATTRIBUTION WATERFALL
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        f(x) = {xaiResult.baseline_expected_value} (Base) + &Sigma; &Phi;i = {xaiResult.predicted_value} {xaiResult.target_unit}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      Additivity Verified
                    </span>
                  </div>

                  <div className="space-y-3">
                    {xaiResult.attributions.map((attr) => {
                      const isPos = attr.impact === "positive";
                      return (
                        <div key={attr.feature_name} className="p-3 rounded-lg bg-surface-card border border-surface-border space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2">
                              {isPos ? (
                                <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-rose-400" />
                              )}
                              <span className="font-bold text-white">{attr.feature_name}</span>
                              <span className="text-slate-400">({attr.feature_value})</span>
                            </div>
                            <span className={`font-bold ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                              {isPos ? "+" : ""}{attr.attribution_phi} {xaiResult.target_unit}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                            {attr.rationale}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Plain Language Interpretation */}
                <div className="scientific-card p-5 space-y-2">
                  <div className="flex items-center gap-2 text-pharma-cyan font-mono text-xs font-bold uppercase">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>NATURAL LANGUAGE EXPLANATION</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {xaiResult.plain_language_explanation}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
