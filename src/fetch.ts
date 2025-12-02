/**
 * Blockchain Theme Fetching
 *
 * Fetch ThemeTokens from the Bitcoin blockchain via ordinals.
 */

import { type ThemeToken, validateThemeToken } from "./schema";

const ORDINALS_API = "https://ordinals.gorillapool.io/api";
const ORDFS_BASE = "https://ordfs.network";

interface OrdinalResult {
	txid: string;
	vout: number;
	outpoint: string;
	satoshis: number;
	origin?: {
		outpoint: string;
		data?: {
			insc?: {
				file?: {
					type?: string;
					json?: unknown;
				};
			};
			map?: Record<string, string>;
		};
	};
	data?: {
		map?: Record<string, string>;
		insc?: {
			file?: {
				type?: string;
			};
		};
	};
}

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
	return `https://themetoken.dev/r/themes/${origin}`;
}

/**
 * Get the ORDFS URL for raw theme content
 *
 * @param origin - The origin outpoint
 * @returns Full URL to the ORDFS content
 */
export function getOrdfsUrl(origin: string): string {
	return `${ORDFS_BASE}/${origin}`;
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
	try {
		const response = await fetch(getOrdfsUrl(origin));

		if (!response.ok) {
			return null;
		}

		const json = await response.json();

		if (json) {
			const validation = validateThemeToken(json);
			if (validation.valid) {
				return {
					theme: validation.theme,
					outpoint: origin,
					origin,
				};
			}
		}

		return null;
	} catch {
		return null;
	}
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

	try {
		// Use search endpoint with base64-encoded query for map.app=ThemeToken
		const query = JSON.stringify({ map: { app: "ThemeToken" } });
		const encodedQuery =
			typeof window !== "undefined"
				? btoa(query)
				: Buffer.from(query).toString("base64");

		const response = await fetch(
			`${ORDINALS_API}/inscriptions/search?q=${encodedQuery}&limit=100`,
		);

		if (response.ok) {
			const results: OrdinalResult[] = await response.json();

			for (const result of results) {
				try {
					// Skip non-ordinals (must be 1 sat)
					if (result.satoshis !== 1) continue;

					// Get origin outpoint
					const originOutpoint = result.origin?.outpoint;
					if (!originOutpoint || seenOrigins.has(originOutpoint)) continue;

					// Check content type
					const fileType =
						result.origin?.data?.insc?.file?.type ||
						result.data?.insc?.file?.type;
					if (fileType !== "application/json") continue;

					// Fetch actual theme content from ordfs
					const theme = await fetchThemeByOrigin(originOutpoint);
					if (theme) {
						themes.push({
							...theme,
							outpoint: result.outpoint, // Current location
						});
						seenOrigins.add(originOutpoint);
					}
				} catch {
					// Skip invalid themes
				}
			}
		}
	} catch (err) {
		console.error("[fetchPublishedThemes] Fetch error:", err);
	}

	return themes;
}
