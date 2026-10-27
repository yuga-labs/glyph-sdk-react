import { useCreateWallet, usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef, useState } from "react";
import { isAddress } from "viem";

/** Mounted per Privy user by Consumer; wallet creation always requires a click. */
export default function CreateEvmWallet() {
    const { ready, authenticated, user } = usePrivy();
    const { createWallet } = useCreateWallet();
    const [status, setStatus] = useState<"idle" | "creating" | "created">("idle");
    const [error, setError] = useState<string | null>(null);
    const request = useRef({ active: true, busy: false });
    const hasEvmWallet = user?.linkedAccounts.some(
        (account) =>
            account.type === "wallet" &&
            account.chainType === "ethereum" &&
            account.walletClientType === "privy" &&
            isAddress(account.address)
    );
    const canCreate = useRef(false);
    canCreate.current = ready && authenticated && !!user?.id && !hasEvmWallet;
    useEffect(() => {
        const current = request.current;
        current.active = true;
        return () => {
            current.active = false;
        };
    }, []);

    const handleCreate = async () => {
        if (!canCreate.current || !request.current.active || request.current.busy) return;
        request.current.busy = true;
        setError(null);
        setStatus("creating");
        try {
            // The root Privy hook creates Ethereum wallets; no automatic creation or extra HD wallet.
            await createWallet();
            if (request.current.active) setStatus("created");
            // Keep the button locked while Privy propagates the linked account to Glyph.
        } catch {
            request.current.busy = false;
            if (request.current.active) {
                setStatus("idle");
                setError("Could not create an EVM wallet. Try again or log out and sign in again.");
            }
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 text-center max-w-96">
            <p>
                {hasEvmWallet
                    ? "Your EVM wallet is not available to Glyph. Log out and sign in again."
                    : "You are signed in to Privy. Glyph needs an EVM wallet; a social login or Solana wallet alone is not enough."}
            </p>
            {!hasEvmWallet && (
                <>
                    <p className="text-sm">Create a Privy Ethereum wallet for this account to use Glyph on ApeChain.</p>
                    <button
                        className="h-12 px-4 transition-colors border rounded-full disabled:opacity-50"
                        disabled={!canCreate.current || status !== "idle"}
                        onClick={handleCreate}
                    >
                        {status === "creating"
                            ? "Creating EVM wallet…"
                            : status === "created"
                              ? "Waiting for wallet…"
                              : "Create EVM wallet"}
                    </button>
                </>
            )}
            {error && (
                <p role="alert" className="text-sm">
                    {error}
                </p>
            )}
            {status !== "idle" && (
                <p role="status">
                    {status === "creating"
                        ? "Creating your wallet."
                        : "Wallet created. Waiting for Privy to update your account."}
                </p>
            )}
        </div>
    );
}
