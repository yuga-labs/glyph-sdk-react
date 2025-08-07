import { GlyphWalletProvider } from "@use-glyph/sdk-react";
import { Chain } from "viem";
import { apeChain, base, curtis, mainnet } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

const supportedChains: [Chain, ...Chain[]] = [apeChain, curtis, mainnet, base];

function App() {
	return (
		<GlyphWalletProvider chains={supportedChains} askForSignature={true}>
			<Consumer />
		</GlyphWalletProvider>
	);
}

export default App;
