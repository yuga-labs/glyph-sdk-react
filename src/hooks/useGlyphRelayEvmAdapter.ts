import { AdaptedWallet, LogLevel } from "@relayprotocol/relay-sdk";
import { useMemo } from "react";
import { useGlyph } from "./useGlyph";

import { Address, hexToBigInt } from "viem";
import { Config, useSwitchChain } from "wagmi";
import { getChainId, getPublicClient } from "wagmi/actions";
import { relayClient } from "../lib/relay";
import { assertHasValue } from "../lib/utils";

export const useGlyphRelayEvmAdapter = (config: Config | undefined): AdaptedWallet | null => {
    const { user, signMessage, signTypedData, sendTransaction } = useGlyph();

    const { switchChainAsync } = useSwitchChain();

    return useMemo(() => {
        if (!user?.evmWallet || !switchChainAsync || !config) {
            return null;
        }

        return {
            vmType: "evm",
            address: () => Promise.resolve(user?.evmWallet),
            getChainId: async () => {
                const chainId = getChainId(config);
                console.log("getting chain id for relay:", chainId);
                return chainId;
            },
            handleSignMessageStep: async (stepItem) => {
                const signData = stepItem.data?.sign;
                let signature: string | undefined;
                if (signData) {
                    if (signData.signatureKind === "eip191") {
                        relayClient.log(["Execute Steps: Signing with eip191"], LogLevel.Verbose);
                        if (signData.message.match(/0x[0-9a-fA-F]{64}/)) {
                            // If the message represents a hash, we need to convert it to raw bytes first
                            signature = await signMessage({
                                message: signData.message
                            });
                        } else {
                            signature = await signMessage({
                                message: signData.message
                            });
                        }
                    } else if (signData.signatureKind === "eip712") {
                        relayClient.log(["Execute Steps: Signing with eip712"], LogLevel.Verbose);
                        signature = await signTypedData({
                            data: {
                                domain: signData.domain as any,
                                types: signData.types as any,
                                primaryType: signData.primaryType,
                                message: signData.value
                            }
                        });
                    }
                }
                return signature;
            },
            handleSendTransactionStep: async (chainId, stepItem) => {
                const stepData = stepItem.data;
                return sendTransaction({
                    transaction: {
                        data: stepData.data,
                        to: stepData.to,
                        value: hexToBigInt((stepData.value as any) || 0),
                        from: stepData.from,
                        chainId: chainId
                    }
                });
            },
            handleConfirmTransactionStep: async (txHash, chainId, onReplaced, onCancelled) => {
                const publicClient = getPublicClient(config, { chainId: chainId });
                assertHasValue(publicClient, "publicClient is required");
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: txHash as Address,
                    onReplaced: (replacement) => {
                        if (replacement.reason === "cancelled") {
                            onCancelled();
                            throw Error("Transaction cancelled");
                        }
                        onReplaced(replacement.transaction.hash);
                    }
                });

                return receipt;
            },
            switchChain: async (chainId) => {
                console.log("switching chain to:", chainId, "for relay");
                await switchChainAsync({ chainId });
            }
        };
    }, [switchChainAsync, sendTransaction, signMessage, signTypedData, user?.evmWallet, config]);
};
