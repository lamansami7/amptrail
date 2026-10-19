import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { healWorkspaceMembership } from '@/lib/data/workspace';

type RpcResult = { data: unknown; error: unknown };

function fakeClient(rpc: (fn: string, args: Record<string, unknown>) => Promise<RpcResult>) {
  return { rpc } as unknown as Parameters<typeof healWorkspaceMembership>[0];
}

describe('workspace self-heal (ensure_user_workspace)', () => {
  it('reports success when the database returns a workspace id', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'company-1', error: null });
    await expect(healWorkspaceMembership(fakeClient(rpc), 'Arena QA Electric')).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('ensure_user_workspace', {
      p_company_name: 'Arena QA Electric',
    });
  });

  it('falls back to a generic company name when signup metadata has none', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'company-1', error: null });
    await healWorkspaceMembership(fakeClient(rpc), '   ');
    expect(rpc).toHaveBeenCalledWith('ensure_user_workspace', { p_company_name: 'My company' });
  });

  it('caps the company name at the database limit', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'company-1', error: null });
    await healWorkspaceMembership(fakeClient(rpc), 'x'.repeat(300));
    const args = rpc.mock.calls[0][1] as { p_company_name: string };
    expect(args.p_company_name).toHaveLength(160);
  });

  it('reports failure when the RPC errors (e.g. function missing on an older database)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    await expect(healWorkspaceMembership(fakeClient(rpc), null)).resolves.toBe(false);
  });

  it('reports failure when the database declines to provision (null id)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    await expect(healWorkspaceMembership(fakeClient(rpc), null)).resolves.toBe(false);
  });

  it('never throws, even if the RPC itself explodes', async () => {
    const rpc = vi.fn().mockRejectedValue(new Error('network gone'));
    await expect(healWorkspaceMembership(fakeClient(rpc), null)).resolves.toBe(false);
  });
});
