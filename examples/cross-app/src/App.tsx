import { demoConfig } from "../../runtime-config";
import { GlyphPrivyProvider } from "@use-glyph/sdk-react";
import "./App.css";
import Consumer from "./consumer";
import { mainnet } from "viem/chains";

const runtime = demoConfig(import.meta.env.DEV ? {
    APP_ENV: import.meta.env.VITE_APP_ENV,
    VITE_DASHBOARD_BASE_URL: import.meta.env.VITE_DASHBOARD_BASE_URL,
    VITE_WIDGET_API_BASE_URL: import.meta.env.VITE_WIDGET_API_BASE_URL,
    VITE_PROVIDER_PRIVY_APP_ID: import.meta.env.VITE_PROVIDER_PRIVY_APP_ID,
    VITE_DEMO_PRIVY_APP_ID: import.meta.env.VITE_DEMO_PRIVY_APP_ID,
    VITE_DEMO_PRIVY_CLIENT_ID: import.meta.env.VITE_DEMO_PRIVY_CLIENT_ID,
    VITE_DYNAMIC_ENVIRONMENT_ID: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID
} : undefined);

function App() {
    return (
        <GlyphPrivyProvider
            glyphUrl={runtime.glyphUrl}
            useStagingTenant={runtime.useStagingTenant}
            appId={runtime.VITE_DEMO_PRIVY_APP_ID} // or process.env.VITE_DEMO_PRIVY_APP_ID (if using next.js)
            clientId={runtime.VITE_DEMO_PRIVY_CLIENT_ID} // or process.env.VITE_DEMO_PRIVY_CLIENT_ID (if using next.js)
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
