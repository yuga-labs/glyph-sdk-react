import { FC, memo, useContext, useEffect, useState } from "react";
import { GlyphViewContext } from "../context/GlyphViewContext";
import { useGlyph } from "../hooks/useGlyph";
import useMediaQuery from "../hooks/useMediaQuery";
import "../index.css";
import { INTERNAL_GRADIENT_TYPE } from "../lib/constants";
import { GlyphViewType, GlyphWidgetProps } from "../types";
import GlyphWidgetButton from "./GlyphWidgetButton";
import LoginButton from "./LoginButton";
import { Drawer, DrawerContent, DrawerDescription, DrawerHandle, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Toaster } from "./ui/sonner";
import { Wallet } from "./widget/Wallet";
import { WidgetGradient } from "./widget/WidgetGradient";

const GlyphWidget: FC<GlyphWidgetProps> = ({ buttonProps }) => {
    const theme = "light";
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const viewCtx = useContext(GlyphViewContext);
    if (!viewCtx) throw new Error("GlyphWidget must be used within a GlyphViewProvider");

    const { glyphView, setGlyphView } = viewCtx;
    const { ready, authenticated, user, hideWidget } = useGlyph();

    // hide tab when not ready, not authenticated, or no user
    useEffect(() => {
        if (!ready || !authenticated) setGlyphView(GlyphViewType.CLOSED);
    }, [ready, authenticated, setGlyphView]);

    const [gradientType, setGradientType] = useState<INTERNAL_GRADIENT_TYPE>();

    return hideWidget ? (
        <div />
    ) : (
        <div className={`glyph-widget gw-widget-container ${theme === "light" ? "light" : "dark"}`}>
            {/* Active session */}
            {ready && authenticated && user ? (
                <>
                    {/* Popover on Desktop */}
                    {isDesktop ? (
                        <Popover
                            open={glyphView !== GlyphViewType.CLOSED}
                            onOpenChange={(v: boolean) => setGlyphView(v ? GlyphViewType.OPEN : GlyphViewType.CLOSED)}
                        >
                            <PopoverTrigger>
                                <GlyphWidgetButton {...(buttonProps || {})} />
                            </PopoverTrigger>

                            {/* "glyph-widget" class is required, since it applies the font style to the popover, which is mounted outside the parent div of this component */}
                            <PopoverContent sideOffset={10} align="end" className={`glyph-widget gw-wallet-container`}>
                                <Toaster theme={theme} />
                                <WidgetGradient gradientType={gradientType} />
                                <Wallet setGradientType={setGradientType} />
                            </PopoverContent>
                        </Popover>
                    ) : (
                        // Drawer on Mobile
                        <Drawer
                            open={glyphView !== GlyphViewType.CLOSED}
                            onOpenChange={(v: boolean) => setGlyphView(v ? GlyphViewType.OPEN : GlyphViewType.CLOSED)}
                        >
                            <DrawerTrigger>
                                <GlyphWidgetButton {...(buttonProps || {})} />
                            </DrawerTrigger>

                            {/* "glyph-widget" class is required, since it applies the font style to the popover, which is mounted outside the parent div of this component */}
                            <DrawerContent className={`glyph-widget`}>
                                <WidgetGradient gradientType={gradientType} />
                                <DrawerHandle />
                                <DrawerTitle className="gw-sr-only">Glyph Wallet</DrawerTitle>
                                <DrawerDescription className="gw-sr-only">
                                    Glyph Widget to access all the things in one place related to your account!
                                </DrawerDescription>
                                <Toaster theme={theme} />
                                <div className="gw-wallet-container gw-w-full">
                                    <Wallet setGradientType={setGradientType} />
                                </div>
                            </DrawerContent>
                        </Drawer>
                    )}
                </>
            ) : (
                <LoginButton />
            )}
        </div>
    );
};

GlyphWidget.displayName = "GlyphWidget";
export default memo(GlyphWidget);
