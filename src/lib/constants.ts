import { apeChain, base, curtis, mainnet, polygon } from "viem/chains";
import APE_ETH from "../assets/svg/APE_ETH";
import APE_USD from "../assets/svg/APE_USD";
import WAPEIcon from "../assets/svg/APE_WAPE";
import APEIcon from "../assets/svg/APEIcon";
import ETH from "../assets/svg/ETH";
import ApechainIcon from "../assets/svg/ApechainIcon";
import USDCIcon from "../assets/svg/USDCIcon";
import BaseIcon from "../assets/svg/BaseIcon";
import ApecoinIcon from "../assets/svg/APEIcon";
import POL from "../assets/svg/POL";

export const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL;
export const GLYPH_PRIVY_APP_ID = process.env.PROVIDER_PRIVY_APP_ID;
export const STAGING_GLYPH_PRIVY_APP_ID = "clxt9p8e601al6tgmsyhu7j3t";
export const WIDGET_API_BASE_URL = process.env.WIDGET_API_BASE_URL;
export const GLYPH_ICON_URL = "https://i.ibb.co/TxcwPQyr/Group-12489-1.png";
export const USER_REFRESH_INTERVAL_MS = 60 * 1000;
export const TOKEN_REFRESH_INTERVAL_MS = 60 * 1000;

export enum INTERNAL_GRADIENT_TYPE {
    PRIMARY = "primary",
    SUCCESS = "success",
    ERROR = "error"
}

export enum WalletView {
    MAIN = "main",
    FUND = "fund",
    SEND = "send",
    RECEIVE = "receive",
    PROFILE = "profile"
}

export enum WalletMainViewTab {
    HOME = "home",
    ACTIVITY = "activity",
    TOKENS = "tokens",
    NFTS = "nfts",
    LINKED_ACCOUNTS = "linked-accounts"
}

export enum FundView {
    // START = "fund-start",
    BUY = "fund-buy",
    WAIT = "fund-wait",
    END = "fund-end"
}

export enum SendView {
    ENTER_ADDRESS = "send-enter-address",
    ENTER_AMOUNT = "send-enter-amount",
    WAIT = "send-wait",
    END = "send-end"
}

// Should be in sync with the id.yuga.com icons (See: https://github.com/yuga-labs/id.yuga.com)
export const CHAIN_ICONS: Record<number, React.FC<React.SVGProps<SVGSVGElement>>> = {
    [apeChain.id]: ApechainIcon,
    [curtis.id]: ApechainIcon,
    [mainnet.id]: ETH,
    [base.id]: BaseIcon,
    [polygon.id]: POL
};

/** Overload specific chain names */
export const CHAIN_NAMES: Record<number, string> = {
    [apeChain.id]: "ApeChain", // Remove after https://github.com/wevm/viem/pull/4080 is merged
}

export const TOKEN_LOGOS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    APE: APEIcon,
    ApeETH: APE_ETH,
    ApeUSD: APE_USD,
    WAPE: WAPEIcon,
    wAPE: WAPEIcon,
    ETH: ETH,
    USDC: USDCIcon
};

export const NATIVE_TOKEN_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    APE: ApecoinIcon,
    ETH: ETH,
    POL: POL
};

export const TESTNET_CSS_CLASS = "gw-grayscale";
export const IS_TESTNET_CHAIN: Map<number, boolean> = new Map([[curtis.id, true]]);

export const glyphConnectorDetails = {
    id: "io.useglyph.privy",
    name: "Glyph",
    iconUrl: GLYPH_ICON_URL,
    iconBackground: "#ffffff",
    shortName: "Glyph",
    type: "injected"
} as const;
