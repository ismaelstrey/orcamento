import { z } from "zod";
import { roleCodes, userStatuses } from "../types/auth";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128)
});

export const refreshRequestSchema = z.object({
  refreshToken: z.string().min(1)
});

export const logoutRequestSchema = z.object({
  sessionId: z.string().min(1)
});

export const sessionMetadataSchema = z.object({
  userAgent: z.string().max(500).optional(),
  ipAddress: z.string().max(100).optional()
});

export const loginInputSchema = loginRequestSchema.extend({
  metadata: sessionMetadataSchema.optional()
});

export const refreshInputSchema = refreshRequestSchema.extend({
  metadata: sessionMetadataSchema.optional()
});

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    status: z.enum(userStatuses)
  }),
  tenant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1)
  }),
  roles: z.array(z.enum(roleCodes)).min(1)
});

export const meResponseSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    status: z.enum(userStatuses)
  }),
  tenant: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1)
  }),
  roles: z.array(z.enum(roleCodes)).min(1)
});
