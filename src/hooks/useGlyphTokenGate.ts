import { useChainId } from "wagmi";
import { useGlyphApi } from "./useGlyphApi";
import { useCallback, useState } from "react";
import { useGlyph } from "./useGlyph";

export type GlyphOwnedToken = {
    id: number;
    qty: number;
    owner: string;
    delegated: boolean;
    linked: boolean;
    nodeId: string;
    delegatedNodeId: string;
}

export type GlyphDelegationChainItem = {
    account: string;
    contractAddress: string;
    tokenIds: number[];
    source: "root" | "V1" | "V2" | "warm";
    linked: boolean;
    nodeId: string;
    delegatedNodeId: string;
}

export type GlyphOwnershipCheckRequest = {
    contractAddress: string;
    chainId?: number;
    quantity?: number;
    tokenIdRange?: string;
    includeDelegates?: boolean;
}

export type GlyphTokenGateResult = {
    result: boolean;
    error?: string;
}

export type GlyphOwnershipCheckResult = GlyphTokenGateResult & {
    tokens: GlyphOwnedToken[];
    delegationChain: GlyphDelegationChainItem[];
}

export function useGlyphTokenGate() {
    const { user } = useGlyph()
    const chainId = useChainId();
    const { glyphApiFetch } = useGlyphApi();
    const [isTokenGateLoading, setIsTokenGateLoading] = useState(false);

    const checkTokenGate = useCallback(async (req: GlyphOwnershipCheckRequest): Promise<GlyphTokenGateResult> => {
        try {
            if (!user) return { result: false, error: "User not authenticated" };
            if (!glyphApiFetch) return { result: false, error: "Glyph API not ready" };

            setIsTokenGateLoading(true);
            const res = await glyphApiFetch(`/api/widget/ownership_check`, {
                method: "POST",
                body: JSON.stringify({ chainId, walletAddress: user.evmWallet, ...req }), // override chainId if provided
                headers: { "Content-Type": "application/json" }
            });

            return (await res.json()) as GlyphTokenGateResult;
        } catch (e: any) {
            return { result: false, error: e?.message || "Glyph tokengate error" };
        } finally {
            setIsTokenGateLoading(false);
        }
    }, [chainId, user, glyphApiFetch, setIsTokenGateLoading]);

    return { checkTokenGate, isTokenGateLoading };
}

export function useGlyphOwnershipCheck(){
    const { user } = useGlyph();
    const chainId = useChainId();
    const { glyphApiFetch } = useGlyphApi();
    const [isOwnershipCheckLoading, setIsOwnershipCheckLoading] = useState(false);

    const checkOwnership = useCallback(async (req: GlyphOwnershipCheckRequest): Promise<GlyphOwnershipCheckResult> => {
        try {
            if (!user) return { result: false, error: "User not authenticated", tokens: [], delegationChain: [] };
            if (!glyphApiFetch) return { result: false, error: "Glyph API not ready", tokens: [], delegationChain: [] };

            setIsOwnershipCheckLoading(true);
            const res = await glyphApiFetch(`/api/widget/ownership_check`, {
                method: "POST",
                body: JSON.stringify({ chainId, walletAddress: user.evmWallet, ...req }), // override chainId if provided
                headers: { "Content-Type": "application/json" }
            });

            return (await res.json()) as GlyphOwnershipCheckResult;
        } catch (e: any) {
            return { result: false, error: e?.message || "Glyph ownership check error", tokens: [], delegationChain: [] };
        } finally {
            setIsOwnershipCheckLoading(false);
        }
    }, [glyphApiFetch, chainId]);

    return { checkOwnership, isOwnershipCheckLoading };
}
