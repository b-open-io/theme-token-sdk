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
// Google Fonts Loading
// ============================================================================

/** Cache of loaded Google Fonts */
const loadedGoogleFonts = new Set<string>();

/**
 * Common Google Fonts catalog with supported weights
 * Used for validation and building font URLs
 */
export const GOOGLE_FONTS_CATALOG = {
	sans: [
		{ name: "Inter", weights: [400, 500, 600, 700] },
		{ name: "DM Sans", weights: [400, 500, 600, 700] },
		{ name: "Geist", weights: [400, 500, 600, 700] },
		{ name: "IBM Plex Sans", weights: [400, 500, 600, 700] },
		{ name: "Montserrat", weights: [400, 500, 600, 700] },
		{ name: "Open Sans", weights: [400, 500, 600, 700] },
		{ name: "Outfit", weights: [400, 500, 600, 700] },
		{ name: "Plus Jakarta Sans", weights: [400, 500, 600, 700] },
		{ name: "Poppins", weights: [400, 500, 600, 700] },
		{ name: "Roboto", weights: [400, 500, 700] },
		{ name: "Space Grotesk", weights: [400, 500, 600, 700] },
		{ name: "Nunito", weights: [400, 500, 600, 700] },
		{ name: "Lato", weights: [400, 700] },
		{ name: "Raleway", weights: [400, 500, 600, 700] },
		{ name: "Work Sans", weights: [400, 500, 600, 700] },
		{ name: "Manrope", weights: [400, 500, 600, 700, 800] },
		{ name: "Sora", weights: [400, 500, 600, 700] },
	],
	serif: [
		{ name: "Libre Baskerville", weights: [400, 700] },
		{ name: "Lora", weights: [400, 500, 600, 700] },
		{ name: "Merriweather", weights: [400, 700] },
		{ name: "Playfair Display", weights: [400, 500, 600, 700] },
		{ name: "Source Serif 4", weights: [400, 500, 600, 700] },
		{ name: "Crimson Pro", weights: [400, 500, 600, 700] },
		{ name: "EB Garamond", weights: [400, 500, 600, 700] },
		{ name: "Cormorant", weights: [400, 500, 600, 700] },
		{ name: "Spectral", weights: [400, 500, 600, 700] },
		{ name: "Bitter", weights: [400, 500, 600, 700] },
	],
	mono: [
		{ name: "Fira Code", weights: [400, 500, 600, 700] },
		{ name: "Geist Mono", weights: [400, 500, 600, 700] },
		{ name: "IBM Plex Mono", weights: [400, 500, 600, 700] },
		{ name: "JetBrains Mono", weights: [400, 500, 600, 700] },
		{ name: "Roboto Mono", weights: [400, 500, 700] },
		{ name: "Source Code Pro", weights: [400, 500, 600, 700] },
		{ name: "Space Mono", weights: [400, 700] },
		{ name: "Inconsolata", weights: [400, 500, 600, 700] },
		{ name: "Ubuntu Mono", weights: [400, 700] },
	],
	display: [
		{ name: "Architects Daughter", weights: [400] },
		{ name: "Oxanium", weights: [400, 500, 600, 700] },
		{ name: "Righteous", weights: [400] },
		{ name: "Bebas Neue", weights: [400] },
		{ name: "Abril Fatface", weights: [400] },
		{ name: "Josefin Sans", weights: [400, 500, 600, 700] },
		{ name: "Fredoka", weights: [400, 500, 600, 700] },
	],
} as const;

/** All Google Fonts flattened for lookup */
const ALL_GOOGLE_FONTS = [
	...GOOGLE_FONTS_CATALOG.sans,
	...GOOGLE_FONTS_CATALOG.serif,
	...GOOGLE_FONTS_CATALOG.mono,
	...GOOGLE_FONTS_CATALOG.display,
];

/**
 * Extract font family name from CSS font-family value
 * @param fontValue - CSS value like '"Inter", sans-serif'
 * @returns Font name like "Inter" or null
 */
export function extractFontFamily(fontValue: string): string | null {
	if (!fontValue) return null;
	const match = fontValue.match(/^["']?([^"',]+)["']?/);
	if (!match) return null;
	const fontName = match[1].trim();
	// Exclude system fonts
	const systemFonts = [
		"ui-sans-serif", "ui-serif", "ui-monospace", "system-ui",
		"-apple-system", "BlinkMacSystemFont", "sans-serif", "serif", "monospace",
	];
	if (systemFonts.includes(fontName.toLowerCase())) return null;
	return fontName;
}

/**
 * Check if a font name is a supported Google Font
 */
export function isGoogleFont(fontName: string): boolean {
	return ALL_GOOGLE_FONTS.some(
		(f) => f.name.toLowerCase() === fontName.toLowerCase(),
	);
}

/**
 * Get font info (weights) for a Google Font
 */
export function getGoogleFontInfo(fontName: string): { name: string; weights: readonly number[] } | undefined {
	return ALL_GOOGLE_FONTS.find(
		(f) => f.name.toLowerCase() === fontName.toLowerCase(),
	);
}

/**
 * Build Google Fonts API URL for a font
 */
export function buildGoogleFontUrl(fontName: string, weights?: readonly number[]): string {
	const fontInfo = getGoogleFontInfo(fontName);
	const fontWeights = weights || fontInfo?.weights || [400, 500, 600, 700];
	const encodedFamily = encodeURIComponent(fontName);
	const weightsParam = fontWeights.join(";");
	return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`;
}

/**
 * Load a Google Font by injecting a stylesheet link
 *
 * @param fontName - Google Font name (e.g., "Inter")
 *
 * @example
 * ```ts
 * loadGoogleFont("Inter")
 * // Font is now loading via Google Fonts API
 * ```
 */
export function loadGoogleFont(fontName: string): void {
	if (typeof document === "undefined") return;
	if (loadedGoogleFonts.has(fontName)) return;

	const fontInfo = getGoogleFontInfo(fontName);
	if (!fontInfo) return;

	const link = document.createElement("link");
	link.rel = "stylesheet";
	link.href = buildGoogleFontUrl(fontName, fontInfo.weights);
	document.head.appendChild(link);

	loadedGoogleFonts.add(fontName);
}

/**
 * Check if a Google Font has been loaded
 */
export function isGoogleFontLoaded(fontName: string): boolean {
	return loadedGoogleFonts.has(fontName);
}

// ============================================================================
// On-Chain Font Loading
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
 * Load all assets referenced in theme styles
 *
 * Handles:
 * - Google Fonts: loads via stylesheet injection
 * - On-chain fonts: fetches from ORDFS and registers FontFace
 * - On-chain patterns/images: fetches and converts to data URLs
 *
 * @param styles - Theme style properties
 *
 * @example
 * ```ts
 * await loadThemeAssets(theme.styles.light)
 * // All fonts and patterns are now loaded
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
		if (!value) continue;

		if (isOnChainPath(value)) {
			// On-chain font - load from ORDFS
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
		} else {
			// Could be a Google Font - extract family name and load
			const fontName = extractFontFamily(value);
			if (fontName && isGoogleFont(fontName)) {
				loadGoogleFont(fontName);
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
