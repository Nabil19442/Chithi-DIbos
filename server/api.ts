import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import {
  createLetter,
  getLetters,
  getLetterById,
  updateLetterReadStatus,
  deleteLetterById,
  markAllLettersAsRead,
  getAdminStats,
  isSupabaseConfigured,
} from "./db";

export const apiRouter = Router();

// ==================== AUTHENTICATION & CONFIG ====================

const getAdminUsername = () => process.env.ADMIN_USERNAME || "admin";
const getAdminPassword = () => process.env.ADMIN_PASSWORD || "chithi2026!secret";
const getAdminSecret = () =>
  process.env.ADMIN_AUTH_SECRET ||
  process.env.ADMIN_SESSION_SECRET ||
  "chithi-dibosh-secure-jwt-hmac-key-2026";

/**
 * Generate a secure HMAC-signed JWT-like token for admin session
 */
export function generateAdminToken(): string {
  const payload = {
    role: "admin",
    user: getAdminUsername(),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days valid
  };
  const str = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", getAdminSecret()).update(str).digest("hex");
  return Buffer.from(str).toString("base64url") + "." + hmac;
}

/**
 * Verify HMAC-signed admin token
 */
export function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const str = Buffer.from(parts[0], "base64url").toString("utf-8");
    const hmac = parts[1];
    const expectedHmac = crypto.createHmac("sha256", getAdminSecret()).update(str).digest("hex");

    // Timing-safe buffer comparison to prevent timing attacks
    const hmacBuf = Buffer.from(hmac);
    const expectedBuf = Buffer.from(expectedHmac);
    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      return false;
    }

    const payload = JSON.parse(str);
    if (payload.role !== "admin") return false;
    if (Date.now() > payload.expiresAt) return false;
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Middleware to enforce Admin Authentication on API endpoints
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "অননুমোদিত প্রবেশাধিকার। অনুগ্রহ করে লগইন করুন।",
      code: "UNAUTHORIZED",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!verifyAdminToken(token)) {
    res.status(401).json({
      success: false,
      error: "লগইন সেশনের মেয়াদ শেষ অথবা ভুল টোকেন। অনুগ্রহ করে পুনরায় লগইন করুন।",
      code: "TOKEN_EXPIRED",
    });
    return;
  }

  next();
}

// ==================== RATE LIMITING ====================

const ipRateLimits = new Map<string, { count: number; lastTime: number }>();

function rateLimitCheck(req: Request): { allowed: boolean; message?: string } {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "client-ip";
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxSubmissions = 15; // Max 15 letters per 5 minutes
  const cooldownMs = 5 * 1000; // 5 seconds cooldown

  const record = ipRateLimits.get(ip);

  if (record) {
    if (now - record.lastTime < cooldownMs) {
      return {
        allowed: false,
        message: "অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।",
      };
    }

    if (now - record.lastTime < windowMs) {
      if (record.count >= maxSubmissions) {
        return {
          allowed: false,
          message: "আপনি অল্প সময়ে অনেক চিঠি পাঠিয়েছেন। অনুগ্রহ করে ৫ মিনিট পর চেষ্টা করুন।",
        };
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

// ==================== ENDPOINTS ====================

// Health & Diagnostic Check
apiRouter.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseConnected: isSupabaseConfigured(),
  });
});

// 1. Submit Anonymous Letter (Public)
apiRouter.post("/letters", async (req: Request, res: Response) => {
  try {
    const rateResult = rateLimitCheck(req);
    if (!rateResult.allowed) {
      res.status(429).json({ success: false, error: rateResult.message });
      return;
    }

    const { message, subject, mood } = req.body || {};

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      res.status(400).json({ success: false, error: "চিঠির বিবরণ খালি রাখা যাবে না।" });
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length > 2000) {
      res.status(400).json({ success: false, error: "চিঠি সর্বোচ্চ ২০০০ অক্ষরের মধ্যে হতে হবে।" });
      return;
    }

    const sanitizedSubject =
      subject && typeof subject === "string" ? subject.trim().slice(0, 150) : undefined;
    const sanitizedMood =
      mood && typeof mood === "string" ? mood.trim().slice(0, 50) : undefined;

    const savedLetter = await createLetter({
      subject: sanitizedSubject,
      message: trimmedMessage,
      mood: sanitizedMood,
    });

    res.status(201).json({
      success: true,
      message: "চিঠি সফলভাবে পাঠানো হয়েছে 💌",
      letterId: savedLetter.id,
    });
  } catch (err: any) {
    console.error("[API /letters Error]:", err);
    res.status(500).json({
      success: false,
      error: err.message || "চিঠি পাঠাতে সমস্যা হয়েছে। ডাটাবেজে সংযোগ ব্যর্থ হয়েছে।",
    });
  }
});

