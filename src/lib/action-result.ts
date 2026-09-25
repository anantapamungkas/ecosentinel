/**
 * Shared return shape for mutations, whether they run as a real Server
 * Action (src/app/actions.ts) or against the in-memory demo store
 * (src/lib/demo/store.ts). Kept in its own module — rather than inside the
 * "use server" file — since a "use server" file may only export async
 * functions.
 */
export interface ActionResult {
  success: boolean;
  error?: string;
}
