import { useMemo } from "react";
import { RelayAPIToken } from "../../../context/GlyphSwapContext";
import { useRelayYourTokensList } from "../../../hooks/useRelayYourTokensList";
import { relayClient } from "../../../lib/relay";
import { Button } from "../../ui/button";

export default function AddGasToSourceChainButton({
    sourceChainNativeSymbol,
    sourceChainName,
    addGasToSourceChain
}: {
    sourceChainNativeSymbol?: string;
    sourceChainName?: string;
    addGasToSourceChain: (toCurrency: RelayAPIToken | undefined) => void;
}) {
    const chains = relayClient.chains || [];
    const chainIds = useMemo(() => chains.map((chain) => chain.id), []);

    const { relaySupportedTokensBalances } = useRelayYourTokensList("all", chainIds);

    return (
        <Button
            onClick={() => {
                addGasToSourceChain(Object.values(relaySupportedTokensBalances || {})?.[0]?.relayToken ?? undefined);
            }}
            className="gw-w-fit !gw-gap-1 !gw-px-2 !gw-py-0.5 !gw-bg-foreground !gw-text-background !gw-h-5"
        >
            <span className="gw-typography-caption">
                {sourceChainNativeSymbol && sourceChainName
                    ? `Add ${sourceChainNativeSymbol}`
                    : "Add gas on source chain"}
            </span>
        </Button>
    );
}
