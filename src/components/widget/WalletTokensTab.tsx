import { useChainId } from "wagmi";
import NoTokenIcon from "../../assets/svg/NoTokenIcon";
import { useBalances } from "../../hooks/useBalances";
import { IS_TESTNET_CHAIN, TESTNET_CLASS, TOKEN_LOGOS } from "../../lib/constants";
import { formatCurrency } from "../../lib/intl";

export function WalletTokensTab() {
    const { balances } = useBalances();
    const chainId = useChainId();

    const isTestnet = IS_TESTNET_CHAIN.get(chainId) || false;
    const tokens = balances?.tokens || [];
    const totalValue = tokens.reduce((acc, token) => acc + +(token.amount || 0), 0);

    return (
        <div className="gw-pl-4 gw-pt-4 gw-flex gw-flex-col gw-h-full">
            {/* Balance */}
            <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-pr-4">
                <h6>Tokens</h6>
                <div className="gw-typography-body2">
                    <span className="amount">{formatCurrency(totalValue, tokens[0]?.currency)}</span>
                </div>
            </div>

            <div className="gw-grid gw-grid-cols-1 gw-mt-2 gw-max-h-100 gw-min-h-0 gw-overflow-auto gw-pr-4 gw-min-h-0">
                {tokens.map((t, index) => {
                    if (t?.hide) return null;
                    const TokenIcon = TOKEN_LOGOS[t.symbol] || NoTokenIcon;

                    return (
                        <div key={t.symbol} className="gw-w-full">
                            <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-py-2">
                                <div className="gw-flex gw-items-center gw-space-x-3">
                                    <TokenIcon width="40" height="40" className={isTestnet ? TESTNET_CLASS : ""}/>
                                    <div className="gw-flex gw-flex-col gw-items-between gw-justify-end">
                                        <span className="gw-font-medium">{t.name}</span>
                                        {Number.isFinite(t.priceChangePct) && (
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
                                    <span className="gw-font-medium">{formatCurrency(t.amount, t.currency)}</span>
                                    <span className="gw-typography-caption gw-text-brand-gray-500">
                                        {t.value} {t.symbol}
                                    </span>
                                </div>
                            </div>
                            {index < tokens.length - 1 && <hr className="gw-my-2 gw-border-muted" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
