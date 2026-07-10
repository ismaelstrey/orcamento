import {
  buildRoadmapSystemSummary,
  type RoadmapStatus,
  type RoadmapTone
} from "@/lib/config/roadmap";
import { DatabaseHealthCard } from "@/components/config/databaseHealthCard";
import {
  buildReleaseReadinessSummary,
  type ReleaseReadinessBlockerSeverity,
  type ReleaseReadinessSignalStatus,
  type ReleaseReadinessTone
} from "@/lib/config/releaseReadiness";
import {
  buildDeliveryPlanSummary,
  type DeliverySliceEffort,
  type DeliverySliceImpact,
  type DeliverySlicePriority,
  type DeliverySliceStatus
} from "@/lib/config/deliveryPlan";
import {
  buildEnvironmentDiagnosticSummary,
  type EnvironmentDiagnosticStatus
} from "@/lib/config/environmentDiagnostics";
import {
  buildPhase1CompletionSummary,
  type Phase1CriterionStatus
} from "@/lib/config/phase1Completion";
import type {
  ReleaseGateLayer,
  ReleaseGateStatus,
  ReleaseGateTone
} from "@/lib/config/releaseGates";
import type {
  SmokePlanPriority,
  SmokePlanStatus
} from "@/lib/config/smokePlan";
import { classNames } from "@/lib/utils/classNames";

function getToneClassName(tone: RoadmapTone): string {
  if (tone === "success") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "warning") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  if (tone === "danger") {
    return "border-rose-300/20 bg-rose-500/10 text-rose-100";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

function getStatusLabel(status: RoadmapStatus): string {
  if (status === "done") {
    return "Concluido";
  }

  if (status === "in_progress") {
    return "Em andamento";
  }

  if (status === "blocked") {
    return "Bloqueado";
  }

  return "Planejado";
}

function getStatusClassName(status: RoadmapStatus): string {
  if (status === "done") {
    return "border-emerald-300/20 text-emerald-200";
  }

  if (status === "in_progress") {
    return "border-sky-300/20 text-sky-200";
  }

  if (status === "blocked") {
    return "border-rose-300/20 text-rose-200";
  }

  return "border-white/10 text-slate-400";
}

function getReleaseGateToneClassName(tone: ReleaseGateTone): string {
  if (tone === "success") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "warning") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/20 bg-rose-500/10 text-rose-100";
}

function getReleaseGateStatusLabel(status: ReleaseGateStatus): string {
  if (status === "covered") {
    return "Coberto";
  }

  if (status === "partial") {
    return "Parcial";
  }

  return "Pendente";
}

function getReleaseGateStatusClassName(status: ReleaseGateStatus): string {
  if (status === "covered") {
    return "border-emerald-300/20 text-emerald-200";
  }

  if (status === "partial") {
    return "border-amber-300/20 text-amber-200";
  }

  return "border-rose-300/20 text-rose-200";
}

function getLayerLabel(layer: ReleaseGateLayer): string {
  if (layer === "unit") {
    return "Unit";
  }

  if (layer === "contract") {
    return "Contrato";
  }

  if (layer === "service") {
    return "Servico";
  }

  if (layer === "ui") {
    return "UI";
  }

  return "E2E";
}

function getSmokeStatusLabel(status: SmokePlanStatus): string {
  if (status === "ready") {
    return "Pronto";
  }

  if (status === "needs_data") {
    return "Precisa fixture";
  }

  return "Precisa ferramenta";
}

function getSmokeStatusClassName(status: SmokePlanStatus): string {
  if (status === "ready") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "needs_data") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-sky-300/20 bg-sky-400/10 text-sky-100";
}

function getSmokePriorityLabel(priority: SmokePlanPriority): string {
  return priority.toUpperCase();
}

function getReadinessToneClassName(tone: ReleaseReadinessTone): string {
  if (tone === "success") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (tone === "warning") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/20 bg-rose-500/10 text-rose-100";
}

function getEnvironmentStatusLabel(status: EnvironmentDiagnosticStatus): string {
  if (status === "ok") {
    return "Ok";
  }

  if (status === "warning") {
    return "Atencao";
  }

  return "Erro";
}

