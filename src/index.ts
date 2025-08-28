import GlyphWidget from "./components/GlyphWidget";
import LoginButton from "./components/LoginButton";
import LogoutButton from "./components/LogoutButton";
import SignUpButton from "./components/SignUpButton";
import { GlyphProvider } from "./context/GlyphProvider";

export { useBalances } from "./hooks/useBalances";
export { useGlyph } from "./hooks/useGlyph";
export { useGlyphFunding, type GLYPH_FUND_STATUS } from "./hooks/useGlyphFunding";
export {
    useGlyphTokenGate,
    useGlyphOwnershipCheck,
    type GlyphOwnershipCheckRequest,
    type GlyphTokenGateResult,
    type GlyphOwnershipCheckResult
} from "./hooks/useGlyphTokenGate";
export { useGlyphView } from "./hooks/useGlyphView";
export { glyphConnectorDetails } from "./lib/constants";
export { GlyphViewType as GlyphView, StrategyType, WalletClientType } from "./types";
export { GlyphProvider, GlyphWidget, LoginButton, LogoutButton, SignUpButton };

// EIP1193 Exports
export { NativeGlyphConnectButton } from "./components/NativeGlyphConnectButton";
export { useNativeGlyphConnection } from "./hooks/useNativeGlyphConnection";
export { glyphWalletConnector } from "./lib/eip1193/glyphWalletConnector";
export { GlyphWalletProvider } from "./lib/eip1193/GlyphWalletProvider";
export { glyphWalletRK, glyphWalletRKStaging } from "./lib/eip1193/glyphWalletRK";

// Privy Exports
export { GLYPH_ICON_URL, GLYPH_PRIVY_APP_ID, STAGING_GLYPH_PRIVY_APP_ID } from "./lib/constants";
export {
    GLYPH_APP_LOGIN_METHOD,
    default as GlyphPrivyProvider,
    STAGING_GLYPH_APP_LOGIN_METHOD
} from "./lib/privy/GlyphPrivyProvider";
export { InjectWagmiConnector } from "./lib/privy/InjectWagmiConnector";
export { usePrivyCrossAppProvider } from "./lib/privy/usePrivyCrossAppProvider";
