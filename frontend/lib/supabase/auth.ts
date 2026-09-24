/**
 * PHARMA AI — Multi-User Authentication Manager
 * Handles Supabase Auth (Sign Up, Sign In, Sign Out, Password Reset)
 * Supports all researcher types (Scientists, Students, AI Engineers, Companies)
 * Isolated private research datasets per user via Supabase auth.uid()
 */

import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { UserSession, ResearcherSession } from "../types";

const USER_SESSION_STORAGE_KEY = "pharma_ai_user_session";

/**
 * Sign Up a new researcher account
 */
export async function signUpUser(
  email: string,
  password: string,
  fullName?: string,
  affiliation?: string
): Promise<{ user: any; session: UserSession | null; message?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const supabase = getSupabaseClient();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName || "Research Scientist",
          affiliation: affiliation || "Independent Researcher",
        },
      },
    });

    if (error) {
      throw new Error(`Sign Up Failed: ${error.message}`);
    }

    let userSession: UserSession | null = null;
    if (data.session && data.user) {
      userSession = {
        userId: data.user.id,
        email: data.user.email || normalizedEmail,
        fullName: fullName || data.user.user_metadata?.full_name || "Research Scientist",
        affiliation: affiliation || data.user.user_metadata?.affiliation,
        token: data.session.access_token,
        sessionStartedAt: new Date().toISOString(),
        isAuthenticated: true,
      };

      if (typeof window !== "undefined") {
        sessionStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(userSession));
        localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(userSession));
      }
    }

    return {
      user: data.user,
      session: userSession,
      message: data.session
        ? "Account created and logged in successfully."
        : "Registration successful. Please verify your email or sign in.",
    };
  }

  // Offline / Standalone Dev Fallback
  const fallbackSession: UserSession = {
    userId: `usr_${Date.now()}`,
    email: normalizedEmail,
    fullName: fullName || "Research Scientist",
    affiliation: affiliation || "Independent Researcher",
    sessionStartedAt: new Date().toISOString(),
    isAuthenticated: true,
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
    localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
  }

  return {
    user: { id: fallbackSession.userId, email: normalizedEmail },
    session: fallbackSession,
    message: "Local researcher profile registered.",
  };
}

/**
 * Sign In existing researcher account
 */
export async function loginUser(email: string, password: string): Promise<UserSession> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("A valid email address is required.");
  }
  if (!password || password.length === 0) {
    throw new Error("Password is required.");
  }

  const supabase = getSupabaseClient();

  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (error) {
      throw new Error(`Authentication Failed: ${error.message}`);
    }

    if (!data.user) {
      throw new Error("User credentials could not be verified.");
    }

    const session: UserSession = {
      userId: data.user.id,
      email: data.user.email || normalizedEmail,
      fullName: data.user.user_metadata?.full_name || "Research Scientist",
      affiliation: data.user.user_metadata?.affiliation || "Pharmaceutical Research",
      token: data.session?.access_token,
      sessionStartedAt: new Date().toISOString(),
      isAuthenticated: true,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    return session;
  }

  // Standalone / Offline Dev Mode
  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters.");
  }

  const fallbackSession: UserSession = {
    userId: `usr_offline_${Date.now()}`,
    email: normalizedEmail,
    fullName: normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Research Scientist",
    affiliation: "Computational Biopharmaceutics Lab",
    sessionStartedAt: new Date().toISOString(),
    isAuthenticated: true,
  };

  if (typeof window !== "undefined") {
    sessionStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
    localStorage.setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(fallbackSession));
  }

  return fallbackSession;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout notice:", e);
    }
  }

  if (typeof window !== "undefined") {
    sessionStorage.removeItem(USER_SESSION_STORAGE_KEY);
    localStorage.removeItem(USER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem("pharma_ai_researcher_session");
    sessionStorage.removeItem("pharma_ai_admin_session");
  }
}

/**
 * Request password reset email
 */
export async function resetPassword(email: string): Promise<{ success: boolean; message: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("A valid email address is required.");
  }

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
    });

    if (error) {
      throw new Error(`Password Reset Failed: ${error.message}`);
    }

    return {
      success: true,
      message: `Password reset link sent to ${normalizedEmail}. Check your inbox.`,
    };
  }

  return {
    success: true,
    message: `(Offline Mode) Simulated password reset link for ${normalizedEmail}.`,
  };
}

/**
 * Get current session synchronously or from storage
 */
export function getCurrentUserSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(USER_SESSION_STORAGE_KEY) || localStorage.getItem(USER_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    if (session && session.isAuthenticated && session.email) {
      return session;
    }
  } catch (e) {
    console.error("Failed to parse user session:", e);
  }

  return null;
}

/**
 * Synchronous check if user is authenticated
 */
export function checkIsAuthenticated(): boolean {
  return getCurrentUserSession() !== null;
}

// ==============================================================================
// BACKWARD-COMPATIBLE WRAPPERS (Preserves existing imports across all modules)
// ==============================================================================
export const loginResearcher = loginUser;
export const loginAdmin = loginUser;
export const logoutResearcher = logoutUser;
export const logoutAdmin = logoutUser;

export function getResearcherSession(): ResearcherSession | null {
  const s = getCurrentUserSession();
  if (!s) return null;
  return {
    isAuthenticated: s.isAuthenticated,
    email: s.email,
    researcherName: s.fullName || s.email,
    token: s.token,
    sessionStartedAt: s.sessionStartedAt,
    userId: s.userId,
  };
}

export const getAdminSession = getResearcherSession;
export const checkIsResearcherAuthenticated = checkIsAuthenticated;
export const checkIsAdminAuthenticated = checkIsAuthenticated;

export const getAuthorizedResearcherEmail = (): string => {
  const s = getCurrentUserSession();
  if (s?.email) return s.email;
  return (process.env.NEXT_PUBLIC_RESEARCHER_EMAIL || "").trim();
};

export const DESIGNATED_ADMIN_EMAIL = "";
