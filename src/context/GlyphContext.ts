import { createContext } from "react";
import { GlyphInterface } from "../hooks/useGlyph";
import { resolveUserIP } from "../lib/utils";

export type GlyphApiFetch = (_path: string, _options?: RequestInit) => Promise<Response>;

export interface GlyphContextType extends GlyphInterface {
    /**
     * A fetch-like function for making authenticated requests to the Glyph Widget API.
     * This function automatically includes authentication headers and handles token refresh.
     *
     * Returns null if the context is not ready or the user is not authenticated.
     *
     * @param input - The URL or Request object for the API endpoint
     * @param init - Optional RequestInit configuration object
     * @returns Promise resolving to the Response from the API, or null if not authenticated
     */
    apiFetch: GlyphApiFetch | null;
}

export const EmptyGlyphContext: GlyphContextType = {
    ready: false,
    authenticated: false,
    glyphUrl: "",
    hideWidget: false,
    login: () => {
        console.error("Glyph context not ready");
    },
    logout: () => {
        console.error("Glyph context not ready");
    },
    signMessage: () => {
        console.error("Glyph context not ready");
        return Promise.reject(new Error("Glyph context not ready"));
    },
    sendTransaction: () => {
        console.error("Glyph context not ready");
        return Promise.reject(new Error("Glyph context not ready"));
    },
    apiFetch: (): Promise<Response> => {
        return Promise.reject(new Error("Glyph context not ready"));
    }
};

export const GlyphContext = createContext<GlyphContextType | null>(null);

export function createApiFetch(
    baseUrl: string,
    getToken?: () => Promise<string>,
    baseHeaders?: Record<string, string>
): GlyphApiFetch {
    let ip = "";

    return async (path: string, options?: RequestInit): Promise<Response> => {
        if (!ip) ip = await resolveUserIP();

        const headers = {
            ...(baseHeaders || {}),
            ...(getToken ? { Authorization: `Bearer ${await getToken()}` } : {}),
            "Content-Type": "application/json",
            "x-widget-ip": ip
        } as Record<string, string>;

        return fetch(new URL(path, baseUrl), {
            ...(options || {}),
            headers
        });
    };
}
