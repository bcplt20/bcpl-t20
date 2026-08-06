import { QueryClient } from '@tanstack/react-query';

/**
 * Single shared react-query client for the whole app.
 *
 * Exported (rather than created inline in _layout.tsx) so the auth layer can
 * clear/invalidate cached, user-scoped data on login AND logout. Without this,
 * a player who (for example) completed KYC on the website, then logged out and
 * back in on the app, would still see the stale pre-KYC dashboard until the
 * cache happened to expire.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Website-side changes must always surface — keep dashboard-style data
      // fresh whenever a screen is (re)focused rather than serving a long-lived
      // stale cache. Individual screens still trigger the refetch on focus.
      staleTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
