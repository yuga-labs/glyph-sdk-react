import { Hex, recoverMessageAddress } from "viem";

export type SignMessageBtnProps = {
	signFn: (params: { message: string }) => Promise<unknown>;
	message: string;
	buttonText?: string;
};

const recoverAddress = async (
	message: string,
	signature: Hex
): Promise<Hex> => {
	try {
		const address = await recoverMessageAddress({
			message,
			signature,
		});
		return address;
	} catch (error) {
		console.warn("Error verifying message:", error);
		throw error;
	}
};

export function SignMessageBtn({
	signFn,
	message,
	buttonText = "Sign Message",
}: SignMessageBtnProps) {
	return (
		<button
			className="flex items-center justify-center w-full h-12 px-4 transition-colors border rounded-full"
			onClick={async () => {
				try {
					const signature = await signFn({ message });
					console.log("signature", signature);
					if (signature && typeof signature === "string") {
						const recoveredAddress = await recoverAddress(
							message,
							signature as Hex
						);
						console.log("recovered address", recoveredAddress);
						alert(`Message signed by ${recoveredAddress}`);
					} else {
						throw new Error("Something went wrong!");
					}
				} catch (e) {
					console.log(e);
					alert(e);
				}
			}}
		>
			{buttonText}
		</button>
	);
}
