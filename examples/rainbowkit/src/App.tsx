import {
	connectorsForWallets,
	RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	glyphConnectorDetails,
	GlyphProvider,
	glyphWalletRK,
	StrategyType,
	useGlyphConfigureDynamicChains,
	WalletClientType,
} from "@use-glyph/sdk-react";
import { useMemo } from "react";
import { http, Transport } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

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

function App() {
	const { chains } = useGlyphConfigureDynamicChains()

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
				connectors: connectors,
			})
		}
		return null
	}, [chains])

	if (!wagmiConfig) {
		return null
	}

	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>
					<GlyphProvider
						strategy={StrategyType.EIP1193}
						walletClientType={WalletClientType.RAINBOWKIT}
						askForSignature={true}
					>
						<Consumer />
					</GlyphProvider>
				</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export default App;
