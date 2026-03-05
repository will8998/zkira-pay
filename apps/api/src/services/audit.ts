import { db } from '../db/index.js';
import { auditLog } from '../db/schema.js';

interface AuditEntry {
  actor: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values(entry);
  } catch (error) {
    // Never let audit logging break the main flow
    console.error('Failed to write audit log:', error);
  }
}