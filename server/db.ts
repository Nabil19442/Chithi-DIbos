import { createClient, SupabaseClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface LetterRecord {
  id: string;
  subject?: string;
  message: string;
  mood?: string;
  createdAt: string; // ISO string
  isRead: boolean;
}

export interface AdminStats {
  total: number;
  unread: number;
  read: number;
  today: number;
  moodCounts: Record<string, number>;
}

// Fallback local memory & file database
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "letters.json");

let localLetters: LetterRecord[] = [];

function loadLocalLetters(): LetterRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn("Could not read local JSON letters database:", err);
  }

  // Welcome seed for Chithi Dibosh
  return [
    {
      id: "chithi-" + crypto.randomUUID().slice(0, 8),
      subject: "চিঠি দিবসের শুভেচ্ছা 💌",
      message: "চিঠি দিবসে আপনাকে জানাই অনেক অনেক শুভকামনা! এই ডিজিটাল চিঠি বক্সে আপনার প্রিয় মানুষের মনের কথাগুলো নীরবে জমা হবে।",
      mood: "🤍 কৃতজ্ঞতা",
      createdAt: new Date().toISOString(),
      isRead: false,
    },
  ];
}

function saveLocalLetters(letters: LetterRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(letters, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal on serverless readonly filesystems
    console.warn("Notice: Local file save skipped (expected in readonly serverless environments):", err);
  }
}

// Initialize local cache
localLetters = loadLocalLetters();

// Supabase client instance (lazy/safe initialization)
let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  // Prefer service_role key for backend/admin operations (bypasses RLS if needed), fallback to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key && url.startsWith("http")) {
    try {
      supabaseClient = createClient(url, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log("[Chithi Dibosh] Connected to Supabase:", url);
      return supabaseClient;
    } catch (err) {
      console.error("[Chithi Dibosh] Error initializing Supabase client:", err);
      return null;
    }
  }

  return null;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith("http"));
}

/**
 * Normalizes a database row from Supabase (snake_case) to LetterRecord (camelCase)
 */
function mapFromSupabase(row: any): LetterRecord {
  return {
    id: String(row.id),
    subject: row.subject || undefined,
    message: String(row.message || ""),
    mood: row.mood || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    isRead: Boolean(row.is_read),
  };
}

/**
 * 1. Insert a new anonymous letter
 */
export async function createLetter(payload: {
  subject?: string;
  message: string;
  mood?: string;
}): Promise<LetterRecord> {
  const newLetter: LetterRecord = {
    id: "chithi-" + crypto.randomUUID().slice(0, 8),
    subject: payload.subject,
    message: payload.message,
    mood: payload.mood,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("letters")
      .insert([
        {
          id: newLetter.id,
          subject: newLetter.subject || null,
          message: newLetter.message,
          mood: newLetter.mood || null,
          created_at: newLetter.createdAt,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[Supabase createLetter Error]:", error);
      throw new Error(`ডাটাবেজে চিঠি সংরক্ষণ করা যায়নি: ${error.message}`);
    }

    return mapFromSupabase(data);
  }

  // Fallback to local memory / JSON
  localLetters.unshift(newLetter);
  saveLocalLetters(localLetters);
  return newLetter;
}

/**
 * 2. Get list of letters with search, filter, and sorting
 */
export async function getLetters(params: {
  query?: string;
  status?: string;
  mood?: string;
  sort?: string;
}): Promise<{ letters: LetterRecord[]; totalCount: number; filteredCount: number }> {
  const supabase = getSupabase();

  if (supabase) {
    let query = supabase.from("letters").select("*", { count: "exact" });

    // Status filtering
    if (params.status === "unread") {
      query = query.eq("is_read", false);
    } else if (params.status === "read") {
      query = query.eq("is_read", true);
    } else if (params.status === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      query = query.gte("created_at", todayStart.toISOString());
    }

    // Mood filtering
    if (params.mood && params.mood !== "all") {
      query = query.eq("mood", params.mood);
    }

    // Search query (filters by message or subject)
    if (params.query && params.query.trim()) {
      const q = `%${params.query.trim()}%`;
      query = query.or(`message.ilike.${q},subject.ilike.${q}`);
    }

    // Sorting
    const isOldest = params.sort === "oldest";
    query = query.order("created_at", { ascending: isOldest });

    const { data, count, error } = await query;

    if (error) {
      console.error("[Supabase getLetters Error]:", error);
      throw new Error(`চিঠি লোড করতে সমস্যা হয়েছে: ${error.message}`);
    }

    // Fetch total count without filters for stats context
    const { count: totalCount } = await supabase
      .from("letters")
      .select("*", { count: "exact", head: true });

    const mappedLetters = (data || []).map(mapFromSupabase);

    return {
      letters: mappedLetters,
      totalCount: totalCount ?? mappedLetters.length,
      filteredCount: count ?? mappedLetters.length,
    };
  }

  // Fallback local memory / JSON
  let filtered = [...localLetters];
  const q = (params.query || "").toLowerCase().trim();

  if (q) {
    filtered = filtered.filter((l) => {
      const matchMsg = l.message.toLowerCase().includes(q);
      const matchSub = l.subject ? l.subject.toLowerCase().includes(q) : false;
      const matchMood = l.mood ? l.mood.toLowerCase().includes(q) : false;
      return matchMsg || matchSub || matchMood;
    });
  }

  if (params.status === "unread") {
    filtered = filtered.filter((l) => !l.isRead);
  } else if (params.status === "read") {
    filtered = filtered.filter((l) => l.isRead);
  } else if (params.status === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    filtered = filtered.filter((l) => new Date(l.createdAt) >= todayStart);
  }

  if (params.mood && params.mood !== "all") {
    filtered = filtered.filter((l) => l.mood === params.mood);
  }

  if (params.sort === "oldest") {
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return {
    letters: filtered,
    totalCount: localLetters.length,
    filteredCount: filtered.length,
  };
}

/**
 * 3. Get single letter by ID
 */
export async function getLetterById(id: string): Promise<LetterRecord | null> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("letters")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }
    return mapFromSupabase(data);
  }

  return localLetters.find((l) => l.id === id) || null;
}

