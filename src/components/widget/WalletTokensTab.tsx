import NoTokenIcon from "../../assets/svg/NoTokenIcon";
import { useBalances } from "../../hooks/useBalances";
import { formatCurrency } from "../../lib/intl";
import { relayClient } from "../../lib/relay";
import { formatTokenCount } from "../../lib/utils";
import { TokenAndChainIcon } from "./internal/TokenAndChainIcon";

export function WalletTokensTab() {
    const chains = relayClient.chains;

    const { balances, hasBalances, fetchForAllNetworks } = useBalances();

    const tokens = balances?.tokens || [];
    const totalValue = balances?.wallet_value?.tokens;

    return (
        <div className="gw-pl-4 gw-pt-4 gw-flex gw-flex-col gw-h-full gw-min-h-0">
            {/* Balance */}
            <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-pr-4">
                <h6>Tokens</h6>
                <div className="gw-typography-body2">
                    <span className="amount">
                        {/* If tokens are present and any of the token has valueInWei > 0, show <0.01 */}
                        {formatCurrency(
                            totalValue,
                            tokens[0]?.currency,
                            tokens?.some((t) => BigInt(t.valueInWei) !== 0n)
                        )}
                    </span>
                </div>
            </div>

            {hasBalances && tokens?.length ? (
                <div className="gw-grid gw-grid-cols-1 gw-mt-2 gw-max-h-100 gw-min-h-0 gw-overflow-auto gw-pr-4">
                    {tokens.map((t, index) => {
                        if (t?.hide) return null;
                        const TokenIcon = t.logo ? (
                            <img src={t.logo} alt={t.symbol} className="gw-size-10 gw-rounded-full" />
                        ) : (
                            <NoTokenIcon className="gw-size-10" />
                        );

                        const chain = chains.find((c) => c.id === t.chainId)!;

                        return (
                            <div key={`${t?.chainId}:${t?.address}_token_list`} className="gw-w-full">
                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-py-2">
                                    <div className="gw-flex gw-items-center gw-space-x-3">
                                        {fetchForAllNetworks ? (
                                            <TokenAndChainIcon
                                                token={{
                                                    name: t?.name,
                                                    logoUrl: t?.logo ?? undefined
                                                }}
                                                chain={{
                                                    id: t?.chainId,
                                                    name: chain?.name,
                                                    logoUrl: chain?.iconUrl ?? undefined
                                                }}
                                            />
                                        ) : (
                                            TokenIcon
                                        )}
                                        <div className="gw-flex gw-flex-col gw-items-between gw-justify-end">
                                            <span className="gw-font-medium gw-max-w-32 gw-truncate">
                                                {t.symbol || t.name}
                                            </span>
                                            {Number.isFinite(t.priceChangePct) && t.priceChangePct !== 0 && (
                                                <span
                                                    className={`gw-typography-caption 
                                                    ${t.priceChangePct >= 0 ? "gw-text-brand-success" : "gw-text-destructive"}`}
                                                >
                                                    {t.priceChangePct >= 0 ? "+" : ""}
                                                    {t.priceChangePct.toFixed(2)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="gw-flex gw-flex-col gw-items-between gw-justify-end gw-text-end">
                                        <span className="gw-font-medium">
                                            {/* If USD amount is 0, but token value is not 0, show <0.01 */}
                                            {formatCurrency(t.amount, t.currency, BigInt(t.valueInWei) !== 0n)}
                                        </span>
                                        <span className="gw-typography-caption gw-text-brand-gray-500 gw-flex gw-items-center gw-justify-end gw-gap-0.5">
                                            <span>
                                                {formatTokenCount(t.valueInWei, t.decimals, t.displayDecimals)}{" "}
                                            </span>
                                            <span className="gw-max-w-20 gw-truncate gw-inline-block gw-break-words">
                                                {t.symbol}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                                {index < tokens.length - 1 && <hr className="gw-my-2 gw-border-muted" />}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="gw-flex gw-justify-center gw-items-center gw-flex-1 gw-text-brand-gray-500 gw-typography-body2 gw-pr-4">
                    {hasBalances ? "No tokens found" : "Loading..."}
                </div>
            )}
        </div>
    );
}
