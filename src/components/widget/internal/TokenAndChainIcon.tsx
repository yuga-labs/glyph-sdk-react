import NoTokenIcon from "../../../assets/svg/NoTokenIcon";
import { CHAIN_NAMES } from "../../../lib/constants";
import { cn } from "../../../lib/utils";

export const TokenAndChainIcon = ({
    token,
    chain,
    tokenClassName,
    chainClassName
}: {
    token: {
        logoUrl: string | undefined;
        name: string | undefined;
    };
    tokenClassName?: string;
    chain?: {
        id: number;
        logoUrl: string | undefined | null;
        name: string;
    };
    chainClassName?: string;
}) => {
    return (
        <span className="gw-relative gw-flex-shrink-0">
            {token.logoUrl ? (
                <img
                    src={token.logoUrl}
                    alt={token.name}
                    className={cn("gw-rounded-full gw-size-10", tokenClassName)}
                />
            ) : (
                <NoTokenIcon className={cn("gw-size-10 gw-rounded-full", tokenClassName)} />
            )}

            {chain?.logoUrl && (
                <span
                    className={cn(
                        "gw-absolute gw-bottom-0 gw-right-0 gw-translate-x-[10%] gw-translate-y-[10%] gw-size-5 gw-rounded-full gw-bg-background",
                        chainClassName
                    )}
                >
                    <img
                        src={chain.logoUrl}
                        alt={CHAIN_NAMES[chain.id] || chain.name}
                        className="gw-rounded-full gw-size-full"
                    />
                </span>
            )}
        </span>
    );
};
