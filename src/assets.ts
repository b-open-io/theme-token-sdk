/**
 * On-Chain Asset Loading
 *
 * Load fonts, patterns, and images from ORDFS (Ordinals File System).
 * These utilities handle fetching and rendering blockchain-inscribed assets.
 */

const ORDFS_BASE = "https://ordfs.network";

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Check if a value is an on-chain asset path
 * @param value - CSS value to check (e.g., "/content/abc123_0")
 */
export function isOnChainPath(value: string): boolean {
	return value.startsWith("/content/");
}

/**
 * Extract origin from an on-chain path
 * @param path - Path like "/content/abc123_0"
 * @returns Origin like "abc123_0" or null if invalid
 */
export function extractOrigin(path: string): string | null {
	if (!path.startsWith("/content/")) return null;
	return path.slice("/content/".length);
}

/**
 * Get ORDFS content URL for an origin
 */
export function getContentUrl(origin: string): string {
	return `${ORDFS_BASE}/content/${origin}`;
}

// ============================================================================
// Font Loading
// ============================================================================

export interface LoadedFont {
	origin: string;
	familyName: string;
	fontFace: FontFace;
}

// Memory cache for loaded fonts
const fontCache = new Map<string, LoadedFont>();

// Loading promises to prevent duplicate fetches
const fontLoadingPromises = new Map<string, Promise<string>>();

/**
 * Generate a unique font family name from an origin
 */
function generateFontFamilyName(origin: string): string {
	return `OnChain-${origin.slice(0, 8)}`;
}

/**
 * Load an on-chain font by origin
 *
 * Fetches the font file from ORDFS, creates a FontFace, and registers it.
 * Returns the generated font family name for use in CSS.
 *
 * @param origin - Ordinal origin (e.g., "abc123_0")
 * @returns Font family name to use in CSS
 *
 * @example
 * ```ts
 * const familyName = await loadFontByOrigin("abc123_0")
 * document.body.style.fontFamily = `"${familyName}", sans-serif`
 * ```
 */
export async function loadFontByOrigin(origin: string): Promise<string> {
	// Return cached font family name if already loaded
	const cached = fontCache.get(origin);
	if (cached) {
		return cached.familyName;
	}

	// If already loading, wait for that promise
	const existing = fontLoadingPromises.get(origin);
	if (existing) {
		return existing;
	}

	// Create loading promise
	const loadPromise = (async () => {
		try {
			// Fetch font file from ORDFS
			const response = await fetch(getContentUrl(origin));
			if (!response.ok) {
				throw new Error(`Failed to fetch font: ${response.status}`);
			}

			const buffer = await response.arrayBuffer();

			// Generate unique family name
			const familyName = generateFontFamilyName(origin);

			// Create FontFace and load it
			const fontFace = new FontFace(familyName, buffer, {
				style: "normal",
				weight: "400",
			});

			await fontFace.load();
			document.fonts.add(fontFace);

			// Cache the result
			const loadedFont: LoadedFont = {
				origin,
				familyName,
				fontFace,
			};
			fontCache.set(origin, loadedFont);

			return familyName;
		} finally {
			fontLoadingPromises.delete(origin);
		}
	})();

	fontLoadingPromises.set(origin, loadPromise);
	return loadPromise;
}

/**
 * Check if a font is already loaded/cached
 */
export function isFontLoaded(origin: string): boolean {
	return fontCache.has(origin);
}

/**
 * Get a cached font (returns undefined if not loaded)
 */
export function getCachedFont(origin: string): LoadedFont | undefined {
	return fontCache.get(origin);
}

/**
 * Clear all cached fonts
 */
export function clearFontCache(): void {
	for (const loaded of fontCache.values()) {
		document.fonts.delete(loaded.fontFace);
	}
	fontCache.clear();
}

// ============================================================================
// Pattern/Image Loading
// ============================================================================

// Cache for loaded patterns as data URLs
const patternCache = new Map<string, string>();
const patternLoadingPromises = new Map<string, Promise<string>>();

/**
 * Load an on-chain pattern/image by origin
 *
 * Fetches the asset from ORDFS and returns a data URL for use in CSS.
 *
 * @param origin - Ordinal origin (e.g., "abc123_0")
 * @returns Data URL for use in CSS background-image or mask-image
 *
 * @example
 * ```ts
 * const dataUrl = await loadPatternByOrigin("abc123_0")
 * element.style.maskImage = `url("${dataUrl}")`
 * ```
 */
export async function loadPatternByOrigin(origin: string): Promise<string> {
	// Return cached
	const cached = patternCache.get(origin);
	if (cached) {
		return cached;
	}

	// If already loading, wait for that promise
	const existing = patternLoadingPromises.get(origin);
	if (existing) {
		return existing;
	}

	// Create loading promise
	const loadPromise = (async () => {
		try {
			const response = await fetch(getContentUrl(origin));
			if (!response.ok) {
				throw new Error(`Failed to fetch pattern: ${response.status}`);
			}

			const blob = await response.blob();
			const dataUrl = await blobToDataUrl(blob);

			patternCache.set(origin, dataUrl);
			return dataUrl;
		} finally {
			patternLoadingPromises.delete(origin);
		}
	})();

	patternLoadingPromises.set(origin, loadPromise);
	return loadPromise;
}

/**
 * Check if a pattern is already loaded/cached
 */
export function isPatternLoaded(origin: string): boolean {
	return patternCache.has(origin);
}

/**
 * Clear all cached patterns
 */
export function clearPatternCache(): void {
	patternCache.clear();
}

// ============================================================================
// Theme Asset Loading
// ============================================================================

/** System font fallback stacks */
const SYSTEM_FONTS = {
	sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
	serif: "ui-serif, Georgia, Cambria, Times New Roman, serif",
	mono: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
};

/**
 * Load all on-chain assets referenced in theme styles
 *
 * Scans for font-sans, font-serif, font-mono, bg-image, etc.
 * and loads any on-chain assets, updating CSS custom properties.
 *
 * @param styles - Theme style properties
 *
 * @example
 * ```ts
 * await loadThemeAssets(theme.styles.light)
 * // On-chain fonts and patterns are now loaded and CSS vars updated
 * ```
 */
export async function loadThemeAssets(
	styles: Record<string, string>,
): Promise<void> {
	const fontLoads: Promise<void>[] = [];
	const patternLoads: Promise<void>[] = [];

	// Font slots to check
	const fontSlots = ["sans", "serif", "mono"] as const;

	for (const slot of fontSlots) {
		const value = styles[`font-${slot}`];
		if (value && isOnChainPath(value)) {
			const origin = extractOrigin(value);
			if (origin) {
				fontLoads.push(
					loadFontByOrigin(origin).then((familyName) => {
						document.documentElement.style.setProperty(
							`--font-${slot}`,
							`"${familyName}", ${SYSTEM_FONTS[slot]}`,
						);
					}),
				);
			}
		}
	}

	// Pattern/image properties to check
	const imageProps = ["bg-image", "card-bg-image", "sidebar-bg-image"];

	for (const prop of imageProps) {
		const value = styles[prop];
		if (value && isOnChainPath(value)) {
			const origin = extractOrigin(value);
			if (origin) {
				patternLoads.push(
					loadPatternByOrigin(origin).then((dataUrl) => {
						document.documentElement.style.setProperty(
							`--${prop}`,
							`url("${dataUrl}")`,
						);
					}),
				);
			}
		}
	}

	// Wait for all assets to load
	await Promise.all([...fontLoads, ...patternLoads]);
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert a Blob to a data URL
 */
function blobToDataUrl(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}
