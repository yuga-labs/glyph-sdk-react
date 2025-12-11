import { useChainId } from "wagmi";
import NoTokenIcon from "../../assets/svg/NoTokenIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { cn } from "../../lib/utils";

export default function NativeTokenIcon({ className }: { className?: string }) {
    const { balances } = useGlyph();
    const chainId = useChainId();

    const nativeBalance = balances?.tokens?.find?.((balance) => balance.native && balance?.chainId === chainId);
    const logoUrl = nativeBalance?.logo;

    return logoUrl ? (
        <img
            src={logoUrl}
            alt={nativeBalance?.symbol}
            className={cn("gw-size-6 gw-rounded-full gw-object-cover", className)}
        />
    ) : (
        <NoTokenIcon className={cn("gw-size-6", className)} />
    );
}
