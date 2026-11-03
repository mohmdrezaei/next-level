"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Thin gold reading-progress bar pinned under the header. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-100 h-0.5 origin-right bg-[linear-gradient(90deg,var(--color-copper),var(--color-gold),var(--color-gold-soft))]"
    />
  );
}
