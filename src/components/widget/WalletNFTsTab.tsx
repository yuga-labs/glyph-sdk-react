import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@radix-ui/react-accordion";
import { useState } from "react";
import NoTokenIcon from "../../assets/svg/NoTokenIcon";
import { useBalances } from "../../hooks/useBalances";
import ExpandItemIcon from "../../assets/svg/ExpandItemIcon";
import { Button } from "../ui/button";
import { useGlyph } from "../../hooks/useGlyph";

export function WalletNFTsTab() {
    const { glyphUrl } = useGlyph();
    const { balances } = useBalances();
    const [expandedItemId, setExpandedItemId] = useState<string | undefined>(undefined);
    const nfts = balances?.nfts || [];

    const nftsURL = new URL("/nfts", glyphUrl).toString();

    return (
        <div className="gw-p-4">
            <div className="gw-flex gw-flex-row gw-justify-between gw-items-center gw-w-full">
                <h6>My NFTs</h6>
                <Button variant={"default"} size={"xsm"} className="gw-brand-forest !gw-justify-start"
                onClick={() => {window.open(nftsURL, "_blank");}}>
                    <span className="gw-flex gw-items-center gw-gap-1 gw-w-full">
                        <span className="gw-flex-1 gw-text-center">Dashboard</span>
                    </span>
                </Button>
            </div>

            <div className="gw-grid gw-grid-cols-1 gw-mt-2">
                {nfts.length > 0 &&
                    <div className="gw-flex gw-justify-center gw-w-full gw-mb-2 gw-text-brand-gray-500 gw-typography-body2">
                        Need to transfer? Go to Glyph Dashboard
                    </div>
                }

                {nfts.length > 0 && 
                    <Accordion 
                        type="single" 
                        collapsible
                        value={expandedItemId}
                        onValueChange={setExpandedItemId}
                    >
                    {nfts.map((t, idx) => {
                        const CollectionImg = t.image ? <img
                            src={t.image}
                            alt={t.name}
                            className="gw-w-10 gw-h-10 gw-object-cover gw-rounded-md gw-block"
                        /> : <NoTokenIcon width="40" height="40" className="border-radius: 5px;"/>;

                        return (
                            <div key={idx.toString()}>
                                <AccordionItem value={idx.toString()}>
                                    <AccordionTrigger asChild>
                                        <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-py-2 gw-cursor-pointer">
                                            <div className="gw-flex gw-items-center gw-space-x-3 gw-min-w-0 gw-flex-1">
                                                <div className="gw-flex-shrink-0">{CollectionImg}</div>
                                                <span className="gw-text-sm gw-line-clamp-1 gw-truncate gw-letter-spacing-0.12 gw-min-w-0 gw-max-w-[75%]">
                                                    {t.name.toLocaleUpperCase()}
                                                </span>
                                            </div>
                                            <div className="gw-flex gw-flex-col gw-items-between gw-justify-end gw-text-end gw-flex-shrink-0">
                                                <ExpandItemIcon className={`${expandedItemId === idx.toString() ? 'gw-rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="gw-grid gw-grid-cols-4 gw-gap-4 gw-mt-2">
                                            {t.items.map((item) => (
                                                <img
                                                    key={item.tokenId}
                                                    title={item.name || item.tokenId}
                                                    src={item.image?.thumbnailUrl}
                                                    alt={item.tokenId}
                                                    className="gw-w-16 gw-h-16 gw-object-cover gw-rounded-md gw-block"
                                                />
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </div>
                        );
                    })}
                    </Accordion>
                }
                {nfts.length === 0 && (
                    <div className="gw-flex gw-justify-center gw-w-full gw-mt-2 gw-text-brand-gray-500 gw-typography-body2">
                        No NFTs found
                    </div>
                )}
            </div>
        </div>
    );
}