/**
 * 4. Update letter read / unread status
 */
export async function updateLetterReadStatus(id: string, isRead: boolean): Promise<LetterRecord | null> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("letters")
      .update({ is_read: isRead })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error("[Supabase updateLetterReadStatus Error]:", error);
      return null;
    }
    return mapFromSupabase(data);
  }

  const letter = localLetters.find((l) => l.id === id);
  if (!letter) return null;
  letter.isRead = isRead;
  saveLocalLetters(localLetters);
  return letter;
}

/**
 * 5. Delete letter by ID
 */
export async function deleteLetterById(id: string): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase
      .from("letters")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[Supabase deleteLetterById Error]:", error);
      return false;
    }
    return true;
  }

  const index = localLetters.findIndex((l) => l.id === id);
  if (index === -1) return false;
  localLetters.splice(index, 1);
  saveLocalLetters(localLetters);
  return true;
}

/**
 * 6. Mark all letters as read
 */
export async function markAllLettersAsRead(): Promise<number> {
  const supabase = getSupabase();

  if (supabase) {
    const { error, count } = await supabase
      .from("letters")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) {
      console.error("[Supabase markAllLettersAsRead Error]:", error);
      return 0;
    }
    return count ?? 0;
  }

  let count = 0;
  localLetters.forEach((l) => {
    if (!l.isRead) {
      l.isRead = true;
      count++;
    }
  });
  saveLocalLetters(localLetters);
  return count;
}

/**
 * 7. Get aggregated administrative statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("letters")
      .select("id, is_read, created_at, mood");

    if (error || !data) {
      console.error("[Supabase getAdminStats Error]:", error);
      return { total: 0, unread: 0, read: 0, today: 0, moodCounts: {} };
    }

    const total = data.length;
    const unread = data.filter((d) => !d.is_read).length;
    const read = total - unread;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const today = data.filter((d) => new Date(d.created_at) >= todayStart).length;

    const moodCounts: Record<string, number> = {};
    data.forEach((d) => {
      if (d.mood) {
        moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
      }
    });

    return { total, unread, read, today, moodCounts };
  }

  const total = localLetters.length;
  const unread = localLetters.filter((l) => !l.isRead).length;
  const read = total - unread;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const today = localLetters.filter((l) => new Date(l.createdAt) >= todayStart).length;

  const moodCounts: Record<string, number> = {};
  localLetters.forEach((l) => {
    if (l.mood) {
      moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    }
  });

  return { total, unread, read, today, moodCounts };
}
