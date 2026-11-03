"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, MessageSquarePlus, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/controls";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { RatingStars } from "@/components/shared/rating-stars";
import { InitialsAvatar } from "@/components/ui/avatar";
import { formatNumber, formatRelative, toPersianDigits } from "@/lib/format";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Product, ProductReview } from "@/features/products/types";

interface ProductReviewsProps {
  product: Product;
  reviews: ProductReview[];
}

export function ProductReviews({ product, reviews }: ProductReviewsProps) {
  const router = useRouter();
  const [showForm, setShowForm] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [helpful, setHelpful] = React.useState<Record<string, boolean>>({});
  const [visible, setVisible] = React.useState(4);
  const [submitting, setSubmitting] = React.useState(false);

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((review) => review.rating === stars).length,
  }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title") ?? "").trim();
    const body = String(data.get("body") ?? "").trim();

    if (title.length < 3 || body.length < 20) {
      toast.error("عنوان و متن نظر را کامل وارد کنید.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        body: { rating, title, body },
      });
      setShowForm(false);
      toast.success("نظر شما ثبت شد", {
        description: "پس از تأیید کارشناس بوتیک، نظر شما در صفحه محصول نمایش داده می‌شود.",
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "ثبت نظر ناموفق بود.");
    } finally {
      setSubmitting(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    if (helpful[reviewId]) return;
    setHelpful((state) => ({ ...state, [reviewId]: true }));

    try {
      await apiFetch(`/api/reviews/${reviewId}/helpful`, { method: "POST" });
    } catch (error) {
      setHelpful((state) => ({ ...state, [reviewId]: false }));
      toast.error(error instanceof ApiClientError ? error.message : "ثبت بازخورد ناموفق بود.");
    }
  };

  return (
    <section id="reviews" className="flex flex-col gap-8">
      <div className="grid gap-8 rounded-2xl border border-line bg-surface/40 p-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <span className="tnum text-4xl font-semibold text-ivory">
            {toPersianDigits(product.rating.toFixed(1))}
          </span>
          <RatingStars rating={product.rating} showValue={false} size="md" />
          <span className="text-[0.68rem] text-mute">
            بر اساس <span className="tnum">{formatNumber(product.reviewCount)}</span> نظر ثبت‌شده
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm((value) => !value)}
            className="mt-2"
          >
            <MessageSquarePlus className="size-3.5" />
            نوشتن نظر
          </Button>
        </div>

        <div className="flex flex-col justify-center gap-3">
          {breakdown.map((row) => {
            const percent = reviews.length ? (row.count / reviews.length) * 100 : 0;
            return (
              <div key={row.stars} className="flex items-center gap-3">
                <span className="tnum flex w-10 items-center gap-1 text-[0.68rem] text-smoke">
                  {toPersianDigits(row.stars)}
                  <Star className="size-3 fill-gold text-gold" />
                </span>
                <Progress value={percent} className="flex-1" />
                <span className="tnum w-8 text-end text-[0.65rem] text-mute">
                  {toPersianDigits(row.count)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {showForm ? (
        <form
          onSubmit={submit}
          className="flex flex-col gap-5 rounded-2xl border border-gold/25 bg-surface/50 p-6"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-ivory">نظر شما درباره این قطعه</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} ستاره`}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "size-5 transition-colors duration-200",
                      value <= rating ? "fill-gold text-gold" : "text-line",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <Field label="عنوان نظر" required>
            <Input name="title" placeholder="خلاصه‌ای از تجربه‌تان" required />
          </Field>

          <Field label="متن نظر" required hint="حداقل ۲۰ کاراکتر">
            <Textarea name="body" placeholder="از کیفیت پارچه، دوخت و سایزبندی بنویسید…" required />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="gold" size="md" loading={submitting}>
              ثبت نظر
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setShowForm(false)}>
              انصراف
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex flex-col">
        {reviews.slice(0, visible).map((review, index) => (
          <React.Fragment key={review.id}>
            {index > 0 ? <Separator /> : null}
            <article className="flex flex-col gap-4 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={review.author} accent="#c8a24c" className="size-10" />
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-2 text-xs text-ivory">
                      {review.author}
                      {review.verified ? (
                        <Badge tone="success" className="gap-1">
                          <CheckCircle2 className="size-3" />
                          خرید تأییدشده
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-[0.65rem] text-mute">
                      {formatRelative(review.createdAt)}
                    </span>
                  </div>
                </div>

                <RatingStars rating={review.rating} showValue={false} />
              </div>

              <div className="flex flex-col gap-2 ps-13">
                <h4 className="text-xs font-medium text-ivory">{review.title}</h4>
                <p className="text-xs leading-7 text-smoke">{review.body}</p>

                <button
                  type="button"
                  onClick={() => markHelpful(review.id)}
                  className={cn(
                    "mt-1 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[0.65rem] transition-colors duration-300",
                    helpful[review.id]
                      ? "border-gold/40 text-gold-soft"
                      : "border-line text-mute hover:border-ivory/25 hover:text-ivory",
                  )}
                >
                  <ThumbsUp className="size-3" />
                  مفید بود
                  <span className="tnum">
                    ({toPersianDigits(review.helpful + (helpful[review.id] ? 1 : 0))})
                  </span>
                </button>
              </div>
            </article>
          </React.Fragment>
        ))}
      </div>

      {visible < reviews.length ? (
        <Button
          type="button"
          variant="subtle"
          size="md"
          className="mx-auto"
          onClick={() => setVisible((value) => value + 4)}
        >
          نمایش نظرات بیشتر
        </Button>
      ) : null}
    </section>
  );
}
