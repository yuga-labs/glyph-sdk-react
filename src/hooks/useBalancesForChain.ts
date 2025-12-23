import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { TOKEN_REFRESH_INTERVAL_MS } from "../lib/constants";
import { createLogger } from "../lib/utils";
import { GlyphWidgetBalances } from "../types";
import { useGlyphApi } from "./useGlyphApi";

let controller: AbortController | null = null;
const logger = createLogger("Glyph Balances Raw");

export function useBalancesForChain(chainId?: number | "all") {
    const { glyphApiFetch } = useGlyphApi();

    return useQuery<GlyphWidgetBalances | null>({
        queryKey: ["glyphWidgetBalances", chainId],
        enabled: !!chainId,
        refetchInterval: TOKEN_REFRESH_INTERVAL_MS,
        queryFn: async () => {
            controller?.abort?.(); // Cancel last api call

            if (!glyphApiFetch) {
                logger.warn("glyph api fetch not available");
                return null;
            }

            controller = new AbortController();
            const signal = controller.signal;

            try {
                const resp = await glyphApiFetch(`/api/widget/balances?chainId=${chainId}`, {
                    signal
                });
                if (!resp.ok) {
                    // Try to parse error message, otherwise use status text
                    let errorMsg = `Failed to fetch balances: ${resp.status} ${resp.statusText}`;
                    try {
                        const errorBody = await resp.json();
                        errorMsg = errorBody.message || errorBody.error || errorMsg;
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        logger.warn("Balance data API error response", resp.status, errorMsg);
                        throw new Error(errorMsg);
                    }
                }
                const balanceData: GlyphWidgetBalances = await resp.json();
                return balanceData;
            } catch (err) {
                logger.warn("balances fetch exception in useQuery", err);
                throw err; // throw error for react-query (triggers retry)
            }
        },
        retry: (failureCount, err) => {
            // handle and don't retry if aborted
            if (err?.name?.includes("AbortError")) {
                return false;
            }
            const shouldRetry = failureCount < 3;
            if (shouldRetry) {
                logger.debug(`Retrying balances fetch (attempt ${failureCount + 1})...`);
                console.error("Failed to fetch balances... retrying...");
            } else {
                toast.error("Failed to fetch balances");
            }
            return shouldRetry;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
    });
}
