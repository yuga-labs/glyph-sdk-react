export const SWAP_ERROR_MESSAGES = {
    INSUFFICIENT_BALANCE: "Insufficient balance",
    INSUFFICIENT_GAS: "Insufficient gas to execute tx",
    FAILED_TO_MAX_LOW_GAS:
        "Unable to set max amount. Balance too low for gas fees. Try entering a smaller amount manually.",
    NO_ROUTES_FOUND:
        "No swap routes available for this pair or amount. Try a different token or amount, or try again later.",
    STATUS_CHECK_FAILED: "Couldn't fetch swap status, check blockchain directly or contact support",
    PRECHECK_FAILURE: "Something went wrong during the swap precheck",
    WALLET_NOT_READY: "wallet not ready, please refresh and try again",
    SOLANA_NOT_IMPLEMENTED: "Solana wallet not implemented",
    NO_GLYPHAPIFETCH: "Wallet not authenticated properly, please refresh and try again",
    NO_FINAL_QUOTE: "Failed to lock in the quote, please try again",
    SOMETHING_WENT_WRONG: "Something went wrong, please try again"
};

export const reformatSwapError = (error: string) => {
    if (typeof error !== "string" || !error) {
        return SWAP_ERROR_MESSAGES.SOMETHING_WENT_WRONG;
    }

    try {
        // raw error sent by relay or blockchain
        if (
            error === SWAP_ERROR_MESSAGES.INSUFFICIENT_GAS ||
            error.toLowerCase().includes("estimategas") ||
            (error.toLowerCase().includes("gas") && error.toLowerCase().includes("exceeds"))
        ) {
            return SWAP_ERROR_MESSAGES.INSUFFICIENT_GAS;
        }

        // Sent by relay
        if (error.toLowerCase().includes("no routes found")) {
            return SWAP_ERROR_MESSAGES.NO_ROUTES_FOUND;
        }
    } catch (_e) {
        // ignore parsing errors, fall through to return original or truncated error
    }

    return error.length < 300 ? error : SWAP_ERROR_MESSAGES.SOMETHING_WENT_WRONG;
};
