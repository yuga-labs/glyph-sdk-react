import { GlyphPrivyProvider } from "@use-glyph/sdk-react";
import "./App.css";
import Consumer from "./consumer";

function App() {
    return (
        <GlyphPrivyProvider
            appId={import.meta.env.VITE_DEMO_PRIVY_APP_ID} // or process.env.VITE_DEMO_PRIVY_APP_ID (if using next.js)
            clientId={import.meta.env.VITE_DEMO_PRIVY_CLIENT_ID} // or process.env.VITE_DEMO_PRIVY_CLIENT_ID (if using next.js)
            config={{
                embeddedWallets: {
                    createOnLogin: "off", // 'users-without-wallets' | 'all-users' | 'off'
                    showWalletUIs: true,
                    extendedCalldataDecoding: true
                }
            }}
        >
            <Consumer />
        </GlyphPrivyProvider>
    );
}

export default App;
