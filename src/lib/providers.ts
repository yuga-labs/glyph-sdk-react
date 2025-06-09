import { Chain, createPublicClient, fallback, http, PublicClient, webSocket } from "viem";
import { apeChain, curtis, mainnet } from "viem/chains";
import { createLogger } from "./utils";

const logger = createLogger("providers");

export const supportedChains: [Chain, ...Chain[]] = [apeChain, mainnet, curtis];
export const supportedChainIds = supportedChains.map((chain) => chain.id);
export const defaultChain: Chain = supportedChains.find((chain) => chain.id === apeChain.id)!;

export const publicClients = supportedChains.reduce(
    (clients, chain) => {
        const ws = chain.rpcUrls?.default?.webSocket?.[0];
        const ht = chain.rpcUrls?.default?.http?.[0];
        const transports = [ws && webSocket(ws), ht && http(ht)].filter((x) => !!x);
        const client = createPublicClient({
            chain,
            transport: transports.length ? fallback(transports) : http()
        });
        clients[chain.id] = client;
        return clients;
    },
    {} as Record<number, PublicClient>
);

export const getPublicClient = (chainId: number): PublicClient => {
    const client = publicClients[chainId];
    if (!client) {
        logger.error("unsupported chain id", { chainId });
        throw new Error(`No client configured for chain ID: ${chainId}`);
    }
    return client;
};

export const defaultPublicClient = publicClients[defaultChain.id];
