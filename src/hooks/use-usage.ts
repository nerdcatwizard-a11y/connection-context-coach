import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUsage } from "@/lib/ai-client";

export type Usage = Awaited<ReturnType<typeof getUsage>>;

export const usageQueryKey = ["usage"] as const;

/** Server-truth entitlement + daily quota for the signed-in account. */
export function useUsage() {
  const query = useQuery({
    queryKey: usageQueryKey,
    queryFn: () => getUsage(),
    staleTime: 30_000,
    retry: 1,
  });

  return {
    usage: query.data ?? null,
    isPremium: query.data?.unlimited === true,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useRefreshUsage() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: usageQueryKey });
}
