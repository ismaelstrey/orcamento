"use client";

import { useRef } from "react";
import { classNames } from "@/lib/utils/classNames";
import { Surface } from "./surface";

export interface WorkspaceTabOption<TValue extends string> {
  value: TValue;
  label: string;
  description: string;
  count?: number | string;
}

interface WorkspaceTabsProps<TValue extends string> {
  ariaLabel: string;
  activeValue: TValue;
  options: Array<WorkspaceTabOption<TValue>>;
  onChange: (value: TValue) => void;
  columnsClassName?: string;
}

export function WorkspaceTabs<TValue extends string>({
  activeValue,
  ariaLabel,
  columnsClassName = "md:grid-cols-2 xl:grid-cols-4",
  onChange,
  options
}: WorkspaceTabsProps<TValue>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number): void {
    const nextTab = tabRefs.current[index];

    if (!nextTab) {
      return;
    }

    nextTab.focus();
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ): void {
    if (!options.length) {
      return;
    }

    const lastIndex = options.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    }

    if (event.key === "Home") {
      nextIndex = 0;
    }

    if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    onChange(options[nextIndex]!.value);
    focusTab(nextIndex);
  }

  return (
    <Surface as="nav" variant="default" className="p-2">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={classNames("grid gap-2", columnsClassName)}
      >
        {options.map((option, index) => {
          const isActive = activeValue === option.value;

          return (
            <button
              key={option.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={classNames(
                "rounded-[1.35rem] border px-4 py-3 text-left transition",
                isActive
                  ? "border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(56,189,248,0.18),rgba(99,102,241,0.12))] text-[var(--foreground-strong)] shadow-[0_0_30px_rgba(56,189,248,0.12)]"
                  : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                {option.label}
                {option.count !== undefined ? (
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-2 py-0.5 font-mono text-[11px] text-[var(--accent)]">
                    {option.count}
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </Surface>
  );
}
