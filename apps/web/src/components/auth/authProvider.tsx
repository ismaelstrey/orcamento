"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren
} from "react";
import { useAuth } from "@/hooks/useAuth";

type AuthContextValue = ReturnType<typeof useAuth>;

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Compartilha a sessão autenticada entre as rotas do frontend.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Expõe a sessão atual e as ações de login/logout para qualquer tela cliente.
 */
export function useAuthContext(): AuthContextValue {
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider.");
  }

  return authContext;
}
