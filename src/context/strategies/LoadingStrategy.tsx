import { EmptyGlyphContext, GlyphContext } from "../GlyphContext";

const LoadingStrategy = ({ children }: { children: React.ReactNode }) => {
    return <GlyphContext.Provider value={EmptyGlyphContext} children={children} />;
};

export default LoadingStrategy;
