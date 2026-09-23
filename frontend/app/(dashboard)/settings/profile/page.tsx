"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/AppHeader";
import { pharmaApi } from "@/lib/api-client";
import { AdminProfile } from "@/lib/types";
import { DESIGNATED_ADMIN_EMAIL } from "@/lib/supabase/auth";
import {
  User,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Calendar,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Scale,
  Ruler,
  AlertTriangle,
  ArrowLeft,
  Lock,
  Upload,
  Sparkles,
} from "lucide-react";

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Form Fields State
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Other" | "Prefer not to say">("Prefer not to say");
  const [bloodGroup, setBloodGroup] = useState<"A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-">("O+");
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(175);
  const [contactNumber, setContactNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState(DESIGNATED_ADMIN_EMAIL);
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("Colleague / Laboratory Deputy");
  const [photoUrl, setPhotoUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Load existing profile from Supabase PostgreSQL (or session fallback)
  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const p = await pharmaApi.getAdminProfile();
        setProfile(p);
        setFullName(p.full_name || "");
        setDob(p.date_of_birth || "1984-06-15");
        setGender(p.gender || "Prefer not to say");
        setBloodGroup(p.blood_group || "O+");
        setWeightKg(p.weight_kg || 70);
        setHeightCm(p.height_cm || 175);
        setContactNumber(p.contact_number || "");
        setEmailAddress(p.email_address || DESIGNATED_ADMIN_EMAIL);
        setAddress(p.address || "");
        setEmergencyName(p.emergency_contact_name || "");
        setEmergencyPhone(p.emergency_contact_number || "");
        setEmergencyRel(p.emergency_contact_relationship || "Colleague / Laboratory Deputy");
        setPhotoUrl(p.profile_photo_url || "");
        setNotes(p.additional_notes || "");
      } catch (err: any) {
        setStatusMsg({ type: "error", text: "Failed to retrieve administrator profile from database." });
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Live Automatic Age Calculation from Date of Birth
  const calculatedAge = useMemo(() => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age <= 130 ? age : null;
  }, [dob]);

  // Live Automatic BMI Calculation from Weight and Height
  const calculatedBMI = useMemo(() => {
    if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    const bmiVal = weightKg / (heightM * heightM);
    let category = "Standard Reference Physical Index";
    if (bmiVal < 18.5) category = "Lower Reference Range";
    else if (bmiVal < 25.0) category = "Standard Reference Physical Index";
    else if (bmiVal < 30.0) category = "Elevated Reference Index";
    else category = "High Reference Index";

    return {
      value: Number(bmiVal.toFixed(1)),
      category,
    };
  }, [weightKg, heightCm]);

  // Profile Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatusMsg({ type: "error", text: "Please select a valid image file (PNG, JPG, WebP)." });
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setStatusMsg({ type: "error", text: "Profile image size must be under 3 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setPhotoUrl(result);
      setStatusMsg({ type: "success", text: "Profile image loaded. Click 'Save Profile' to persist to database." });
      setTimeout(() => setStatusMsg(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  // Validation Logic
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = "Full name must be at least 2 characters.";
    }

    if (!dob) {
      errors.dob = "Date of birth is required.";
    } else {
      const birth = new Date(dob);
      const now = new Date();
      if (birth > now) {
        errors.dob = "Date of birth cannot be in the future.";
      } else if (calculatedAge !== null && calculatedAge < 18) {
        errors.dob = "Administrator must be at least 18 years of age.";
      }
    }

    if (!weightKg || weightKg < 20 || weightKg > 300) {
      errors.weightKg = "Weight must be between 20 kg and 300 kg.";
    }

    if (!heightCm || heightCm < 50 || heightCm > 250) {
      errors.heightCm = "Height must be between 50 cm and 250 cm.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailAddress.trim() || !emailRegex.test(emailAddress)) {
      errors.emailAddress = "Please enter a valid email address.";
    }

    // Phone validation (optional plus, digits, spaces, parentheses, hyphens, min 7 digits)
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{3,6}$/;
    if (!contactNumber.trim() || contactNumber.replace(/\D/g, "").length < 7) {
      errors.contactNumber = "Please enter a valid contact phone number with at least 7 digits.";
    }

    if (!emergencyName.trim() || emergencyName.trim().length < 2) {
      errors.emergencyName = "Emergency contact name is required.";
    }

    if (!emergencyPhone.trim() || emergencyPhone.replace(/\D/g, "").length < 7) {
      errors.emergencyPhone = "Please enter a valid emergency contact phone number.";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setStatusMsg({ type: "error", text: "Please correct the highlighted validation errors before saving." });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const updated: AdminProfile = {
        id: "admin_primary_profile",
        admin_email: DESIGNATED_ADMIN_EMAIL,
        full_name: fullName.trim(),
        date_of_birth: dob,
        gender,
        blood_group: bloodGroup,
        weight_kg: Number(weightKg),
        height_cm: Number(heightCm),
        contact_number: contactNumber.trim(),
        email_address: emailAddress.trim(),
        address: address.trim(),
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_number: emergencyPhone.trim(),
        emergency_contact_relationship: emergencyRel.trim(),
        profile_photo_url: photoUrl,
        additional_notes: notes.trim(),
        updated_at: new Date().toISOString(),
      };

      const saved = await pharmaApi.saveAdminProfile(updated);
      setProfile(saved);
      setStatusMsg({
        type: "success",
        text: "Administrator personal profile updated and securely stored in Supabase PostgreSQL.",
      });
      setTimeout(() => setStatusMsg(null), 5000);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err?.message || "Failed to update administrator profile. Please verify database connection.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <AppHeader
        title="Admin Personal Details & Physiological Profile"
        subtitle="Secure Biometric & Operational Credentials Strictly Restricted to the Platform Administrator"
      />

      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        {/* Breadcrumb & Navigation Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-pharma-cyan transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>&larr; Back to Platform Settings</span>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1 rounded bg-pharma-primary/10 border border-pharma-primary/30 text-[10px] font-mono font-bold text-pharma-accent uppercase">
            <Lock className="h-3 w-3 text-pharma-cyan" />
            <span>Strict Admin-Only Access &bull; RLS Protected</span>
          </div>
        </div>

        {/* Status Notification Banner */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-mono flex items-center gap-2.5 transition-all ${
              statusMsg.type === "success"
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
                : "bg-rose-950/40 border-rose-800/60 text-rose-300"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Top Section: Profile Header Card & Photo Upload */}
          <div className="scientific-card p-6 border-pharma-primary/40 bg-surface-card/70">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Profile Avatar / Photo Preview */}
              <div className="relative group shrink-0">
                <div className="h-28 w-28 rounded-2xl bg-surface border-2 border-pharma-cyan/50 overflow-hidden flex items-center justify-center shadow-lg shadow-pharma-cyan/10">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Administrator Photo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-pharma-primary/30 to-surface-card text-pharma-cyan">
                      <User className="h-12 w-12" />
                      <span className="text-[9px] font-mono mt-1 opacity-70">NO PHOTO</span>
                    </div>
                  )}
                </div>

                {/* Upload action overlay */}
                <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-pharma-primary hover:bg-sky-500 text-white cursor-pointer shadow-md transition-colors border border-surface-border">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Identity Details Header */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pharma-primary/20 text-pharma-cyan font-bold border border-pharma-primary/40">
                    PLATFORM ADMINISTRATOR
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-bold border border-emerald-800/40">
                    SUPABASE RLS SECURED
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white font-mono tracking-tight">
                  {fullName || "Administrator Identity"}
                </h2>
                <p className="text-xs font-mono text-slate-400">
                  Account: <span className="text-pharma-cyan font-semibold">{DESIGNATED_ADMIN_EMAIL}</span>
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-mono text-slate-300">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-surface-border">
                    <span className="text-slate-400 text-[10px]">AGE:</span>
                    <span className="text-white font-bold">{calculatedAge !== null ? `${calculatedAge} y` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-surface-border">
                    <span className="text-slate-400 text-[10px]">BLOOD GROUP:</span>
                    <span className="text-white font-bold">{bloodGroup}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-surface-border">
                    <span className="text-slate-400 text-[10px]">BMI:</span>
                    <span className="text-emerald-400 font-bold">
                      {calculatedBMI ? `${calculatedBMI.value} kg/m²` : "—"}
                    </span>
                  </div>
                </div>

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl("")}
                    className="text-[11px] font-mono text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove custom photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Sections Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 1: Personal & Biometric Metrics */}
            <div className="scientific-card p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <User className="h-4 w-4 text-pharma-cyan" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  1. PERSONAL & BIOMETRIC DETAILS
                </h3>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Elena Vance"
                    className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none transition-colors ${
                      validationErrors.fullName
                        ? "border-rose-500 focus:border-rose-400"
                        : "border-surface-border focus:border-pharma-cyan"
                    }`}
                  />
                  {validationErrors.fullName && (
                    <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.fullName}</p>
                  )}
                </div>

                {/* DOB & Auto-Calculated Age */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Date of Birth <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none cursor-pointer ${
                          validationErrors.dob
                            ? "border-rose-500 focus:border-rose-400"
                            : "border-surface-border focus:border-pharma-cyan"
                        }`}
                      />
                    </div>
                    {validationErrors.dob && (
                      <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.dob}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Age (Calculated Automatically)
                    </label>
                    <div className="w-full px-3 py-2 bg-surface border border-surface-border/70 rounded text-xs font-mono text-pharma-cyan font-bold flex items-center justify-between">
                      <span>{calculatedAge !== null ? `${calculatedAge} years` : "Awaiting valid DOB"}</span>
                      <span className="text-[10px] text-slate-500 uppercase">Auto</span>
                    </div>
                  </div>
                </div>

                {/* Gender & Blood Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e: any) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan cursor-pointer"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Blood Group
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e: any) => setBloodGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan cursor-pointer"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                {/* Weight, Height & Auto-Calculated BMI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Weight (kg) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="20"
                      max="300"
                      required
                      value={weightKg || ""}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none ${
                        validationErrors.weightKg
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-surface-border focus:border-pharma-cyan"
                      }`}
                    />
                    {validationErrors.weightKg && (
                      <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.weightKg}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Height (cm) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="50"
                      max="250"
                      required
                      value={heightCm || ""}
                      onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none ${
                        validationErrors.heightCm
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-surface-border focus:border-pharma-cyan"
                      }`}
                    />
                    {validationErrors.heightCm && (
                      <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.heightCm}</p>
                    )}
                  </div>
                </div>

                {/* Calculated BMI Badge & Scientific Note */}
                <div className="p-3 bg-surface rounded-lg border border-surface-border space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 uppercase text-[10px]">Calculated Body Mass Index (BMI):</span>
                    <span className="text-emerald-400 font-bold">
                      {calculatedBMI ? `${calculatedBMI.value} kg/m²` : "—"}
                    </span>
                  </div>
                  {calculatedBMI && (
                    <div className="text-[10px] font-mono text-pharma-cyan">
                      Classification: {calculatedBMI.category}
                    </div>
                  )}
                  <p className="text-[10px] font-sans text-slate-400 pt-1 leading-relaxed border-t border-surface-border/50">
                    Non-clinical reference metric for pharmacometrics and allometric baseline. Not intended for medical diagnosis or clinical healthcare decisions.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Contact Details & Location */}
            <div className="space-y-6">
              <div className="scientific-card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                  <Phone className="h-4 w-4 text-pharma-cyan" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    2. CONTACT & LOCATION CREDENTIALS
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Direct Contact Phone <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none ${
                        validationErrors.contactNumber
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-surface-border focus:border-pharma-cyan"
                      }`}
                    />
                    {validationErrors.contactNumber && (
                      <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.contactNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Admin Email Address (Linked to Platform Auth) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      placeholder="admin@pharma.ai"
                      className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none ${
                        validationErrors.emailAddress
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-surface-border focus:border-pharma-cyan"
                      }`}
                    />
                    {validationErrors.emailAddress && (
                      <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.emailAddress}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Institution / Physical Laboratory Address
                    </label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Department of Pharmacometrics & Biopharmaceutics, Bio-Innovation Quarter, Suite 400"
                      className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Emergency Contact Information */}
              <div className="scientific-card p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white font-mono uppercase">
                    3. EMERGENCY CONTACT DETAILS
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                      Emergency Contact Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      placeholder="e.g. Dr. Marcus Vance"
                      className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none ${
                        validationErrors.emergencyName
                          ? "border-rose-500 focus:border-rose-400"
                          : "border-surface-border focus:border-pharma-cyan"
                      }`}
                    />
                    {validationErrors.emergencyName && (
                      <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.emergencyName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        Emergency Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        placeholder="+1 (555) 019-2835"
                        className={`w-full px-3 py-2 bg-surface-card border rounded text-xs font-mono text-white focus:outline-none ${
                          validationErrors.emergencyPhone
                            ? "border-rose-500 focus:border-rose-400"
                            : "border-surface-border focus:border-pharma-cyan"
                        }`}
                      />
                      {validationErrors.emergencyPhone && (
                        <p className="text-[10px] font-mono text-rose-400 mt-1">{validationErrors.emergencyPhone}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                        Relationship
                      </label>
                      <input
                        type="text"
                        value={emergencyRel}
                        onChange={(e) => setEmergencyRel(e.target.value)}
                        placeholder="e.g. Spouse / Colleague / Deputy"
                        className="w-full px-3 py-2 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Additional Laboratory Notes */}
          <div className="scientific-card p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-surface-border pb-3">
              <Sparkles className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                4. ADDITIONAL OPERATIONAL & CLINICAL NOTES
              </h3>
            </div>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record special research clearances, medical alerts, lab safety clearances, or personal pharmacometric notes..."
              className="w-full p-3 bg-surface-card border border-surface-border rounded text-xs font-mono text-white focus:outline-none focus:border-pharma-cyan leading-relaxed"
            />
          </div>

          {/* Bottom Save & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-surface border border-surface-border">
            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>
                Protected under PostgreSQL Row Level Security: Only the authenticated Admin session can read/modify.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/settings"
                className="px-4 py-2 bg-surface-card hover:bg-surface border border-surface-border rounded text-xs font-mono text-slate-300 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-pharma-primary hover:bg-sky-500 text-white rounded text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>SAVING PROFILE...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>SAVE ADMIN PROFILE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
