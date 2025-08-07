import {
	GlyphView,
	GlyphWidget,
	useGlyph,
	useGlyphTokenGate,
	useGlyphView,
} from "@use-glyph/sdk-react";
import React, { useState } from "react";
import { apeChain, base, curtis, mainnet } from "viem/chains";
import { useChainId, useSignMessage, useSwitchChain } from "wagmi";
import GlyphIcon from "./assets/GlyphIcon";
import GlyphWordmark from "./assets/GlyphWordmark";
import { LinkIcon } from "./assets/LinkIcon";
import PrivyIcon from "./assets/PrivyIcon";

const Consumer: React.FC = () => {
	const { authenticated, ready, logout, login, signMessage } = useGlyph();
	const { signMessageAsync } = useSignMessage();
	const { checkTokenGate, isTokenGateLoading } = useGlyphTokenGate();
	const { setGlyphView } = useGlyphView();
	const [loading, setLoading] = useState(false);
	const chainId = useChainId();
	const { switchChainAsync } = useSwitchChain();
	const [contractAddress, setContractAddress] = useState<string>("");

	const handleSwitchChain = async (chainId: number) => {
		setLoading(true);
		console.log("switchChainAsync", chainId);
		await switchChainAsync({chainId});
		setLoading(false);
	};

	const handleTokenGate = async () => {
		const tokenOwnership = await checkTokenGate({ contractAddress: contractAddress });
		if (tokenOwnership.error) return alert(`Tokengate error: ${tokenOwnership.error}`);
		alert(tokenOwnership.result ? "Token owned" : "Token not owned");
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
								This demo app simulates a third-party app in the native Privy
								ecosystem.
							</div>

							<div className="mt-12 mb-5">
								{!ready || !authenticated ? (
									<div className="flex flex-col items-center justify-center gap-4">
										<p className="opacity-50 max-w-80">
											Login or signup with your Privy account
										</p>
										<button
											className="h-12 px-4 transition-colors border rounded-full sm:min-w-44"
											onClick={login}
										>
											Login with Privy
										</button>
									</div>
								) : (
									<>
										<div className="grid w-full grid-cols-2 gap-4 mx-auto text-xs md:grid-cols-3 xl:grid-cols-4 sm:w-fit sm:text-sm">
											<button
												className="h-12 px-4 transition-colors border rounded-full sm:min-w-44"
												onClick={async () => {
													try {
														const signature = await signMessage({
															message: "Hello world",
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
												Sign with Glyph
											</button>
											<button
												className="h-12 px-4 transition-colors border rounded-full sm:min-w-44"
												onClick={async () => {
													try {
														const signature = await signMessageAsync({
															message: "Hello world",
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
												Sign with Wagmi
											</button>
											<button
												onClick={async () => {
													await handleSwitchChain(
														chainId === apeChain.id ? curtis.id : apeChain.id
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
														{chainId === apeChain.id ? "Curtis" : "ApeChain"}
													</span>
												)}
											</button>
											{/* switch to ethereum mainnet */}
											{
												<button
													className="h-12 px-4 border rounded-full sm:min-w-44"
													onClick={async () => await handleSwitchChain(mainnet.id)}
													disabled={loading || chainId === mainnet.id}
												>
													{loading ? (
														"Switching..."
													) : (
														<span className="flex items-center justify-center gap-2 sm:gap-1">
															{chainId === mainnet.id ? `Already on Ethereum` : `Switch to Ethereum`}
														</span>
													)}
												</button>
											}
											{/* switch to base mainnet */}
											{
												<button
													className="h-12 px-4 border rounded-full sm:min-w-44"
													onClick={async () => await handleSwitchChain(base.id)}
													disabled={loading || chainId === base.id}
												>
													{loading ? (
														"Switching..."
													) : (
														<span className="flex items-center justify-center gap-2 sm:gap-1">
															{chainId === base.id ? `Already on Base` : `Switch to Base`}
														</span>
													)}
												</button>
											}
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
												onClick={() => setGlyphView(GlyphView.TOKENS)}
											>
												Tokens
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
												Test the token gate by checking if you own a specific token. You can switch to another chain using the buttons above.
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
												onClick={()=> handleTokenGate()}
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
