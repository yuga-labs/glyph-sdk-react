import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { GlyphContext } from "../context/GlyphContext";

/** Opaque lifetime for private reads; credentials never enter query keys. */
export function useGlyphReadScope(identity?: unknown) {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("glyph hooks must be used within GlyphProvider");
    const { ready, authenticated, apiFetch, glyphUrl } = context;
    const scope = useMemo(
        () => ({
            key: crypto.randomUUID(),
            glyphUrl,
            identity,
            apiFetch: ready && authenticated ? apiFetch : null,
            active: true
        }),
        [ready, authenticated, apiFetch, glyphUrl, identity]
    );
    const current = useRef(scope);
    current.current = scope;
    const isCurrent = useCallback(() => current.current === scope && scope.active && !!scope.apiFetch, [scope]);
    useEffect(() => {
        scope.active = true;
        return () => {
            scope.active = false;
        };
    }, [scope]);
    return { scope, isCurrent };
}