function getEnvironmentStatusClassName(
  status: EnvironmentDiagnosticStatus
): string {
  if (status === "ok") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "warning") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-rose-300/20 bg-rose-500/10 text-rose-100";
}

function getSignalStatusLabel(status: ReleaseReadinessSignalStatus): string {
  if (status === "healthy") {
    return "Saudavel";
  }

  if (status === "attention") {
    return "Atencao";
  }

  return "Bloqueado";
}

function getSignalStatusClassName(status: ReleaseReadinessSignalStatus): string {
  if (status === "healthy") {
    return "border-emerald-300/20 text-emerald-200";
  }

  if (status === "attention") {
    return "border-amber-300/20 text-amber-200";
  }

  return "border-rose-300/20 text-rose-200";
}

function getBlockerSeverityLabel(
  severity: ReleaseReadinessBlockerSeverity
): string {
  if (severity === "critical") {
    return "Critico";
  }

  if (severity === "high") {
    return "Alto";
  }

  return "Medio";
}

function getBlockerSeverityClassName(
  severity: ReleaseReadinessBlockerSeverity
): string {
  if (severity === "critical") {
    return "border-rose-300/20 bg-rose-500/10 text-rose-100";
  }

  if (severity === "high") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

function getDeliveryPriorityLabel(priority: DeliverySlicePriority): string {
  return priority.toUpperCase();
}

function getDeliveryEffortLabel(effort: DeliverySliceEffort): string {
  if (effort === "s") {
    return "Curto";
  }

  if (effort === "m") {
    return "Medio";
  }

  return "Longo";
}

function getDeliveryImpactLabel(impact: DeliverySliceImpact): string {
  if (impact === "high") {
    return "Alto impacto";
  }

  if (impact === "medium") {
    return "Impacto medio";
  }

  return "Baixo impacto";
}

function getDeliveryStatusLabel(status: DeliverySliceStatus): string {
  if (status === "done") {
    return "Entregue";
  }

  if (status === "next") {
    return "Proximo";
  }

  return "Fila";
}

function getDeliveryStatusClassName(status: DeliverySliceStatus): string {
  if (status === "done") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  if (status === "next") {
    return "border-sky-300/20 bg-sky-400/10 text-sky-100";
  }

  return "border-white/10 bg-white/5 text-slate-300";
}

function getPhase1CriterionStatusClassName(
  status: Phase1CriterionStatus
): string {
  if (status === "done") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }

  return "border-amber-300/20 bg-amber-400/10 text-amber-100";
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-sky-300 transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function ConfigPage() {
  const roadmap = buildRoadmapSystemSummary();
  const phase1Completion = buildPhase1CompletionSummary(roadmap);
  const deliveryPlan = buildDeliveryPlanSummary(roadmap);
  const readiness = buildReleaseReadinessSummary({ roadmap, deliveryPlan });
  const environmentDiagnostics = buildEnvironmentDiagnosticSummary({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  });

  return (
    <div className="grid gap-6">
      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Configuracoes
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white">
              Roadmap e saude do projeto
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              {roadmap.headline}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-100/80">
                Projeto completo
              </p>
              <p className="mt-3 text-5xl font-semibold text-white">
                {roadmap.overallProgress}%
              </p>
              <div className="mt-4">
                <ProgressBar value={roadmap.overallProgress} />
              </div>
              <p className="mt-3 text-sm leading-6 text-sky-50/80">
                Inclui MVP, IA, pricing, automacao e escala comercial.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-100/80">
                MVP operacional
              </p>
              <p className="mt-3 text-5xl font-semibold text-white">
                {roadmap.mvpProgress}%
              </p>
              <div className="mt-4">
                <ProgressBar value={roadmap.mvpProgress} />
              </div>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">
                Mede planejamento, MVP e qualidade de uso imediata.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Capacidades
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {roadmap.completedCapabilities}/{roadmap.totalCapabilities}
            </p>
            <p className="mt-1 text-sm text-slate-400">Concluidas no roadmap.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Fases
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {roadmap.phaseSummaries.length}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Da fundacao ate escala comercial.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              Fonte
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              Roadmap versionado
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Dados em lib/config/roadmap.ts.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-emerald-300/20 bg-emerald-400/10 p-6">
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-emerald-100/80">
              Fase 1
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {phase1Completion.phaseLabel}
            </h2>
            <p className="mt-3 text-sm leading-7 text-emerald-50/85">
              {phase1Completion.headline}
            </p>

            <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-slate-950/30 p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-100/80">
                    Conclusao operacional
                  </p>
                  <p className="mt-2 text-5xl font-semibold text-white">
                    {phase1Completion.progress}%
                  </p>
                </div>
                <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-emerald-100">
                  {phase1Completion.isComplete ? "Concluida" : "Atencao"}
                </span>
              </div>
              <div className="mt-4">
                <ProgressBar value={phase1Completion.progress} />
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {phase1Completion.criteria.map((criterion) => (
                <article
                  key={criterion.id}
                  className={classNames(
                    "rounded-2xl border p-4",
                    getPhase1CriterionStatusClassName(criterion.status)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">
                      {criterion.label}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-slate-950/35 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white">
                      {criterion.status === "done" ? "Ok" : "Revisar"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 opacity-85">
                    {criterion.evidence}
                  </p>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-emerald-100/80">
                Proximo foco fora da Fase 1
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {phase1Completion.nextQualityFocus.map((focus) => (
                  <p
                    key={focus}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs leading-5 text-emerald-50"
                  >
                    {focus}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Release readiness
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Prontidao para proxima entrega
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {readiness.headline}
            </p>

            <div
              className={classNames(
                "mt-5 rounded-2xl border p-5",
                getReadinessToneClassName(readiness.tone)
              )}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-75">
                    Score de release
                  </p>
                  <p className="mt-2 text-5xl font-semibold text-white">
                    {readiness.score}%
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-white">
                  {readiness.canShipMvp ? "Apto" : "Segurar"}
                </span>
              </div>
              <div className="mt-4">
                <ProgressBar value={readiness.score} />
              </div>
              <p className="mt-4 text-sm leading-6 opacity-85">
                Marco recomendado: {readiness.nextMilestone}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                Ordem sugerida
              </p>
              <div className="mt-3 grid gap-2">
                {readiness.recommendedExecutionOrder.map((slice, index) => (
                  <div
                    key={slice.id}
                    className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-white">
                      {String(index + 1).padStart(2, "0")} | {slice.title}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                      {slice.area} | {getDeliveryPriorityLabel(slice.priority)} | +
                      {slice.progressLift}%
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {readiness.signals.map((signal) => (
                <article
                  key={signal.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-200/70">
                        Sinal de saude
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {signal.label}
                      </h3>
                    </div>
                    <span
                      className={classNames(
                        "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                        getSignalStatusClassName(signal.status)
                      )}
                    >
                      {getSignalStatusLabel(signal.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <ProgressBar value={signal.score} />
                    </div>
                    <span className="font-mono text-sm text-white">
                      {signal.score}%
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-300">
                    {signal.evidence}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/80">
                    Proximo: {signal.nextStep}
                  </p>
                </article>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                  Bloqueios
                </p>
                <div className="mt-3 grid gap-2">
                  {readiness.blockers.map((blocker) => (
                    <div
                      key={blocker.id}
                      className={classNames(
                        "rounded-xl border p-3",
                        getBlockerSeverityClassName(blocker.severity)
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-white">
                          {blocker.label}
                        </p>
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-80">
                          {getBlockerSeverityLabel(blocker.severity)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 opacity-85">
                        {blocker.impact}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/80">
                        Resolver: {blocker.resolution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                  Checklist de release
                </p>
                <div className="mt-3 grid gap-2">
                  {readiness.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-white">
                          {item.label}
                        </p>
                        <span
                          className={classNames(
                            "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                            item.done
                              ? "border-emerald-300/20 text-emerald-200"
                              : "border-amber-300/20 text-amber-200"
                          )}
                        >
                          {item.done ? "Ok" : "Aberto"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {item.ownerArea} | {item.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Ambiente
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Diagnostico de banco
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {environmentDiagnostics.headline}
            </p>

            <div
              className={classNames(
                "mt-5 rounded-2xl border p-5",
                getEnvironmentStatusClassName(environmentDiagnostics.status)
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-75">
                    Status geral
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {getEnvironmentStatusLabel(environmentDiagnostics.status)}
                  </p>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-950/35 px-3 py-1 font-mono text-xs uppercase tracking-[0.16em] text-white">
                  Sem segredos
                </span>
              </div>
              <div className="mt-4 grid gap-2">
                {environmentDiagnostics.nextActions.map((action) => (
                  <p
                    key={action}
                    className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs leading-5"
                  >
                    {action}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <DatabaseHealthCard />

            <div className="grid gap-3 lg:grid-cols-2">
              {environmentDiagnostics.databaseUrls.map((diagnostic) => (
                <article
                  key={diagnostic.name}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-200/70">
                        {diagnostic.name}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {diagnostic.host || "Nao configurado"}
                      </h3>
                    </div>
                    <span
                      className={classNames(
                        "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                        getEnvironmentStatusClassName(diagnostic.status)
                      )}
                    >
                      {getEnvironmentStatusLabel(diagnostic.status)}
                    </span>
                  </div>

                  <dl className="mt-4 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <dt className="uppercase tracking-[0.16em] text-slate-500">
                        Banco
                      </dt>
                      <dd className="mt-1 text-white">
                        {diagnostic.database || "-"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <dt className="uppercase tracking-[0.16em] text-slate-500">
                        SSL
                      </dt>
                      <dd className="mt-1 text-white">
                        {diagnostic.sslMode || "-"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <dt className="uppercase tracking-[0.16em] text-slate-500">
                        Limite
                      </dt>
                      <dd className="mt-1 text-white">
                        {diagnostic.connectionLimit || "-"}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/35 p-3">
                      <dt className="uppercase tracking-[0.16em] text-slate-500">
                        Timeouts
                      </dt>
                      <dd className="mt-1 text-white">
                        {diagnostic.poolTimeout || "-"} /{" "}
                        {diagnostic.connectTimeout || "-"}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                    <p className="break-all font-mono text-[11px] leading-5 text-slate-400">
                      {diagnostic.safeUrl || "Variavel ausente"}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-2">
                    {diagnostic.findings.map((finding) => (
                      <p
                        key={finding}
                        className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs leading-5 text-slate-300"
                      >
                        {finding}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {environmentDiagnostics.checks.map((check) => (
                <article
                  key={check.id}
                  className={classNames(
                    "rounded-2xl border p-4",
                    getEnvironmentStatusClassName(check.status)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">
                      {check.label}
                    </h3>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] opacity-80">
                      {getEnvironmentStatusLabel(check.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 opacity-85">
                    {check.detail}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Plano de entrega
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Slices da proxima etapa
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {deliveryPlan.recommendation}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4 text-sky-50">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-sky-100/80">
                  Ciclo atual
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {deliveryPlan.cycleLabel}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-emerald-50">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-100/80">
                  Entregues agora
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {deliveryPlan.completedThisCycle.length}
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-50/80">
                  +{deliveryPlan.completedProgressLift}% ja refletido no ciclo.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-amber-50">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-100/80">
                  Ganho estimado
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  +{deliveryPlan.expectedProgressLift}%
                </p>
                <p className="mt-1 text-xs leading-5 text-amber-50/80">
                  Projeta MVP em {deliveryPlan.projectedMvpProgress}%.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-sky-300/20 bg-slate-950/35 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-sky-200/80">
                    Projecao apos proximo lote
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    MVP {roadmap.mvpProgress}% {"->"}{" "}
                    {deliveryPlan.projectedMvpProgress}%
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Produto completo {roadmap.overallProgress}% {"->"}{" "}
                    {deliveryPlan.projectedOverallProgress}% se os slices imediatos
                    forem concluidos.
                  </p>
                </div>
                <div className="min-w-[180px]">
                  <ProgressBar value={deliveryPlan.projectedMvpProgress} />
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {deliveryPlan.runwayBatches.map((batch) => (
                <article
                  key={batch.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                        {batch.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {batch.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-1 font-mono text-xs text-sky-100">
                      +{batch.expectedProgressLift}%
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {batch.slices.map((slice) => (
                      <div
                        key={`${batch.label}-${slice.id}`}
                        className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-white">
                          {slice.title}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {slice.area} | {getDeliveryPriorityLabel(slice.priority)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {deliveryPlan.completedThisCycle.map((slice) => (
                <article
                  key={slice.id}
                  className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/75">
                        {slice.area}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {slice.title}
                      </h3>
                    </div>
                    <span
                      className={classNames(
                        "inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                        getDeliveryStatusClassName(slice.status)
                      )}
                    >
                      {getDeliveryStatusLabel(slice.status)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                      {getDeliveryPriorityLabel(slice.priority)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                      {getDeliveryEffortLabel(slice.effort)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-200">
                      {getDeliveryImpactLabel(slice.impact)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-3">
              {deliveryPlan.nextSlices.map((slice) => (
                <article
                  key={slice.id}
                  className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sky-100/75">
                        {slice.area} | +{slice.progressLift}% estimado
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-white">
                        {slice.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={classNames(
                          "inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                          getDeliveryStatusClassName(slice.status)
                        )}
                      >
                        {getDeliveryStatusLabel(slice.status)}
                      </span>
                      <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-200">
                        {getDeliveryPriorityLabel(slice.priority)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {slice.acceptanceCriteria.map((criterion) => (
                      <p
                        key={criterion}
                        className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-xs leading-5 text-slate-200"
                      >
                        {criterion}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-slate-400">
                Fila apos P0
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {deliveryPlan.queuedSlices.map((slice) => (
                  <div
                    key={slice.id}
                    className="rounded-xl border border-white/10 bg-slate-950/35 p-3"
                  >
                    <p className="text-sm font-medium text-white">{slice.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {slice.area} | {getDeliveryEffortLabel(slice.effort)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
            Analise do sistema
          </p>
          <div className="mt-4 grid gap-3">
            {roadmap.analysis.map((item) => (
              <p
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-slate-300"
              >
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-amber-200/80">
            Riscos abertos
          </p>
          <div className="mt-4 grid gap-3">
            {roadmap.risks.map((risk) => (
              <p
                key={risk}
                className="rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-7 text-amber-50"
              >
                {risk}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Gates do MVP
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Qualidade dos fluxos criticos
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {roadmap.releaseGates.headline}
            </p>

            <div
              className={classNames(
                "mt-5 rounded-2xl border p-5",
                getReleaseGateToneClassName(roadmap.releaseGates.tone)
              )}
            >
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-75">
                    Cobertura inicial
                  </p>
                  <p className="mt-2 text-5xl font-semibold text-white">
                    {roadmap.releaseGates.progress}%
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{roadmap.releaseGates.coveredScenarios} coberto(s)</p>
                  <p>{roadmap.releaseGates.partialScenarios} parcial(is)</p>
                  <p>{roadmap.releaseGates.missingScenarios} pendente(s)</p>
                </div>
              </div>
              <div className="mt-4">
                <ProgressBar value={roadmap.releaseGates.progress} />
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {roadmap.releaseGates.nextActions.map((action) => (
                <p
                  key={action}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-6 text-slate-300"
                >
                  {action}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {roadmap.releaseGates.groups.map((group) => (
              <article
                key={group.id}
                className={classNames(
                  "rounded-2xl border p-4",
                  getReleaseGateToneClassName(group.tone)
                )}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {group.label}
                    </h3>
                    <p className="mt-1 text-sm leading-6 opacity-85">
                      {group.description}
                    </p>
                  </div>
                  <span className="font-mono text-2xl font-semibold text-white">
                    {group.progress}%
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={group.progress} />
                </div>

                <div className="mt-4 grid gap-3">
                  {group.scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="rounded-xl border border-white/10 bg-slate-950/35 p-3"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {scenario.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 opacity-85">
                            {scenario.evidence}
                          </p>
                        </div>
                        <span
                          className={classNames(
                            "inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                            getReleaseGateStatusClassName(scenario.status)
                          )}
                        >
                          {getReleaseGateStatusLabel(scenario.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {scenario.layers.map((layer) => (
                          <span
                            key={layer}
                            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300"
                          >
                            {getLayerLabel(layer)}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-xs leading-5 text-amber-100">
                        Gap: {scenario.gap}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/80">
                        Proximo: {scenario.nextStep}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Smoke plan
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Roteiro dos fluxos criticos
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {roadmap.smokePlan.headline}
            </p>

            <div className="mt-5 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-5 text-sky-50">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-sky-100/80">
                Prontidao para automacao
              </p>
              <p className="mt-2 text-5xl font-semibold text-white">
                {roadmap.smokePlan.readiness}%
              </p>
              <div className="mt-4">
                <ProgressBar value={roadmap.smokePlan.readiness} />
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <p>{roadmap.smokePlan.readyFlows} fluxo(s) pronto(s)</p>
                <p>{roadmap.smokePlan.needsDataFlows} precisam fixture/dados</p>
                <p>
                  {roadmap.smokePlan.needsToolingFlows} precisam ferramenta E2E
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {roadmap.smokePlan.flows.map((flow) => (
              <article
                key={flow.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-sky-200/70">
                      {getSmokePriorityLabel(flow.priority)} · {flow.route}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {flow.label}
                    </h3>
                  </div>
                  <span
                    className={classNames(
                      "inline-flex w-fit rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                      getSmokeStatusClassName(flow.status)
                    )}
                  >
                    {getSmokeStatusLabel(flow.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {flow.objective}
                </p>
                <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/35 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    Alvo de automacao
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    {flow.automationTarget}
                  </p>
                </div>
                <div className="mt-3 grid gap-2">
                  {flow.steps.map((step) => (
                    <div
                      key={`${flow.id}-${step.label}`}
                      className="rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2"
                    >
                      <p className="text-xs font-medium text-white">{step.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Esperado: {step.expected}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-200/80">
              Roadmap
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Fases e progresso
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-400">
            O percentual geral e ponderado: fases futuras entram com peso menor que
            o MVP, mas continuam puxando o produto completo para baixo.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {roadmap.phaseSummaries.map((phase) => (
            <article
              key={phase.id}
              className={classNames(
                "rounded-2xl border p-5",
                getToneClassName(phase.tone)
              )}
            >
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.2em] opacity-75">
                        Peso {phase.weight}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">
                        {phase.label}
                      </h3>
                    </div>
                    <span className="font-mono text-3xl font-semibold text-white">
                      {phase.progress}%
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 opacity-85">
                    {phase.description}
                  </p>
                  <div className="mt-4">
                    <ProgressBar value={phase.progress} />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] opacity-70">
                    {phase.completedCapabilities}/{phase.totalCapabilities} capacidades
                    concluidas
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {phase.capabilities.map((capability) => (
                    <div
                      key={capability.id}
                      className="rounded-xl border border-white/10 bg-slate-950/35 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-white">{capability.label}</p>
                        <span
                          className={classNames(
                            "shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em]",
                            getStatusClassName(capability.status)
                          )}
                        >
                          {getStatusLabel(capability.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <ProgressBar value={capability.progress} />
                        </div>
                        <span className="font-mono text-sm text-white">
                          {capability.progress}%
                        </span>
                      </div>
                      <p className="mt-3 text-xs leading-5 opacity-85">
                        {capability.evidence}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/80">
                        Proximo: {capability.nextStep}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-sky-300/15 bg-sky-400/10 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-100/80">
          Proximos slices recomendados
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {roadmap.nextRecommendedSlices.map((slice, index) => (
            <p
              key={slice}
              className="rounded-2xl border border-sky-300/15 bg-slate-950/35 px-4 py-3 text-sm leading-7 text-sky-50"
            >
              <span className="mr-2 font-mono text-xs uppercase tracking-[0.18em] text-sky-200/70">
                {String(index + 1).padStart(2, "0")}
              </span>
              {slice}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}
