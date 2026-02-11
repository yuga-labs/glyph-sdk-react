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
import { http, Transport } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

function App() {
    const { chains } = useGlyphConfigureDynamicChains();

    const wagmiConfig = useMemo(() => {
        if (chains && chains.length > 0) {
            return createConfig({
                chains,
                transports: chains.reduce(
                    (acc, chain) => {
                        acc[chain.id] = http();
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
