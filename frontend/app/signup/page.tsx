"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpUser, checkIsAuthenticated } from "@/lib/supabase/auth";
import { Dna, Lock, Mail, AlertCircle, ArrowRight, User, Building, CheckCircle2, FlaskConical } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (checkIsAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await signUpUser(email, password, fullName, affiliation);
      if (res.session) {
        // Automatically logged in
        router.push("/dashboard");
      } else {
        setSuccessMessage(res.message || "Account registered successfully. You can now sign in.");
      }
    } catch (err: any) {
      setError(err?.message || "Sign up failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Background scientific decorative grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(2,132,199,0.12),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Top Banner Notice */}
      <div className="max-w-md w-full mx-auto text-center space-y-2 relative z-10 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pharma-primary/10 border border-pharma-primary/30 text-[11px] font-mono text-pharma-accent font-semibold tracking-wider uppercase">
          <FlaskConical className="h-3.5 w-3.5 text-pharma-cyan" />
          RESEARCHER REGISTRATION
        </div>
      </div>

      {/* SignUp Card */}
      <div className="max-w-md w-full mx-auto relative z-10 my-auto">
        <div className="scientific-card p-6 sm:p-8 border border-surface-border shadow-2xl backdrop-blur-xl bg-surface/90">
          {/* Brand Header */}
          <div className="text-center mb-5 space-y-1.5">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-surface-card border border-pharma-cyan/40 text-pharma-cyan shadow-lg shadow-pharma-cyan/10 mb-1">
              <Dna className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5 font-mono">
              PHARMA <span className="text-pharma-cyan">AI</span>
            </h1>
            <p className="text-xs text-pharma-muted font-medium">
              Create your private pharmaceutical research workspace
            </p>
          </div>

          {/* Success Notification */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <div className="font-semibold">{successMessage}</div>
                <Link href="/login" className="text-pharma-cyan hover:underline mt-1 inline-block font-mono">
                  Proceed to Sign In &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-medium">
                Full Name / Investigator Title
              </label>
              <div className="relative">
                <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jane Doe, PharmD"
                  className="w-full pl-9 pr-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-pharma-cyan transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-medium">
                Affiliation / Institution / Company
              </label>
              <div className="relative">
                <Building className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="University / Institute / Pharma R&D"
                  className="w-full pl-9 pr-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-pharma-cyan transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="investigator@lab.org"
                  className="w-full pl-9 pr-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-pharma-cyan transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1 font-medium">
                Password (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-pharma-cyan transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-pharma-primary hover:bg-sky-500 text-white font-medium text-sm rounded-lg transition-all shadow-md shadow-pharma-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer font-mono"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <>
                  <span>REGISTER RESEARCHER ACCOUNT</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-5 pt-4 border-t border-surface-border text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-mono font-medium text-pharma-cyan hover:text-white transition-colors ml-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Prominent Regulatory Disclaimer */}
      <div className="max-w-md w-full mx-auto text-center relative z-10 pb-4">
        <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
          RESEARCH SIMULATION — NOT CLINICALLY VALIDATED
        </p>
      </div>
    </main>
  );
}
