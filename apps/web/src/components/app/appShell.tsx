"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthContext } from "@/components/auth/authProvider";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Resumo operacional do tenant."
  },
  {
    href: "/customers",
    label: "Clientes",
    description: "Base de relacionamento comercial."
  },
  {
    href: "/catalog",
    label: "Catalogo",
    description: "Categorias, marcas e produtos do tenant."
  },
  {
    href: "/quotes",
    label: "Orcamentos",
    description: "Criacao, historico e distribuicao comercial."
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
      <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-6 text-slate-200">
        <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-sky-200/70">
            Intelligent Quote Platform
          </p>
          <h1 className="mt-4 text-3xl text-white">Preparando sua área autenticada</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Validando a sessão do navegador e sincronizando o contexto do tenant.
          </p>
        </div>
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
    <main className="min-h-screen bg-[#07111f] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-white/10 bg-[rgba(6,12,24,0.85)] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur">
          <div className="rounded-[1.5rem] border border-sky-300/10 bg-sky-400/10 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-sky-200/80">
              Tenant ativo
            </p>
            <h1 className="mt-3 text-2xl text-white">{tenant.name}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Slug: {tenant.slug}
            </p>
          </div>

          <nav className="mt-6 grid gap-3">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-[1.5rem] border px-4 py-4 transition ${
                    isActive
                      ? "border-sky-300/30 bg-sky-400/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="text-base font-medium text-white">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-sky-200/70">
              Sessão
            </p>
            <p className="mt-3 text-lg font-medium text-white">{user.name}</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">{user.email}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">
              Perfis: {roles.join(", ")}
            </p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-5 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Sair
            </button>
          </div>
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-[rgba(9,16,29,0.82)] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur md:p-6">
          {children}
        </section>
      </div>
    </main>
  );
}
