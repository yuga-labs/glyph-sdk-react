import { GlyphWalletProvider } from "@use-glyph/sdk-react";
import { Chain } from "viem";
import { apeChain, curtis } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

const supportedChains: [Chain, ...Chain[]] = [apeChain, curtis];

function App() {
	return (
		<GlyphWalletProvider chains={supportedChains} askForSignature={true}>
			<Consumer />
		</GlyphWalletProvider>
	);
}

export default App;
