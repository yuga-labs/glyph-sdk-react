import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchScopedGlyphData, shouldRetryGlyphData } from "../context/glyphDataQuery";
import { TOKEN_REFRESH_INTERVAL_MS } from "../lib/constants";
import { GlyphWidgetBalances } from "../types";
import { useGlyph } from "./useGlyph";
import { useGlyphReadScope } from "./useGlyphReadScope";

export function useBalancesForChain(chainId?: number | "all") {
    const { user } = useGlyph();
    const { scope, isCurrent } = useGlyphReadScope(user?.evmWallet);
    const client = useQueryClient();
    useEffect(
        () => () => {
            void client.cancelQueries({ queryKey: ["glyphWidgetChainBalances", scope.key] });
        },
        [client, scope]
    );
    const query = useQuery({
        queryKey: ["glyphWidgetChainBalances", scope.key, chainId],
        enabled: isCurrent() && !!chainId && !!user?.evmWallet,
        gcTime: 0,
        placeholderData: () => undefined,
        refetchInterval: TOKEN_REFRESH_INTERVAL_MS,
        queryFn: ({ signal }) =>
            fetchScopedGlyphData<GlyphWidgetBalances>(
                scope.apiFetch,
                `/api/widget/balances?chainId=${chainId}`,
                signal,
                isCurrent,
                scope.key
            ),
        retry: (count, error) => isCurrent() && shouldRetryGlyphData(error, count, 3),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
    });
    return {
        ...query,
        data: isCurrent() && !query.isError && query.data?.scope === scope.key ? query.data.value : null
    };
}
