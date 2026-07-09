"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/theme/themeToggle";
import { useAuthContext } from "@/components/auth/authProvider";
import { classNames } from "@/lib/utils/classNames";

type NavIcon = "dashboard" | "customers" | "catalog" | "quotes" | "config";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumo operacional",
    icon: "dashboard"
  },
  {
    href: "/customers",
    label: "Clientes",
    description: "Base comercial",
    icon: "customers"
  },
  {
    href: "/catalog",
    label: "Catalogo",
    description: "Produtos e marcas",
    icon: "catalog"
  },
  {
    href: "/quotes",
    label: "Orcamentos",
    description: "Propostas e versoes",
    icon: "quotes"
  },
  {
    href: "/config",
    label: "Config",
    description: "Roadmap e saude",
    icon: "config"
  }
] satisfies Array<{
  href: string;
  label: string;
  description: string;
  icon: NavIcon;
}>;

interface AppShellProps {
  children: React.ReactNode;
}

function Icon({ name }: { name: NavIcon }) {
  const props = {
    "aria-hidden": true,
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24"
  };

  if (name === "dashboard") {
    return (
      <svg {...props}>
        <path d="M4 13.5a8 8 0 0 1 16 0" />
        <path d="M12 13l3.5-4.5" />
        <path d="M6.5 18h11" />
      </svg>
    );
  }

  if (name === "customers") {
    return (
      <svg {...props}>
        <path d="M16 19a4 4 0 0 0-8 0" />
        <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M18 11.5a2.5 2.5 0 0 0 0-5" />
      </svg>
    );
  }

  if (name === "catalog") {
    return (
      <svg {...props}>
        <path d="M5 7.5 12 4l7 3.5-7 3.5-7-3.5Z" />
        <path d="M5 12l7 3.5 7-3.5" />
        <path d="M5 16.5 12 20l7-3.5" />
      </svg>
    );
  }

  if (name === "config") {
    return (
      <svg {...props}>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 0 1-2.97 2.97l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.1 1.66V21a2.1 2.1 0 0 1-4.2 0v-.07a1.8 1.8 0 0 0-1.1-1.66 1.8 1.8 0 0 0-1.98.36l-.05.05a2.1 2.1 0 0 1-2.97-2.97l.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-1.66-1.1H2.9a2.1 2.1 0 0 1 0-4.2h.04A1.8 1.8 0 0 0 4.6 8a1.8 1.8 0 0 0-.36-1.98l-.05-.05A2.1 2.1 0 0 1 7.16 3l.05.05A1.8 1.8 0 0 0 9.2 3.4 1.8 1.8 0 0 0 10.3 1.8V1.7a2.1 2.1 0 0 1 4.2 0v.1a1.8 1.8 0 0 0 1.1 1.6 1.8 1.8 0 0 0 1.98-.36l.05-.05a2.1 2.1 0 0 1 2.97 2.97l-.05.05A1.8 1.8 0 0 0 19.4 8a1.8 1.8 0 0 0 1.66 1.7h.04a2.1 2.1 0 0 1 0 4.2h-.04A1.8 1.8 0 0 0 19.4 15Z" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2Z" />
      <path d="M9 9h6" />
      <path d="M9 13h4" />
    </svg>
  );
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    tenant,
    roles,
    isAuthenticated,
    isBootstrapping,
    logout
  } = useAuthContext();

  useEffect(() => {
    if (!isBootstrapping && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  if (isBootstrapping || !isAuthenticated || !user || !tenant) {
    return (
      <main className="app-grid flex min-h-screen items-center justify-center px-4 py-6 text-[var(--foreground)]">
        <section className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface-hero)] p-8 text-center shadow-[var(--shadow-soft)]">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-strong)]/80">
            IQP
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground-strong)]">
            Preparando area autenticada
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Validando sessao e contexto do tenant.
          </p>
        </section>
      </main>
    );
  }

  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="app-grid min-h-screen p-2 text-[var(--foreground)] md:p-3">
      <div className="relative z-10 grid min-h-[calc(100vh-1rem)] w-full gap-3 md:min-h-[calc(100vh-1.5rem)] md:grid-cols-[76px_minmax(0,1fr)]">
        <aside className="order-2 md:order-1 md:sticky md:top-3 md:h-[calc(100vh-1.5rem)]">
          <div className="flex h-full items-center justify-between gap-2 rounded-[1.5rem] border border-[var(--border)] bg-[rgba(8,15,29,0.82)] p-2 shadow-[0_18px_60px_rgba(2,6,23,0.28)] backdrop-blur-xl md:flex-col">
            <div className="flex items-center gap-2 md:flex-col">
              <Link
                href="/dashboard"
                title={tenant.name}
                className="group relative inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)] transition hover:border-[var(--accent-strong)] hover:bg-[var(--surface-secondary)]"
              >
                IQP
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden min-w-48 translate-x-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left opacity-0 shadow-[var(--shadow-soft)] transition group-hover:translate-x-0 group-hover:opacity-100 md:block">
                  <span className="block truncate text-sm font-semibold normal-case tracking-normal text-[var(--foreground-strong)]">
                    {tenant.name}
                  </span>
                  <span className="mt-1 block truncate text-xs font-normal normal-case tracking-normal text-[var(--muted)]">
                    {tenant.slug}
                  </span>
                </span>
              </Link>

              <nav className="flex items-center gap-2 md:flex-col md:py-2">
                {navigationItems.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      aria-label={item.label}
                      className={classNames(
                        "group relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition duration-200",
                        isActive
                          ? "border-[var(--border-strong)] bg-[rgba(56,189,248,0.14)] text-[var(--accent-strong)] shadow-[0_0_0_1px_rgba(56,189,248,0.08)]"
                          : "border-transparent bg-transparent text-[var(--muted)] hover:border-[var(--border)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground-strong)]"
                      )}
                    >
                      <Icon name={item.icon} />
                      <span
                        className={classNames(
                          "absolute right-1 top-1 h-1.5 w-1.5 rounded-full transition",
                          isActive ? "bg-[var(--accent-strong)]" : "bg-transparent"
                        )}
                      />
                      <span className="pointer-events-none absolute left-full z-50 ml-3 hidden min-w-44 translate-x-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left opacity-0 shadow-[var(--shadow-soft)] transition group-hover:translate-x-0 group-hover:opacity-100 md:block">
                        <span className="block text-sm font-semibold text-[var(--foreground-strong)]">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs text-[var(--muted)]">
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 md:flex-col">
              <ThemeToggle />
              <div className="h-px w-6 bg-[var(--border)] md:h-px md:w-8" />
              <div className="group relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[linear-gradient(135deg,rgba(56,189,248,0.16),rgba(255,255,255,0.04))] text-sm font-semibold text-[var(--foreground-strong)]">
                {user.name.slice(0, 1).toUpperCase()}
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden min-w-56 translate-x-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left opacity-0 shadow-[var(--shadow-soft)] transition group-hover:translate-x-0 group-hover:opacity-100 md:block">
                  <span className="block truncate text-sm font-semibold text-[var(--foreground-strong)]">
                    {user.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">
                    {user.email}
                  </span>
                  <span className="mt-2 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                    {roles.join(", ")}
                  </span>
                </span>
              </div>
              <button
                type="button"
                title="Sair"
                aria-label="Sair da conta"
                onClick={() => void handleLogout()}
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-transparent bg-transparent text-[var(--muted)] transition hover:border-[color:rgba(244,63,94,0.28)] hover:bg-[color:rgba(244,63,94,0.1)] hover:text-[color:rgb(255,205,213)]"
              >
                <svg
                  aria-hidden="true"
                  className="h-4.5 w-4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M10 6H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" />
                  <path d="M14 8l4 4-4 4" />
                  <path d="M18 12H9" />
                </svg>
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden translate-x-2 rounded-2xl border border-[color:rgba(244,63,94,0.24)] bg-[var(--surface-elevated)] px-3 py-2 text-xs font-medium text-[color:rgb(255,205,213)] opacity-0 shadow-[var(--shadow-soft)] transition group-hover:translate-x-0 group-hover:opacity-100 md:block">
                  Sair
                </span>
              </button>
            </div>
          </div>
        </aside>

        <section className="order-1 min-h-[72vh] overflow-hidden rounded-[1.75rem] border border-[var(--border-strong)] bg-[var(--surface-elevated)] shadow-[var(--shadow-strong)] md:order-2 md:h-[calc(100vh-1.5rem)]">
          <div className="content-scroll h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
