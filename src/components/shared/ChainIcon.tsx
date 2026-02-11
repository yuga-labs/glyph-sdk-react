import { useChainId } from "wagmi";
import NoTokenIcon from "../../assets/svg/NoTokenIcon";
import { IS_TESTNET_CHAIN, NATIVE_TOKEN_ICONS, TESTNET_CSS_CLASS } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useGlyph } from "../../hooks/useGlyph";


export function NativeTokenIcon({ className }: { className?: string }) {
    const { nativeSymbol } = useGlyph();
    const chainId = useChainId();

    const Icon = NATIVE_TOKEN_ICONS[nativeSymbol] || NoTokenIcon;
    const isTestnet = IS_TESTNET_CHAIN.get(chainId) || false;
    return <Icon className={cn("gw-size-6", className, isTestnet && TESTNET_CSS_CLASS)} />;
}
