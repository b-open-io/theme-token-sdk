/**
 * Blockchain Theme Fetching
 *
 * Fetch ThemeTokens from the Bitcoin blockchain via ordinals.
 */

import { type ThemeToken, validateThemeToken } from "./schema";

const ORDFS_BASE = "https://api.1sat.app/content";
const THEME_INDEX_API = "https://themetoken.dev/api/themes/cache";

/**
 * A published theme from the blockchain
 */
export interface PublishedTheme {
	/** The validated theme data */
	theme: ThemeToken;
	/** Current outpoint location (txid_vout) */
	outpoint: string;
	/** Origin outpoint - the original inscription */
	origin: string;
}

/**
 * Get the registry URL for a theme origin
 *
 * @param origin - The origin outpoint (e.g., "abc123_0")
 * @returns Full URL to the ShadCN registry endpoint
 *
 * @example
 * ```ts
 * const url = getRegistryUrl('65481b3b...b0_0')
 * // Returns: "https://themetoken.dev/r/themes/65481b3b...b0_0"
 * ```
 */
export function getRegistryUrl(origin: string): string {
	return `https://themetoken.dev/r/themes/${normalizeOrigin(origin)}`;
}

/**
 * Get the ORDFS URL for raw theme content
 *
 * @param origin - The origin outpoint
 * @returns Full URL to the ORDFS content
 */
export function getOrdfsUrl(origin: string): string {
	return `${ORDFS_BASE}/${normalizeOrigin(origin)}`;
}

function normalizeOrigin(value: string): string {
	let origin = value.trim();
	try {
		const url = new URL(origin);
		origin = url.pathname;
	} catch {
		// Not a URL; treat it as an origin or /content path.
	}
	origin = origin
		.replace(/^\/?content\//, "")
		.replace(/^\/+/, "")
		.replace(/^r\/themes\//, "");
	const [outpoint, ...path] = origin.split("/");
	const normalizedOutpoint = outpoint
		.replace(/\.(json|png)$/i, "")
		.replace(/\.([0-9]+)$/, "_$1");
	return [normalizedOutpoint, ...path].join("/");
}

/**
 * Fetch a specific theme by origin outpoint
 *
 * @param origin - The origin outpoint (e.g., "abc123def456_0")
 * @returns The published theme or null if not found/invalid
 *
 * @example
 * ```ts
 * const published = await fetchThemeByOrigin('65481b3b...b0_0')
 * if (published) {
 *   console.log(published.theme.name)
 * }
 * ```
 */
export async function fetchThemeByOrigin(
	origin: string,
): Promise<PublishedTheme | null> {
	const normalizedOrigin = normalizeOrigin(origin);
	for (const path of [`${normalizedOrigin}/theme.json`, normalizedOrigin]) {
		try {
			const response = await fetch(getOrdfsUrl(path));
			if (!response.ok) continue;
			const validation = validateThemeToken(await response.json());
			if (validation.valid) {
				return {
					theme: validation.theme,
					outpoint: normalizedOrigin,
					origin: normalizedOrigin,
				};
			}
		} catch {
			// Try the legacy direct inscription path next.
		}
	}
	return null;
}

/**
 * Fetch all published ThemeTokens from the blockchain
 *
 * Uses the search endpoint to find all ThemeToken inscriptions.
 * Returns deduplicated themes by origin (ignores transfers).
 *
 * @returns Array of published themes
 *
 * @example
 * ```ts
 * const themes = await fetchPublishedThemes()
 * for (const { theme, origin } of themes) {
 *   console.log(`${theme.name}: ${origin}`)
 * }
 * ```
 */
export async function fetchPublishedThemes(): Promise<PublishedTheme[]> {
	const themes: PublishedTheme[] = [];
	const seenOrigins = new Set<string>();
	let cursor: number | null = 0;

	try {
		while (cursor !== null) {
			const response = await fetch(
				`${THEME_INDEX_API}?cursor=${cursor}&limit=50`,
			);
			if (!response.ok) break;

			const page = (await response.json()) as {
				themes?: Array<{ origin?: string; theme?: unknown }>;
				nextCursor?: number | null;
			};
			for (const item of page.themes ?? []) {
				if (!item.origin || seenOrigins.has(item.origin)) continue;
				const validation = validateThemeToken(item.theme);
				if (!validation.valid) continue;
				themes.push({
					theme: validation.theme,
					outpoint: item.origin,
					origin: item.origin,
				});
				seenOrigins.add(item.origin);
			}
			const nextCursor = page.nextCursor ?? null;
			cursor = nextCursor === cursor ? null : nextCursor;
		}
	} catch (error) {
		console.error("[fetchPublishedThemes] Fetch error:", error);
	}

	return themes;
}
