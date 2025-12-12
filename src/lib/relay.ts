import { createClient, MAINNET_RELAY_API, RelayChain } from "@relayprotocol/relay-sdk";

export const SOLANA_RELAY_ID = 792703809;

export const relayClient = createClient({
    baseApiUrl: MAINNET_RELAY_API,
    source: "useglyph.io"
});

export const configureRelayChains = (chains: RelayChain[]) => {
    relayClient.configure({
        chains
    });
};
