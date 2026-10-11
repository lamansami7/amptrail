import { describe, expect, it } from 'vitest';
import { settingsSchema } from '@/lib/schemas/settings';

describe('settings validation schema', () => {
  it('accepts valid full name and company name', () => {
    const valid = {
      full_name: 'David Miller',
      company_name: 'Miller Electric LLC',
    };
    const result = settingsSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBe('David Miller');
      expect(result.data.company_name).toBe('Miller Electric LLC');
    }
  });

  it('rejects empty or whitespace company name', () => {
    expect(settingsSchema.safeParse({ company_name: '' }).success).toBe(false);
    expect(settingsSchema.safeParse({ company_name: '   ' }).success).toBe(false);
  });

  it('rejects company name exceeding 160 characters', () => {
    const longName = 'C'.repeat(161);
    expect(settingsSchema.safeParse({ company_name: longName }).success).toBe(false);
  });

  it('transforms empty full name to null', () => {
    const result = settingsSchema.safeParse({
      full_name: '   ',
      company_name: 'Miller Electric',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBeNull();
    }
  });

  it('rejects full name exceeding 120 characters', () => {
    const longName = 'N'.repeat(121);
    expect(settingsSchema.safeParse({ full_name: longName, company_name: 'Valid' }).success).toBe(false);
  });
});
