import { configureViemChain } from "@relayprotocol/relay-sdk";
import { createPublicClient, extractChain, fallback, http } from "viem";
import { relayClient } from "./relay";
import { mainnet } from "viem/chains";

/**
 * Intended primarily for client-side code. Could be used as a fallback on server-side code, but bear in mind we could be rate-limited.
 */
export function createDefaultPublicClient(chainId: number) {
    const relayChains = relayClient?.chains || [];

    const viemChains = relayChains.map((c) => configureViemChain(c as any).viemChain);

    // configureViemChain discards a RelayChain's httpRpcUrl for well-known chains and returns viem's bundled
    // chain, whose default RPC (e.g. eth.merkle.io for mainnet) can be unreliable. Read the relay chain's
    // httpRpcUrl directly so the consumer's rpcUrls override (which useGlyphConfigureDynamicChains injects onto
    // httpRpcUrl) — and otherwise the relay-provided RPC — take precedence over the viem default.
    const httpRpcUrl = relayChains.find((c: any) => c.id === chainId)?.httpRpcUrl;

    return createPublicClient({
        chain: extractChain({ chains: viemChains, id: chainId }),
        transport: httpRpcUrl
            ? http(httpRpcUrl)
            : chainId === mainnet.id
              ? fallback([http("https://ethereum-rpc.publicnode.com"), http()])
              : http()
    });
}
