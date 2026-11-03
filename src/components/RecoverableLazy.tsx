import { Component, createElement, lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";

class WidgetLoadError extends Error {
    constructor() {
        super("Widget content could not be loaded");
    }
}

type Loader<P extends object> = () => Promise<{ default: ComponentType<P> }>;
type Props<P extends object> = { loader: Loader<P>; componentProps: P };
type State<P extends object> = { failed: boolean; content: LazyExoticComponent<ComponentType<P>> };

export class RecoverableLazy<P extends object> extends Component<Props<P>, State<P>> {
    constructor(props: Props<P>) {
        super(props);
        this.state = {
            failed: false,
            content: lazy(() =>
                props.loader().catch(() => {
                    throw new WidgetLoadError();
                })
            )
        };
    }

    static getDerivedStateFromError(error: unknown) {
        if (!(error instanceof WidgetLoadError)) throw error;
        return { failed: true };
    }

    render() {
        if (this.state.failed) {
            return (
                <div className="gw-p-4 gw-text-center gw-text-sm" role="alert">
                    <p>Glyph could not load this content. Reload the page to try again.</p>
                    <p>Reloading may clear unsaved input.</p>
                    <button
                        type="button"
                        className="gw-mt-2 gw-min-h-[44px] gw-px-4 gw-underline"
                        onClick={() => window.location.reload()}
                    >
                        Reload page
                    </button>
                </div>
            );
        }
        return (
            <Suspense fallback={null}>
                {createElement(
                    this.state.content as ComponentType<P>,
                    this.props.componentProps as P & React.Attributes
                )}
            </Suspense>
        );
    }
}
