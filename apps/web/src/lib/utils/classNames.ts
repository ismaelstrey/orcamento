/**
 * Combina classes condicionais sem depender de bibliotecas externas.
 */
export function classNames(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}
