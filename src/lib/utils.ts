import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { Chain, EIP1193Provider, formatUnits, parseUnits, zeroAddress } from "viem";
import { injected } from "wagmi";
import { RelayAPIToken } from "../context/GlyphSwapContext";
import {
    GLYPH_PRIVY_APP_ID,
    glyphConnectorDetails,
    MAX_DECIMALS_FOR_CRYPTO,
    STAGING_GLYPH_PRIVY_APP_ID
} from "./constants";
import { relayClient } from "./relay";

const addressRegex = /^0x[a-fA-F0-9]{40}$/;

export const TWITTER_IMAGE_URL_REGEX = /https?:\/\/(?:[a-zA-Z0-9-]+\.)*twimg\.com/;

const txMerge = extendTailwindMerge({
    prefix: "gw-"
});

export function cn(...inputs: ClassValue[]) {
    return txMerge(clsx(inputs));
}

export function copyToClipboard(text: string) {
    if (!window.isSecureContext || !text) {
        return false;
    }

    navigator.clipboard.writeText(text);

    return true;
}

export const generateNonce = () => {
    // Generate a random number that fits within Number.MAX_SAFE_INTEGER
    const array = new Uint8Array(8); // 8 bytes = 64 bits
    crypto.getRandomValues(array);

    // Convert to number, ensuring it's within safe range
    const number = Number(
        "0x" +
            Array.from(array)
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
    );
    return number % Number.MAX_SAFE_INTEGER;
};

export const ethereumAvatar = (address: string | undefined) => {
    return `https://effigy.im/a/${address || "0x0000000000000000000000000000000000000000"}.svg`;
};

export function isEthereumAddress(address?: string): boolean {
    if (!address) return false;
    return addressRegex.test(address);
}

// Intended to prevent console.logs to be stripped out by production builds
const ROOT_NAMESPACE = "GlyphWidget";
export const createLogger = (namespace: string) => {
    const debug = Function.prototype.bind.call(console.debug, console);
    const log = Function.prototype.bind.call(console.log, console);
    const name = `${ROOT_NAMESPACE}/${namespace}`;
    return {
        debug: (...args: any[]) => {
            debug(`[${name}]`, ...args);
        },
        log: (...args: any[]) => {
            log(`[${name}]`, ...args);
        },
        warn: (...args: any[]) => {
            console.warn(`[${name}]`, ...args);
        },
        error: (...args: any[]) => {
            console.error(`[${name}]`, ...args);
        }
    };
};

export function tokenToBigIntWei(balance: number | string, decimals: number) {
    return BigInt(parseUnits(balance.toString(), decimals));
}

export const displayNumberPrecision = (value: number | null | undefined, precision = 2) => {
    return Number(
        value
            ?.toLocaleString?.("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: precision
            })
            ?.replace(/,/g, "") || "0"
    );
};

export const formatTokenCount = (valueInWei: bigint | number | string, decimals: number, displayDecimals?: number) => {
    const resolvedDisplayDecimals = displayDecimals ?? MAX_DECIMALS_FOR_CRYPTO;
    const resolvedValue = displayNumberPrecision(
        parseFloat(formatUnits(BigInt(valueInWei), decimals)),
        Math.min(resolvedDisplayDecimals, MAX_DECIMALS_FOR_CRYPTO)
    );
    return resolvedValue === 0 && BigInt(valueInWei) > 0n ? `< ${10 ** -resolvedDisplayDecimals}` : resolvedValue;
};

export const wagmiCrossAppConnector = (provider: EIP1193Provider, useStagingTenant?: boolean) =>
    injected({
        target: {
            id: useStagingTenant ? STAGING_GLYPH_PRIVY_APP_ID : GLYPH_PRIVY_APP_ID,
            name: glyphConnectorDetails.name,
            provider: provider,
            icon: glyphConnectorDetails.iconUrl
        }
    });

export function assertHasValue<T>(item: T, message?: string): asserts item is NonNullable<T> {
    if (item === undefined || item === null) {
        throw new Error(message || `Expected item to have a value, got: ${item}`);
    }
}

export function assertAndReturn<T>(item: T, message?: string): NonNullable<T> {
    assertHasValue(item, message);
    return item;
}

export const getRPCErrorString = (error: any) => {
    try {
        if (
            (typeof error === "string" && error?.toLowerCase()?.includes("estimategas")) ||
            (error?.toLowerCase()?.includes?.("gas") && error?.toLowerCase()?.includes?.("exceeds"))
        ) {
            return "Not enough gas available";
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        // ignore error
    }

    return typeof error === "string" && error.length < 255
        ? error
        : typeof error === "object"
          ? (error as any)?.message
          : undefined;
};

export function getBlockExplorerURL(chainId: number, chains?: readonly Chain[]) {
    const chain = chains?.find((chain) => chain.id === chainId);
    if (!chain) {
        throw new Error("Not a supported chain");
    }
    return chain.blockExplorers!.default.url || null;
}

export function getBlockExplorerName(chainId: number, chains?: readonly Chain[]) {
    const chain = chains?.find((chain) => chain.id === chainId);
    if (!chain) {
        throw new Error("Not a supported chain");
    }
    return chain.blockExplorers!.default.name;
}

export function getRelayChainsAndIcons() {
    const chains = relayClient?.chains;

    // Create a map of chainId -> iconUrl and cache it
    const iconMap = new Map<number, string>();
    chains.forEach((chain) => {
        if (chain.id && chain.iconUrl) iconMap.set(chain.id, chain.iconUrl);
    });

    return { chains, iconMap };
}

export const chainIdToRelayChain = (chainId: number) => {
    return relayClient?.chains?.find((chain) => chain.id === chainId) || null;
};

export const isNativeAndWrappedPair = (
    fromCurrency: RelayAPIToken | undefined,
    toCurrency: RelayAPIToken | undefined
) => {
    // If any of them is undefined return false
    if (!fromCurrency || !toCurrency) return false;

    // Have to be on same network
    if (fromCurrency?.chainId !== toCurrency?.chainId) return false;

    // One of them has to be the native token
    if (![fromCurrency?.address?.toLowerCase?.(), toCurrency?.address?.toLowerCase?.()].includes(zeroAddress))
        return false;

    const chains = relayClient?.chains || [];
    // We inject wrappedTokenAddress from the Glyph Backend while fetching `supported_chains`
    const wrappedTokenAddress = (chains.find((chain) => chain.id === fromCurrency.chainId) as any)?.wrappedTokenAddress;

    // One of them has to be the wrapped token
    if (
        ![fromCurrency?.address?.toLowerCase?.(), toCurrency?.address?.toLowerCase?.()].includes(
            wrappedTokenAddress?.toLowerCase?.()
        )
    )
        return false;

    return true;
};
