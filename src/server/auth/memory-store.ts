import { accentFor, type SessionUser } from "@/features/auth/types";
import { cleanPhone } from "../phone";

export interface MemoryUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "customer";
  accent: string;
  customerId: string;
  birthday: string;
  gender: "male" | "female" | "unspecified";
  createdAt: Date;
}

export interface MemorySession {
  token: string;
  userId: string;
  expiresAt: Date;
}

declare global {
  // eslint-disable-next-line no-var
  var __memoryUsers: Map<string, MemoryUser> | undefined;
  // eslint-disable-next-line no-var
  var __memorySessions: Map<string, MemorySession> | undefined;
}

function initMemoryUsers(): Map<string, MemoryUser> {
  const map = new Map<string, MemoryUser>();

  // Demo user
  map.set("u_demo", {
    id: "u_demo",
    name: "آرش مهرآذین",
    email: "demo@nextlevel.test",
    phone: "09120000000",
    role: "customer",
    accent: accentFor("09120000000"),
    customerId: "c-001",
    birthday: "1370/05/12",
    gender: "male",
    createdAt: new Date("2024-01-01"),
  });

  // Admin user
  map.set("u_admin", {
    id: "u_admin",
    name: "مدیر بوتیک",
    email: "admin@nextlevel.test",
    phone: "09120000001",
    role: "admin",
    accent: accentFor("admin@nextlevel.test"),
    customerId: "c_admin",
    birthday: "",
    gender: "unspecified",
    createdAt: new Date("2024-01-01"),
  });

  return map;
}

export function getMemoryUsers(): Map<string, MemoryUser> {
  if (!globalThis.__memoryUsers) {
    globalThis.__memoryUsers = initMemoryUsers();
  }
  return globalThis.__memoryUsers;
}

export function getMemorySessions(): Map<string, MemorySession> {
  if (!globalThis.__memorySessions) {
    globalThis.__memorySessions = new Map<string, MemorySession>();
  }
  return globalThis.__memorySessions;
}

export function findMemoryUserByPhone(phone: string): MemoryUser | null {
  const cleaned = cleanPhone(phone);
  for (const user of getMemoryUsers().values()) {
    if (cleanPhone(user.phone) === cleaned) return user;
  }
  return null;
}

export function findMemoryUserByEmail(email: string): MemoryUser | null {
  const needle = email.trim().toLowerCase();
  for (const user of getMemoryUsers().values()) {
    if (user.email.toLowerCase() === needle) return user;
  }
  return null;
}

export function findMemoryUserById(id: string): MemoryUser | null {
  return getMemoryUsers().get(id) ?? null;
}

export function saveMemoryUser(user: MemoryUser): MemoryUser {
  getMemoryUsers().set(user.id, user);
  return user;
}

export function toSessionUserFromMemory(user: MemoryUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    accent: user.accent,
  };
}
