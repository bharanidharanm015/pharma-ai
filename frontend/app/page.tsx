"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { checkIsResearcherAuthenticated } from "@/lib/supabase/auth";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (checkIsResearcherAuthenticated()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="h-6 w-6 border-2 border-pharma-cyan/20 border-t-pharma-cyan rounded-full animate-spin" />
    </div>
  );
}
