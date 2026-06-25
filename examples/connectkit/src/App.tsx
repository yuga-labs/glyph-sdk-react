import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
    GlyphProvider,
    glyphWalletConnector,
    StrategyType,
    useGlyphConfigureDynamicChains,
    WalletClientType
} from "@use-glyph/sdk-react";
import { ConnectKitProvider } from "connectkit";
import { useMemo } from "react";
import { fallback, http, Transport } from "viem";
import { mainnet } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

function App() {
    const { chains } = useGlyphConfigureDynamicChains(undefined, {
        [mainnet.id]: "https://ethereum-rpc.publicnode.com"
    });

    const wagmiConfig = useMemo(() => {
        if (chains && chains.length > 0) {
            return createConfig({
                chains,
                transports: chains.reduce(
                    (acc, chain) => {
                        const https = (chain.rpcUrls?.default?.http ?? []).filter(Boolean);
                        acc[chain.id] = https.length ? fallback(https.map((url) => http(url))) : http();
                        return acc;
                    },
                    {} as Record<number, Transport>
                ),
                connectors: [glyphWalletConnector()]
            });
        }
        return null;
    }, [chains]);

    if (!wagmiConfig) {
        return null;
    }
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider mode="light" theme="rounded">
                    <GlyphProvider
                        strategy={StrategyType.EIP1193}
                        walletClientType={WalletClientType.CONNECTKIT}
                        askForSignature={true}
                    >
                        <Consumer />
                    </GlyphProvider>
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default App;
