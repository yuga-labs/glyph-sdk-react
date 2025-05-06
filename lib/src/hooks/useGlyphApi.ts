import { useContext } from "react";
import { GlyphContext } from "../context/GlyphContext";

export function useGlyphApi() {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("glyph hooks must be used within GlyphProvider");

    return { glyphApiFetch: context.apiFetch };
}
