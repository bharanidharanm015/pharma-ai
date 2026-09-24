"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkIsAuthenticated } from "@/lib/supabase/auth";
import { Dna } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const isAuth = checkIsAuthenticated();
    if (!isAuth) {
      router.replace("/login");
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-surface-card border border-pharma-primary/50 flex items-center justify-center text-pharma-cyan animate-pulse">
            <Dna className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1 font-mono">
              PHARMA <span className="text-pharma-cyan">AI</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono">VERIFYING RESEARCH SESSION...</p>
          </div>
        </div>
        <div className="w-48 h-1 bg-surface-border rounded-full overflow-hidden">
          <div className="h-full bg-pharma-cyan animate-[pulse_1.5s_ease-in-out_infinite] w-3/4 rounded-full" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
