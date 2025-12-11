import { paths } from "@relayprotocol/relay-sdk";
import { CheckIcon, PlusIcon, X } from "lucide-react";
import { Hex, zeroAddress } from "viem";
import { useTokenBalance } from "../../../hooks/useTokenBalance";
import { MAX_DECIMALS_FOR_CRYPTO } from "../../../lib/constants";
import { formatCurrency } from "../../../lib/intl";
import { displayNumberPrecision } from "../../../lib/utils";
import { Button } from "../../ui/button";
import TooltipElement from "../../ui/tooltip-element";

export type TopUpDetails =
    | NonNullable<
          paths["/quote"]["post"]["responses"]["200"]["content"]["application/json"]["details"]
      >["currencyGasTopup"]
    | undefined;

type WalletSwapTopUpGasProps = {
    destinationChainId?: number;
    walletAddress?: Hex;
    topUpGas: boolean;
    setTopUpGas: (value: boolean) => void;
    topUpDetails: TopUpDetails;
    quoteReady?: boolean;
};

export const WalletSwapTopUpGas = ({
    destinationChainId,
    walletAddress,
    topUpGas,
    setTopUpGas,
    topUpDetails,
    quoteReady
}: WalletSwapTopUpGasProps) => {
    const { balance } = useTokenBalance(walletAddress, zeroAddress, destinationChainId);

    const topupValue = displayNumberPrecision(
        parseFloat(topUpDetails?.amountFormatted || "0"),
        Math.min(topUpDetails?.currency?.decimals || MAX_DECIMALS_FOR_CRYPTO, MAX_DECIMALS_FOR_CRYPTO)
    );
    const topupAmount = Number(topUpDetails?.amountUsd || "0");

    const topupCurrency = topUpDetails?.currency;

    if (balance === undefined || balance === null || balance > 0n || !quoteReady) {
        return null;
    }

    return (
        <>
            <Button
                className="gw-w-fit !gw-gap-1 !gw-px-2 !gw-py-0.5 !gw-bg-brand-success !gw-text-foreground !gw-h-5"
                variant={"default"}
                onClick={() => setTopUpGas(!topUpGas)}
            >
                {!topUpGas && <PlusIcon className="!gw-size-3" />}{" "}
                <span className="gw-typography-caption gw-inline-flex gw-gap-1 gw-items-center">
                    {!topUpGas ? (
                        "Add Gas"
                    ) : topUpDetails ? (
                        <>
                            <span>+{topupValue}</span>
                            <span>({formatCurrency(topupAmount, "USD")})</span>
                            {topupCurrency?.metadata?.logoURI && (
                                <img
                                    src={topupCurrency?.metadata?.logoURI || ""}
                                    alt={topupCurrency?.name}
                                    className="gw-rounded-full gw-size-4"
                                />
                            )}
                            <span>{topupCurrency?.symbol}</span>
                            <X className="!gw-size-3" />
                        </>
                    ) : (
                        <>
                            <CheckIcon className="!gw-size-3" />
                            <span>Added Gas</span>
                        </>
                    )}
                </span>
            </Button>

            <TooltipElement
                description="No gas detected on the destination chain. A gas top-up is recommended which is reserved from your buy total, not charged extra."
                stopPropagation
                side="bottom"
                align="center"
                triggerClassName="gw-ml-1"
            />
        </>
    );
};
