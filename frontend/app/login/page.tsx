"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin, checkIsAdminAuthenticated, DESIGNATED_ADMIN_EMAIL } from "@/lib/supabase/auth";
import { Dna, Lock, Mail, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DESIGNATED_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkIsAdminAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await loginAdmin(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Authorized Admin only.");
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
      <div className="max-w-md w-full mx-auto text-center space-y-2 relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pharma-primary/10 border border-pharma-primary/30 text-[11px] font-mono text-pharma-accent font-semibold tracking-wider uppercase">
          <ShieldCheck className="h-3.5 w-3.5 text-pharma-cyan" />
          PRIVATE ADMIN RESEARCH ENVIRONMENT
        </div>
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto relative z-10 my-auto">
        <div className="scientific-card p-6 sm:p-8 border border-surface-border shadow-2xl backdrop-blur-xl bg-surface/90">
          {/* Brand Header */}
          <div className="text-center mb-6 space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-card border border-pharma-cyan/40 text-pharma-cyan shadow-lg shadow-pharma-cyan/10 mb-2">
              <Dna className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5 font-mono">
              PHARMA <span className="text-pharma-cyan">AI</span>
            </h1>
            <p className="text-xs text-pharma-muted font-medium">
              AI-Enhanced Drug Delivery Research Platform
            </p>
            <div className="pt-2">
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300 py-1 px-3 bg-surface-card rounded border border-surface-border inline-block">
                Authorized Admin Access Only
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-medium">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pharma.ai"
                  className="w-full pl-9 pr-3 py-2 bg-surface-card border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-pharma-cyan transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
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
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>LOGIN TO ADMIN DASHBOARD</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Access Policy Note */}
          <div className="mt-6 pt-4 border-t border-surface-border text-center">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This system is strictly restricted to one designated Administrator account. No public access, user accounts, or registrations exist.
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
