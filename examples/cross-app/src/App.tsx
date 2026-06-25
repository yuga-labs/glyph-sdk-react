import { GlyphPrivyProvider } from "@use-glyph/sdk-react";
import "./App.css";
import Consumer from "./consumer";
import { mainnet } from "viem/chains";

function App() {
    return (
        <GlyphPrivyProvider
            appId={import.meta.env.VITE_DEMO_PRIVY_APP_ID} // or process.env.VITE_DEMO_PRIVY_APP_ID (if using next.js)
            clientId={import.meta.env.VITE_DEMO_PRIVY_CLIENT_ID} // or process.env.VITE_DEMO_PRIVY_CLIENT_ID (if using next.js)
            config={{
                embeddedWallets: {
                    showWalletUIs: true,
                    extendedCalldataDecoding: true,
                    ethereum: {
                        createOnLogin: "off" // 'users-without-wallets' | 'all-users' | 'off'
                    }
                }
            }}
            rpcUrls={{
                [mainnet.id]: "https://ethereum-rpc.publicnode.com"
            }}
        >
            <Consumer />
        </GlyphPrivyProvider>
    );
}

export default App;
