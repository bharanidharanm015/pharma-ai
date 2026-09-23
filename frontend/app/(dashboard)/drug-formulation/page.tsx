"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { Drug, Formulation } from "@/lib/types";
import {
  Pill,
  FlaskConical,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import Link from "next/link";

export default function DrugFormulationPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [selectedFormulation, setSelectedFormulation] = useState<Formulation | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Drug Form State (all 11 fields required)
  const [drugForm, setDrugForm] = useState<Drug>({
    id: `DRUG-${Date.now()}`,
    name: "New Research Compound",
    dose_mg: 400.0,
    molecular_weight: 206.3,
    solubility_mg_ml: 0.021,
    permeability_peff: 4.2e-4,
    half_life_h: 2.1,
    clearance_l_h: 3.2,
    vd_l: 9.8,
    bioavailability_f: 0.95,
    pka: 4.4,
    logp: 3.97,
  });

  // Formulation Form State (all 5 fields required)
  const [formulationForm, setFormulationForm] = useState<Formulation>({
    id: `FORM-${Date.now()}`,
    name: "ER Hydrophilic Polymer Matrix",
    drug_name: "New Research Compound",
    dosage_form: "Matrix Tablet",
    type: "Extended Release",
    api_amount_mg: 400.0,
    polymer_concentration: 28.0,
    particle_size_d50_um: 45.0,
    release_characteristics: "Diffusion-controlled",
    components: [],
  });

  const loadData = async () => {
    const dList = await pharmaApi.getDrugs();
    const fList = await pharmaApi.getFormulations();
    setDrugs(dList);
    setFormulations(fList);
    if (dList.length > 0 && !selectedDrug) {
      setSelectedDrug(dList[0]);
      setDrugForm(dList[0]);
    }
    if (fList.length > 0 && !selectedFormulation) {
      setSelectedFormulation(fList[0]);
      setFormulationForm(fList[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectDrug = (d: Drug) => {
    setSelectedDrug(d);
    setDrugForm(d);
    // Sync formulation drug name
    setFormulationForm((prev) => ({ ...prev, drug_name: d.name, drug_id: d.id, api_amount_mg: d.dose_mg }));
  };

  const handleSaveDrug = async (e: React.FormEvent) => {
    e.preventDefault();
    await pharmaApi.saveDrug(drugForm);
    setStatusMessage(`Drug "${drugForm.name}" saved to research scenario repository.`);
    setTimeout(() => setStatusMessage(null), 3500);
    await loadData();
  };

  const handleDeleteDrug = async (id: string) => {
    if (confirm("Delete this drug scenario?")) {
      await pharmaApi.deleteDrug(id);
      await loadData();
    }
  };

  const handleSaveFormulation = async (e: React.FormEvent) => {
    e.preventDefault();
    await pharmaApi.saveFormulation(formulationForm);
    setStatusMessage(`Formulation "${formulationForm.name}" saved to database.`);
    setTimeout(() => setStatusMessage(null), 3500);
    await loadData();
  };

  const handleDeleteFormulation = async (id: string) => {
    if (confirm("Delete this formulation recipe?")) {
      await pharmaApi.deleteFormulation(id);
      await loadData();
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Drug & Formulation Studio"
        subtitle="Manage Active Pharmaceutical Ingredients (APIs), Physicochemical Constraints & Excipient Matrices"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {statusMessage && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Repository Selectors */}
          <div className="lg:col-span-4 space-y-6">
            {/* Drugs List */}
            <div className="scientific-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-xs font-bold text-white font-mono uppercase">DRUG SCENARIOS ({drugs.length})</h3>
                </div>
                <button
                  onClick={() => {
                    const newId = `DRUG-${Date.now()}`;
                    const d: Drug = {
                      id: newId,
                      name: "Novel Candidate API",
                      dose_mg: 250,
                      molecular_weight: 310,
                      solubility_mg_ml: 0.05,
                      permeability_peff: 2.0e-4,
                      half_life_h: 4.5,
                      clearance_l_h: 8.0,
                      vd_l: 35.0,
                      bioavailability_f: 0.85,
                      pka: 6.8,
                      logp: 2.3,
                      bcs_class: "Class II",
                    };
                    setSelectedDrug(d);
                    setDrugForm(d);
                  }}
                  className="px-2 py-1 text-[11px] font-mono bg-pharma-primary/20 text-pharma-accent border border-pharma-primary/40 rounded hover:bg-pharma-primary/30 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {drugs.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectDrug(d)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selectedDrug?.id === d.id
                        ? "bg-pharma-primary/20 border-pharma-cyan text-white"
                        : "bg-surface border-surface-border text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {d.dose_mg} mg | MW {d.molecular_weight} | LogP {d.logp}
                      </div>
                    </div>
                    {d.is_demo ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-slate-400">
                        DEMO
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDrug(d.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Formulations List */}
            <div className="scientific-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-surface-border pb-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-sky-400" />
                  <h3 className="text-xs font-bold text-white font-mono uppercase">FORMULATIONS ({formulations.length})</h3>
                </div>
                <button
                  onClick={() => {
                    const f: Formulation = {
                      id: `FORM-${Date.now()}`,
                      name: "Custom Matrix Scenario",
                      drug_name: selectedDrug?.name || "Active Compound",
                      dosage_form: "Matrix Tablet",
                      type: "Extended Release",
                      api_amount_mg: selectedDrug?.dose_mg || 300,
                      polymer_concentration: 25.0,
                      particle_size_d50_um: 40.0,
                      release_characteristics: "Diffusion-controlled",
                      components: [],
                    };
                    setSelectedFormulation(f);
                    setFormulationForm(f);
                  }}
                  className="px-2 py-1 text-[11px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40 rounded hover:bg-sky-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  <span>New</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {formulations.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFormulation(f);
                      setFormulationForm(f);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                      selectedFormulation?.id === f.id
                        ? "bg-sky-950/40 border-sky-400 text-white"
                        : "bg-surface border-surface-border text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="font-semibold truncate max-w-[170px]">{f.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {f.dosage_form} | Polymer: {f.polymer_concentration}%
                      </div>
                    </div>
                    {f.is_demo ? (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-card border border-surface-border text-slate-400">
                        DEMO
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFormulation(f.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Pipeline Run Button */}
            <div className="scientific-card p-4 border-pharma-primary/40 bg-surface-card/40 space-y-2">
              <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                EXECUTE SIMULATION PIPELINE
              </div>
              <p className="text-[11px] text-slate-400">
                Propagate active compound & formulation into Dissolution kinetics and PBPK multi-organ ODE solver.
              </p>
              <div className="pt-1 flex gap-2">
                <Link
                  href="/dissolution"
                  className="flex-1 text-center py-2 px-3 rounded bg-pharma-primary hover:bg-sky-500 text-white font-mono text-xs font-semibold transition-colors"
                >
                  Dissolution &rarr;
                </Link>
                <Link
                  href="/pk-pbpk"
                  className="flex-1 text-center py-2 px-3 rounded bg-surface-card hover:bg-surface border border-surface-border text-pharma-cyan font-mono text-xs font-semibold transition-colors"
                >
                  PK / PBPK &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Editors */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Drug Fields Editor (All 11 Fields) */}
            <div className="scientific-card p-6">
              <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-sm font-bold text-white font-mono">
                    DRUG PHYSICOCHEMICAL SPECIFICATION (11 FIELDS)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-pharma-muted">ID: {drugForm.id}</span>
              </div>

              <form onSubmit={handleSaveDrug} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 1. Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Drug Name
                    </label>
                    <input
                      type="text"
                      required
                      value={drugForm.name}
                      onChange={(e) => setDrugForm({ ...drugForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 2. Dose */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Dose (mg)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.dose_mg}
                      onChange={(e) => setDrugForm({ ...drugForm, dose_mg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 3. Molecular Weight */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Molecular Weight (g/mol)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.molecular_weight}
                      onChange={(e) => setDrugForm({ ...drugForm, molecular_weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 4. Solubility */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Solubility (mg/mL)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.solubility_mg_ml}
                      onChange={(e) => setDrugForm({ ...drugForm, solubility_mg_ml: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 5. Permeability */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Permeability Peff (10^-4 cm/s)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.permeability_peff}
                      onChange={(e) => setDrugForm({ ...drugForm, permeability_peff: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 6. Half-life */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Half-life t1/2 (h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.half_life_h}
                      onChange={(e) => setDrugForm({ ...drugForm, half_life_h: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 7. Clearance */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Clearance CL (L/h)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.clearance_l_h}
                      onChange={(e) => setDrugForm({ ...drugForm, clearance_l_h: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 8. Volume of Distribution */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Volume of Distribution Vd (L)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.vd_l}
                      onChange={(e) => setDrugForm({ ...drugForm, vd_l: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 9. Bioavailability */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Bioavailability F (0 - 1)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      max="1.0"
                      required
                      value={drugForm.bioavailability_f}
                      onChange={(e) => setDrugForm({ ...drugForm, bioavailability_f: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 10. pKa */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Ionization Constant (pKa)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={drugForm.pka ?? ""}
                      onChange={(e) => setDrugForm({ ...drugForm, pka: parseFloat(e.target.value) || undefined })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 11. LogP */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Octanol-Water Partition (LogP)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={drugForm.logp}
                      onChange={(e) => setDrugForm({ ...drugForm, logp: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pharma-primary hover:bg-sky-500 text-white rounded text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>SAVE DRUG SCENARIO</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Formulation Fields Editor (All 5 Fields) */}
            <div className="scientific-card p-6">
              <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white font-mono">
                    FORMULATION DELIVERY MATRIX (5 FIELDS)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-pharma-muted">ID: {formulationForm.id}</span>
              </div>

              <form onSubmit={handleSaveFormulation} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Formulation Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Formulation Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formulationForm.name}
                      onChange={(e) => setFormulationForm({ ...formulationForm, name: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 1. Type */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Release Type
                    </label>
                    <select
                      value={formulationForm.type}
                      onChange={(e: any) => setFormulationForm({ ...formulationForm, type: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan cursor-pointer"
                    >
                      <option value="Immediate Release">Immediate Release</option>
                      <option value="Extended Release">Extended Release</option>
                      <option value="Delayed / Enteric">Delayed / Enteric</option>
                      <option value="Sustained Release">Sustained Release</option>
                    </select>
                  </div>

                  {/* 2. API Amount */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      API Amount (mg)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formulationForm.api_amount_mg}
                      onChange={(e) => setFormulationForm({ ...formulationForm, api_amount_mg: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 3. Polymer Concentration */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Polymer Concentration (% w/w)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="90"
                      required
                      value={formulationForm.polymer_concentration}
                      onChange={(e) => setFormulationForm({ ...formulationForm, polymer_concentration: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 4. Particle Size */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Particle Size D50 (um)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="500"
                      required
                      value={formulationForm.particle_size_d50_um}
                      onChange={(e) => setFormulationForm({ ...formulationForm, particle_size_d50_um: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan"
                    />
                  </div>

                  {/* 5. Release Characteristics */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Release Characteristics
                    </label>
                    <select
                      value={formulationForm.release_characteristics}
                      onChange={(e: any) => setFormulationForm({ ...formulationForm, release_characteristics: e.target.value })}
                      className="w-full px-3 py-1.5 bg-surface-card border border-surface-border rounded text-sm text-white font-mono focus:outline-none focus:border-pharma-cyan cursor-pointer"
                    >
                      <option value="Diffusion-controlled">Diffusion-controlled (Fickian transport)</option>
                      <option value="Polymer Erosion">Polymer Erosion & Case II Relaxation</option>
                      <option value="Anomalous Transport">Anomalous Transport (Coupled Diffusion & Swelling)</option>
                      <option value="Zero-Order Osmotic">Zero-Order Osmotic Pump Delivery</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>SAVE FORMULATION SCENARIO</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
