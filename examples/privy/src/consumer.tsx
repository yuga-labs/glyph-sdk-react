import { GlyphView, GlyphWidget, useGlyph, useGlyphTokenGate, useGlyphView } from "@use-glyph/sdk-react";
import { usePrivy } from "@privy-io/react-auth";
import React, { useRef, useState } from "react";
import { useChainId, useConfig, useSignMessage, useSwitchChain } from "wagmi";
import GlyphIcon from "./assets/GlyphIcon";
import GlyphWordmark from "./assets/GlyphWordmark";
import { LinkIcon } from "./assets/LinkIcon";
import PrivyIcon from "./assets/PrivyIcon";
import CreateEvmWallet from "./CreateEvmWallet";

type DemoActionResult = { type: "success" | "error"; message: string };

async function runDemoAction(
    action: () => Promise<string>,
    report: (result: DemoActionResult | null) => void,
    failureMessage: string,
    version: { current: number }
) {
    const current = ++version.current;
    report(null);
    try {
        const message = await action();
        if (version.current === current) report({ type: "success", message });
    } catch {
        if (version.current === current) report({ type: "error", message: failureMessage });
    }
}

const Consumer: React.FC = () => {
    const { authenticated, ready, logout, login, signMessage } = useGlyph();
    const { ready: privyReady, authenticated: privyAuthenticated, user: privyUser } = usePrivy();
    const { signMessageAsync } = useSignMessage();
    const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
    const { setGlyphView } = useGlyphView();
    const [loading, setLoading] = useState(false);
    const [actionResult, setActionResult] = useState<DemoActionResult | null>(null);
    const actionVersion = useRef(0);
    const chainId = useChainId();
    const wagmiConfig = useConfig(); //   Can also use useChains hook to get the chains
    const { switchChainAsync } = useSwitchChain();
    const [contractAddress, setContractAddress] = useState<string>("");

    const runAction = (action: () => Promise<string>, failureMessage: string) =>
        runDemoAction(action, setActionResult, failureMessage, actionVersion);

    const handleSign = (sign: typeof signMessage) =>
        runAction(async () => {
            const signature = await sign({ message: "Hello world" });
            if (!signature) throw new Error("No signature returned");
            return "Message signed";
        }, "Signing canceled or failed");

    const handleSwitchChain = async (chainId: number) => {
        setLoading(true);
        try {
            await runAction(async () => {
                await switchChainAsync({ chainId });
                return "Chain switched";
            }, "Failed to switch chain");
        } finally {
            setLoading(false);
        }
    };

    const handleTokenGate = () =>
        runAction(async () => {
            const tokenOwnership = await checkTokenGate({ contractAddress });
            if (tokenOwnership.error) throw new Error("Token ownership check failed");
            return tokenOwnership.result ? "Token owned" : "Token not owned";
        }, "Failed to check token ownership");

    return (
        <>
            <div className="flex items-center justify-center h-dvh">
                <div className="w-full overflow-auto max-h-dvh">
                    <div className="flex flex-col items-center justify-start flex-1 px-5 pt-24 pb-10 mx-auto w-fit">
                        <div className="absolute top-5 right-5 sm:top-8 sm:right-12">
                            {ready && authenticated && <GlyphWidget />}
                        </div>
                        <div className="px-4 text-white shadow-xl bg-black/30 py-7 rounded-3xl h-fit backdrop-blur-md max-sm:w-fit sm:px-10 sm:py-10">
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 sm:px-4">
                                <div className="inline-flex items-center gap-2 sm:gap-4">
                                    <GlyphIcon className="size-8 sm:size-14" />
                                    <GlyphWordmark className="h-10 sm:h-16 w-auto" />
                                </div>
                                <div className="flex items-end gap-2 pl-4 border-l sm:pl-6">
                                    <PrivyIcon className="h-6 sm:h-10 w-auto" />
                                </div>
                            </div>

                            <div className="max-w-lg mx-auto mt-10 text-lg text-center sm:text-2xl">
                                This demo app simulates a third-party app in the native Privy ecosystem.
                            </div>

                            <div className="mt-12 mb-5">
                                {!privyReady || !ready ? (
                                    <p role="status" className="text-center">
                                        Loading Privy…
                                    </p>
                                ) : !privyAuthenticated ? (
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <p className="opacity-50 max-w-80">Login or signup with your Privy account</p>
                                        <button
                                            className="h-12 px-4 transition-colors border rounded-full sm:min-w-44"
                                            onClick={login}
                                        >
                                            Login with Privy
                                        </button>
                                    </div>
                                ) : !authenticated ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <CreateEvmWallet key={privyUser?.id} />
                                        <button
                                            className="h-12 px-4 text-black bg-white rounded-full sm:min-w-44"
                                            onClick={logout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {actionResult && (
                                            <p
                                                role={actionResult.type === "error" ? "alert" : "status"}
                                                aria-atomic="true"
                                                className="mb-4 text-center"
                                            >
                                                {actionResult.message}
                                            </p>
                                        )}
                                        <div className="grid w-full grid-cols-2 gap-4 mx-auto text-xs md:grid-cols-3 xl:grid-cols-4 sm:w-fit sm:text-sm">
                                            <button
                                                className="h-12 px-4 transition-colors border rounded-full sm:min-w-44"
                                                onClick={() => handleSign(signMessage)}
                                            >
                                                Sign with Glyph
                                            </button>
                                            <button
                                                className="h-12 px-4 transition-colors border rounded-full sm:min-w-44"
                                                onClick={() => handleSign(signMessageAsync)}
                                            >
                                                Sign with Wagmi
                                            </button>

                                            {wagmiConfig.chains.map((chain) => {
                                                return (
                                                    <button
                                                        key={chain.id}
                                                        onClick={async () => {
                                                            await handleSwitchChain(chain.id);
                                                        }}
                                                        className="h-12 px-4 border rounded-full sm:min-w-44"
                                                        disabled={loading || chain.id === chainId}
                                                    >
                                                        {chainId === chain.id ? (
                                                            `Already on ${chain.name}`
                                                        ) : (
                                                            <span className="flex items-center justify-center gap-2 sm:gap-1">
                                                                {`Switch to`} {chain.name}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}

                                            {/* logout */}
                                            <button
                                                onClick={logout}
                                                className="h-12 px-4 text-black bg-white rounded-full sm:min-w-44"
                                            >
                                                Logout
                                            </button>

                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.MAIN)}
                                            >
                                                Open Widget
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.CLOSED)}
                                            >
                                                Close Widget
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.FUND)}
                                            >
                                                Fund wallet
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.SEND)}
                                            >
                                                Send funds
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.RECEIVE)}
                                            >
                                                Receive funds
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.PROFILE)}
                                            >
                                                Profile
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.TOKENS)}
                                            >
                                                Tokens
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.NFTS)}
                                            >
                                                NFTs
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.LINKED_ACCOUNTS)}
                                            >
                                                Accounts
                                            </button>
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loading}
                                                onClick={() => setGlyphView(GlyphView.ACTIVITY)}
                                            >
                                                Activity
                                            </button>
                                        </div>

                                        {/* test token gate */}
                                        <div className="flex flex-col items-center justify-center gap-4 mt-4 text-center">
                                            <p className="text-sm max-w-96">
                                                Test the token gate by checking if you own a specific token. You can
                                                switch to another chain using the buttons above.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center gap-4 mt-4 text-center">
                                            <input
                                                type="text"
                                                placeholder="Contract address"
                                                value={contractAddress}
                                                onChange={(e) => setContractAddress(e.target.value)}
                                                className="w-full p-2 border rounded-md text-black"
                                            />
                                            <button
                                                onClick={() => handleTokenGate()}
                                                className="w-full p-2 border rounded-md"
                                                disabled={isTokenGateLoading || !contractAddress}
                                            >
                                                {isTokenGateLoading ? "Checking..." : "Check token ownership"}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="w-full px-4 mt-4 text-white shadow-xl bg-black/30 py-7 rounded-3xl h-fit backdrop-blur-md sm:px-10 sm:py-6">
                            <div className="flex flex-wrap items-center justify-center text-sm gap-x-8 text-white/75">
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 p-2 hover:underline whitespace-nowrap"
                                    href="https://github.com/yuga-labs/glyph-sdk-react/tree/main/examples/privy"
                                >
                                    GitHub Example <LinkIcon className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default React.memo(Consumer);
