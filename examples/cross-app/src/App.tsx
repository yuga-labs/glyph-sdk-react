import {
	GLYPH_APP_LOGIN_METHOD,
	GlyphPrivyProvider,
} from "@use-glyph/sdk-react";
import { apeChain, base, Chain } from "viem/chains";
import "./App.css";
import Consumer from "./consumer";

const supportedChains: [Chain, ...Chain[]] = [apeChain, base];

function App() {
	return (
		<GlyphPrivyProvider
			appId={"cm4vofyfw04npzg40krvtmgip"}
			clientId={"client-WY5eXhhUuWyyySiHcTcAKA7nD3X3e5SEwiD9dhhZjeRxz"}
			config={{
				loginMethodsAndOrder: {
					primary: [GLYPH_APP_LOGIN_METHOD],
				},
				embeddedWallets: {
					createOnLogin: "off", // 'users-without-wallets' | 'all-users' | 'off'
					showWalletUIs: true,
					extendedCalldataDecoding: true,
				},
				supportedChains,
				defaultChain: apeChain,
			}}
			chains={supportedChains}
		>
			<Consumer />
		</GlyphPrivyProvider>
	);
}

export default App;
