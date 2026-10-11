import { describe, expect, it } from 'vitest';
import { projectSchema } from '@/lib/schemas/project';

describe('project validation schema', () => {
  it('accepts a valid commercial electrical project', () => {
    const valid = {
      name: 'North Wing Renovation',
      project_number: 'PRJ-2026-001',
      site_address: '100 Main St, Chicago, IL',
      general_contractor: 'Turner Construction',
      notes: 'Phase 1 conduit rough-in',
    };
    const result = projectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects an empty or whitespace-only project name', () => {
    expect(projectSchema.safeParse({ name: '' }).success).toBe(false);
    expect(projectSchema.safeParse({ name: '   ' }).success).toBe(false);
  });

  it('rejects project names exceeding 180 characters', () => {
    const longName = 'A'.repeat(181);
    expect(projectSchema.safeParse({ name: longName }).success).toBe(false);
  });

  it('accepts optional fields being null, undefined, or empty', () => {
    const minimal = {
      name: 'Substation Upgrade',
    };
    const result = projectSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project_number).toBeNull();
      expect(result.data.site_address).toBeNull();
      expect(result.data.general_contractor).toBeNull();
    }
  });

  it('enforces maximum length on optional fields', () => {
    expect(projectSchema.safeParse({ name: 'Valid', project_number: 'N'.repeat(81) }).success).toBe(false);
    expect(projectSchema.safeParse({ name: 'Valid', site_address: 'A'.repeat(501) }).success).toBe(false);
    expect(projectSchema.safeParse({ name: 'Valid', general_contractor: 'G'.repeat(181) }).success).toBe(false);
    expect(projectSchema.safeParse({ name: 'Valid', notes: 'N'.repeat(10001) }).success).toBe(false);
  });
});
