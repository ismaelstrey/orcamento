"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/components/auth/authProvider";
import { ThemeToggle } from "@/components/theme/themeToggle";
import { Button } from "@/components/ui/button";
import { FeedbackBanner } from "@/components/ui/feedbackBanner";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";

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
    <main className="app-grid relative min-h-screen overflow-hidden px-4 py-4 md:px-6 md:py-6">
      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1600px] gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <Surface as="section" variant="hero" className="flex flex-col justify-between p-6 md:p-8 xl:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3 py-1 font-mono text-xs uppercase tracking-[0.32em] text-[var(--accent-strong)]">
                Acesso autenticado
              </span>
              <h1 className="mt-5 max-w-4xl text-4xl leading-tight font-semibold tracking-tight text-[var(--foreground-strong)] md:text-5xl xl:text-6xl">
                Entre no Intelligent Quote Platform
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-8 text-[var(--muted)] md:text-base">
                Use sua conta para abrir o dashboard, operar clientes, montar o
                catálogo e publicar orçamentos com uma interface adaptada para
                qualquer tamanho de tela.
              </p>
            </div>

            <ThemeToggle />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {nextActions.map((action, index) => (
              <Surface
                key={action}
                as="article"
                variant="subtle"
                hoverable
                className="h-full p-5"
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent-strong)]/80">
                  Passo {index + 1}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
                  {action}
                </p>
              </Surface>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Surface as="article" variant="subtle" className="p-5">
              <p className="text-sm text-[var(--muted)]">Experiência visual</p>
              <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                Layout adaptativo
              </p>
            </Surface>
            <Surface as="article" variant="subtle" className="p-5">
              <p className="text-sm text-[var(--muted)]">Ambiente operacional</p>
              <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                Sessão com tenant
              </p>
            </Surface>
            <Surface as="article" variant="subtle" className="p-5">
              <p className="text-sm text-[var(--muted)]">Tema</p>
              <p className="mt-2 text-xl font-semibold text-[var(--foreground-strong)]">
                Claro e escuro
              </p>
            </Surface>
          </div>
        </Surface>

        <Surface as="section" variant="elevated" className="flex flex-col justify-center p-6 md:p-8">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--accent-strong)]/80">
              Sessão do navegador
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground-strong)]">
              Acesse o painel
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Informe suas credenciais para abrir a área autenticada e manter o
              contexto operacional do tenant.
            </p>
          </div>

          <form className="mt-8 grid gap-4" onSubmit={handleLoginSubmit}>
            <Field label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="owner@bootstrap.local"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Senha" htmlFor="login-password">
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha de acesso"
                autoComplete="current-password"
                required
              />
            </Field>

            {error ? (
              <FeedbackBanner description={error} title="Falha ao autenticar" variant="error" />
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting || isBootstrapping}
              size="lg"
              fullWidth
            >
              {isSubmitting ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>
        </Surface>
      </section>
    </main>
  );
}
