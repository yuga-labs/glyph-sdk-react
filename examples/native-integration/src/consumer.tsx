import {
    GlyphView,
    GlyphWidget,
    NativeGlyphConnectButton,
    SignUpButton,
    useGlyph,
    useGlyphTokenGate,
    useGlyphView,
    useNativeGlyphConnection
} from "@use-glyph/sdk-react";
import React, { useEffect, useState } from "react";
import { useAccount, useChainId, useConfig, useSwitchChain } from "wagmi";
import GlyphIcon from "./assets/GlyphIcon";
import GlyphWordmark from "./assets/GlyphWordmark";
import { LinkIcon } from "./assets/LinkIcon";
import WagmiIcon from "./assets/WagmiIcon";

const Consumer: React.FC = () => {
    const { connect } = useNativeGlyphConnection();
    const { isConnected } = useAccount();
    const { signMessage, ready, authenticated, login: widgetLogin, user, logout } = useGlyph();
    const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
    const [contractAddress, setContractAddress] = useState<string>("");

    const handleWidgetLogin = async () => {
        setLoginLoading(true);
        await widgetLogin();
    };

    // Reset login loading state when the user is authenticated
    useEffect(() => {
        if (ready && authenticated && user) {
            setLoginLoading(false);
        }
    }, [ready, authenticated, user]);

    const { setGlyphView } = useGlyphView();

    const [loading, setLoading] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const chainId = useChainId();
    const wagmiConfig = useConfig(); //   Can also use useChains hook to get the chains
    const { switchChainAsync } = useSwitchChain();

    const handleSwitchChain = async (chainId: number) => {
        setLoading(true);
        try {
            await switchChainAsync({
                chainId: chainId
            });
        } catch (error) {
            console.log(error);
            alert("Failed to switch chain");
        } finally {
            setLoading(false);
        }
    };

    const handleTokenGate = async () => {
        const tokenOwnership = await checkTokenGate({ contractAddress });
        if (tokenOwnership.error) return alert(`Tokengate error: ${tokenOwnership.error}`);
        alert(tokenOwnership.result ? "Token owned" : "Token not owned");
    };

    return (
        <>
            <div className="flex items-center justify-center h-dvh">
                <div className="w-full overflow-auto max-h-dvh">
                    <div className="flex flex-col items-center justify-start flex-1 px-5 pt-24 pb-10 mx-auto w-fit">
                        <div className="absolute top-5 right-5 sm:top-8 sm:right-12">
                            {!isConnected ? <NativeGlyphConnectButton /> : <GlyphWidget />}
                        </div>
                        <div className="px-4 text-white shadow-xl bg-black/30 py-7 rounded-3xl h-fit backdrop-blur-md max-sm:w-fit sm:px-10 sm:py-10">
                            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 sm:px-4">
                                <div className="inline-flex items-center gap-2 sm:gap-4">
                                    <GlyphIcon className="size-8 sm:size-14" />
                                    <GlyphWordmark className="h-10 sm:h-16 w-auto" />
                                </div>
                                <div className="flex items-end gap-2 pl-4 border-l sm:pl-6">
                                    <WagmiIcon className="h-6 sm:h-11 w-auto" />
                                </div>
                            </div>

                            <div className="max-w-lg mx-auto mt-10 text-lg text-center sm:text-2xl">
                                This demo app simulates a third-party app with Glyph as an EIP1193 provider via Wagmi.
                            </div>

                            <div className="mt-12 mb-5">
                                {!isConnected ? (
                                    <>
                                        {/* <NativeGlyphConnectButton /> */}
                                        <div className="flex flex-col items-center justify-center gap-4 text-xs sm:text-sm">
                                            <p className="opacity-50 max-w-80">
                                                Login or signup with your Glyph account
                                            </p>
                                            <button
                                                className="flex items-center justify-center h-12 px-4 transition-colors border rounded-full sm:min-w-44"
                                                onClick={() => connect()}
                                            >
                                                Connect to Glyph
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid w-full grid-cols-2 gap-4 mx-auto text-xs md:grid-cols-3 xl:grid-cols-4 sm:w-fit sm:text-sm">
                                        <button
                                            className="flex items-center justify-center h-12 px-4 transition-colors border rounded-full"
                                            onClick={async () => {
                                                try {
                                                    const signature = await signMessage({
                                                        message: "Hello world"
                                                    });
                                                    if (signature) {
                                                        console.log("signature", signature);
                                                        alert("Message signed");
                                                    } else {
                                                        throw new Error("Something went wrong!");
                                                    }
                                                } catch (e) {
                                                    console.log(e);
                                                    alert("User declined");
                                                }
                                            }}
                                        >
                                            Sign Message
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
                                        <button
                                            onClick={logout}
                                            className="h-12 px-4 text-black bg-white rounded-full sm:min-w-44"
                                        >
                                            Logout
                                        </button>

                                        {/* Users need to authenticate (sign a message) before they can use the widget */}
                                        {/* Developers can use the ready and authenticated hooks to conditionally render the widget and related functionality */}
                                        {/* To ask the user to login to the widget, use `login` function from `useGlyph` hook */}
                                        {ready && authenticated && user ? (
                                            <>
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
                                                <span></span>

                                                {/* test token gate */}
                                                <div className="flex flex-col items-center justify-center gap-4 mt-4 text-center">
                                                    <p className="text-sm max-w-96">
                                                        Test the token gate by checking if you own a specific token. You
                                                        can switch to another chain using the buttons above.
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
                                        ) : (
                                            <button
                                                className="h-12 px-4 py-2 border rounded-full"
                                                disabled={loginLoading}
                                                onClick={handleWidgetLogin}
                                            >
                                                {loginLoading ? "Look for a popup..." : "Login to widget"}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full px-4 mt-4 text-white shadow-xl bg-black/30 py-7 rounded-3xl h-fit backdrop-blur-md sm:px-10 sm:py-6">
                            <div className="flex flex-col items-center justify-center gap-4 mt-4 text-center">
                                <p className="text-sm opacity-50 max-w-96">
                                    Another option is to register via the Glyph Dashboard.
                                </p>
                                <SignUpButton />
                            </div>

                            <div className="flex flex-wrap items-center justify-center pt-10 text-sm gap-x-8 text-white/75">
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 p-1 hover:underline"
                                    href="https://docs.useglyph.io/integrations/native/"
                                >
                                    Documentation <LinkIcon className="w-4 h-4" />
                                </a>
                                <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 p-2 hover:underline whitespace-nowrap"
                                    href="https://github.com/yuga-labs/glyph-sdk-react/tree/main/examples/native-integration"
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
