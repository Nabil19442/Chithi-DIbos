import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "1mb" }));

// Persistent Data Storage Setup
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "letters.json");

interface LetterRecord {
  id: string;
  subject?: string;
  message: string;
  mood?: string;
  createdAt: string;
  isRead: boolean;
}

// Ensure data folder and file exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadLetters(): LetterRecord[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading letters database:", err);
  }
  
  // Seed with a welcoming first message for Chithi Dibosh
  const initialSeed: LetterRecord[] = [
    {
      id: "chithi-" + crypto.randomUUID().slice(0, 8),
      subject: "চিঠি দিবসের শুভেচ্ছা 💌",
      message: "চিঠি দিবসে আপনাকে জানাই অনেক অনেক শুভকামনা! এই ডিজিটাল চিঠি বক্সে আপনার প্রিয় মানুষের মনের কথাগুলো নীরবে জমা হবে।",
      mood: "🤍 কৃতজ্ঞতা",
      createdAt: new Date().toISOString(),
      isRead: false,
    },
  ];
  saveLetters(initialSeed);
  return initialSeed;
}

function saveLetters(letters: LetterRecord[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(letters, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving letters database:", err);
  }
}

// In-Memory letter cache initialized from disk
let lettersDatabase: LetterRecord[] = loadLetters();

// Spam Protection & Rate Limiting
const ipRateLimits = new Map<string, { count: number; lastTime: number }>();

function rateLimitCheck(req: Request): { allowed: boolean; message?: string } {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.socket.remoteAddress || "unknown-ip";
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxSubmissions = 10; // Max 10 letters in 5 minutes
  const cooldownMs = 8 * 1000; // 8 seconds cooldown between letters

  const record = ipRateLimits.get(ip);

  if (record) {
    if (now - record.lastTime < cooldownMs) {
      return { allowed: false, message: "অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।" };
    }

    if (now - record.lastTime < windowMs) {
      if (record.count >= maxSubmissions) {
        return { allowed: false, message: "আপনি অল্প সময়ে অনেকগুলো চিঠি পাঠিয়েছেন। অনুগ্রহ করে ৫ মিনিট পর আবার চেষ্টা করুন।" };
      }
      ipRateLimits.set(ip, { count: record.count + 1, lastTime: now });
    } else {
      ipRateLimits.set(ip, { count: 1, lastTime: now });
    }
  } else {
    ipRateLimits.set(ip, { count: 1, lastTime: now });
  }

  return { allowed: true };
}

// Admin Security Config
const ADMIN_USER = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "chithi2026!secret";
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || "chithi-dibosh-secret-key-2026";

function generateAdminToken(): string {
  const payload = {
    role: "admin",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const str = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", ADMIN_SECRET).update(str).digest("hex");
  return Buffer.from(str).toString("base64") + "." + hmac;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const str = Buffer.from(parts[0], "base64").toString("utf-8");
    const hmac = parts[1];
    const expectedHmac = crypto.createHmac("sha256", ADMIN_SECRET).update(str).digest("hex");
    
    if (hmac !== expectedHmac) return false;
    const payload = JSON.parse(str);
    if (payload.role !== "admin") return false;
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch {
    return false;
  }
}

// Middleware: Authenticate Admin Request
function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "অননুমোদিত প্রবেশাধিকার (Unauthorized)" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!verifyAdminToken(token)) {
    res.status(401).json({ error: "সেশনের মেয়াদ শেষ বা ভুল টোকেন। অনুগ্রহ করে পুনরায় লগইন করুন।" });
    return;
  }

  next();
}

// ==================== API ROUTES ====================

// Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Submit Anonymous Letter (Public)
app.post("/api/letters", (req: Request, res: Response) => {
  const rateResult = rateLimitCheck(req);
  if (!rateResult.allowed) {
    res.status(429).json({ error: rateResult.message });
    return;
  }

  const { message, subject, mood } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "চিঠির বিবরণ খালি রাখা যাবে না।" });
    return;
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length > 2000) {
    res.status(400).json({ error: "চিঠি সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে।" });
    return;
  }

  const sanitizedSubject = subject && typeof subject === "string" ? subject.trim().slice(0, 150) : undefined;
  const sanitizedMood = mood && typeof mood === "string" ? mood.trim().slice(0, 50) : undefined;

  const newLetter: LetterRecord = {
    id: "chithi-" + crypto.randomUUID().slice(0, 8),
    subject: sanitizedSubject || undefined,
    message: trimmedMessage,
    mood: sanitizedMood || undefined,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  lettersDatabase.unshift(newLetter);
  saveLetters(lettersDatabase);

  res.status(201).json({
    success: true,
    message: "চিঠি সফলভাবে পাঠানো হয়েছে 💌",
    letterId: newLetter.id,
  });
});

