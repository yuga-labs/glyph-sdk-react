import { useQuery } from "@tanstack/react-query";
import { parseUnits, zeroAddress } from "viem";
import { useGlyphSwap } from "../context/GlyphSwapContext";
import { RELAY_APP_FEE_BPS, RELAY_APP_FEE_RECIPIENT } from "../lib/constants";
import { relayClient, SOLANA_RELAY_ID } from "../lib/relay";
import { assertHasValue, isNativeAndWrappedPair } from "../lib/utils";
import { useGlyph } from "./useGlyph";

const QUOTE_REFETCH_INTERVAL = 30_000;

export const useRelayQuote = (enabled?: boolean) => {
    const swapState = useGlyphSwap();
    const { fromCurrency, toCurrency, tradeType, amount, topupGas, topupGasAmount } = swapState;
    const { user } = useGlyph();

    const evmWallet = user?.evmWallet;
    const solanaWallet = user?.solanaWallet;

    let amountIsValid = true;
    try {
        amountIsValid = Number(swapState.amount) > 0;
    } catch {
        amountIsValid = false;
    }

    const isQuotable =
        !!evmWallet &&
        !!solanaWallet &&
        !!fromCurrency &&
        !!toCurrency &&
        amountIsValid &&
        (enabled !== undefined ? enabled : true); // Only use this if enabled is passed as props

    const nativeAndWrappedPair = isNativeAndWrappedPair(fromCurrency, toCurrency);
    const operation = nativeAndWrappedPair ? (fromCurrency?.address === zeroAddress ? "wrap" : "unwrap") : "swap";

    const quoteQuery = useQuery({
        queryKey: ["relayQuote", evmWallet, solanaWallet, swapState],
        queryFn: async () => {
            assertHasValue(evmWallet);
            assertHasValue(solanaWallet);
            assertHasValue(fromCurrency);
            assertHasValue(toCurrency);
            assertHasValue(amount);

            const fromWallet = fromCurrency.chainId === SOLANA_RELAY_ID ? solanaWallet : evmWallet;
            const toWallet = toCurrency.chainId === SOLANA_RELAY_ID ? solanaWallet : evmWallet;

            return relayClient.actions.getQuote({
                tradeType,
                chainId: fromCurrency.chainId!,
                currency: fromCurrency.address!,
                toChainId: toCurrency.chainId!,
                toCurrency: toCurrency.address!,
                amount: parseUnits(amount, fromCurrency.decimals!).toString(),
                user: fromWallet,
                recipient: toWallet,
                options: {
                    topupGas,
                    topupGasAmount,
                    appFees: isNativeAndWrappedPair(fromCurrency, toCurrency)
                        ? undefined // No app fees for wrapping and unwrapping
                        : [
                              {
                                  recipient: RELAY_APP_FEE_RECIPIENT,
                                  fee: RELAY_APP_FEE_BPS.toString()
                              }
                          ]
                }
            });
        },
        enabled: isQuotable,
        refetchInterval: QUOTE_REFETCH_INTERVAL,
        gcTime: 0,
        retry: 1
    });

    return { ...quoteQuery, appFeesWaived: nativeAndWrappedPair, operation };
};
