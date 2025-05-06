import {
	glyphConnectorDetails,
	GlyphProvider,
	glyphWalletRK,
	StrategyType,
} from "@use-glyph/sdk-react";
import {
	connectorsForWallets,
	RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chain, http, Transport } from "viem";
import { apeChain, base, mainnet } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

const supportedChains: [Chain, ...Chain[]] = [apeChain, mainnet, base];

const connectors = connectorsForWallets(
	[
		{
			groupName: glyphConnectorDetails.name,
			wallets: [glyphWalletRK],
		},
	],
	{
		appName: glyphConnectorDetails.name,
		projectId: glyphConnectorDetails.id,
	}
);

const wagmiConfig = createConfig({
	chains: supportedChains,
	transports: supportedChains.reduce(
		(acc, chain) => {
			acc[chain.id] = http();
			return acc;
		},
		{} as Record<number, Transport>
	),
	connectors,
});

function App() {
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>
					<GlyphProvider strategy={StrategyType.EIP1193}>
						<Consumer />
					</GlyphProvider>
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export default App;
