import { apeChain } from "viem/chains";

export const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL;
export const GLYPH_PRIVY_APP_ID = process.env.PROVIDER_PRIVY_APP_ID;
export const STAGING_GLYPH_PRIVY_APP_ID = "clxt9p8e601al6tgmsyhu7j3t";
export const WIDGET_API_BASE_URL = process.env.WIDGET_API_BASE_URL;
export const GLYPH_ICON_URL = "https://i.ibb.co/TxcwPQyr/Group-12489-1.png";
export const USER_REFRESH_INTERVAL_MS = 60 * 1000;
export const TOKEN_REFRESH_INTERVAL_MS = 60 * 1000;

// TODO: update before launch (and keep it in sync with id.yuga.com/src/lib/web3.ts)
export const RELAY_APP_FEE_RECIPIENT = "0x3c7fb61850cCD1490B820D317f565358D6f1Fb87";
export const RELAY_APP_FEE_BPS = 80;

export const MAX_DECIMALS_FOR_CRYPTO = 6; // Useful for BTC, ETH and other expensive currencies

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
    PROFILE = "profile",
    SWAP = "swap"
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

export enum SwapView {
    START = "swap-start",
    WAIT = "swap-wait",
    END = "swap-end"
}

/** Overload specific chain names */
export const CHAIN_NAMES: Record<number, string> = {
    [apeChain.id]: "ApeChain" // Remove after https://github.com/wevm/viem/pull/4080 is merged and viem is updated to that version
};

export const glyphConnectorDetails = {
    id: "io.useglyph.privy",
    name: "Glyph",
    iconUrl: GLYPH_ICON_URL,
    iconBackground: "#ffffff",
    shortName: "Glyph",
    type: "injected"
} as const;
