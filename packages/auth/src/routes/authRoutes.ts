export const authRoutes = [
  {
    method: "POST",
    path: "/api/v1/auth/login",
    authRequired: false
  },
  {
    method: "POST",
    path: "/api/v1/auth/refresh",
    authRequired: false
  },
  {
    method: "POST",
    path: "/api/v1/auth/logout",
    authRequired: true
  },
  {
    method: "GET",
    path: "/api/v1/auth/me",
    authRequired: true
  }
] as const;
