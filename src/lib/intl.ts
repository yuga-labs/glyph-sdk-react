export const formatCurrency = (
    amount?: number | string,
    currency?: string | null,
    showLessThan?: boolean,
    style: "currency" | "decimal" = "currency"
): string => {
    // using the same locale to make it consistent across browsers

    const showLessThanValid = showLessThan && Number(amount) < 0.01;

    const resolvedAmount = showLessThanValid ? 0.01 : amount;

    const formattedValue = new Intl.NumberFormat(["en-US"], {
        style: style,
        currency: style === "decimal" ? undefined : currency || "USD"
    }).format(Number(resolvedAmount || 0));

    return showLessThanValid ? `< ${formattedValue}` : formattedValue;
};

export const currencyToSymbol = (currency?: string): string => {
    return formatCurrency(0, currency).replace(/[.\d]/g, "").trim();
};
