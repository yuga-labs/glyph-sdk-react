import { erc20Abi, Hex, zeroAddress } from "viem";
import { useBalance, useReadContract } from "wagmi";

export const useTokenBalance = (
    account: Hex | undefined,
    tokenAddress: Hex | undefined,
    chainId: number | undefined
): {
    balance: bigint | undefined;
    isLoading: boolean;
    error: string | undefined;
} => {
    const isNative = tokenAddress === zeroAddress;

    const {
        data: balance,
        isLoading: balanceLoading,
        error: balanceError
    } = useReadContract({
        abi: erc20Abi,
        address: tokenAddress,
        functionName: "balanceOf",
        args: [account as Hex],
        chainId,
        query: {
            enabled: !!tokenAddress && !!chainId && !!account && !isNative
        }
    });

    const {
        data: nativeBalance,
        isLoading: nativeBalanceLoading,
        error: nativeBalanceError
    } = useBalance({
        address: account,
        chainId,
        query: {
            enabled: !!tokenAddress && !!chainId && !!account && isNative
        }
    });

    return {
        balance: isNative ? nativeBalance?.value : balance,
        isLoading: isNative ? nativeBalanceLoading : balanceLoading,
        error: isNative ? nativeBalanceError?.message : balanceError?.message
    };
};
