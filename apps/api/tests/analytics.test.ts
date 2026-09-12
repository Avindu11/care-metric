import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('CareMetric Analytics API Integration Tests', () => {
  it('GET /api/health should return ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/providers should return 5 providers', async () => {
    const res = await request(app).get('/api/providers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(5);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('name');
  });

  it('GET /api/facilities should return 3 facilities', async () => {
    const res = await request(app).get('/api/facilities');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data[0]).toHaveProperty('name');
  });

  it('GET /api/appointments should return paginated list and valid totals', async () => {
    const res = await request(app).get('/api/appointments?page=1&pageSize=10');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(10);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.pageSize).toBe(10);
    expect(res.body.pagination.total).toBe(500);
    expect(res.body.pagination.totalPages).toBe(50);

    const firstItem = res.body.data[0];
    expect(firstItem).toHaveProperty('appointmentCode');
    expect(firstItem).toHaveProperty('patientCode');
    expect(firstItem.provider).toHaveProperty('name');
    expect(firstItem.facility).toHaveProperty('name');
    expect(firstItem).toHaveProperty('status');
  });

  it('GET /api/analytics/appointments should verify metric invariant (total = sum of statuses)', async () => {
    const res = await request(app).get('/api/analytics/appointments');
    expect(res.status).toBe(200);
    const { metrics } = res.body;

    expect(metrics.total).toBe(500);
    expect(
      metrics.scheduled +
        metrics.confirmed +
        metrics.completed +
        metrics.cancelled +
        metrics.noShow,
    ).toBe(metrics.total);
  });

  it('GET /api/analytics/appointments filtered by status should only count matching status', async () => {
    const res = await request(app).get('/api/analytics/appointments?status=COMPLETED');
    expect(res.status).toBe(200);
    const { metrics } = res.body;

    expect(metrics.total).toBe(metrics.completed);
    expect(metrics.scheduled).toBe(0);
    expect(metrics.confirmed).toBe(0);
    expect(metrics.cancelled).toBe(0);
    expect(metrics.noShow).toBe(0);
  });

  it('GET /api/analytics/appointments filtered by provider and facility', async () => {
    // 1. Get a provider and facility
    const provRes = await request(app).get('/api/providers');
    const facRes = await request(app).get('/api/facilities');
    const providerId = provRes.body.data[0].id;
    const facilityId = facRes.body.data[0].id;

    const res = await request(app).get(
      `/api/analytics/appointments?providerId=${providerId}&facilityId=${facilityId}`,
    );
    expect(res.status).toBe(200);
    const { metrics } = res.body;
    expect(metrics.total).toBeGreaterThanOrEqual(0);

    // Verify appointments list with same filters matches analytics total exactly
    const listRes = await request(app).get(
      `/api/appointments?providerId=${providerId}&facilityId=${facilityId}&pageSize=1`,
    );
    expect(listRes.status).toBe(200);
    expect(listRes.body.pagination.total).toBe(metrics.total);
  });

  it('GET /api/analytics/appointments/trend returns valid date breakdown', async () => {
    const res = await request(app).get('/api/analytics/appointments/trend');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const trendTotal = res.body.data.reduce(
      (acc: number, cur: { count: number }) => acc + cur.count,
      0,
    );
    expect(trendTotal).toBe(500);
  });

  it('GET /api/analytics/integrity detects duplicate rows from relational history join', async () => {
    const res = await request(app).get('/api/analytics/integrity');
    expect(res.status).toBe(200);

    const { summary, duplicates, diagnosis } = res.body;
    expect(summary.uniqueAppointments).toBe(500);
    expect(summary.joinedRows).toBeGreaterThan(500);
    expect(summary.duplicateRows).toBe(summary.joinedRows - summary.uniqueAppointments);
    expect(summary.integrityStatus).toBe('WARNING');
    expect(duplicates.length).toBeGreaterThan(0);
    expect(duplicates[0].occurrences).toBeGreaterThan(1);
    expect(diagnosis.type).toBe('ONE_TO_MANY_JOIN_MULTIPLICATION');
  });
});
