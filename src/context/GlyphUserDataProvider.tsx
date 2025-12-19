import { useQuery } from "@tanstack/react-query";
import react, { PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { deepEqual, useChainId } from "wagmi";
import { useGlyphApi } from "../hooks/useGlyphApi";
import { TOKEN_REFRESH_INTERVAL_MS, USER_REFRESH_INTERVAL_MS } from "../lib/constants";
import { createLogger } from "../lib/utils";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";
import { GlyphContext } from "./GlyphContext";
import { GlyphUserDataContext } from "./GlyphUserDataContext";

const logger = createLogger("GlyphData");
let controller: AbortController | null = null;

export const GlyphUserDataProvider: react.FC<PropsWithChildren> = ({ children }) => {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("GlyphUserDataProvider must be used within GlyphProvider");

    const { ready, authenticated } = context;
    const { glyphApiFetch } = useGlyphApi();
    const chainId = useChainId();
    const [fetchForAllNetworks, setFetchForAllNetworks] = useState(false);
    const resolvedChainId = fetchForAllNetworks ? "all" : chainId;

    const {
        data: user,
        refetch: refetchUserQuery,
        error: userError
    } = useQuery<GlyphWidgetUser | null>({
        queryKey: ["glyphWidgetUser", authenticated], // Query key depends on authentication status
        queryFn: async () => {
            if (!glyphApiFetch) {
                logger.warn("widget fetch not available");
                return null;
            }

            try {
                const resp = await glyphApiFetch("/api/widget/user");
                if (!resp.ok) {
                    // Try to parse error message, otherwise use status text
                    let errorMsg = `Failed to fetch user data: ${resp.status} ${resp.statusText}`;
                    try {
                        const errorBody = await resp.json();
                        errorMsg = errorBody.message || errorBody.error || errorMsg;
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        logger.warn("User data API error response", resp.status, errorMsg);
                        throw new Error(errorMsg);
                    }
                }
                const userData: GlyphWidgetUser = await resp.json();
                return userData;
            } catch (err) {
                logger.warn("User data fetch exception in useQuery", err);
                throw err; // throw error for react-query (triggers retry)
            }
        },
        enabled: ready && authenticated && !!glyphApiFetch,
        refetchInterval: USER_REFRESH_INTERVAL_MS,
        retry: (failureCount) => {
            const shouldRetry = failureCount < 5; // Retry up to 5 times (1 minute?)
            if (shouldRetry) logger.debug(`Retrying user fetch (attempt ${failureCount + 1})...`);
            return shouldRetry;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
    });

    const {
        data: balancesData,
        refetch: refetchBalancesQuery,
        isFetching: isBalancesLoading
    } = useQuery<GlyphWidgetBalances | null>({
        queryKey: ["glyphWidgetBalances", resolvedChainId],
        enabled: ready && authenticated && !!glyphApiFetch && !!user,
        refetchInterval: TOKEN_REFRESH_INTERVAL_MS,
        queryFn: async () => {
            controller?.abort?.(); // Cancel last api call

            if (!glyphApiFetch) {
                logger.warn("widget balances fetch not available");
                return null;
            }

            controller = new AbortController();
            const signal = controller.signal;

            try {
                const resp = await glyphApiFetch(`/api/widget/balances?chainId=${resolvedChainId}`, {
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
                console.log("Failed to fetch balances... retrying...");
            } else {
                toast.error("Failed to fetch balances");
            }
            return shouldRetry;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
    });

    // Wrapper function to match the existing context type for refreshBalances
    // Calling refetch() ignores staleTime, effectively acting like force=true
    const refreshBalances = useCallback(
        async (force: boolean = false, cbs?: Record<string, (diffAmount: number) => void>): Promise<void> => {
            logger.debug(`Triggering balances data refresh (force=${force})...`);

            const res = await refetchBalancesQuery();
            if (res.data && cbs) {
                if (deepEqual(balancesData, res.data)) return;

                // iterate over all cbs and call them if the balance has changed
                Object.entries(cbs).forEach(([symbol, cb]) => {
                    const newValue =
                        res.data?.tokens?.find?.((token) => `${token.chainId}:${token.address}` === symbol)?.value ||
                        "0";
                    const oldValue =
                        balancesData?.tokens?.find?.((token) => `${token.chainId}:${token.address}` === symbol)
                            ?.value || "0";
                    if (newValue && newValue !== oldValue) cb(Number(newValue) - Number(oldValue));
                });
            }
        },
        [refetchBalancesQuery, balancesData]
    );

    // Log user fetch errors from useQuery
    useEffect(() => {
        if (userError) {
            logger.error("Failed to load/refresh user data:", userError);
            // You could potentially show a toast here if needed,
            // but useQuery manages the error state internally.
            // toast.error("Failed to load user data.");
        }
    }, [userError]);

    // Wrapper function to match the existing context type for refreshUser
    // Calling refetch() ignores staleTime, effectively acting like force=true
    const refreshUser = useCallback(
        async (force: boolean = false): Promise<void> => {
            logger.debug(`Triggering user data refresh (force=${force})...`);
            await refetchUserQuery();
        },
        [refetchUserQuery]
    );

    const hasBalances = !!balancesData;

    return (
        <GlyphUserDataContext.Provider
            value={{
                user: user ?? null, // Provide user data from query, default to null
                balances: balancesData ?? null,
                hasBalances,
                isBalancesLoading,
                refreshUser, // Provide the wrapped refetch function
                refreshBalances,
                setFetchForAllNetworks,
                fetchForAllNetworks
            }}
        >
            {children}
        </GlyphUserDataContext.Provider>
    );
};
