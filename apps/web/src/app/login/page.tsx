"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";

const nextActions = [
  "Acompanhar indicadores do dashboard",
  "Cadastrar clientes e manter a base ativa",
  "Organizar catálogo para montagem de orçamentos",
  "Publicar compartilhamentos a partir de versões congeladas"
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const {
    isAuthenticated,
    isBootstrapping,
    isSubmitting,
    error,
    login
  } = useAuthContext();

  useEffect(() => {
    if (!isBootstrapping && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isBootstrapping, router]);

  /**
   * Efetua o login e redireciona para a área autenticada quando a sessão for válida.
   */
  async function handleLoginSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    try {
      await login(email.trim(), password);
      setPassword("");
      router.replace("/dashboard");
    } catch {
      // O estado de erro já é controlado pelo provider.
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-8 md:py-12">
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(125,211,252,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 rounded-[2rem] border border-[var(--surface-border)] bg-[var(--surface)] p-6 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur xl:grid-cols-[1.15fr_0.85fr] md:p-8">
        <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
          <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-sky-200">
            Acesso autenticado
          </span>
          <h1 className="mt-5 text-4xl leading-tight tracking-tight text-white md:text-5xl">
            Entre no Intelligent Quote Platform
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] md:text-base">
            Use sua conta para abrir o dashboard, operar clientes e avançar
            para os próximos módulos do fluxo comercial.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleLoginSubmit}>
            <label className="grid gap-2 text-sm text-slate-200">
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@bootstrap.local"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                autoComplete="email"
                required
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-200">
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha de acesso"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/40"
                autoComplete="current-password"
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || isBootstrapping}
              className="inline-flex w-fit rounded-full border border-sky-300/20 bg-sky-400/10 px-5 py-3 font-medium text-sky-100 transition hover:bg-sky-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>
        </article>

        <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/40 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
            Escopo atual do MVP
          </p>
          <ul className="mt-5 space-y-3">
            {nextActions.map((action) => (
              <li
                key={action}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-100"
              >
                {action}
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
