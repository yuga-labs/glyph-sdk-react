import { demoConfig } from "../../runtime-config";
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

const runtime = demoConfig(import.meta.env.DEV ? {
    APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_DASHBOARD_BASE_URL: import.meta.env.VITE_DASHBOARD_BASE_URL,
    VITE_WIDGET_API_BASE_URL: import.meta.env.VITE_WIDGET_API_BASE_URL,
    VITE_PROVIDER_PRIVY_APP_ID: import.meta.env.VITE_PROVIDER_PRIVY_APP_ID,
    VITE_DEMO_PRIVY_APP_ID: import.meta.env.VITE_DEMO_PRIVY_APP_ID,
    VITE_DEMO_PRIVY_CLIENT_ID: import.meta.env.VITE_DEMO_PRIVY_CLIENT_ID,
    VITE_DYNAMIC_ENVIRONMENT_ID: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID
} : undefined);

function App() {
    const { chains } = useGlyphConfigureDynamicChains(runtime.glyphUrl, {
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
                connectors: [glyphWalletConnector({ useStagingTenant: runtime.useStagingTenant })]
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
                        glyphUrl={runtime.glyphUrl}
                        useStagingTenant={runtime.useStagingTenant}
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
