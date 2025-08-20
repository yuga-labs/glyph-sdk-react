import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { useState } from "react";
import { useBalances } from "../../hooks/useBalances";
import ExpandItemIcon from "../../assets/svg/ExpandItemIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { buttonVariants } from "../ui/button";
import { NFTImgFail } from "../../assets/svg/NFTImgFail";
import LinkedNFTChip from "../../assets/svg/LinkedNFTChip";
import { cn } from "../../lib/utils";

type NFTImageProps = React.SVGProps<SVGSVGElement> & {
    alt: string;
    url?: string | null;
    title?: string;
    className?: string;
}

const NFTImg = ({ url, alt, title, className, ...props }: NFTImageProps): JSX.Element => {
    const [imgErr, setImgErr] = useState(false);

    return (
        <>
            {(!imgErr && url) ?
                <img
                    src={url}
                    alt={alt}
                    title={title}
                    onError={() => setImgErr(true)}
                    className={cn("gw-object-cover gw-rounded-md gw-block", className)}
                /> : <NFTImgFail style={{ width: "100%", height: "100%" }} {...props} />
            }
        </>
    );
}

export function WalletNFTsTab() {
    const { glyphUrl } = useGlyph();
    const { balances } = useBalances();
    const [expandedItemId, setExpandedItemId] = useState<string | undefined>(undefined);
    const nfts = balances?.nfts || [];

    const nftsURL = new URL("/nfts", glyphUrl).toString();

    return (
        <div className="gw-pl-4 gw-pt-4 gw-flex gw-flex-col gw-h-full">
            {/* Fixed header */}
            <div className="gw-flex gw-mb-2 gw-flex-row gw-justify-between gw-items-center gw-w-full gw-flex-shrink-0">
                <h6>My NFTs</h6>
            </div>

            {nfts?.length ? (
                <div className="gw-flex gw-flex-col gw-flex-1 gw-min-h-0">
                    {/* Scrollable accordion area */}
                    <div className="gw-flex-1 gw-min-h-0 gw-overflow-auto">
                        <Accordion className="gw-w-full"
                            type="single"
                            collapsible
                            value={expandedItemId}
                            onValueChange={setExpandedItemId}
                        >
                            {nfts.map((t, idx) => {
                                return (
                                    <div key={idx.toString()}>
                                        <AccordionItem value={idx.toString()} className="gw-pr-4">
                                            <AccordionTrigger asChild>
                                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-py-2 gw-cursor-pointer">
                                                    <div className="gw-flex gw-items-center gw-space-x-3 gw-min-w-0 gw-flex-1">
                                                        <div className="gw-flex-shrink-0">
                                                            <NFTImg
                                                                url={t.contractImage || t.image}
                                                                alt={t.name}
                                                                className="gw-w-10 gw-h-10" // for img
                                                                height="40" // for svg
                                                                width="40" // for svg
                                                            />
                                                        </div>
                                                        <span className="gw-text-sm gw-line-clamp-1 gw-truncate gw-letter-spacing-0.12 gw-min-w-0 gw-max-w-[75%]">
                                                            {t.name?.toLocaleUpperCase?.() || t.symbol || ""}
                                                        </span>
                                                    </div>
                                                    <div className="gw-flex gw-flex-col gw-items-between gw-justify-end gw-text-end gw-flex-shrink-0">
                                                        <ExpandItemIcon className={`${expandedItemId === idx.toString() ? '' : 'gw-rotate-180'}`} />
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="gw-grid gw-grid-cols-4 gw-gap-4 gw-my-2">
                                                    {t.items.map((item) => (
                                                        <div key={item.tokenId} className="gw-relative">
                                                            {item.fromLinked && (
                                                                <div className="gw-absolute gw-top-1 gw-right-1 gw-z-10">
                                                                    <LinkedNFTChip />
                                                                </div>
                                                            )}
                                                            {item.fromDelegated && (
                                                                <div className="gw-absolute gw-bottom-0 gw-left-0 gw-right-0 gw-z-10">
                                                                    <div className="gw-bg-black gw-bg-opacity-50 gw-text-white gw-text-center gw-text-[10px] gw-py-0.5 gw-px-1">
                                                                        Delegate
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <NFTImg
                                                                url={item.tokenImage || item.image?.thumbnailUrl}
                                                                alt={item.tokenId}
                                                                className="gw-w-16 gw-h-16" // for img
                                                                height="64" // for svg
                                                                width="64" // for svg
                                                                title={item.tokenName || item.name || item.tokenId}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </div>
                                );
                            })}
                        </Accordion>
                    </div>

                    {/* Fixed footer */}
                    <div className="gw-flex gw-justify-center gw-items-center gw-w-full gw-text-brand-gray-500 gw-typography-body2 gw-flex-shrink-0 gw-mt-2">
                        Need to transfer? Use
                        <a href={nftsURL} target="_blank" rel="noopener noreferrer" className={buttonVariants({
                            variant: "link-inline",
                            size: "xs-inline",
                            scale: false
                        })}>Glyph Dashboard</a>
                    </div>
                </div>
            ) : (
                <div className="gw-flex gw-justify-center gw-items-center gw-flex-1 gw-text-brand-gray-500 gw-typography-body2 gw-pr-4">
                    No NFTs found
                </div>
            )}
        </div>
    );
}
