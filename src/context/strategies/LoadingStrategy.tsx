import react, { PropsWithChildren } from "react";
import { EmptyGlyphContext, GlyphContext } from "../GlyphContext";

const LoadingStrategy: react.FC<PropsWithChildren> = ({ children }) => {
    return <GlyphContext.Provider value={EmptyGlyphContext} children={children} />;
};

export default LoadingStrategy;
