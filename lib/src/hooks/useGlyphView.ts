import { useContext } from "react";
import { GlyphViewContext } from "../context/GlyphViewContext";

// hook to expose to developers so they can control the widget view
export const useGlyphView = () => {
    const context = useContext(GlyphViewContext);
    if (context === undefined) throw new Error("useGlyphView must be used within a GlyphViewProvider");

    const { setGlyphView } = context;

    return {
        setGlyphView
    };
};
