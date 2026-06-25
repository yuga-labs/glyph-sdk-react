import { GlyphWalletProvider } from "@use-glyph/sdk-react";
import { mainnet } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

function App() {
    return (
        <GlyphWalletProvider
            askForSignature={true}
            rpcUrls={{
                [mainnet.id]: "https://ethereum-rpc.publicnode.com"
            }}
        >
            <Consumer />
        </GlyphWalletProvider>
    );
}

export default App;
