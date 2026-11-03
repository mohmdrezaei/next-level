import Link from "next/link";
import { Camera, Mail, MapPin, Phone, Send } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "./newsletter-form";
import { FOOTER_NAV, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { CATEGORIES } from "@/features/products/data/catalog";

const SOCIAL_ICONS = [Camera, Send, Mail];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-line bg-carbon/60">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-[linear-gradient(90deg,transparent,rgba(200,162,76,0.35),transparent)]" />

      <div className="container-page py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div className="flex flex-col gap-7">
            <Logo />

            <p className="max-w-sm text-xs leading-7 text-mute">{SITE.description}</p>

            <NewsletterForm />
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {FOOTER_NAV.map((group) => (
              <div key={group.title} className="flex flex-col gap-4">
                <h3 className="text-[0.7rem] tracking-[0.18em] text-ivory">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-xs text-mute transition-colors duration-300 hover:text-gold-soft"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-col gap-4">
              <h3 className="text-[0.7rem] tracking-[0.18em] text-ivory">دسته‌بندی‌ها</h3>
              <ul className="flex flex-col gap-3">
                {CATEGORIES.slice(0, 5).map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/shop?category=${category.slug}`}
                      className="text-xs text-mute transition-colors duration-300 hover:text-gold-soft"
                    >
                      {category.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-6 border-t border-line pt-8 md:grid-cols-3">
          <a
            href={`tel:${SITE.phoneRaw}`}
            className="group flex items-start gap-3 text-xs text-smoke transition-colors duration-300 hover:text-ivory"
          >
            <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
            <span className="flex flex-col gap-1">
              <span className="tnum">{SITE.phone}</span>
              <span className="text-[0.68rem] text-mute">{SITE.workingHours}</span>
            </span>
          </a>

          <a
            href={`mailto:${SITE.email}`}
            className="group flex items-start gap-3 text-xs text-smoke transition-colors duration-300 hover:text-ivory"
          >
            <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
            <span className="flex flex-col gap-1">
              <span dir="ltr">{SITE.email}</span>
              <span className="text-[0.68rem] text-mute">پاسخ‌گویی حداکثر ۴ ساعت کاری</span>
            </span>
          </a>

          <p className="flex items-start gap-3 text-xs text-smoke">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
            <span className="flex flex-col gap-1">
              <span>{SITE.address}</span>
            </span>
          </p>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-[0.68rem] text-mute">
            © {new Date().getFullYear()} تمام حقوق برای {SITE.latinName} محفوظ است.
          </p>

          <div className="flex items-center gap-5">
            {SOCIAL_LINKS.map((social, index) => {
              const Icon = SOCIAL_ICONS[index] ?? Mail;
              return (
                <a
                  key={social.title}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.title}
                  className="grid size-9 place-items-center rounded-full border border-line text-mute transition-colors duration-300 hover:border-gold/40 hover:text-gold-soft"
                >
                  <Icon className="size-3.5" />
                </a>
              );
            })}
          </div>

          <p className="text-[0.68rem] text-mute">
            طراحی و توسعه در بوتیک {SITE.name}
          </p>
        </div>
      </div>
    </footer>
  );
}
