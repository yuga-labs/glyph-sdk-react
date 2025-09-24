import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { EIP1193Provider, parseUnits } from "viem";
import { injected } from "wagmi";
import { GLYPH_PRIVY_APP_ID, glyphConnectorDetails, STAGING_GLYPH_PRIVY_APP_ID } from "./constants";

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

export function tokenToBigIntWei(balance: number, decimals: number) {
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

export const wagmiCrossAppConnector = (provider: EIP1193Provider, useStagingTenant?: boolean) =>
    injected({
        target: {
            id: useStagingTenant ? STAGING_GLYPH_PRIVY_APP_ID : GLYPH_PRIVY_APP_ID,
            name: glyphConnectorDetails.name,
            provider: provider,
            icon: glyphConnectorDetails.iconUrl
        }
    });
