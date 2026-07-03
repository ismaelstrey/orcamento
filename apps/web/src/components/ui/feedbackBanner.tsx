import type { ReactNode } from "react";
import { classNames } from "@/lib/utils/classNames";

type FeedbackVariant = "info" | "success" | "error" | "warning";

interface FeedbackBannerProps {
  title?: string;
  description: string;
  variant?: FeedbackVariant;
  action?: ReactNode;
  className?: string;
}

const variantClasses: Record<FeedbackVariant, string> = {
  info: "border-[color:rgba(56,189,248,0.24)] bg-[color:rgba(14,165,233,0.12)]",
  success:
    "border-[color:rgba(52,211,153,0.24)] bg-[color:rgba(16,185,129,0.12)]",
  error: "border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.12)]",
  warning:
    "border-[color:rgba(250,204,21,0.24)] bg-[color:rgba(234,179,8,0.12)]"
};

/**
 * Exibe mensagens de feedback com contraste previsível para sucesso, erro e avisos.
 */
export function FeedbackBanner({
  action,
  className,
  description,
  title,
  variant = "info"
}: FeedbackBannerProps) {
  return (
    <section
      className={classNames(
        "rounded-[1.5rem] border p-4 text-sm shadow-[var(--shadow-soft)]",
        variantClasses[variant],
        className
      )}
    >
      {title ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--foreground-strong)]/80">
          {title}
        </p>
      ) : null}
      <p className={classNames("leading-7 text-[var(--foreground)]", title && "mt-2")}>
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
