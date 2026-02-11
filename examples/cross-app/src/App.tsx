import { GlyphPrivyProvider } from "@use-glyph/sdk-react";
import { Chain } from "viem";
import { apeChain, base, curtis, mainnet, polygon, sepolia } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

const supportedChains: [Chain, ...Chain[]] = [apeChain, curtis, mainnet, base, polygon, sepolia];

function App() {
	return (
		<GlyphPrivyProvider
			appId={import.meta.env.VITE_DEMO_PRIVY_APP_ID} // or process.env.VITE_DEMO_PRIVY_APP_ID (if using next.js)
			clientId={import.meta.env.VITE_DEMO_PRIVY_CLIENT_ID} // or process.env.VITE_DEMO_PRIVY_CLIENT_ID (if using next.js)
			config={{
				embeddedWallets: {
					createOnLogin: "off", // 'users-without-wallets' | 'all-users' | 'off'
					showWalletUIs: true,
					extendedCalldataDecoding: true,
				},
				supportedChains,
				defaultChain: apeChain,
			}}
			chains={supportedChains}
		>
			<Consumer />
		</GlyphPrivyProvider>
	);
}

export default App;
