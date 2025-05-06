import {
	GlyphView,
	GlyphWidget,
	LoginButton,
	SignUpButton,
	useGlyph,
	useGlyphView
} from "@use-glyph/sdk-react";
import React, { useState } from "react";
import { apeChain, base } from "viem/chains";
import { useChainId, useSignMessage, useSwitchChain } from "wagmi";
import apechainLogo from "./assets/apechain.png";
import baseLogo from "./assets/base.png";
import GlyphIcon from "./assets/GlyphIcon";
import GlyphWordmark from "./assets/GlyphWordmark";
import { LinkIcon } from "./assets/LinkIcon";
import PrivyIcon from "./assets/PrivyIcon";
import { SignMessageBtn } from "./SignMessageBtn";

const Consumer: React.FC = () => {
	const { authenticated, ready, signMessage, logout } = useGlyph();
	const { signMessageAsync } = useSignMessage();
	const { setGlyphView } = useGlyphView();
	const [loading, setLoading] = useState(false);
	const chainId = useChainId();
	const { switchChainAsync } = useSwitchChain();

	const handleSwitchChain = async (chainId: number) => {
		setLoading(true);
		await switchChainAsync({
			chainId: chainId,
		});
		setLoading(false);
	};

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
								This demo app simulates a third-party app in a Glyph cross-app
								ecosystem.
							</div>

							<div className="mt-12 mb-5">
								{!ready || !authenticated ? (
									<div className="flex flex-col items-center justify-center mx-auto text-sm text-center w-fit">
										<div className="flex flex-col items-center justify-center gap-4">
											<p className="opacity-50 max-w-80">
												Sign up or sign in with your Glyph account
											</p>
											<LoginButton />
										</div>
									</div>
								) : (
									<>
										<div className="grid w-full grid-cols-2 gap-4 mx-auto text-xs md:grid-cols-3 xl:grid-cols-4 sm:w-fit sm:text-sm">
											<SignMessageBtn
												signFn={signMessage}
												message="Hello, Glyph!"
												buttonText="Sign with Glyph"
											/>
											<SignMessageBtn
												signFn={signMessageAsync}
												message="Hello, Wagmi!"
												buttonText="Sign with Wagmi"
											/>
											<button
												onClick={async () => {
													await handleSwitchChain(
														chainId === apeChain.id ? base.id : apeChain.id
													);
												}}
												className="h-12 px-4 border rounded-full sm:min-w-44"
												disabled={loading}
											>
												{loading ? (
													"Switching..."
												) : (
													<span className="flex items-center justify-center gap-2 sm:gap-1">
														{`Switch to`}{" "}
														<span className="sm:hidden">
															{chainId === apeChain.id ? (
																<img
																	src={baseLogo}
																	alt="Base"
																	className="w-5 h-5 rounded-full"
																/>
															) : (
																<img
																	src={apechainLogo}
																	alt="ApeChain"
																	className="w-5 h-5 rounded-full"
																/>
															)}
														</span>
														<span className="hidden sm:block">
															{chainId === apeChain.id ? "Base" : "ApeChain"}
														</span>
													</span>
												)}
											</button>
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
									</>
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
									href="https://docs.useglyph.io/integrations/privy/"
								>
									Documentation <LinkIcon className="w-4 h-4" />
								</a>
								<a
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-1 p-2 hover:underline whitespace-nowrap"
									href="https://github.com/yuga-labs/glyph-sdk-react/tree/main/examples/cross-app"
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
