import { PrivyProvider } from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  GlyphProvider,
  StrategyType,
  useGlyphConfigureDynamicChains,
} from "@use-glyph/sdk-react";
import { useMemo } from "react";
import { http, Transport } from "viem";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

// You can directly use GlyphPrivyProvider directly, but if you want to have full control use this example. Additionally, if you want to use Glyph as a sign in method, you can import GLYPH_APP_LOGIN_METHOD from the lib and use it in the loginMethodsAndOrder array in Privy config.
function App() {
  const { chains } = useGlyphConfigureDynamicChains();

  const wagmiConfig = useMemo(() => {
    if (chains && chains.length > 0) {
      return createConfig({
        chains: chains,
        transports: chains.reduce(
          (acc, chain) => {
            acc[chain.id] = http();
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
      appId={import.meta.env.VITE_DEMO_PRIVY_APP_ID} // or process.env.VITE_DEMO_PRIVY_APP_ID (if using next.js)
      clientId={import.meta.env.VITE_DEMO_PRIVY_CLIENT_ID} // or process.env.VITE_DEMO_PRIVY_CLIENT_ID (if using next.js)
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
          <GlyphProvider strategy={StrategyType.PRIVY}>
            <Consumer />
          </GlyphProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

export default App;
