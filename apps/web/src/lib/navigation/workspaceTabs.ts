export interface WorkspaceTabUrlStateInput<TValue extends string> {
  defaultValue: TValue;
  paramName?: string;
  values: readonly TValue[];
}

export interface WorkspaceTabHrefInput<TValue extends string>
  extends WorkspaceTabUrlStateInput<TValue> {
  pathname: string;
  searchParams: string;
  value: TValue;
}

export function resolveWorkspaceTabValue<TValue extends string>({
  defaultValue,
  paramName = "tab",
  searchParams,
  values
}: WorkspaceTabUrlStateInput<TValue> & {
  searchParams: string;
}): TValue {
  const params = new URLSearchParams(searchParams);
  const rawValue = params.get(paramName);

  return values.includes(rawValue as TValue) ? (rawValue as TValue) : defaultValue;
}

export function buildWorkspaceTabHref<TValue extends string>({
  defaultValue,
  paramName = "tab",
  pathname,
  searchParams,
  value
}: WorkspaceTabHrefInput<TValue>): string {
  const nextParams = new URLSearchParams(searchParams);

  if (value === defaultValue) {
    nextParams.delete(paramName);
  } else {
    nextParams.set(paramName, value);
  }

  const nextQuery = nextParams.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}