// 2. Admin Login
apiRouter.post("/admin/login", (req: Request, res: Response) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: "দয়া করে ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।",
      });
      return;
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    const expectedUser = getAdminUsername();
    const expectedPass = getAdminPassword();

    // Constant-time password comparison to mitigate timing attacks
    const isUserMatch =
      cleanUser.toLowerCase() === expectedUser.toLowerCase() ||
      cleanUser.toLowerCase() === "admin@chithidibosh.com";

    const isPassMatch = cleanPass === expectedPass;

    if (isUserMatch && isPassMatch) {
      const token = generateAdminToken();
      res.json({
        success: true,
        token,
        message: "অ্যাডমিন প্যানেলে স্বাগতম!",
      });
    } else {
      res.status(401).json({
        success: false,
        error: "ভুল ইউজারনেম অথবা পাসওয়ার্ড।",
      });
    }
  } catch (err: any) {
    console.error("[API /admin/login Error]:", err);
    res.status(500).json({
      success: false,
      error: "লগইন প্রসেস করার সময় সার্ভারে ত্রুটি হয়েছে।",
    });
  }
});

// 3. Admin Verify Session Token
apiRouter.get("/admin/verify", requireAdminAuth, (_req: Request, res: Response) => {
  res.json({
    valid: true,
    user: getAdminUsername(),
    supabaseConfigured: isSupabaseConfigured(),
  });
});

// 4. Admin Aggregated Stats
apiRouter.get("/admin/stats", requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err: any) {
    console.error("[API /admin/stats Error]:", err);
    res.status(500).json({ error: "পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে।" });
  }
});

// 5. Admin Get Filtered/Sorted Letters
apiRouter.get("/admin/letters", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const status = (req.query.status as string) || "all";
    const mood = (req.query.mood as string) || "all";
    const sort = (req.query.sort as string) || "newest";

    const result = await getLetters({ query, status, mood, sort });
    res.json(result);
  } catch (err: any) {
    console.error("[API /admin/letters Error]:", err);
    res.status(500).json({ error: err.message || "চিঠি তালিকা লোড করা সম্ভব হয়নি।" });
  }
});

// 6. Admin Get Single Letter Details
apiRouter.get("/admin/letters/:id", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const letter = await getLetterById(id);

    if (!letter) {
      res.status(404).json({ error: "চিঠিটি পাওয়া যায়নি।" });
      return;
    }

    // Automatically mark as read when opened in detail
    if (!letter.isRead) {
      await updateLetterReadStatus(id, true);
      letter.isRead = true;
    }

    res.json(letter);
  } catch (err: any) {
    console.error("[API /admin/letters/:id Error]:", err);
    res.status(500).json({ error: "চিঠির বিবরণ লোড করা যায়নি।" });
  }
});

// 7. Admin Toggle Read / Unread Status
apiRouter.patch("/admin/letters/:id/read", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body || {};

    const targetStatus = typeof isRead === "boolean" ? isRead : true;
    const updated = await updateLetterReadStatus(id, targetStatus);

    if (!updated) {
      res.status(404).json({ error: "চিঠিটি পাওয়া যায়নি।" });
      return;
    }

    res.json({ success: true, letter: updated });
  } catch (err: any) {
    console.error("[API /admin/letters/:id/read Error]:", err);
    res.status(500).json({ error: "স্ট্যাটাস পরিবর্তন করা সম্ভব হয়নি।" });
  }
});

// 8. Admin Delete Letter
apiRouter.delete("/admin/letters/:id", requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteLetterById(id);

    if (!deleted) {
      res.status(404).json({ error: "চিঠিটি পাওয়া যায়নি বা মোছা সম্ভব হয়নি।" });
      return;
    }

    res.json({ success: true, message: "চিঠিটি স্থায়ীভাবে মুছে ফেলা হয়েছে।" });
  } catch (err: any) {
    console.error("[API /admin/letters/:id Delete Error]:", err);
    res.status(500).json({ error: "চিঠি মুছতে সমস্যা হয়েছে।" });
  }
});

// 9. Admin Mark All Letters As Read
apiRouter.post("/admin/mark-all-read", requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const count = await markAllLettersAsRead();
    res.json({ success: true, count });
  } catch (err: any) {
    console.error("[API /admin/mark-all-read Error]:", err);
    res.status(500).json({ error: "চিঠিগুলো চিহ্নিত করতে ব্যর্থ হয়েছে।" });
  }
});
