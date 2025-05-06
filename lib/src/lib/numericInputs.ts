export function limitDecimals(value: string, separator: string, maxDecimals: number): string {
    let formattedValue = value;

    if (formattedValue.includes(separator) && !formattedValue.endsWith(separator)) {
        const [whole, decimal] = formattedValue.split(separator);
        if (decimal.length > maxDecimals) {
            formattedValue = `${whole}${separator}${decimal.substring(0, maxDecimals)}`;
        }
    }

    return formattedValue;
}

export function formatInputNumber(value: string, maxDecimals: number): string {
    let formattedValue = value;

    // check for multiple leading zeros (only allow one when followed by decimal)
    if (formattedValue.match(/^0+[.,]/)) formattedValue = formattedValue.replace(/^0+/, "0");
    if (formattedValue.match(/^0[0-9]+/)) formattedValue = formattedValue.replace(/^0+/, "");

    // limit decimal places (separated by either . or ,)
    formattedValue = limitDecimals(formattedValue, ".", maxDecimals);
    formattedValue = limitDecimals(formattedValue, ",", maxDecimals);

    return formattedValue;
}
