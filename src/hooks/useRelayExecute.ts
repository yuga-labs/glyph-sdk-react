import { Execute } from "@relayprotocol/relay-sdk";
import { useMutation } from "@tanstack/react-query";
import { useChainId, useConfig } from "wagmi";
import { useGlyphSwap } from "../context/GlyphSwapContext";
import { SWAP_ERROR_MESSAGES } from "../lib/customErrors";
import { relayClient, SOLANA_RELAY_ID } from "../lib/relay";
import { useGlyphApi } from "./useGlyphApi";
import { useGlyphRelayEvmAdapter } from "./useGlyphRelayEvmAdapter";

export const PRECHECK_FAILURE_CODE = "PRECHECK_FAILED";

export const buildErrorPayloadWithCode = (code: string, message: string) => {
    return { code: code, message: message };
};

export const useRelayExecute = () => {
    const chainId = useChainId();
    const { glyphApiFetch } = useGlyphApi();
    const { reportSwapFailed } = useGlyphSwap();

    const config = useConfig();
    const evmAdapter = useGlyphRelayEvmAdapter(config);

    return useMutation({
        mutationFn: async ({ qt, onExecutionStart }: { qt: Execute; onExecutionStart?: (quote: Execute) => void }) => {
            if (!config) {
                console.error("useConfig not ready");
                throw buildErrorPayloadWithCode(PRECHECK_FAILURE_CODE, SWAP_ERROR_MESSAGES.WALLET_NOT_READY);
            }
            if (!evmAdapter) {
                console.error("evmAdapter function not ready");
                throw buildErrorPayloadWithCode(PRECHECK_FAILURE_CODE, SWAP_ERROR_MESSAGES.WALLET_NOT_READY);
            }

            const quoteChainId = qt.details?.currencyIn?.currency?.chainId;
            if (quoteChainId === SOLANA_RELAY_ID) {
                // TODO: implement solana adapter
                throw buildErrorPayloadWithCode(PRECHECK_FAILURE_CODE, SWAP_ERROR_MESSAGES.SOLANA_NOT_IMPLEMENTED);
            }

            if (!glyphApiFetch) {
                throw buildErrorPayloadWithCode(PRECHECK_FAILURE_CODE, SWAP_ERROR_MESSAGES.NO_GLYPHAPIFETCH);
            }
            let parsedRes = null;

            // Handle error related to qupte generations differently than execution error. We want to show quote generation error right on the START screen for better UX
            try {
                const res = await glyphApiFetch(`/api/widget/swap/quote`, {
                    method: "POST",
                    body: JSON.stringify({ ...qt.request?.data })
                });
                if (!res.ok) throw { code: PRECHECK_FAILURE_CODE, message: SWAP_ERROR_MESSAGES.NO_FINAL_QUOTE };

                if (quoteChainId && quoteChainId !== chainId) {
                    console.log("Switching chain from", chainId, "to", quoteChainId);
                    await evmAdapter.switchChain(quoteChainId);
                }
                parsedRes = await res.json();
            } catch (e) {
                console.error(e);
                throw buildErrorPayloadWithCode(PRECHECK_FAILURE_CODE, SWAP_ERROR_MESSAGES.NO_FINAL_QUOTE);
            }

            const { id: txnId, quote: finalQuote } = parsedRes;

            onExecutionStart?.(finalQuote);

            let result: any;
            try {
                result = await relayClient.actions.execute({
                    quote: finalQuote,
                    wallet: evmAdapter
                });
            } catch (error) {
                console.debug("error while executing", error);
                await reportSwapFailed(txnId);
                throw error;
            }

            // Some relay-sdk flows resolve with a failure object instead of throwing.
            // Normalize that into an exception so the UI catch path runs.
            const resultStatus = (result as any)?.status ?? (result as any)?.state;
            const resultError = (result as any)?.error ?? (result as any)?.reason ?? (result as any)?.message;
            const failedStatuses = new Set(["error", "failed", "failure", "reverted"]);
            if (failedStatuses.has(String(resultStatus).toLowerCase()) || (result as any)?.ok === false) {
                console.debug(
                    "failedStatuses",
                    failedStatuses,
                    "resultStatus",
                    resultStatus,
                    "resultError",
                    resultError
                );
                await reportSwapFailed(txnId);
                throw new Error(typeof resultError === "string" ? resultError : "Relay execution failed");
            }

            const requestId = (finalQuote as any)?.steps?.[0]?.requestId as string | undefined;

            return { requestId, txnId, result };
        }
    });
};
