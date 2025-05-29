import failedGradient from "../../assets/images/failed-gradient.png";
import successGradient from "../../assets/images/success-gradient.png";
import { INTERNAL_GRADIENT_TYPE } from "../../lib/constants";

export const WidgetGradient = ({ gradientType }: { gradientType: INTERNAL_GRADIENT_TYPE | undefined }) => {
    return gradientType === INTERNAL_GRADIENT_TYPE.PRIMARY ? (
        <img
            // // @ts-expect-error - fetchpriority is not supported in the image component
            // fetchPriority="high"
            src={successGradient}
            alt="success-gradient"
            className="gw-absolute gw-top-0 gw-left-0 gw-w-full gw-h-full gw-object-cover gw-object-left-bottom gw-z-0 gw-pointer-events-none gw-rounded-t-3xl md:gw-rounded-3xl gw-opacity-20"
        />
    ) : gradientType === INTERNAL_GRADIENT_TYPE.SUCCESS ? (
        <img
            // // @ts-expect-error - fetchpriority is not supported in the image component
            // fetchPriority="high"
            src={successGradient}
            alt="success-gradient"
            className="gw-absolute gw-top-0 gw-left-0 gw-w-full gw-h-full gw-object-cover gw-object-left-bottom gw-z-0 gw-pointer-events-none gw-rounded-t-3xl md:gw-rounded-3xl"
        />
    ) : gradientType === INTERNAL_GRADIENT_TYPE.ERROR ? (
        <img
            // // @ts-expect-error - fetchpriority is not supported in the image component
            // fetchPriority="high"
            src={failedGradient}
            alt="failed-gradient"
            className="gw-absolute gw-top-0 gw-left-0 gw-w-full gw-h-full gw-object-cover gw-object-left-bottom gw-z-0 gw-pointer-events-none gw-rounded-t-3xl md:gw-rounded-3xl"
        />
    ) : null;
};
