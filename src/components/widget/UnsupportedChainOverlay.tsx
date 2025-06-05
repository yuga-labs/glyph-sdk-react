import { apeChain } from "viem/chains";
import { useChainId, useSwitchChain } from "wagmi";
import ApechainIcon from "../../assets/svg/ApechainIcon";
import { defaultChain } from "../../lib/providers";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { CHAIN_ICONS, IS_TESTNET_CHAIN, TESTNET_CLASS } from "../../lib/constants";

type UnsupportedChainOverlayProps = {
    className?: string;
};

export function UnsupportedChainOverlay({ className }: UnsupportedChainOverlayProps) {
    const { switchChainAsync } = useSwitchChain();
    const chainId = useChainId();

    const isTestnet = IS_TESTNET_CHAIN.get(chainId) || false;
    const ChainIcon = CHAIN_ICONS[chainId] || ApechainIcon;

    return (
        <div
            className={cn(
                "gw-p-4 gw-absolute gw-top-0 gw-left-0 gw-right-0 gw-bottom-0 gw-z-50 gw-flex gw-items-center gw-justify-center gw-rounded-3xl gw-backdrop-blur-sm",
                className
            )}
        >
            <div className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-gap-4 gw-p-10 gw-rounded-xl gw-bg-background gw-shadow-buttonLg">
                <ChainIcon className={cn("gw-size-20", isTestnet && TESTNET_CLASS)} />
                <h6 className="gw-text-center">
                    Switch to {defaultChain.id === apeChain.id ? "ApeChain" : defaultChain.name}
                    <br /> network to continue
                </h6>
                <Button
                    variant="tertiary"
                    className="!gw-px-10 gw-mt-4"
                    onClick={async () => await switchChainAsync({ chainId: defaultChain.id })}
                >
                    Switch
                </Button>
            </div>
        </div>
    );
}
