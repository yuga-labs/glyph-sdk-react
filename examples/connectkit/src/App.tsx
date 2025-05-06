import {
	GlyphProvider,
	glyphWalletConnector,
	StrategyType,
} from "@use-glyph/sdk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { Chain, http, Transport } from "viem";
import { apeChain, base, mainnet } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

const supportedChains: [Chain, ...Chain[]] = [apeChain, mainnet, base];

const wagmiConfig = createConfig({
	chains: supportedChains,
	transports: supportedChains.reduce(
		(acc, chain) => {
			acc[chain.id] = http();
			return acc;
		},
		{} as Record<number, Transport>
	),
	connectors: [glyphWalletConnector()],
});

function App() {
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<ConnectKitProvider mode="light" theme="rounded">
					<GlyphProvider strategy={StrategyType.EIP1193}>
						<Consumer />
					</GlyphProvider>
				</ConnectKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export default App;
