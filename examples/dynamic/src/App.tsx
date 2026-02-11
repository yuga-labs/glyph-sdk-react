import { GlyphEvmWalletConnectors } from "@dynamic-labs-connectors/glyph-global-wallet-evm";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import {
	GlyphProvider,
	StrategyType,
	WalletClientType,
} from "@use-glyph/sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chain, http, Transport } from "viem";
import { apeChain } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

// You also need to enable all these exact chains in your dynamic dashboard for it to work
const supportedChains: [Chain, ...Chain[]] = [apeChain];

const wagmiConfig = createConfig({
	chains: supportedChains,
	transports: supportedChains.reduce(
		(acc, chain) => {
			acc[chain.id] = http();
			return acc;
		},
		{} as Record<number, Transport>
	),
	multiInjectedProviderDiscovery: false,
});

function App() {
	return (
		<DynamicContextProvider
			settings={{
				environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID, // or process.env.DYNAMIC_ENVIRONMENT_ID (if using next.js)
				walletConnectors: [GlyphEvmWalletConnectors(true)],
			}}
		>
			<WagmiProvider config={wagmiConfig}>
				<QueryClientProvider client={queryClient}>
					<DynamicWagmiConnector>
						<GlyphProvider
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
