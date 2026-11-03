import { demoConfig } from "../../runtime-config";
import { PrivyProvider } from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  GlyphProvider,
  StrategyType,
  useGlyphConfigureDynamicChains,
} from "@use-glyph/sdk-react";
import { useMemo } from "react";
import { fallback, http, Transport } from "viem";
import { mainnet } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

// You can directly use GlyphPrivyProvider directly, but if you want to have full control use this example. Additionally, if you want to use Glyph as a sign in method, you can import GLYPH_APP_LOGIN_METHOD from the lib and use it in the loginMethodsAndOrder array in Privy config.
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
    <PrivyProvider
      appId={runtime.VITE_DEMO_PRIVY_APP_ID} // or process.env.VITE_DEMO_PRIVY_APP_ID (if using next.js)
      clientId={runtime.VITE_DEMO_PRIVY_CLIENT_ID} // or process.env.VITE_DEMO_PRIVY_CLIENT_ID (if using next.js)
      config={{
        loginMethodsAndOrder: {
          primary: ["google", "twitter"],
        },
        embeddedWallets: {
          showWalletUIs: true,
          extendedCalldataDecoding: true,
          ethereum:{
            createOnLogin: "off" // 'users-without-wallets' | 'all-users' | 'off'
          }
        },
        supportedChains: wagmiConfig.chains,
        defaultChain: wagmiConfig.chains[0],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <GlyphProvider glyphUrl={runtime.glyphUrl} useStagingTenant={runtime.useStagingTenant} strategy={StrategyType.PRIVY}>
            <Consumer />
          </GlyphProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;
