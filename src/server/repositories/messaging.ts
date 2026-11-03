/**
 * Newsletter and contact-form submissions.
 */
import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { contactMessages, newsletterSubscribers } from "@/db/schema";

import { badRequest } from "../http";
import { isValidEmail } from "../phone";
import { sanitizeString } from "@/lib/sanitize";

/* -------------------------------------------------------------------------- */
/*  Newsletter                                                                */
/* -------------------------------------------------------------------------- */

export interface Subscriber {
  id: number;
  email: string;
  createdAt: string;
}

export async function subscribeToNewsletter(email: string): Promise<{ created: boolean; email: string }> {
  const value = sanitizeString(email ?? "", 160).toLowerCase();
  if (!isValidEmail(value)) throw badRequest("نشانی ایمیل معتبر نیست.", { field: "email" });

  const inserted = await db
    .insert(newsletterSubscribers)
    .values({ email: value })
    .onConflictDoNothing({ target: newsletterSubscribers.email })
    .returning({ id: newsletterSubscribers.id });

  return { created: inserted.length > 0, email: value };
}

export async function listSubscribers(limit = 200): Promise<Subscriber[]> {
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function unsubscribeFromNewsletter(email: string): Promise<boolean> {
  const rows = await db
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, String(email ?? "").trim().toLowerCase()))
    .returning({ id: newsletterSubscribers.id });

  return rows.length > 0;
}

/* -------------------------------------------------------------------------- */
/*  Contact                                                                   */
/* -------------------------------------------------------------------------- */

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface ContactMessage extends ContactInput {
  id: number;
  createdAt: string;
  status: string;
}

export async function submitContactMessage(input: ContactInput): Promise<ContactMessage> {
  const name = sanitizeString(input?.name ?? "", 80);
  const email = sanitizeString(input?.email ?? "", 160).toLowerCase();
  const message = sanitizeString(input?.message ?? "", 5000);

  if (name.length < 3) throw badRequest("نام باید حداقل ۳ کاراکتر باشد.", { field: "name" });
  if (!isValidEmail(email)) throw badRequest("نشانی ایمیل معتبر نیست.", { field: "email" });
  if (message.length < 10) throw badRequest("متن پیام باید حداقل ۱۰ کاراکتر باشد.", { field: "message" });

  const rows = await db
    .insert(contactMessages)
    .values({
      name,
      email,
      phone: sanitizeString(input.phone ?? "", 20),
      subject: sanitizeString(input.subject ?? "", 120),
      message,
    })
    .returning();

  const row = rows[0];
  if (!row) throw badRequest("ارسال پیام ناموفق بود.");

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
  };
}

export async function listContactMessages(limit = 100): Promise<ContactMessage[]> {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    status: row.status,
  }));
}

export async function countContactMessages(): Promise<number> {
  const rows = await db.select({ value: sql<number>`count(*)::int` }).from(contactMessages);
  return rows[0]?.value ?? 0;
}
