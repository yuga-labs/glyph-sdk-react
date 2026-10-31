import type { GlyphWidgetBalances } from "../types";

const MAX_EXPANDED_BYTES = 64 * 1024 * 1024;
const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

export class GlyphBalancesDecodeError extends Error {
    constructor() {
        super("Invalid Glyph balances response");
        this.name = "GlyphBalancesDecodeError";
    }
}

/** Decode only explicitly negotiated NFT image references; legacy arrays pass through unchanged. */
export function decodeGlyphBalances(value: unknown): GlyphWidgetBalances {
    const invalid = () => new GlyphBalancesDecodeError();
    if (!record(value)) throw invalid();
    if (Array.isArray(value.nfts)) return value as unknown as GlyphWidgetBalances;
    const encoded = value.nfts;
    if (
        !record(encoded) ||
        encoded.format !== "nft-images-v1" ||
        !Array.isArray(encoded.collections) ||
        !Array.isArray(encoded.images) ||
        !Array.from(encoded.images).every((image) => typeof image === "string") ||
        !Array.isArray(encoded.references) ||
        encoded.images.length > encoded.references.length
    )
        throw invalid();
    const collections = encoded.collections;
    if (
        !collections.every(
            (collection) => record(collection) && Array.isArray(collection.items) && collection.items.every(record)
        )
    )
        throw invalid();
    const data = collections as (Record<string, unknown> & { items: Record<string, unknown>[] })[];
    const images = encoded.images as string[];
    const byteLength = (text: string) => new TextEncoder().encode(text).byteLength;
    const sizes = images.map((image) => byteLength(JSON.stringify(image)));
    let bytes = byteLength(JSON.stringify(data));
    if (bytes > MAX_EXPANDED_BYTES) throw invalid();
    const references: number[][] = [];
    const seen = new Set<string>();
    for (const reference of encoded.references) {
        if (!Array.isArray(reference) || reference.length !== 4 || !Array.from(reference).every(Number.isSafeInteger))
            throw invalid();
        const [collection, item, field, image] = reference as number[];
        const target = data[collection];
        if (
            collection < 0 ||
            !target ||
            item < -1 ||
            (field !== 0 && field !== 1) ||
            image < 0 ||
            image >= images.length ||
            (item >= 0 && (!target.items[item] || (field === 1 && !record(target.items[item].image))))
        )
            throw invalid();
        const current =
            item === -1
                ? target[field === 0 ? "image" : "contractImage"]
                : field === 0
                  ? target.items[item].tokenImage
                  : (target.items[item].image as Record<string, unknown>).cachedUrl;
        const key = `${collection}:${item}:${field}`;
        if (current !== "" || seen.has(key)) throw invalid();
        seen.add(key);
        bytes += sizes[image] - 2;
        if (bytes > MAX_EXPANDED_BYTES) throw invalid();
        references.push(reference);
    }
    const restored = data.map((collection) => ({
        ...collection,
        items: collection.items.map((item) => ({
            ...item,
            ...(record(item.image) ? { image: { ...item.image } } : {})
        }))
    }));
    for (const [collection, item, field, image] of references) {
        const target = restored[collection] as Record<string, unknown> & { items: Record<string, unknown>[] };
        if (item === -1) target[field === 0 ? "image" : "contractImage"] = images[image];
        else if (field === 0) target.items[item].tokenImage = images[image];
        else (target.items[item].image as Record<string, unknown>).cachedUrl = images[image];
    }
    return { ...value, nfts: restored } as unknown as GlyphWidgetBalances;
}
