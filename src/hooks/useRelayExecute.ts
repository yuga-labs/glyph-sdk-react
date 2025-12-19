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

            const result = await relayClient.actions
                .execute({
                    quote: finalQuote,
                    wallet: evmAdapter
                })
                .catch(async (error) => {
                    await reportSwapFailed(txnId);
                    throw error; // throw the error to be handled by the caller
                });

            const requestId = (finalQuote as any)?.steps?.[0]?.requestId as string | undefined;

            return { requestId, txnId, result };
        }
    });
};
