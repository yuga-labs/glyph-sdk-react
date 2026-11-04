import { useContext, useEffect, useState } from "react";
import { GlyphViewContext } from "../context/GlyphViewContext";
import { useGlyph } from "../hooks/useGlyph";
import useMediaQuery from "../hooks/useMediaQuery";
import "../index.css";
import { INTERNAL_GRADIENT_TYPE } from "../lib/constants";
import { GlyphViewType, GlyphWidgetProps } from "../types";
import { GlyphWidgetButton } from "./GlyphWidgetButton";
import { LoginButton } from "./LoginButton";
import { Drawer, DrawerContent, DrawerDescription, DrawerHandle, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Toaster } from "./ui/sonner";
import { preloadWallet, Wallet } from "./widget/Wallet";
import { RecoverableLazy } from "./RecoverableLazy";
import { WidgetDataError } from "./WidgetDataState";
const loadGradient = () =>
    import("./widget/internal/WidgetGradient").then(({ WidgetGradient }) => ({ default: WidgetGradient }));

const preloadWidget = () => {
    preloadWallet();
    void loadGradient().catch(() => {});
};

export const GlyphWidget = ({ buttonProps, minWidth = 768, alwaysOpen = false }: GlyphWidgetProps) => {
    const theme = "light";
    const isDesktop = useMediaQuery(`(min-width: ${minWidth}px)`);

    const viewCtx = useContext(GlyphViewContext);
    if (!viewCtx) throw new Error("GlyphWidget must be used within a GlyphViewProvider");

    const { glyphView, setGlyphView } = viewCtx;
    const { ready, authenticated, user, hideWidget, isUserLoading, isUserError, refreshUser } = useGlyph();

    // hide tab when not ready, not authenticated, or no user
    // show if showWalletPermanently is true
    useEffect(() => {
        if (alwaysOpen) setGlyphView(GlyphViewType.OPEN);
        else if (!ready || !authenticated) setGlyphView(GlyphViewType.CLOSED);
    }, [ready, authenticated, setGlyphView]);

    const [gradientType, setGradientType] = useState<INTERNAL_GRADIENT_TYPE>();

    return hideWidget ? (
        <div />
    ) : (
        <div className={`glyph-widget gw-widget-container ${theme === "light" ? "light" : "dark"}`}>
            {/* Active session */}
            {ready && authenticated && isUserError ? (
                <WidgetDataError compact message="Glyph data is unavailable." onRetry={() => refreshUser(true)} />
            ) : ready && authenticated && isUserLoading ? (
                <div
                    className="gw-inline-flex gw-h-12 gw-w-52 gw-items-center gw-justify-center gw-gap-2 gw-rounded-full gw-bg-secondary/90 gw-text-secondary-foreground"
                    role="status"
                    aria-live="polite"
                >
                    <span>Loading Glyph</span>
                    <span
                        className="gw-size-4 gw-rounded-full gw-border-2 gw-border-current gw-border-t-transparent motion-safe:gw-animate-spin motion-reduce:gw-animate-none"
                        aria-hidden="true"
                    />
                </div>
            ) : ready && authenticated && user ? (
                <>
                    {/* Popover on Desktop */}
                    {isDesktop ? (
                        <Popover
                            open={alwaysOpen ? true : glyphView !== GlyphViewType.CLOSED}
                            onOpenChange={
                                alwaysOpen
                                    ? () => setGlyphView(GlyphViewType.OPEN)
                                    : (v: boolean) => setGlyphView(v ? GlyphViewType.OPEN : GlyphViewType.CLOSED)
                            }
                        >
                            <PopoverTrigger onPointerEnter={preloadWidget} onFocus={preloadWidget}>
                                {alwaysOpen ? null : <GlyphWidgetButton {...(buttonProps || {})} />}
                            </PopoverTrigger>

                            {/* "glyph-widget" class is required, since it applies the font style to the popover, which is mounted outside the parent div of this component */}
                            <PopoverContent sideOffset={10} align="end" className={`glyph-widget gw-wallet-container`}>
                                <Toaster theme={theme} />
                                <RecoverableLazy
                                    loader={loadGradient}
                                    componentProps={{ gradientType: gradientType ?? INTERNAL_GRADIENT_TYPE.PRIMARY }}
                                    fallback={null}
                                />{" "}
                                {/* Default to primary gradient */}
                                <Wallet setGradientType={setGradientType} />
                            </PopoverContent>
                        </Popover>
                    ) : (
                        // Drawer on Mobile
                        <Drawer
                            open={alwaysOpen ? true : glyphView !== GlyphViewType.CLOSED}
                            onOpenChange={
                                alwaysOpen
                                    ? () => setGlyphView(GlyphViewType.OPEN)
                                    : (v: boolean) => setGlyphView(v ? GlyphViewType.OPEN : GlyphViewType.CLOSED)
                            }
                        >
                            <DrawerTrigger onPointerEnter={preloadWidget} onFocus={preloadWidget}>
                                {alwaysOpen ? null : <GlyphWidgetButton {...(buttonProps || {})} />}
                            </DrawerTrigger>

                            {/* "glyph-widget" class is required, since it applies the font style to the popover, which is mounted outside the parent div of this component */}
                            <DrawerContent className={`glyph-widget`}>
                                <RecoverableLazy
                                    loader={loadGradient}
                                    componentProps={{ gradientType: gradientType ?? INTERNAL_GRADIENT_TYPE.PRIMARY }}
                                    fallback={null}
                                />{" "}
                                {/* Default to primary gradient */}
                                <DrawerHandle />
                                <DrawerTitle className="gw-sr-only">Glyph Wallet</DrawerTitle>
                                <DrawerDescription className="gw-sr-only">
                                    Glyph Widget to access all the things in one place related to your account!
                                </DrawerDescription>
                                <Toaster theme={theme} />
                                <div className="gw-wallet-container gw-w-full" style={{ maxHeight: "80dvh" }}>
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
