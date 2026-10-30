import { MAINNET_RELAY_API, paths } from "@relayprotocol/relay-sdk";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { SwapView } from "../lib/constants";
import { useBalances } from "./useBalances";

type TxDetails = {
    hash: string;
    blockExplorerName?: string;
    blockExplorerUrl?: string;
};

type UseRelayIntentStatusParams = {
    intentRequestId: string | null;
    setTxStatus: Dispatch<SetStateAction<"SUCCESS" | "FAILED" | "PENDING">>;
    setView: Dispatch<SetStateAction<SwapView>>;
    onError?: () => Promise<void>;
};

export const useRelayIntentStatus = ({
    intentRequestId,
    setTxStatus,
    setView,
    onError
}: UseRelayIntentStatusParams) => {
    const [txDetails, setTxDetails] = useState<TxDetails>();
    const [error, setError] = useState<string>("");

    const { refreshBalances, isBalancesLoading } = useBalances();

    const latest = useRef({ onError, refreshBalances, isBalancesLoading });
    latest.current = { onError, refreshBalances, isBalancesLoading };

    useEffect(() => {
        if (!intentRequestId) return;

        let cancelled = false;
        const controller = new AbortController();
        let failures = 0;
        setError("");
        setTxDetails({
            hash: intentRequestId,
            blockExplorerName: "Relay Explorer",
            blockExplorerUrl: `https://relay.link/transaction/${intentRequestId}`
        });
        const wait = (ms: number) =>
            new Promise<void>((resolve) => {
                const finish = () => {
                    clearTimeout(timer);
                    controller.signal.removeEventListener("abort", finish);
                    resolve();
                };
                const timer = setTimeout(finish, ms);
                controller.signal.addEventListener("abort", finish, { once: true });
                if (controller.signal.aborted) finish();
            });

        const pollStatus = async () => {
            while (!cancelled) {
                try {
                    const readController = new AbortController();
                    const abortRead = () => readController.abort();
                    controller.signal.addEventListener("abort", abortRead, { once: true });
                    const timeout = setTimeout(abortRead, 15000);
                    let data: paths["/intents/status/v2"]["get"]["responses"]["200"]["content"]["application/json"];
                    try {
                        const resp = await fetch(
                            `${MAINNET_RELAY_API}/intents/status/v2?requestId=${encodeURIComponent(intentRequestId)}`,
                            { signal: readController.signal }
                        );
                        if (!resp.ok) throw new Error("Failed to get execution status");
                        data = await resp.json();
                        if (readController.signal.aborted)
                            throw new DOMException("Status read cancelled", "AbortError");
                    } finally {
                        clearTimeout(timeout);
                        controller.signal.removeEventListener("abort", abortRead);
                    }
                    if (cancelled) return;
                    const status = data?.status;

                    if (!status) {
                        throw new Error("Missing execution status");
                    }

                    failures = 0;
                    setError("");
                    try {
                        const relayTxDetails: TxDetails = {
                            hash: intentRequestId,
                            blockExplorerName: "Relay Explorer",
                            blockExplorerUrl: `https://relay.link/transaction/${intentRequestId}`
                        };
                        // Using relay tx hash as the primary tx details
                        setTxDetails(relayTxDetails);
                    } catch (error) {
                        console.error("Error getting tx hash:", error);
                    }

                    if (status === "success") {
                        if (!cancelled) {
                            if (!latest.current.isBalancesLoading) {
                                latest.current.refreshBalances?.();
                            }
                            setTxStatus("SUCCESS");
                            setView(SwapView.END);
                        }
                        return;
                    }

                    if (status === "refund" || status === "failure") {
                        if (!cancelled) {
                            if (!latest.current.isBalancesLoading) {
                                latest.current.refreshBalances?.();
                            }
                            if (latest.current.onError) {
                                try {
                                    await latest.current.onError();
                                } catch {
                                    /* Settlement is authoritative. */
                                }
                            }
                            if (cancelled) return;
                            setTxStatus("FAILED");
                            setView(SwapView.END);
                            if (status === "refund") {
                                setError("Will be refunded back to you!");
                            } else {
                                if (data.details) {
                                    setError(data?.details);
                                }
                            }
                        }
                        return;
                    }
                } catch {
                    if (cancelled) return;
                    failures += 1;
                    // A status-read outage does not mean a submitted transaction failed.
                    setError("Swap status temporarily unavailable. Check Relay Explorer before taking another action.");
                    if (failures >= 6) return;
                }

                await wait(Math.min(5000 * 2 ** failures, 30000));
            }
        };

        pollStatus();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [intentRequestId, setTxStatus, setView]);

    return {
        error,
        txDetails
    };
};
