import { configureViemChain } from "@relayprotocol/relay-sdk";
import { createPublicClient, extractChain, http } from "viem";
import { relayClient } from "./relay";

/**
 * Intended primarily for client-side code. Could be used as a fallback on server-side code, but bear in mind we could be rate-limited.
 */
export function createDefaultPublicClient(chainId: number) {
    const relayChains = relayClient?.chains || [];

    const viemChains = relayChains.map((c) => configureViemChain(c as any).viemChain);

    return createPublicClient({
        chain: extractChain({ chains: viemChains, id: chainId }),
        transport: http()
    });
}
