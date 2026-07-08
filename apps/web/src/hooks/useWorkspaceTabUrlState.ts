"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildWorkspaceTabHref,
  resolveWorkspaceTabValue
} from "@/lib/navigation/workspaceTabs";

interface UseWorkspaceTabUrlStateInput<TValue extends string> {
  defaultValue: TValue;
  paramName?: string;
  values: readonly TValue[];
}

export function useWorkspaceTabUrlState<TValue extends string>({
  defaultValue,
  paramName = "tab",
  values
}: UseWorkspaceTabUrlStateInput<TValue>): [TValue, (value: TValue) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const activeValue = resolveWorkspaceTabValue({
    defaultValue,
    paramName,
    searchParams: serializedSearchParams,
    values
  });

  const setActiveValue = useCallback(
    (nextValue: TValue): void => {
      router.replace(
        buildWorkspaceTabHref({
          defaultValue,
          paramName,
          pathname,
          searchParams: serializedSearchParams,
          value: nextValue,
          values
        }),
        { scroll: false }
      );
    },
    [defaultValue, paramName, pathname, router, serializedSearchParams, values]
  );

  return [activeValue, setActiveValue];
}
