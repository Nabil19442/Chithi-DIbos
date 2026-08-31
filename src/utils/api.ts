import { Letter, AdminStats, SubmitLetterPayload, FilterStatus, SortOrder } from "../types";

const ADMIN_TOKEN_KEY = "chithi_admin_token";

export function getStoredAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setStoredAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearStoredAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function submitLetter(payload: SubmitLetterPayload): Promise<{ success: boolean; letterId?: string; error?: string }> {
  try {
    const res = await fetch("/api/letters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "চিঠি পাঠাতে সমস্যা হয়েছে।" };
    }
    return { success: true, letterId: data.letterId };
  } catch (err: any) {
    return { success: false, error: "নেটওয়ার্ক সমস্যা। অনুগ্রহ করে পুনরায় চেষ্টা করুন।" };
  }
}

export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "লগইন ব্যর্থ হয়েছে।" };
    }
    if (data.token) {
      setStoredAdminToken(data.token);
    }
    return { success: true, token: data.token };
  } catch (err: any) {
    return { success: false, error: "সার্ভারে সংযোগ করা যায়নি।" };
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
    return true;
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
    return await res.json();
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
    return await res.json();
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
    return await res.json();
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
