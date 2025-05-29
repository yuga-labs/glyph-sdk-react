import { Loader2 } from "lucide-react";
import { FC, memo } from "react";
import { useAccount } from "wagmi";
import GlyphIcon from "../assets/svg/GlyphIcon";
import { useNativeGlyphConnection } from "../hooks/useNativeGlyphConnection";
import LoginButton from "./LoginButton";
import { Button } from "./ui/button";

export const NativeGlyphConnectButton: FC = memo(() => {
    const { connect } = useNativeGlyphConnection();
    const { isConnected, isConnecting } = useAccount();

    return !isConnected ? (
        isConnecting ? (
            <Button variant={"default"} size={"login"} disabled>
                <span className="gw-inline-flex gw-items-center gw-w-full gw-gap-1">
                    <span className="gw-p-2 gw-rounded-full">
                        <GlyphIcon className="!gw-size-5" />
                    </span>
                    <Loader2 className="gw-size-4 gw-animate-spin" />
                </span>
            </Button>
        ) : (
            <Button variant={"default"} size={"login"} onClick={connect} className="gw-w-52 !gw-justify-start">
                <span className="gw-flex gw-items-center gw-gap-1 gw-w-full">
                    <span className="gw-p-2 gw-rounded-full">
                        <GlyphIcon className="!gw-size-5" />
                    </span>
                    <span className="gw-flex-1 gw-text-center">Connect to Glyph</span>
                </span>
            </Button>
        )
    ) : (
        <LoginButton />
    );
});
