import { Chain } from "viem";
import { apeChain, base, mainnet } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";
import { GlyphWalletProvider } from "@use-glyph/sdk-react";

const supportedChains: [Chain, ...Chain[]] = [apeChain, mainnet, base];

function App() {
	return (
		<GlyphWalletProvider chains={supportedChains}>
			<Consumer />
		</GlyphWalletProvider>
	);
}

export default App;
