import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && key && url !== "your_supabase_project_url_here");
}

// Lazy singleton — only created when Supabase mode is active
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (_client) return _client;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경 변수가 설정되지 않았습니다. VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 확인하세요."
    );
  }
  _client = createClient(url, key);
  return _client;
}
