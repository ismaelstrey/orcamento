"use client";

import { motion } from "framer-motion";
import { classNames } from "@/lib/utils/classNames";

interface StatCardProps {
  label: string;
  value: string;
  description: string;
  className?: string;
}

/**
 * Destaca métricas resumidas em cards compactos e escaláveis.
 */
export function StatCard({
  className,
  description,
  label,
  value
}: StatCardProps) {
  return (
    <motion.article
      className={classNames(
        "rounded-[1.6rem] border border-[var(--border)] bg-[var(--surface-secondary)] p-5 shadow-[var(--shadow-soft)]",
        className
      )}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground-strong)]">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
    </motion.article>
  );
}
