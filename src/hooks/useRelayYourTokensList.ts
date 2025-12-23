import { useMemo } from "react";
import { RelayAPIToken } from "../context/GlyphSwapContext";
import { GlyphWidgetTokenBalancesItem } from "../types";
import { useBalancesForChain } from "./useBalancesForChain";
import useRelayTokenList from "./useRelayTokenList";

export const useRelayYourTokensList = (currentChainId: number | "all", chainIds: number[]) => {
    const { data: balances, isLoading: isBalancesLoading, error: balancesError } = useBalancesForChain("all"); // fetch balance for all supported networks at once

    // Balances might contain native token in the array even if the balance is 0
    const nonZeroBalances = useMemo(
        () =>
            balances?.tokens?.filter(
                (t) =>
                    t.valueInWei &&
                    BigInt(t.valueInWei) > 0n &&
                    (currentChainId === "all" || t.chainId === currentChainId)
            ),
        [balances?.tokens, currentChainId]
    );

    // Token balances that are supported by Relay
    const {
        data: yourTokenList,
        isLoading: isYourTokenListLoading,
        error: yourTokenListError
    } = useRelayTokenList(
        balances?.tokens?.length
            ? {
                  depositAddressOnly: false, // for swap
                  chainIds: chainIds, // fetch for all the supported chains at once
                  defaultList: false,
                  tokens: balances?.tokens?.map((token) => `${token.chainId}:${token.address}`) // fetch all the tokens having balance across all the supported chains at once
              }
            : undefined
    );

    return useMemo(() => {
        const relaySupportedTokensBalances = nonZeroBalances?.reduce(
            (acc, token) => {
                const relayToken = yourTokenList?.find(
                    (t) => t.chainId === token.chainId && t.address === token.address
                );
                if (!relayToken) {
                    return acc;
                }

                acc[`${token.chainId!}:${token.address.toLowerCase()!}`] = {
                    ...token,
                    relayToken: relayToken
                };
                return acc;
            },
            {} as Record<string, GlyphWidgetTokenBalancesItem & { relayToken: RelayAPIToken }>
        );
        return {
            isLoading: isBalancesLoading || isYourTokenListLoading,
            isError: !!balancesError || !!yourTokenListError,
            error: balancesError || yourTokenListError,
            nonZeroBalances,
            relaySupportedTokens: yourTokenList || [],
            relaySupportedTokensBalances,
            relaySupportedTokensBalancesLength: relaySupportedTokensBalances
                ? Object.keys(relaySupportedTokensBalances).length
                : 0
        };
    }, [nonZeroBalances, yourTokenList, isBalancesLoading, isYourTokenListLoading, balancesError, yourTokenListError]);
};
