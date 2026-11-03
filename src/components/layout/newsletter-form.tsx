"use client";

import * as React from "react";
import { ArrowLeft, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api-client";

export function NewsletterForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "error" | "done">("idle");
  const [sending, setSending] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error");
      return;
    }

    setSending(true);
    try {
      await apiFetch("/api/newsletter", { method: "POST", body: { email } });
      setStatus("done");
      setEmail("");
      window.setTimeout(() => setStatus("idle"), 3200);
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof ApiClientError ? error.message : "عضویت در خبرنامه ناموفق بود.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[0.68rem] tracking-[0.18em] text-gold/85">
        خبرنامه بوتیک
      </span>
      <p className="text-xs leading-6 text-mute">
        از انتشار ست‌های جدید و قطعات تیراژ محدود زودتر از همه باخبر شوید.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex-1">
          <Input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder="نشانی ایمیل شما"
            aria-label="نشانی ایمیل"
            data-invalid={status === "error" ? "" : undefined}
            className="h-11"
          />
          <AnimatePresence>
            {status === "error" ? (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2 text-[0.68rem] text-danger"
              >
                نشانی ایمیل معتبر نیست.
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        <Button type="submit" variant="subtle" size="md" className="h-11 shrink-0" loading={sending}>
          {status === "done" ? (
            <>
              <Check className="size-4 text-success" />
              ثبت شد
            </>
          ) : (
            <>
              عضویت
              <ArrowLeft className="size-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
