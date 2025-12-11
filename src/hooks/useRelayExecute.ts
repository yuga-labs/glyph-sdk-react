import { AdaptedWallet, Execute } from "@relayprotocol/relay-sdk";
import { useMutation } from "@tanstack/react-query";
import { relayClient, SOLANA_RELAY_ID } from "../lib/relay";
import { useGlyphApi } from "./useGlyphApi";
import { useGlyphRelayEvmAdapter } from "./useGlyphRelayEvmAdapter";
import { useGlyphSwap } from "../context/GlyphSwapContext";

export const useRelayExecute = () => {
    const evmAdapter = useGlyphRelayEvmAdapter();
    const { glyphApiFetch } = useGlyphApi();
    const { reportSwapFailed } = useGlyphSwap();

    return useMutation({
        mutationFn: async (qt: Execute) => {
            let wallet: AdaptedWallet;
            const quoteChainId = qt.details?.currencyIn?.currency?.chainId;
            if (quoteChainId === SOLANA_RELAY_ID) {
                // TODO: implement solana adapter
                throw new Error("Solana adapter not implemented");
            } else {
                wallet = evmAdapter;
            }

            if (!glyphApiFetch) return null;
            const res = await glyphApiFetch(`/api/widget/swap/quote`, {
                method: "POST",
                body: JSON.stringify({ ...qt.request?.data })
            });
            if (!res.ok) throw new Error("Failed to fetch transactions");

            const currentChainIdWallet = await wallet.getChainId();
            if (quoteChainId && quoteChainId !== currentChainIdWallet) {
                console.log("Switching chain from", currentChainIdWallet, "to", quoteChainId);
                await wallet.switchChain(quoteChainId);
            }

            const { id: txnId, quote: finalQuote } = await res.json();
            const result = await relayClient.actions.execute({
                quote: finalQuote,
                wallet
            }).catch(async (error) => {
                await reportSwapFailed(txnId);
                throw error; // throw the error to be handled by the caller
            });

            const requestId = (finalQuote as any)?.steps?.[0]?.requestId as string | undefined;

            return { requestId, txnId, result };
        }
    });
};
