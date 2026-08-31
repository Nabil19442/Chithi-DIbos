import { Letter, AdminStats, SubmitLetterPayload, FilterStatus, SortOrder } from "../types";

const ADMIN_TOKEN_KEY = "chithi_admin_token";

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string): void {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (err) {
    console.error("Could not store admin token:", err);
  }
}

export function clearStoredAdminToken(): void {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (err) {
    console.error("Could not clear admin token:", err);
  }
}

/**
 * Safely parse JSON from response or fallback to text error
 */
async function safeJson(res: Response): Promise<any> {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return null;
}

export async function submitLetter(
  payload: SubmitLetterPayload
): Promise<{ success: boolean; letterId?: string; error?: string }> {
  try {
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    if (!res.ok) {
      return {
        success: false,
        error: data?.error || `চিঠি পাঠাতে ব্যর্থ হয়েছে (${res.status})`,
      };
    }
    return { success: true, letterId: data?.letterId };
  } catch (err: any) {
    console.error("Submit letter error:", err);
    return {
      success: false,
      error: "নেটওয়ার্ক সমস্যা। সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।",
    };
  }
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await safeJson(res);

    if (!res.ok) {
      if (res.status === 401) {
        return { success: false, error: data?.error || "ভুল ইউজারনেম অথবা পাসওয়ার্ড।" };
      }
      if (res.status === 404) {
        return {
          success: false,
          error: "লগইন এপিআই পাওয়া যায়নি (404)। দয়া করে Vercel সার্ভারলেস রুট চেক করুন।",
        };
      }
      return {
        success: false,
        error: data?.error || `লগইন ব্যর্থ হয়েছে (${res.status})।`,
      };
    }

    if (data?.token) {
      setStoredAdminToken(data.token);
      return { success: true, token: data.token };
    }

    return { success: false, error: "সার্ভার থেকে টোকেন পাওয়া যায়নি।" };
  } catch (err: any) {
    console.error("Login fetch error:", err);
    return {
      success: false,
      error: "সার্ভারে সংযোগ করা যায়নি। ইন্টারনেট ও সার্ভার স্ট্যাটাস চেক করুন।",
    };
  }
}

export async function verifyAdminAuth(): Promise<boolean> {
  const token = getStoredAdminToken();
  if (!token) return false;

  try {
    const res = await fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearStoredAdminToken();
      return false;
    }
    const data = await safeJson(res);
    return Boolean(data?.valid);
  } catch {
    return false;
  }
}

export async function getAdminStats(): Promise<AdminStats | null> {
  const token = getStoredAdminToken();
  if (!token) return null;

  try {
    const res = await fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await safeJson(res);
  } catch {
    return null;
  }
}

export async function getAdminLetters(params: {
  q?: string;
  status?: FilterStatus;
  mood?: string;
  sort?: SortOrder;
}): Promise<{ letters: Letter[]; totalCount: number; filteredCount: number } | null> {
  const token = getStoredAdminToken();
  if (!token) return null;

  try {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.mood && params.mood !== "all") query.set("mood", params.mood);
    if (params.sort) query.set("sort", params.sort);

    const res = await fetch(`/api/admin/letters?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await safeJson(res);
  } catch {
    return null;
  }
}

export async function getLetterDetails(id: string): Promise<Letter | null> {
  const token = getStoredAdminToken();
  if (!token) return null;

  try {
    const res = await fetch(`/api/admin/letters/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await safeJson(res);
  } catch {
    return null;
  }
}

export async function updateLetterReadStatus(id: string, isRead: boolean): Promise<boolean> {
  const token = getStoredAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`/api/admin/letters/${id}/read`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isRead }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteLetter(id: string): Promise<boolean> {
  const token = getStoredAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`/api/admin/letters/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllLettersRead(): Promise<boolean> {
  const token = getStoredAdminToken();
  if (!token) return false;

  try {
    const res = await fetch("/api/admin/mark-all-read", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}
