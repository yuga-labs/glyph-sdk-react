import { useGlyphApi } from "./useGlyphApi";
import { GlyphWidgetTokenBalancesItem } from "../types";
import { useGlyph } from "./useGlyph";
import { useQuery } from "@tanstack/react-query";
import { checksumAddress, Hex } from "viem";

export const useTokenBalance = (
    tokenAddress: string | undefined,
    chainId: number | undefined
): {
    balance: string | undefined;
    isLoading: boolean;
    error: string | undefined;
} => {
    const { balances } = useGlyph();
    const { glyphApiFetch } = useGlyphApi();

    // first try to find the token in the balances.tokens array
    const foundToken = tokenAddress && chainId
        ? balances?.tokens?.find?.(
            (token) =>
                token.chainId === chainId &&
                checksumAddress(token.address as Hex) === checksumAddress(tokenAddress as Hex)
        )
        : undefined;

    // ...otherwise, fetch from API
    const { data: fetchedValueInWei, isLoading, error } = useQuery({
        queryKey: ["tokenBalance", tokenAddress, chainId],
        queryFn: async () => {
            if (!tokenAddress || !chainId || !glyphApiFetch) {
                return undefined;
            }

            const response = await glyphApiFetch(`/api/widget/balances/${tokenAddress}?chainId=${chainId}`);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json() as GlyphWidgetTokenBalancesItem;
            return data.valueInWei;
        },
        // there are rare instances where chainId is `0x0000000000000000000000000000000000000000`, so we protect ourselves against this
        enabled: !foundToken && !!tokenAddress && Number.isInteger(chainId) && Number(chainId) !== 0
    });

    return {
        balance: foundToken?.valueInWei ?? fetchedValueInWei ?? "0", // if no balance found, return 0 so query result is not undefined
        isLoading,
        error: error ? (error as Error).message : undefined
    };
};
