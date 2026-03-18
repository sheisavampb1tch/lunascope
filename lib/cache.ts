import { unstable_cache } from "next/cache";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function createCachedJsonFetcher<T extends JsonValue>(
  keyParts: string[],
  fetcher: () => Promise<T>,
  revalidate = 30,
  tags: string[] = [],
) {
  return unstable_cache(fetcher, keyParts, {
    revalidate,
    tags,
  });
}
