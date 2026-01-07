import { useQuery } from "@tanstack/react-query";
import { RelayAPIToken, useGlyphSwap } from "../context/GlyphSwapContext";
import { RELAY_APP_FEE_BPS, RELAY_APP_FEE_RECIPIENT } from "../lib/constants";
import { relayClient, SOLANA_RELAY_ID } from "../lib/relay";
import { assertHasValue, chainIdToRelayChain, isNativeAndWrappedPair } from "../lib/utils";
import { useGlyph } from "./useGlyph";

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

            const fromWallet = fromCurrency.chainId === SOLANA_RELAY_ID ? solanaWallet : evmWallet;
            const toWallet = toCurrency.chainId === SOLANA_RELAY_ID ? solanaWallet : evmWallet;

            return relayClient.actions.getQuote({
                tradeType,
                chainId: fromCurrency.chainId!,
                currency: fromCurrency.address!,
                toChainId: toCurrency.chainId!,
                toCurrency: toCurrency.address!,
                amount: amount, // amount already in wei
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
