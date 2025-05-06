import { GlyphProvider } from "@use-glyph/sdk-react";
import { PrivyProvider } from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Chain, http, Transport } from "viem";
import { apeChain, base, mainnet } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

const queryClient = new QueryClient();

const supportedChains: [Chain, ...Chain[]] = [apeChain, mainnet, base];
const defaultChain = apeChain;

const wagmiConfig = createConfig({
	chains: supportedChains,
	transports: supportedChains.reduce(
		(acc, chain) => {
			acc[chain.id] = http();
			return acc;
		},
		{} as Record<number, Transport>
	),
});

// You can directly use GlyphPrivyProvider directly, but if you want to have full control use this example. Additionally, if you want to use Glyph as a sign in method, you can import GLYPH_APP_LOGIN_METHOD from the lib and use it in the loginMethodsAndOrder array in Privy config.
function App() {
	return (
		<PrivyProvider
			appId={"cm4vofyfw04npzg40krvtmgip"}
			clientId={"client-WY5eXhhUuWyyySiHcTcAKA7nD3X3e5SEwiD9dhhZjeRxz"}
			config={{
				loginMethodsAndOrder: {
					primary: ["google", "twitter"],
				},
				embeddedWallets: {
					createOnLogin: "users-without-wallets", // 'users-without-wallets' | 'all-users' | 'off'
					showWalletUIs: true,
					extendedCalldataDecoding: true,
				},
				supportedChains,
				defaultChain,
			}}
		>
			<QueryClientProvider client={queryClient}>
				<WagmiProvider config={wagmiConfig}>
					<GlyphProvider>
						<Consumer />
					</GlyphProvider>
				</WagmiProvider>
			</QueryClientProvider>
		</PrivyProvider>
	);
}

export default App;
