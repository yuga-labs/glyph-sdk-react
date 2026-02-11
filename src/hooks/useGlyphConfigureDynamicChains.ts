import { configureViemChain, RelayChain } from "@relayprotocol/relay-sdk";
import { useEffect, useState } from "react";
import { Chain } from "viem";
import { WIDGET_API_BASE_URL } from "../lib/constants";
import { relayClient } from "../lib/relay";

interface UseGlyphRequiredChainsResult {
    chainIds: [number, ...number[]] | undefined;
    chains: [Chain, ...Chain[]];
}

/**
 * Hook to fetch the list of required Glyph chain IDs (viem chain ids) from an API endpoint. SHOULD ONLY BE USED ONCE AT THE TOP LEVEL.
 *
 * @param glyphUrl - (optional) The URL of the Glyph API endpoint if need to override
 */
export const useGlyphConfigureDynamicChains = (glyphUrl?: string): UseGlyphRequiredChainsResult => {
    const [requiredChainIds, setRequiredChainIds] = useState<[number, ...number[]]>();
    const [viemChains, setViemChains] = useState<[Chain, ...Chain[]]>([] as unknown as [Chain, ...Chain[]]);

    useEffect(() => {
        const fetchRequiredChains = async () => {
            const url = glyphUrl || WIDGET_API_BASE_URL;
            if (!url) return;
            // If required take enableTestnet as param and pass it in the query. Backend doesn't yet support it though - so will have to update it in BE first
            const res = await fetch(`${url}/api/public/supported_chains`, {
                method: "GET"
            });
            if (!res.ok) {
                throw new Error(`Failed to fetch Glyph required chains: ${res.status} ${res.statusText}`);
            }
            const data = (await res.json()) as {
                chains: RelayChain[];
                supportedChains: number[];
            };

            if (
                Array.isArray(data.supportedChains) &&
                Array.isArray(data.chains) &&
                data.supportedChains.length > 0 &&
                data.chains.length > 0
            ) {
                setRequiredChainIds(data.supportedChains as [number, ...number[]]);
                // It's technically RelayChain not Chain, but we're casting for compatibility - let's see if it works
                setViemChains(
                    data.chains.map((chain) => configureViemChain(chain as any).viemChain) as [Chain, ...Chain[]]
                );

                // Configure relay client dynamically
                relayClient.configure({
                    chains: data.chains
                });
            } else {
                throw new Error("No supported chains returned from API");
            }
        };

        if (!requiredChainIds) {
            fetchRequiredChains();
        }
    }, [glyphUrl, requiredChainIds]);

    return { chainIds: requiredChainIds, chains: viemChains };
};
