import { createClient, MAINNET_RELAY_API, paths, RelayChain } from "@relayprotocol/relay-sdk";

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

export async function fetchRelayRequests(
    queryOptions: Record<string, string>
): Promise<paths["/requests/v2"]["get"]["responses"]["200"]["content"]["application/json"]> {
    const url = `${MAINNET_RELAY_API}/requests/v2?${new URLSearchParams(queryOptions)}`;
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    if (!res.ok) {
        console.warn("relay-get-onramp-reqs", res.statusText);
        throw new Error(res.statusText);
    }

    const body = (await res.json()) as paths["/requests/v2"]["get"]["responses"]["200"]["content"]["application/json"];
    if (!body.requests?.length) throw new Error(`No Relay requests found for ${queryOptions}`);

    return body;
}
