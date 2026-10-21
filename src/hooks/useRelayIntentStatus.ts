import { MAINNET_RELAY_API, paths } from "@relayprotocol/relay-sdk";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { toast } from "sonner";
import { useConfig } from "wagmi";
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

export const useRelayIntentStatus = ({ intentRequestId, setTxStatus, setView, onError }: UseRelayIntentStatusParams) => {
    const config = useConfig();

    const [txDetails, setTxDetails] = useState<TxDetails>();
    const [error, setError] = useState<string>("");

    const { refreshBalances, isBalancesLoading } = useBalances();

    useEffect(() => {
        if (!intentRequestId) return;

        let cancelled = false;

        const pollStatus = async () => {
            while (!cancelled) {
                try {
                    const resp = await fetch(`${MAINNET_RELAY_API}/intents/status/v2?requestId=${intentRequestId}`);

                    if (!resp.ok) {
                        throw new Error("Failed to get execution status");
                    }

                    const data =
                        (await resp.json()) as paths["/intents/status/v2"]["get"]["responses"]["200"]["content"]["application/json"];
                    const status = data?.status;

                    if (!status) {
                        break;
                    }

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
                            if (!isBalancesLoading) {
                                refreshBalances?.();
                            }
                            setTxStatus("SUCCESS");
                            setView(SwapView.END);
                        }
                        return;
                    }

                    if (status === "refund" || status === "failure") {
                        if (!cancelled) {
                            if (!isBalancesLoading) {
                                refreshBalances?.();
                            }
                            if (onError) await onError();
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
                } catch (error) {
                    console.error("Error polling status:", error);
                    toast.error(
                        typeof error === "string"
                            ? error
                            : typeof error === "object"
                                ? (error as any)?.message || "Couldn't fetch the status of the swap"
                                : "Couldn't fetch the status of the swap"
                    );
                    return;
                }

                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        };

        pollStatus();

        return () => {
            cancelled = true;
        };
    }, [intentRequestId, config.chains, setTxStatus, setView]);

    return {
        error,
        txDetails
    };
};
