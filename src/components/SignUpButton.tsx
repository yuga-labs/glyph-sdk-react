import { Loader2 } from "lucide-react";
import GlyphIcon from "../assets/svg/GlyphIcon";
import { useGlyph } from "../hooks/useGlyph";
import { Button } from "./ui/button";

export const SignUpButton = () => {
    const { glyphUrl } = useGlyph();
    const signupUrl = new URL("/", glyphUrl).toString();

    return !glyphUrl ? (
        <Button variant={"outline"} size={"login"} disabled>
            <span className="gw-inline-flex gw-items-center gw-w-full gw-gap-1">
                <span className="gw-p-2 gw-rounded-full">
                    <GlyphIcon className="!gw-size-5" />
                </span>
                <Loader2 className="gw-size-4 gw-animate-spin" />
            </span>
        </Button>
    ) : (
        <Button
            variant={"outline"}
            size={"login"}
            onClick={() => {
                window.open(signupUrl, "_blank");
            }}
            className="gw-w-52 !gw-justify-start"
        >
            <span className="gw-flex gw-items-center gw-gap-1 gw-w-full">
                <span className="gw-p-2 gw-rounded-full">
                    <GlyphIcon className="!gw-size-5" />
                </span>
                <span className="gw-flex-1 gw-text-center">Visit Glyph Portal</span>
            </span>
        </Button>
    );
};
