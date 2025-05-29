import { Chain, createPublicClient, fallback, http, PublicClient, webSocket } from "viem";
import { apeChain, curtis } from "viem/chains";

export const supportedChains: [Chain, ...Chain[]] = [curtis, apeChain];
export const supportedChainIds = supportedChains.map((chain) => chain.id);
export const defaultChain: Chain = supportedChains.find((chain) => chain.id === apeChain.id)!;

export const wsClient: PublicClient = createPublicClient({
    chain: defaultChain,
    transport: fallback([webSocket(), http()])
});

// viem had a bug that broke the WS client, but it's been fixed so we make
// the publicClient and wsClient one and the same.
export const publicClient = wsClient;
