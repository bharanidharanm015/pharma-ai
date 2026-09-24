"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { SavedExperiment } from "@/lib/types";
import {
  BookmarkCheck,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  FlaskConical,
  X,
  FileText,
  Save,
  RotateCcw,
  Inbox,
  AlertCircle,
  Filter,
} from "lucide-react";

export default function ResearchResultsPage() {
  const [experiments, setExperiments] = useState<SavedExperiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<SavedExperiment | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState("all");
  const [loading, setLoading] = useState(true);

  // New Experiment Form
  const [newExpForm, setNewExpForm] = useState({
    title: "",
    drug_name: "Ibuprofen",
    formulation_name: "ER Matrix Tablet",
    model: "5-Organ PBPK RK4",
    validation_status: "Validated" as const,
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [exps, noteContent] = await Promise.all([
        pharmaApi.getSavedExperiments(),
        pharmaApi.getResearchNotes(),
      ]);
      setExperiments(exps || []);
      setNotes(noteContent || "");
    } catch (e) {
      console.error("Failed to load results:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await pharmaApi.saveResearchNotes(notes);
      setStatusMsg("Research notes successfully saved to secure repository.");
      setTimeout(() => setStatusMsg(null), 3000);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    const expId = `EXP-${new Date().getFullYear()}-${String(experiments.length + 1).padStart(3, "0")}`;
    const newRecord: SavedExperiment = {
      id: `exp_${Date.now()}`,
      experiment_id: expId,
      title: newExpForm.title || `${newExpForm.drug_name} ${newExpForm.model} Run`,
      drug_name: newExpForm.drug_name,
      formulation_name: newExpForm.formulation_name,
      model: newExpForm.model,
      parameters_json: {
        dose_mg: 400,
        solubility_mg_ml: 0.021,
        peff_cm_s: "4.2e-4",
        polymer_conc_percent: 28.0,
      },
      results_json: {
        c_max: 13.8,
        auc_0_inf: 118.2,
        t_max: 1.85,
        mass_balance_error_percent: 0.03,
      },
      validation_status: newExpForm.validation_status,
      notes: newExpForm.notes,
      created_at: new Date().toISOString(),
    };

    await pharmaApi.saveExperiment(newRecord);
    setShowSaveModal(false);
    setStatusMsg(`Experiment ${expId} saved successfully.`);
    setTimeout(() => setStatusMsg(null), 3500);
    loadData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved experiment?")) {
      await pharmaApi.deleteExperiment(id);
      if (selectedExp?.id === id) setSelectedExp(null);
      loadData();
    }
  };

  const filteredExperiments = experiments.filter((e) => {
    if (filterModel === "all") return true;
    return e.model.toLowerCase().includes(filterModel.toLowerCase());
  });

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Research Results & Saved Experiments"
        subtitle="Archive, Inspect, and Reopen In Silico Simulation Workflows & Mechanistic Models"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {statusMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Action Header & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-surface-border">
          <div className="flex items-center gap-3">
            <BookmarkCheck className="h-5 w-5 text-pharma-cyan" />
            <div>
              <div className="text-xs font-mono font-bold uppercase text-white">
                Saved Experiment Library
              </div>
              <div className="text-[11px] text-slate-400">
                {experiments.length} total saved workflows in user workspace
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-surface-card border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono">
              <Filter className="h-3 w-3 text-slate-400" />
              <select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="all">All Models</option>
                <option value="PBPK">PBPK</option>
                <option value="Dissolution">Dissolution</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="Optimization">Optimization</option>
              </select>
            </div>

            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3 py-1.5 rounded-lg bg-pharma-primary hover:bg-sky-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save New Experiment</span>
            </button>
          </div>
        </div>

        {/* Experiments Table or Clean Empty State */}
        <div className="scientific-card p-5 border border-surface-border bg-surface">
          {loading ? (
            <div className="py-12 text-center text-xs font-mono text-slate-400">
              Loading saved experiments...
            </div>
          ) : filteredExperiments.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-surface-card border border-surface-border mx-auto flex items-center justify-center text-slate-500">
                <Inbox className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white font-mono">No Saved Experiments Found</div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No experiments have been saved yet. You can save an experiment manually using the button above or save directly from any simulator.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 rounded-lg bg-pharma-primary hover:bg-sky-500 text-white text-xs font-mono font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create First Experiment</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-surface-border text-slate-400">
                    <th className="py-2.5 px-3 font-semibold">Experiment ID</th>
                    <th className="py-2.5 px-3 font-semibold">Drug / Compound</th>
                    <th className="py-2.5 px-3 font-semibold">Formulation</th>
                    <th className="py-2.5 px-3 font-semibold">Model</th>
                    <th className="py-2.5 px-3 font-semibold">Validation</th>
                    <th className="py-2.5 px-3 font-semibold">Created Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/50 text-slate-300">
                  {filteredExperiments.map((exp) => (
                    <tr
                      key={exp.id}
                      onClick={() => setSelectedExp(exp)}
                      className="hover:bg-surface-hover cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                        <BookmarkCheck className="h-3.5 w-3.5 text-pharma-cyan" />
                        <span>{exp.experiment_id}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{exp.drug_name}</td>
                      <td className="py-3 px-3 text-slate-400">{exp.formulation_name}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-surface-card border border-surface-border text-slate-300">
                          {exp.model}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                            exp.validation_status === "Validated"
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80"
                              : exp.validation_status === "Conditional"
                              ? "bg-amber-950/60 text-amber-300 border-amber-800/80"
                              : "bg-slate-800 text-slate-300 border-slate-700"
                          }`}
                        >
                          {exp.validation_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {new Date(exp.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedExp(exp);
                            }}
                            className="p-1 rounded hover:bg-surface-card text-pharma-cyan"
                            title="Inspect Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(exp.id, e)}
                            className="p-1 rounded hover:bg-rose-950/40 text-rose-400"
                            title="Delete Experiment"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Experiment Inspection Modal / Detail Drawer */}
        {selectedExp && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="scientific-card w-full max-w-2xl bg-surface border border-surface-border shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="h-5 w-5 text-pharma-cyan" />
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">
                      {selectedExp.experiment_id}: {selectedExp.title}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400">
                      Archived on {new Date(selectedExp.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExp(null)}
                  className="p-1 rounded hover:bg-surface-card text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-surface-card border border-surface-border space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Drug / Compound</span>
                  <div className="font-bold text-white">{selectedExp.drug_name}</div>
                </div>
                <div className="p-3 rounded bg-surface-card border border-surface-border space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Formulation</span>
                  <div className="font-bold text-white">{selectedExp.formulation_name}</div>
                </div>
                <div className="p-3 rounded bg-surface-card border border-surface-border space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Model</span>
                  <div className="font-bold text-pharma-cyan">{selectedExp.model}</div>
                </div>
                <div className="p-3 rounded bg-surface-card border border-surface-border space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase">Validation Status</span>
                  <div className="font-bold text-emerald-400">{selectedExp.validation_status}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Simulation Parameters:
                </div>
                <pre className="p-3 rounded bg-surface-card border border-surface-border text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedExp.parameters_json, null, 2)}
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase">
                  Execution Results:
                </div>
                <pre className="p-3 rounded bg-surface-card border border-surface-border text-[11px] font-mono text-emerald-300 overflow-x-auto">
                  {JSON.stringify(selectedExp.results_json, null, 2)}
                </pre>
              </div>

              {selectedExp.notes && (
                <div className="space-y-1 text-xs">
                  <span className="font-mono font-bold text-slate-300 uppercase">Scientist Notes:</span>
                  <p className="p-2.5 rounded bg-surface-card border border-surface-border text-slate-300 text-xs">
                    {selectedExp.notes}
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-surface-border">
                <Link
                  href="/pk-pbpk"
                  className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reopen in Simulator</span>
                </Link>
                <button
                  onClick={() => setSelectedExp(null)}
                  className="px-3.5 py-1.5 rounded bg-surface-card border border-surface-border text-slate-300 hover:text-white text-xs font-mono"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Experiment Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="scientific-card w-full max-w-lg bg-surface border border-surface-border shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-surface-border pb-3">
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-pharma-cyan" />
                  <span>Archive Simulation Experiment</span>
                </h3>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-1 rounded hover:bg-surface-card text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateExperiment} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                    Experiment Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newExpForm.title}
                    onChange={(e) => setNewExpForm({ ...newExpForm, title: e.target.value })}
                    placeholder="e.g. Ibuprofen 400mg PBPK Organ Clearance"
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                      Drug / Compound
                    </label>
                    <input
                      type="text"
                      required
                      value={newExpForm.drug_name}
                      onChange={(e) => setNewExpForm({ ...newExpForm, drug_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                      Formulation
                    </label>
                    <input
                      type="text"
                      required
                      value={newExpForm.formulation_name}
                      onChange={(e) => setNewExpForm({ ...newExpForm, formulation_name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                      Simulation Model
                    </label>
                    <select
                      value={newExpForm.model}
                      onChange={(e) => setNewExpForm({ ...newExpForm, model: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                    >
                      <option value="5-Organ PBPK RK4">5-Organ PBPK RK4</option>
                      <option value="Classical 1C/2C PK">Classical 1C/2C PK</option>
                      <option value="Korsmeyer-Peppas Dissolution">Korsmeyer-Peppas Dissolution</option>
                      <option value="GI Absorption Flux">GI Absorption Flux</option>
                      <option value="Random Forest Regressor">Random Forest Regressor</option>
                      <option value="Pareto Multi-Objective">Pareto Multi-Objective</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                      Validation Status
                    </label>
                    <select
                      value={newExpForm.validation_status}
                      onChange={(e) => setNewExpForm({ ...newExpForm, validation_status: e.target.value as any })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white"
                    >
                      <option value="Validated">Validated</option>
                      <option value="Conditional">Conditional</option>
                      <option value="Pending">Pending</option>
                      <option value="Exploratory">Exploratory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                    Scientist Observations / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={newExpForm.notes}
                    onChange={(e) => setNewExpForm({ ...newExpForm, notes: e.target.value })}
                    placeholder="Enter experimental rationale and mass balance observations..."
                    className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(false)}
                    className="px-3 py-1.5 rounded bg-surface-card border border-surface-border text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded bg-pharma-primary hover:bg-sky-500 text-white text-xs font-mono font-bold"
                  >
                    Save Experiment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Persistent Investigator Observations */}
        <div className="scientific-card p-5 border border-surface-border bg-surface space-y-3">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-pharma-cyan" />
              <h3 className="text-xs font-bold text-white font-mono uppercase">
                INVESTIGATOR NOTES & SCIENTIFIC OBSERVATIONS
              </h3>
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-3 py-1 bg-pharma-primary hover:bg-sky-500 text-white rounded text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingNotes ? "SAVING..." : "SAVE NOTES"}</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record experimental rationale, IVIVC correlation notes, and physiological modeling assumptions..."
            className="w-full p-3 bg-surface-card border border-surface-border rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-pharma-cyan leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
