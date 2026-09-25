/**
 * Single source of truth for whether a real Supabase backend is configured.
 *
 * `NEXT_PUBLIC_*` variables are inlined at build time by Next.js, so this
 * constant evaluates identically on the server (middleware, Server Actions,
 * Route Handlers) and in the browser — every part of the app can branch on
 * it without needing to thread a prop or a request header through.
 *
 * When it's `false`, nothing in the app attempts to construct a Supabase
 * client or hit the network: the dashboard runs entirely on the in-memory
 * simulator in `src/lib/demo/store.ts` so `npm run dev` works out of the box
 * with zero setup.
 */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-ref")
);
