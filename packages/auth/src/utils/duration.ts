const durationMap = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 60 * 60 * 24
} as const;

/**
 * Converte durações simples como 15m, 7d e 1h para segundos.
 */
export function durationToSeconds(value: string): number {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Formato de duração inválido: ${value}`);
  }

  const [, amountText, unit] = match;
  const amount = Number(amountText);

  return amount * durationMap[unit as keyof typeof durationMap];
}

/**
 * Retorna a data de expiração a partir de agora.
 */
export function createFutureDate(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}
