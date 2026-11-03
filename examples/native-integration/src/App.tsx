import { demoConfig } from "../../runtime-config";
import { GlyphWalletProvider } from "@use-glyph/sdk-react";
import { mainnet } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

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
        <GlyphWalletProvider
            glyphUrl={runtime.glyphUrl}
            useStagingTenant={runtime.useStagingTenant}
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
