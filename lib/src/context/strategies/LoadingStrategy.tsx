import React, { FC } from "react";
import { GlyphContext, EmptyGlyphContext } from "../GlyphContext";

const LoadingStrategy: FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <GlyphContext.Provider value={EmptyGlyphContext} children={children}/>
    );
};

LoadingStrategy.displayName = "LoadingStrategy";
export default LoadingStrategy;
