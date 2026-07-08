import { z } from "zod";

export const auditEventResponseSchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  actorUserName: z.string().nullable(),
  actorUserEmail: z.string().nullable(),
  payloadSummary: z.array(z.string()).default([]),
  createdAt: z.string()
});

export const auditEventsResponseSchema = z.object({
  items: z.array(auditEventResponseSchema)
});

export type AuditEventResponse = z.infer<typeof auditEventResponseSchema>;
export type AuditEventsResponse = z.infer<typeof auditEventsResponseSchema>;
