import { MAINNET_RELAY_API, type paths } from "@relayprotocol/relay-sdk";
import { useQuery, type DefaultError, type QueryKey } from "@tanstack/react-query";
import { useMemo } from "react";

export type GetCurrenciesBody = NonNullable<
    paths["/currencies/v2"]["post"]["requestBody"]
>["content"]["application/json"] & { referrer?: string };
export type GetCurrenciesResponse = paths["/currencies/v2"]["post"]["responses"]["200"]["content"]["application/json"];
type QueryType = typeof useQuery<GetCurrenciesResponse, DefaultError, GetCurrenciesResponse, QueryKey>;
type QueryOptions = Parameters<QueryType>["0"];

export const queryTokenList = async function (
    options?: GetCurrenciesBody,
    headers?: Record<string, string>
): Promise<GetCurrenciesResponse> {
    const url = new URL(`${MAINNET_RELAY_API}/currencies/v2`);
    const res = await fetch(url.href, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers
        },
        body: JSON.stringify(options)
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch token list: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as GetCurrenciesResponse;
};

export default function (options?: GetCurrenciesBody, queryOptions?: Partial<QueryOptions>) {
    const response = (useQuery as QueryType)({
        queryKey: ["useTokenList", options],
        queryFn: () => queryTokenList(options),
        enabled: options ? true : false,
        retry: false,
        ...queryOptions
    });

    return useMemo(() => {
        return {
            ...response,
            data: response.error ? undefined : response.data
        } as Omit<ReturnType<QueryType>, "data"> & {
            data?: GetCurrenciesResponse;
        };
    }, [response.data, response.error, response.isLoading]);
}
