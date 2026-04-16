"use client";

/**
 * Client-side auth helpers for DASM Souq.
 *
 * Identity source of truth: DASM Platform (api.dasm.com.sa).
 *
 * Auth strategy:
 *   1. Login/register POSTs go directly to Core with `credentials: "include"`.
 *   2. Core responds with a Sanctum session cookie (domain=.dasm.com.sa) +
 *      an `access_token` (Sanctum personal access token).
 *   3. The session cookie is automatically reused by every subdomain under
 *      .dasm.com.sa, so the user is SSO-logged-in across the whole platform.
 *   4. We also persist `access_token` to localStorage so any client-side
 *      Bearer-token code path keeps working.
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.dasm.com.sa/api";

const TOKEN_KEY = "dasm_token";

export interface User {
  id: number;
  name?: string;
  email?: string;
  type?: string;
  resolved_dashboard?: string | null;
  [key: string]: unknown;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
  needsVerification?: boolean;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistToken(token: string | undefined) {
  if (!token || typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — the session cookie is still enough */
  }
  // Also persist to a plain cookie so server-side rendering in Next.js can
  // read it (localStorage is not available on the server). Scoped to the
  // current host + path; secure over HTTPS.
  try {
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    /* noop */
  }
}

function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
  try {
    // Expire immediately.
    document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    /* noop */
  }
}

function extractFirstValidationError(errors: unknown): string | null {
  if (!errors || typeof errors !== "object") return null;
  const first = Object.values(errors as Record<string, unknown>)[0];
  if (Array.isArray(first) && typeof first[0] === "string") return first[0];
  if (typeof first === "string") return first;
  return null;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.status === "error") {
      if (data?.message === "Email not verified") {
        return {
          success: false,
          needsVerification: true,
          error:
            "يلزمك توثيق بريدك الإلكتروني أولاً — تحقق من صندوق الوارد.",
        };
      }
      const msg =
        extractFirstValidationError(data?.errors) ||
        data?.message ||
        "فشل تسجيل الدخول. تحقّق من البريد وكلمة المرور وحاول مرة أخرى.";
      return { success: false, error: msg };
    }

    persistToken(data?.access_token);
    return {
      success: true,
      user: data?.user,
      token: data?.access_token,
    };
  } catch {
    return {
      success: false,
      error: "تعذّر الاتصال بالخادم. حاول خلال لحظات.",
    };
  }
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResult> {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data?.status === "error") {
      const msg =
        extractFirstValidationError(data?.errors) ||
        data?.message ||
        "تعذّر إنشاء الحساب. راجع البيانات وحاول مجدداً.";
      return { success: false, error: msg };
    }

    persistToken(data?.access_token);
    return {
      success: true,
      user: data?.user,
      token: data?.access_token,
    };
  } catch {
    return {
      success: false,
      error: "تعذّر الاتصال بالخادم. حاول خلال لحظات.",
    };
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/user`, {
      credentials: "include",
      headers,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.id ? (data as User) : null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getStoredToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include",
      headers,
    });
  } catch {
    /* even if logout fails on the server, clear client state */
  }
  clearToken();
}
