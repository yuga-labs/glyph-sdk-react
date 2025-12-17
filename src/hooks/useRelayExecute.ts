import { Execute } from "@relayprotocol/relay-sdk";
import { useMutation } from "@tanstack/react-query";
import { useChainId, useConfig } from "wagmi";
import { useGlyphSwap } from "../context/GlyphSwapContext";
import { relayClient, SOLANA_RELAY_ID } from "../lib/relay";
import { useGlyphApi } from "./useGlyphApi";
import { useGlyphRelayEvmAdapter } from "./useGlyphRelayEvmAdapter";

export const useRelayExecute = () => {
    const chainId = useChainId();
    const { glyphApiFetch } = useGlyphApi();
    const { reportSwapFailed } = useGlyphSwap();

    const config = useConfig();
    const evmAdapter = useGlyphRelayEvmAdapter(config);

    return useMutation({
        mutationFn: async (qt: Execute) => {
            if (!config) {
                console.error("useConfig not ready");
                throw new Error("wallet client not ready");
            }
            if (!evmAdapter) {
                console.error("evmAdapter function not ready");
                throw new Error("wallet client not ready");
            }

            const quoteChainId = qt.details?.currencyIn?.currency?.chainId;
            if (quoteChainId === SOLANA_RELAY_ID) {
                // TODO: implement solana adapter
                throw new Error("Solana adapter not implemented");
            }

            if (!glyphApiFetch) return null;
            const res = await glyphApiFetch(`/api/widget/swap/quote`, {
                method: "POST",
                body: JSON.stringify({ ...qt.request?.data })
            });
            if (!res.ok) throw new Error("Failed to fetch transactions");

            if (quoteChainId && quoteChainId !== chainId) {
                console.log("Switching chain from", chainId, "to", quoteChainId);
                await evmAdapter.switchChain(quoteChainId);
            }

            const { id: txnId, quote: finalQuote } = await res.json();
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
