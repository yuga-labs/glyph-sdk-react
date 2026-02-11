import { Hex } from "viem";
import { WalletView } from "../lib/constants";
import { WalletMainViewTab } from "../lib/constants";

export enum StrategyType {
    PRIVY = "privy",
    EIP1193 = "eip1193"
}
export const DEFAULT_STRATEGY = StrategyType.PRIVY;
export enum WalletClientType {
    RAINBOWKIT = "rainbowkit",
    CONNECTKIT = "connectkit",
    THIRDWEB = "thirdweb",
    WAGMI = "wagmi",
    DYNAMIC = "dynamic"
}

export const GlyphViewType = {
    CLOSED: "closed",
    OPEN: "open",
    ...WalletView,
    ...WalletMainViewTab
} as const;
export type GlyphViewType = (typeof GlyphViewType)[keyof typeof GlyphViewType];

export interface BaseGlyphProviderOptions {
    glyphUrl?: string;
    useStagingTenant?: boolean;
    onLogin?: () => void;
    onLogout?: () => void;
    children: React.ReactNode;
}

export interface EIP1193GlyphProviderOptionsWithSignature extends BaseGlyphProviderOptions {
    strategy: StrategyType.EIP1193;
    walletClientType: WalletClientType;
    askForSignature?: boolean;
}

export interface PrivyGlyphProviderOptions extends BaseGlyphProviderOptions {
    strategy: StrategyType.PRIVY;
}

export type GlyphProviderOptions = EIP1193GlyphProviderOptionsWithSignature | PrivyGlyphProviderOptions;

export interface BaseGlyphProviderOptionsWithSignature extends BaseGlyphProviderOptions {
    askForSignature?: boolean;
}

export type GlyphWidgetTokenBalancesItem = {
    name: string;
    symbol: string;
    value: string;
    valueInWei: string;
    amount: string;
    currency: string;
    native: boolean;
    hide?: boolean;
    address: Hex;
    rateInCurrency: string;
    decimals: number;
    displayDecimals: number;
    priceChangePct: number;
};

export type GlyphWidgetNFTBalancesItem = {
    address: Hex;
    name: string;
    symbol: string;
    image: string | null; // fallback (to be deprecated in favour of contractImage)
    contractImage: string | null;
    items: {
        tokenId: string;
        symbol: string;
        name: string; // fallback (to be deprecated in favour of tokenName)
        tokenName: string;
        tokenImage: string;
        balance: string; // numeric
        owner: string;
        fromLinked: boolean;
        fromDelegated: boolean;
        image?: {
            cachedUrl: string;
            thumbnailUrl: string;
            pngUrl: string;
            contentType: string;
            size: number;
            originalUrl: string;
        };
    }[];
};

export type GlyphWidgetBalances = {
    tokens: GlyphWidgetTokenBalancesItem[];
    nfts: GlyphWidgetNFTBalancesItem[];
};

export type GlyphWidgetButtonProps = {
    showAvatar?: boolean;
    showBalance?: boolean;
    showUsername?: boolean;
};

export type GlyphWidgetProps = {
    buttonProps?: GlyphWidgetButtonProps;
};

export type GlyphWidgetUser = {
    hasProfile: boolean;
    id: string;
    name: string;
    picture: string;
    evmWallet: string;
    smartWallet?: string;
    solanaWallet?: string;
    linkedWallets?: {
        address: string;
        walletClientType?: string;
    }[];
    currency: string;
    minFundingAmount: number;
    maxFundingAmount: number;
    country: string;
    subdivision?: string;
    cb_chain: string;
    cb_token: string;
    hasGoogle?: boolean;
    hasApple?: boolean;
    hasEmail?: boolean;
    hasTwitter?: boolean;
    isOnrampEnabled?: boolean;
    blockExplorerUrl?: string;
} | null;

export type GlyphWidgetSession = {
    id: string;
    status: "new" | "active";
    username: string | null;
};
