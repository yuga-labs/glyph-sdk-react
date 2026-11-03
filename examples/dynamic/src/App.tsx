import { demoConfig } from "../../runtime-config";
import { GlyphEvmWalletConnectors } from "@dynamic-labs-connectors/glyph-global-wallet-evm";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  GlyphProvider,
  StrategyType,
  useGlyphConfigureDynamicChains,
  WalletClientType,
} from "@use-glyph/sdk-react";
import { useMemo } from "react";
import { fallback, http, Transport } from "viem";
import { mainnet } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

// You also need to enable all these exact chains in your dynamic dashboard for it to work

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
    [mainnet.id]: "https://ethereum-rpc.publicnode.com",
  });

  const wagmiConfig = useMemo(() => {
    if (chains && chains.length > 0) {
      return createConfig({
        chains: chains,
        transports: chains.reduce(
          (acc, chain) => {
            const https = (chain.rpcUrls?.default?.http ?? []).filter(Boolean);
            acc[chain.id] = https.length ? fallback(https.map((url) => http(url))) : http();
            return acc;
          },
          {} as Record<number, Transport>
        ),
      });
    }
    return undefined;
  }, [chains]);

  if (!wagmiConfig) {
    return null;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: runtime.VITE_DYNAMIC_ENVIRONMENT_ID, // or process.env.DYNAMIC_ENVIRONMENT_ID (if using next.js)
        walletConnectors: [GlyphEvmWalletConnectors(runtime.useStagingTenant)],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>
            <GlyphProvider
              glyphUrl={runtime.glyphUrl}
              useStagingTenant={runtime.useStagingTenant}
              strategy={StrategyType.EIP1193}
              walletClientType={WalletClientType.DYNAMIC}
            >
              <Consumer />
            </GlyphProvider>
          </DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}

export default App;
