import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useCallback, useState } from "react";
import { useActivity } from "../../hooks/useActivity";
import { useGlyph } from "../../hooks/useGlyph";
import { ActivityRow } from "../shared/ActivityRow";
import CopyButton from "../shared/CopyButton";
import { LinkWithIcon } from "../shared/LinkWithIcon";
import { ActivityRowSkeleton } from "../shared/skeletons/ActivityRowSkeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import TooltipElement from "../ui/tooltip-element";

export type WalletActivityTabProps = {
    expandFirst?: boolean;
};

export function WalletActivityTab({ expandFirst = false }: WalletActivityTabProps) {
    const { user, hasBalances } = useGlyph();
    const { transactionGroups, fetchTransactions, loadMore, hasMore, isLoading } = useActivity();

    const observerTarget = useRef<HTMLDivElement>(null);
    const [expandedItemId, setExpandedItemId] = useState<string>("");

    const totalTransactions = transactionGroups.reduce((count, group) => count + group.transactions.length, 0);

    // initial data load, call onOpen cb if provided
    useEffect(() => {
        fetchTransactions(true);
    }, []);

    // open first item if required
    useEffect(() => {
        if (!expandFirst) return;

        setExpandedItemId(expandedItemId || transactionGroups?.[0]?.transactions?.[0]?.id || "");
    }, [expandedItemId, transactionGroups, expandFirst]);

    // handle infinite scrolling
    const handleScroll = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isLoading) {
                loadMore();
            }
        },
        [hasMore, isLoading, loadMore]
    );

    useEffect(() => {
        const observer = new IntersectionObserver(handleScroll, {
            root: null,
            rootMargin: "0px",
            threshold: 1.0
        });

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [handleScroll]);

    return (
        <div className="gw-pl-4 gw-pt-4 gw-flex gw-flex-col gw-h-full">
            <div className="gw-flex gw-items-center gw-justify-between gw-pr-4">
                <a
                    href={user?.blockExplorerUrl || `https://apescan.io/address/${user?.evmWallet}`}
                    target="_blank"
                    rel="noreferrer"
                >
                    <h6 className="gw-flex gw-items-center gw-space-x-2">
                        Activity <ArrowUpRight className="gw-text-primary gw-size-6" />
                    </h6>
                </a>

                <TooltipElement
                    description="Activity keeps track of your transactions and their status. Click any transaction to see details."
                    stopPropagation
                    side="left"
                    align="center"
                />
            </div>

            <div className="gw-grid gw-grid-cols-1 gw-mt-2 gw-overflow-auto gw-pr-4 gw-min-h-0">
                {/* hasBalances is false when just switched to a new chain */}
                {!hasBalances || (isLoading && totalTransactions === 0) ? (
                    // initial loading state
                    new Array(3).fill(null).map((_, index) => {
                        return (
                            <div key={index}>
                                <ActivityRowSkeleton />
                                {index < 2 && <hr className="gw-border-muted" />}
                            </div>
                        );
                    })
                ) : totalTransactions > 0 ? (
                    <>
                        {transactionGroups.map((group, groupIndex) => (
                            <div key={group.label || `group-${groupIndex}`}>
                                {/* group label (may not be present) */}
                                {group.label && (
                                    <div className="gw-text-brand-gray-500 gw-rounded-md gw-py-3 gw-typography-body2">
                                        {group.label}
                                    </div>
                                )}

                                {/* group transactions */}
                                <Accordion
                                    type="single"
                                    collapsible
                                    value={expandedItemId}
                                    onValueChange={setExpandedItemId}
                                >
                                    {group.transactions.map((t, index) => {
                                        return (
                                            <div key={t.id}>
                                                <AccordionItem value={t.id}>
                                                    <AccordionTrigger>
                                                        <ActivityRow
                                                            data={{
                                                                status: t.status,
                                                                type: t.type,
                                                                type_text: t.type_text,
                                                                value: t.value,
                                                                amount: t.amount,
                                                                amount_currency: t.amount_currency,
                                                                name_on_list: t.name_on_list
                                                            }}
                                                        />
                                                    </AccordionTrigger>
                                                    <AccordionContent>
                                                        {
                                                            t.detail_rows?.length ? (
                                                                <div className="gw-w-[50%] gw-flex gw-flex-col gw-space-y-1 gw-px-3 gw-text-brand-gray-500">
                                                                    {t.detail_rows?.map?.((row) => (<div className="gw-line-clamp-1 gw-truncate">{row.toUpperCase()}</div>))}
                                                                </div>
                                                            ) : null
                                                        }
                                                        {t.blockExplorerTxns?.length ? (
                                                            <div className="gw-flex gw-flex-col gw-items-start gw-space-y-1 gw-mb-2">
                                                                {t.blockExplorerTxns?.map?.((tx) => (
                                                                    <LinkWithIcon
                                                                        key={tx.url}
                                                                        text={tx.text}
                                                                        url={tx.url}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="gw-w-full gw-mb-2 gw-text-brand-gray-500 gw-typography-caption gw-text-center">
                                                                {t.status_text || "No transaction data"}
                                                            </div>
                                                        )}
                                                        {t.allowIdCopy && (
                                                            <span className="gw-flex gw-items-center gw-space-x-2 gw-typography-caption gw-text-brand-gray-500 gw-w-full gw-justify-center">
                                                                <span>Transaction ID: </span>{" "}
                                                                <CopyButton
                                                                    textToCopy={t?.id}
                                                                    text={t?.id.slice(0, 20) + "..."}
                                                                />
                                                            </span>
                                                        )}
                                                    </AccordionContent>
                                                </AccordionItem>
                                                {index < group.transactions.length - 1 && (
                                                    <hr className="gw-border-muted" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </Accordion>

                                {/* divider between groups, except for the last group */}
                                {groupIndex < transactionGroups.length - 1 && (
                                    <div className="gw-mb-2 gw-border-t gw-border-muted"></div>
                                )}
                            </div>
                        ))}

                        {/* loading indicator w/ observer target */}
                        {hasMore && (
                            <div className="gw-py-2 gw-flex gw-justify-center">
                                {isLoading ? (
                                    <div className="gw-animate-pulse gw-flex gw-space-x-2 gw-items-center">
                                        <div className="gw-h-2 gw-w-2 gw-bg-primary gw-rounded-full"></div>
                                        <div className="gw-h-2 gw-w-2 gw-bg-primary gw-rounded-full"></div>
                                        <div className="gw-h-2 gw-w-2 gw-bg-primary gw-rounded-full"></div>
                                    </div>
                                ) : (
                                    <div ref={observerTarget} className="gw-h-4"></div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="gw-flex gw-justify-center gw-items-center gw-text-brand-gray-500 gw-typography-body2 gw-py-8">
                        No transactions
                    </div>
                )}
            </div>
        </div>
    );
}
