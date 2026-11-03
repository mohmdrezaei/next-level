import crypto from "node:crypto";
import { accentFor, type SessionUser } from "@/features/auth/types";
import { cleanPhone, isValidPhone } from "../phone";
import { badRequest, unauthorized } from "../http";
import { createSessionForUser } from "./session";
import {
  findMemoryUserByPhone,
  saveMemoryUser,
  toSessionUserFromMemory,
} from "./memory-store";
import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { newId } from "../ids";

interface OtpEntry {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

interface RefreshTokenEntry {
  token: string;
  userId: string;
  expiresAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __otpStore: Map<string, OtpEntry> | undefined;
  // eslint-disable-next-line no-var
  var __refreshTokens: Map<string, RefreshTokenEntry> | undefined;
}

function getOtpStore(): Map<string, OtpEntry> {
  if (!globalThis.__otpStore) {
    globalThis.__otpStore = new Map<string, OtpEntry>();
  }
  return globalThis.__otpStore;
}

function getRefreshTokenStore(): Map<string, RefreshTokenEntry> {
  if (!globalThis.__refreshTokens) {
    globalThis.__refreshTokens = new Map<string, RefreshTokenEntry>();
  }
  return globalThis.__refreshTokens;
}

const JWT_SECRET = process.env.JWT_SECRET || "nextlevel-boutique-jwt-secret-key-2026";

/**
 * Generate standard base64url signed JWT (HMAC-SHA256).
 */
export function createAccessToken(user: SessionUser): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      iat: now,
      exp: now + 2 * 60 * 60, // 2 hours
    }),
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest("base64url");

  return `${header}.${payload}.${signature}`;
}

/**
 * Verify access token and extract payload.
 */
export function verifyAccessToken(token: string): { sub: string; phone: string; role: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expected) return null;

    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < now) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Generate 64-char refresh token with 30-day expiry.
 */
export function createRefreshToken(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  getRefreshTokenStore().set(token, { token, userId, expiresAt });
  return token;
}

/**
 * Validate refresh token and retrieve user id.
 */
export function verifyRefreshToken(token: string): string | null {
  const entry = getRefreshTokenStore().get(token);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    getRefreshTokenStore().delete(token);
    return null;
  }
  return entry.userId;
}

/**
 * Generate OTP, store with 120s TTL, and output prominently in server terminal.
 */
export async function sendOtp(rawPhone: string): Promise<{ ok: boolean; phone: string; message: string; expiresIn: number }> {
  const phone = cleanPhone(rawPhone);
  if (!isValidPhone(phone)) {
    throw badRequest("شماره موبایل نامعتبر است. شماره باید با ۰۹ شروع شده و ۱۱ رقم باشد.", {
      field: "phone",
    });
  }

  // Generate 5-digit random OTP
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  const expiresIn = 120; // 2 minutes

  getOtpStore().set(phone, {
    phone,
    code,
    expiresAt: Date.now() + expiresIn * 1000,
    attempts: 0,
  });

  // Display OTP in server terminal in local/development mode
  console.log("\n");
  console.log("=================================================================");
  console.log("             [NEXT LEVEL BOUTIQUE - SMS OTP SERVICE]             ");
  console.log("-----------------------------------------------------------------");
  console.log(`📱 شماره موبایل : ${phone}`);
  console.log(`🔑 کد تأیید ورود : ${code}`);
  console.log(`⏱  مدت اعتبار   : ۲ دقیقه (${expiresIn} ثانیه)`);
  console.log("=================================================================\n");

  return {
    ok: true,
    phone,
    message: "کد تأیید ورود به شماره موبایل شما ارسال شد.",
    expiresIn,
  };
}

/**
 * Verify submitted OTP against stored OTP.
 */
export async function verifyOtp(rawPhone: string, rawCode: string): Promise<boolean> {
  const phone = cleanPhone(rawPhone);
  const code = rawCode.trim();

  const entry = getOtpStore().get(phone);

  // In development mode, allow default dev code 12345 or matching entry
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev && code === "12345") {
    if (entry) getOtpStore().delete(phone);
    return true;
  }

  if (!entry) {
    throw badRequest("کد تأیید منقضی شده است یا درخواستی ثبت نشده است. لطفاً مجدداً درخواست کد دهید.", {
      field: "code",
    });
  }

  if (Date.now() > entry.expiresAt) {
    getOtpStore().delete(phone);
    throw badRequest("کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.", { field: "code" });
  }

  if (entry.attempts >= 5) {
    getOtpStore().delete(phone);
    throw badRequest("تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً مجدداً کد دریافت کنید.", {
      field: "code",
    });
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    throw badRequest("کد تأیید وارد شده نادرست است.", { field: "code" });
  }

  // Verification succeeded - clear OTP
  getOtpStore().delete(phone);
  return true;
}

/**
 * Sign in or auto-register user via verified OTP.
 * Generates access token, refresh token, and creates browser session.
 */
export async function authenticateWithOtp(
  rawPhone: string,
  rawCode: string,
  name?: string,
): Promise<{
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
}> {
  const phone = cleanPhone(rawPhone);
  await verifyOtp(phone, rawCode);

  let sessionUser: SessionUser | null = null;
  let customerId: string | null = null;

  // Try DB first if reachable
  try {
    const existing = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
    if (existing[0]) {
      const u = existing[0];
      sessionUser = {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role === "admin" ? "admin" : "customer",
        accent: u.accent || accentFor(u.phone),
      };
      customerId = u.customerId;
    } else {
      const id = newId("u");
      const cId = newId("c");
      const resolvedName = name?.trim() || `کاربر ${phone.slice(-4)}`;
      const resolvedEmail = `${phone}@nextlevel.local`;

      await db.insert(customers).values({
        id: cId,
        name: resolvedName,
        phone,
        email: resolvedEmail,
        city: "تهران",
        province: "تهران",
        joinedAt: new Date(),
        orders: 0,
        totalSpent: 0,
        tier: "bronze",
        lastOrderAt: null,
      }).catch(() => {});

      await db.insert(users).values({
        id,
        name: resolvedName,
        email: resolvedEmail,
        phone,
        role: "customer",
        accent: accentFor(phone),
        passwordHash: "",
        customerId: cId,
      }).catch(() => {});

      sessionUser = {
        id,
        name: resolvedName,
        email: resolvedEmail,
        phone,
        role: "customer",
        accent: accentFor(phone),
      };
      customerId = cId;
    }
  } catch {
    // Database offline / fallback
  }

  // If DB didn't resolve, check or create in memory store
  if (!sessionUser) {
    const memUser = findMemoryUserByPhone(phone);
    if (memUser) {
      sessionUser = toSessionUserFromMemory(memUser);
      customerId = memUser.customerId;
    } else {
      const id = newId("u");
      const cId = newId("c");
      const resolvedName = name?.trim() || `کاربر ${phone.slice(-4)}`;
      const resolvedEmail = `${phone}@nextlevel.local`;

      const newUser = saveMemoryUser({
        id,
        name: resolvedName,
        email: resolvedEmail,
        phone,
        role: "customer",
        accent: accentFor(phone),
        customerId: cId,
        birthday: "",
        gender: "unspecified",
        createdAt: new Date(),
      });

      sessionUser = toSessionUserFromMemory(newUser);
      customerId = cId;
    }
  }

  // Create web session cookie (Next.js SSR session)
  await createSessionForUser(sessionUser.id);

  // Issue Access Token & Refresh Token
  const accessToken = createAccessToken(sessionUser);
  const refreshToken = createRefreshToken(sessionUser.id);

  return {
    user: sessionUser,
    accessToken,
    refreshToken,
  };
}
