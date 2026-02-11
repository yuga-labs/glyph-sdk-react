export const formatCurrency = (amount?: number | string, currency?: string | null): string => {
    // using the same locale to make it consistent across browsers
    return new Intl.NumberFormat(["en-US"], {
        style: "currency",
        currency: currency || "USD"
    }).format(Number(amount || 0));
};

export const currencyToSymbol = (currency?: string): string => {
    return formatCurrency(0, currency).replace(/[.\d]/g, "").trim();
};
