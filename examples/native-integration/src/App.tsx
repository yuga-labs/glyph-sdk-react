import { GlyphWalletProvider } from "@use-glyph/sdk-react";
import "./App.css";
import Consumer from "./consumer";

function App() {
	return (
		<GlyphWalletProvider askForSignature={true}>
			<Consumer />
		</GlyphWalletProvider>
	);
}

export default App;
