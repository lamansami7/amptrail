'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getSupabaseConfig } from './config';

let client: SupabaseClient<Database> | undefined;

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase is not configured. Add the public URL and key to your environment.');
  client ??= createBrowserClient<Database>(config.url, config.key);
  return client;
}
