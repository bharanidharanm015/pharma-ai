/**
 * PHARMA AI — Strict Single-Admin Authentication Manager
 * Enforces: Only ONE Admin account can log in.
 * No registration, no user signup, no other roles.
 */

import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { AdminSession } from "../types";

export const DESIGNATED_ADMIN_EMAIL =
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@pharma.ai";

const ADMIN_STORAGE_KEY = "pharma_ai_admin_session";

export async function loginAdmin(email: string, password: string): Promise<AdminSession> {
  const normalizedEmail = email.trim().toLowerCase();

  // Strict check: Only the designated admin email is allowed
  if (normalizedEmail !== DESIGNATED_ADMIN_EMAIL.toLowerCase()) {
    throw new Error(
      "Unauthorized Access: Only the authorized Admin account can log into this private research platform."
    );
  }

  if (!password || password.trim().length === 0) {
    throw new Error("Password is required.");
  }

  const supabase = getSupabaseClient();

  if (isSupabaseConfigured() && supabase) {
    // Authenticate via Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (error) {
      throw new Error(`Authentication Failed: ${error.message}`);
    }

    if (!data.user || data.user.email?.toLowerCase() !== DESIGNATED_ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut();
      throw new Error("Access Denied: The authenticated account is not authorized as the Platform Administrator.");
    }

    const session: AdminSession = {
      isAuthenticated: true,
      email: data.user.email,
      adminName: "Lead Pharmacometrics Administrator",
      token: data.session?.access_token,
      sessionStartedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  }

  // Standalone / Offline Dev Mode
  // If Supabase is not yet configured, allow authenticated access for development
  if (password !== "admin" && password.length < 4) {
    throw new Error("Invalid Administrator Credentials.");
  }

  const session: AdminSession = {
    isAuthenticated: true,
    email: DESIGNATED_ADMIN_EMAIL,
    adminName: "Lead Pharmacometrics Administrator (Admin Session)",
    sessionStartedAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
  }

  return session;
}

export async function logoutAdmin(): Promise<void> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout notice:", e);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    sessionStorage.clear();
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const session: AdminSession = JSON.parse(raw);
    if (
      session.isAuthenticated &&
      session.email?.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase()
    ) {
      return session;
    }
  } catch (e) {
    console.error("Failed to parse admin session:", e);
  }

  return null;
}

export function checkIsAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}
