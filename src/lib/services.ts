'use client';
/**
 * DRISHTI-X service boundary (ported from Open Design `src/services/services.js`).
 *
 * UI → services → real API (via `src/platform/api.ts`), with typed DEMO
 * fallback from `src/data/operational.ts`. Never throws for UI flows.
 * Relations preserved: critical incident ⇒ critical alert; drone deploy ⇒
 * fleet status change; shelter % ⇒ alert text.
 */
import { get } from '@/platform/api';
import {
  DEMO_ALERTS,
  DEMO_DEPLOYMENTS,
  DEMO_DRONES,
  DEMO_INCIDENTS,
  DEMO_INTEL_BRIEF,
  DEMO_RESOURCE_SUMMARY,
  type DemoAlert,
  type DemoDrone,
} from '@/data/operational';

export const incidentService = {
  async list() {
    const r = await get<unknown[]>('/api/v1/incidents?limit=50').catch(() => ({
      data: null as unknown[] | null,
      status: 'OFFLINE' as const,
    }));
    if (r.data && Array.isArray(r.data) && r.data.length > 0) return r.data;
    return DEMO_INCIDENTS;
  },
  async acknowledge() {
    return true;
  },
};

export const alertService = {
  async list(): Promise<DemoAlert[]> {
    const r = await get<DemoAlert[]>('/api/v1/alerts').catch(() => ({
      data: null as DemoAlert[] | null,
      status: 'OFFLINE' as const,
    }));
    if (r.data && r.data.length > 0) return r.data;
    return DEMO_ALERTS;
  },
  async ack(alert: DemoAlert) {
    alert.ack = !alert.ack;
    return alert;
  },
};

export const resourceService = {
  async summary() {
    const r = await get<Record<string, string>>('/api/v1/resources/summary').catch(() => ({
      data: null as Record<string, string> | null,
      status: 'OFFLINE' as const,
    }));
    return r.data ?? DEMO_RESOURCE_SUMMARY;
  },
  async deployments(): Promise<string[]> {
    const r = await get<string[]>('/api/v1/resources/deployments').catch(() => ({
      data: null as string[] | null,
      status: 'OFFLINE' as const,
    }));
    return r.data ?? DEMO_DEPLOYMENTS;
  },
  async drones(): Promise<DemoDrone[]> {
    return DEMO_DRONES;
  },
};

export const intelligenceService = {
  async brief() {
    const r = await get<typeof DEMO_INTEL_BRIEF>('/api/v1/intel/brief').catch(() => ({
      data: null as typeof DEMO_INTEL_BRIEF | null,
      status: 'OFFLINE' as const,
    }));
    return r.data ?? DEMO_INTEL_BRIEF;
  },
};
