"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { ThemeToggle } from "@/components/theme/themeToggle";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { classNames } from "@/lib/utils/classNames";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumo operacional do tenant.",
    shortLabel: "DB"
  },
  {
    href: "/customers",
    label: "Clientes",
    description: "Base de relacionamento comercial.",
    shortLabel: "CL"
  },
  {
    href: "/catalog",
    label: "Catalogo",
    description: "Categorias, marcas e produtos do tenant.",
    shortLabel: "CT"
  },
  {
    href: "/quotes",
    label: "Orcamentos",
    description: "Criacao, historico e distribuicao comercial.",
    shortLabel: "OR"
  }
];

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * Garante a sessão autenticada e fornece a navegação base da área privada.
 */
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
      <main className="app-grid flex min-h-screen items-center justify-center px-4 py-6 text-[var(--foreground)] md:px-6">
        <Surface
          as="section"
          variant="hero"
          className="relative z-10 w-full max-w-xl p-8 text-center md:p-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-strong)]/80">
            Intelligent Quote Platform
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground-strong)] md:text-4xl">
            Preparando sua área autenticada
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)] md:text-base">
            Validando a sessão do navegador e sincronizando o contexto do tenant.
          </p>
        </Surface>
      </main>
    );
  }

  /**
   * Encerra a sessão atual e devolve o usuário para a página de login.
   */
  async function handleLogout(): Promise<void> {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="app-grid min-h-screen px-3 py-3 md:px-4 md:py-4 xl:px-5 xl:py-5">
      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-1.5rem)] w-full max-w-[1800px] gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="grid gap-4 xl:sticky xl:top-3 xl:h-[calc(100vh-2.5rem)] xl:grid-rows-[auto_minmax(0,1fr)_auto]">
          <Surface as="section" variant="hero" className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--accent-strong)]/80">
                  Tenant ativo
                </p>
                <h1 className="mt-3 line-clamp-2 text-2xl font-semibold leading-tight text-[var(--foreground-strong)]">
                  {tenant.name}
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Slug: {tenant.slug}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </Surface>

          <Surface
            as="nav"
            variant="default"
            className="content-scroll grid gap-3 overflow-y-auto p-3 md:p-4"
          >
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    "grid gap-2 rounded-[1.4rem] border px-4 py-4 transition duration-200",
                    isActive
                      ? "border-[var(--border-strong)] bg-[linear-gradient(135deg,rgba(56,189,248,0.2),rgba(99,102,241,0.14))] shadow-[var(--shadow-soft)]"
                      : "border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={classNames(
                        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border text-[11px] font-mono uppercase tracking-[0.24em]",
                        isActive
                          ? "border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[var(--accent-strong)]"
                          : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                      )}
                    >
                      {item.shortLabel}
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-medium text-[var(--foreground-strong)]">
                        {item.label}
                      </p>
                      <p className="text-sm leading-6 text-[var(--muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </Surface>

          <Surface as="section" variant="subtle" className="p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-strong)]/70">
              Sessão
            </p>
            <p className="mt-3 text-lg font-medium text-[var(--foreground-strong)]">
              {user.name}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{user.email}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
              Perfis: {roles.join(", ")}
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => void handleLogout()}
            >
              Sair
            </Button>
          </Surface>
        </aside>

        <Surface
          as="section"
          variant="elevated"
          className="min-h-[72vh] overflow-hidden p-0 xl:h-[calc(100vh-2.5rem)]"
        >
          <div className="content-scroll h-full overflow-y-auto px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            {children}
          </div>
        </Surface>
      </div>
    </main>
  );
}