// 2. Admin Login
app.post("/api/admin/login", (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।" });
    return;
  }

  const cleanUser = String(username).trim();
  const cleanPass = String(password).trim();

  // Validate admin credentials
  if (
    (cleanUser === ADMIN_USER || cleanUser === "admin@chithidibosh.com") &&
    cleanPass === ADMIN_PASS
  ) {
    const token = generateAdminToken();
    res.json({
      success: true,
      token,
      message: "অ্যাডমিন প্যানেলে স্বাগতম!",
    });
  } else {
    res.status(401).json({ error: "ভুল ইউজারনেম অথবা পাসওয়ার্ড।" });
  }
});

// 3. Admin Verify Token
app.get("/api/admin/verify", requireAdminAuth, (_req: Request, res: Response) => {
  res.json({ valid: true, admin: ADMIN_USER });
});

// 4. Admin Stats
app.get("/api/admin/stats", requireAdminAuth, (_req: Request, res: Response) => {
  const total = lettersDatabase.length;
  const unread = lettersDatabase.filter((l) => !l.isRead).length;
  const read = total - unread;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const today = lettersDatabase.filter((l) => {
    const d = new Date(l.createdAt);
    return d >= todayStart;
  }).length;

  const moodCounts: Record<string, number> = {};
  lettersDatabase.forEach((l) => {
    if (l.mood) {
      moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    }
  });

  res.json({
    total,
    unread,
    read,
    today,
    moodCounts,
  });
});

// 5. Admin Get Letters (with search, filter, sort)
app.get("/api/admin/letters", requireAdminAuth, (req: Request, res: Response) => {
  const query = (req.query.q as string || "").toLowerCase().trim();
  const status = (req.query.status as string || "all").toLowerCase();
  const mood = (req.query.mood as string || "all").trim();
  const sort = (req.query.sort as string || "newest").toLowerCase();

  let filtered = [...lettersDatabase];

  // Search filter
  if (query) {
    filtered = filtered.filter((l) => {
      const matchMessage = l.message.toLowerCase().includes(query);
      const matchSubject = l.subject ? l.subject.toLowerCase().includes(query) : false;
      const matchMood = l.mood ? l.mood.toLowerCase().includes(query) : false;
      return matchMessage || matchSubject || matchMood;
    });
  }

  // Status filter
  if (status === "unread") {
    filtered = filtered.filter((l) => !l.isRead);
  } else if (status === "read") {
    filtered = filtered.filter((l) => l.isRead);
  } else if (status === "today") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    filtered = filtered.filter((l) => new Date(l.createdAt) >= todayStart);
  }

  // Mood filter
  if (mood && mood !== "all") {
    filtered = filtered.filter((l) => l.mood === mood);
  }

  // Sort
  if (sort === "oldest") {
    filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({
    letters: filtered,
    totalCount: lettersDatabase.length,
    filteredCount: filtered.length,
  });
});

// 6. Admin Get Single Letter (and optionally mark as read)
app.get("/api/admin/letters/:id", requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const letter = lettersDatabase.find((l) => l.id === id);

  if (!letter) {
    res.status(404).json({ error: "চিঠিটি পাওয়া যায়নি।" });
    return;
  }

  // Auto mark as read if requested or unread
  if (!letter.isRead) {
    letter.isRead = true;
    saveLetters(lettersDatabase);
  }

  res.json(letter);
});

// 7. Admin Toggle Read / Unread Status
app.patch("/api/admin/letters/:id/read", requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { isRead } = req.body;

  const letter = lettersDatabase.find((l) => l.id === id);
  if (!letter) {
    res.status(404).json({ error: "চিঠিটি পাওয়া যায়নি।" });
    return;
  }

  letter.isRead = typeof isRead === "boolean" ? isRead : !letter.isRead;
  saveLetters(lettersDatabase);

  res.json({ success: true, letter });
});

// 8. Admin Delete Letter
app.delete("/api/admin/letters/:id", requireAdminAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const index = lettersDatabase.findIndex((l) => l.id === id);

  if (index === -1) {
    res.status(404).json({ error: "চিঠিটি পাওয়া যায়নি।" });
    return;
  }

  lettersDatabase.splice(index, 1);
  saveLetters(lettersDatabase);

  res.json({ success: true, message: "চিঠিটি মুছে ফেলা হয়েছে।" });
});

// 9. Admin Mark All As Read
app.post("/api/admin/mark-all-read", requireAdminAuth, (_req: Request, res: Response) => {
  lettersDatabase.forEach((l) => {
    l.isRead = true;
  });
  saveLetters(lettersDatabase);
  res.json({ success: true, count: lettersDatabase.length });
});

// ==================== VITE & STATIC FILES ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Chithi Dibosh Server] running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
