import { Execute } from "@relayprotocol/relay-sdk";
import { useQuery } from "@tanstack/react-query";
import { RelayAPIToken, useGlyphSwap } from "../context/GlyphSwapContext";
import { SOLANA_RELAY_ID } from "../lib/relay";
import { assertHasValue, chainIdToRelayChain, isNativeAndWrappedPair } from "../lib/utils";
import { useGlyph } from "./useGlyph";
import { useGlyphApi } from "./useGlyphApi";

const QUOTE_REFETCH_INTERVAL = 30_000;

export const GAS_BUFFER = 115n; // 15% gas buffer for actual execution - this is unrelated to the "max" button feature

export const checkIfGasIsEnough = (
    gasCurrencyAddress: string,
    sourceToken: RelayAPIToken | undefined,
    quoteGasAmountInWei: number | string | undefined | null,
    sourceGasBalanceInWei: number | string | undefined | null,
    sellAmount: string | undefined | null // in wei
) => {
    return (
        sourceGasBalanceInWei !== undefined &&
        sourceGasBalanceInWei !== null &&
        sourceToken &&
        (gasCurrencyAddress !== sourceToken?.address
            ? BigInt(sourceGasBalanceInWei) * 100n >= BigInt(quoteGasAmountInWei || 0) * GAS_BUFFER // If different token than gas token -> check if gas is at least 15% more than required
            : (BigInt(sourceGasBalanceInWei) - BigInt(sellAmount || "0")) * 100n >=
              BigInt(quoteGasAmountInWei || 0) * GAS_BUFFER)
    ); // If same token is being sold, reserve some for gas and require 15% buffer
};

export const useRelayQuote = (enabled?: boolean) => {
    const swapState = useGlyphSwap();
    const { glyphApiFetch } = useGlyphApi();

    const { fromCurrency, toCurrency, tradeType, amount, topupGas, topupGasAmount } = swapState;
    const { user } = useGlyph();

    const fromChain = fromCurrency?.chainId ? chainIdToRelayChain(fromCurrency?.chainId) : undefined;
    const isNativeFromCurrency = fromCurrency?.address === fromChain?.currency?.address;

    const evmWallet = user?.evmWallet;
    const solanaWallet = user?.solanaWallet;

    let amountIsValid = true;
    try {
        amountIsValid = BigInt(amount ?? "0") > 0n;
    } catch {
        amountIsValid = false;
    }

    const isQuotable =
        fromCurrency?.chainId === SOLANA_RELAY_ID
            ? !!solanaWallet
            : !!evmWallet &&
              !!fromCurrency &&
              !!toCurrency &&
              amountIsValid &&
              (enabled !== undefined ? enabled : true); // Only use this if enabled is passed as props

    const nativeAndWrappedPair = isNativeAndWrappedPair(fromCurrency, toCurrency);
    const operation = nativeAndWrappedPair ? (isNativeFromCurrency ? "wrap" : "unwrap") : "swap";

    const quoteQuery = useQuery({
        queryKey: ["relayQuote", evmWallet, solanaWallet, swapState],
        queryFn: async () => {
            assertHasValue(evmWallet);
            assertHasValue(solanaWallet);
            assertHasValue(fromCurrency);
            assertHasValue(toCurrency);
            assertHasValue(amount);

            if (!glyphApiFetch) throw new Error("Wallet not authenticated properly, please refresh and try again");

            const fromWallet = fromCurrency.chainId === SOLANA_RELAY_ID ? solanaWallet : evmWallet;
            const toWallet = toCurrency.chainId === SOLANA_RELAY_ID ? solanaWallet : evmWallet;

            // Goes through the host app's own server rather than calling Relay's /quote directly --
            // this call can never safely carry a Relay API key since it runs in this
            // browser-bundled package, and Relay now rejects unauthenticated /quote requests. The
            // host app computes appFees itself server-side (same isNativeAndWrappedPair waiver),
            // so it isn't sent here; nativeAndWrappedPair below is only for this hook's own
            // appFeesWaived/operation return values, not for what's actually charged.
            const res = await glyphApiFetch("/api/widget/swap/quote/preview", {
                method: "POST",
                body: JSON.stringify({
                    originChainId: fromCurrency.chainId!,
                    originCurrency: fromCurrency.address!,
                    destinationChainId: toCurrency.chainId!,
                    destinationCurrency: toCurrency.address!,
                    tradeType,
                    amount, // amount already in wei
                    user: fromWallet,
                    recipient: toWallet,
                    topupGas,
                    topupGasAmount
                })
            });
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.error || "Failed to fetch quote");
            }

            return res.json() as Promise<Execute>;
        },
        enabled: isQuotable,
        refetchInterval: QUOTE_REFETCH_INTERVAL,
        gcTime: 0,
        retry: 1
    });

    return { ...quoteQuery, appFeesWaived: nativeAndWrappedPair, operation };
};
