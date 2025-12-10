/**
 * Theme Token Schema & Validation
 *
 * Zod schemas and validation utilities for ThemeToken standard.
 * All color values use the Oklch format: "oklch(L C H)"
 */

import { z } from "zod";

/**
 * Schema URL for Theme Token standard
 */
export const THEME_TOKEN_SCHEMA_URL =
	"https://themetoken.dev/v1/schema.json" as const;

/**
 * Core required theme properties (flat, kebab-case, matches ShadCN CSS vars)
 */
const corePropsSchema = z.object({
	background: z.string(),
	foreground: z.string(),
	card: z.string(),
	"card-foreground": z.string(),
	popover: z.string(),
	"popover-foreground": z.string(),
	primary: z.string(),
	"primary-foreground": z.string(),
	secondary: z.string(),
	"secondary-foreground": z.string(),
	muted: z.string(),
	"muted-foreground": z.string(),
	accent: z.string(),
	"accent-foreground": z.string(),
	destructive: z.string(),
	"destructive-foreground": z.string(),
	border: z.string(),
	input: z.string(),
	ring: z.string(),
	radius: z.string(),
});

/**
 * Theme style properties schema
 * Core properties are required, additional properties are allowed
 */
export const themeStylePropsSchema = corePropsSchema.catchall(z.string());

/**
 * Theme style properties type
 * Core required properties plus any additional string properties
 */
export type ThemeStyleProps = z.infer<typeof corePropsSchema> & {
	[key: string]: string;
};

/**
 * Theme styles with light and dark modes
 */
export const themeStylesSchema = z.object({
	light: themeStylePropsSchema,
	dark: themeStylePropsSchema,
});

export type ThemeStyles = z.infer<typeof themeStylesSchema>;

/**
 * CSS rules schema for @layer base
 */
export const cssRulesSchema = z
	.object({
		"@layer base": z
			.record(z.string(), z.record(z.string(), z.string()))
			.optional(),
	})
	.optional();

export type CssRules = z.infer<typeof cssRulesSchema>;

/**
 * Bundle asset definition for theme bundles
 * Describes sibling inscriptions in the same transaction
 */
export const bundleAssetSchema = z.object({
	/** Output index in the transaction (0, 1, 2, etc.) */
	vout: z.number().int().min(0),
	/** Asset type */
	type: z.enum(["font", "pattern", "wallpaper", "icon"]),
	/** Slot this asset fills (e.g., "sans", "background", "hero") */
	slot: z.string(),
});

export type BundleAsset = z.infer<typeof bundleAssetSchema>;

/**
 * Bundle metadata for themes with associated assets
 * Assets are inscribed first (lower vout indices), theme last
 */
export const bundleSchema = z.object({
	/** Bundle format version */
	version: z.literal(1),
	/** Array of assets in this bundle */
	assets: z.array(bundleAssetSchema),
});

export type ThemeBundle = z.infer<typeof bundleSchema>;

/**
 * Theme Token schema
 * Required: $schema, name, styles
 * Optional: author (paymail/identity), css, bundle (for theme bundles)
 */
export const themeTokenSchema = z.object({
	$schema: z.string(),
	name: z.string(),
	author: z.string().optional(),
	/** Bundle metadata for themes with associated assets */
	bundle: bundleSchema.optional(),
	styles: themeStylesSchema,
	css: cssRulesSchema,
});

export type ThemeToken = z.infer<typeof themeTokenSchema>;

/**
 * Validation result type
 */
export type ValidationResult =
	| { valid: true; theme: ThemeToken }
	| { valid: false; error: string };

/**
 * Metadata about parsed CSS
 */
export interface ParseMetadata {
	/** Number of properties found in light mode */
	lightPropertyCount: number;
	/** Number of properties found in dark mode */
	darkPropertyCount: number;
	/** Total unique properties across both modes */
	totalPropertyCount: number;
	/** Whether :root block was found */
	hasLightMode: boolean;
	/** Whether .dark block was found */
	hasDarkMode: boolean;
}

/**
 * Parse result type
 */
export type ParseResult =
	| { valid: true; theme: ThemeToken; metadata: ParseMetadata }
	| { valid: false; error: string };

/**
 * Validate a ThemeToken object
 *
 * @param data - Unknown data to validate
 * @returns Validation result with parsed theme or error message
 *
 * @example
 * ```ts
 * const result = validateThemeToken(json)
 * if (result.valid) {
 *   console.log(result.theme.name)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateThemeToken(data: unknown): ValidationResult {
	const result = themeTokenSchema.safeParse(data);
	if (result.success) {
		return { valid: true, theme: result.data };
	}
	return { valid: false, error: result.error.message };
}

/**
 * Parse @layer base rules from CSS
 * Also captures root-level body { } rules
 */
function parseLayerBase(
	css: string,
): { "@layer base": Record<string, Record<string, string>> } | undefined {
	// First try to match @layer base { ... body ... }
	const layerMatch = css.match(/@layer\s+base\s*\{([\s\S]*?body[\s\S]*?)\}/);

	let bodyContent: string | null = null;

	if (layerMatch) {
		// Extract body { ... } within @layer base
		const bodyMatch = layerMatch[1].match(/body\s*\{([^}]+)\}/);
		if (bodyMatch) {
			bodyContent = bodyMatch[1];
		}
	} else {
		// Try root-level body { }
		const rootBodyMatch = css.match(/(?:^|\n)body\s*\{([^}]+)\}/);
		if (rootBodyMatch) {
			bodyContent = rootBodyMatch[1];
		}
	}

	if (!bodyContent) return undefined;

	const bodyProps: Record<string, string> = {};
	const propRegex = /([a-z-]+)\s*:\s*([^;]+);/gi;
	for (const match of bodyContent.matchAll(propRegex)) {
		bodyProps[match[1].trim()] = match[2].trim();
	}

	if (Object.keys(bodyProps).length === 0) return undefined;

	return {
		"@layer base": {
			body: bodyProps,
		},
	};
}

/**
 * Build a lookup map of all CSS variables from the full CSS
 * Used for resolving var() references across :root and .dark blocks
 */
function buildVarLookup(fullCss: string): Record<string, string> {
	const lookup: Record<string, string> = {};
	const varRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
	for (const match of fullCss.matchAll(varRegex)) {
		// First occurrence wins (root variables take precedence)
		if (!(match[1] in lookup)) {
			lookup[match[1]] = match[2].trim();
		}
	}
	return lookup;
}

/**
 * Resolve var() references recursively using a lookup map
 */
function resolveVar(value: string, lookup: Record<string, string>): string {
	const varMatch = value.match(/^var\(--([a-z0-9-]+)\)$/i);
	if (!varMatch) return value;

	const refName = varMatch[1];
	// Tailwind v4 built-ins
	if (refName === "color-white") return "oklch(1 0 0)";
	if (refName === "color-black") return "oklch(0 0 0)";

	const resolved = lookup[refName];
	return resolved ? resolveVar(resolved, lookup) : value;
}

/**
 * Parse CSS block into ThemeStyleProps
 * Maps CSS variable names to internal format:
 * - --shadow-x → shadow-offset-x
 * - --shadow-y → shadow-offset-y
 * - --tracking-normal → letter-spacing
 * - var(--xxx) references are resolved to their actual values
 */
function parseCssBlock(
	css: string,
	varLookup: Record<string, string>,
): ThemeStyleProps {
	const props: Record<string, string> = {};
	const varRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;

	for (const match of css.matchAll(varRegex)) {
		const [, name, value] = match;
		// Skip @theme inline variables (--color-*, --radius-*, --tracking-* except tracking-normal)
		// These are Tailwind v4 @theme inline duplicates that reference the actual variables
		if (name.startsWith("color-") || name.startsWith("radius-")) {
			continue;
		}
		// Skip tracking-tighter/tight/wide/wider/widest (calculated from tracking-normal)
		if (name.match(/^tracking-(tighter|tight|wide|wider|widest)$/)) {
			continue;
		}

		// Map CSS names to internal JSON format, resolving var() references
		if (name === "shadow-x") {
			props["shadow-offset-x"] = resolveVar(value.trim(), varLookup);
		} else if (name === "shadow-y") {
			props["shadow-offset-y"] = resolveVar(value.trim(), varLookup);
		} else if (name === "tracking-normal") {
			props["letter-spacing"] = resolveVar(value.trim(), varLookup);
		} else {
			props[name] = resolveVar(value.trim(), varLookup);
		}
	}

	return props as unknown as ThemeStyleProps;
}

/**
 * Parse CSS export into ThemeToken format
 * Accepts raw CSS with :root { } and .dark { } blocks
 *
 * @param css - Raw CSS string with :root and .dark blocks
 * @param name - Theme name (defaults to "Custom Theme")
 * @returns Parse result with theme or error message
 *
 * @example
 * ```ts
 * const css = `:root { --background: oklch(1 0 0); ... } .dark { ... }`
 * const result = parseCss(css, 'My Theme')
 * if (result.valid) {
 *   console.log(result.theme)
 * }
 * ```
 */
export function parseCss(css: string, name = "Custom Theme"): ParseResult {
	try {
		// Extract :root block for light mode
		const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
		// Extract .dark block for dark mode
		const darkMatch = css.match(/\.dark\s*\{([^}]+)\}/);

		const hasLightMode = !!rootMatch;
		const hasDarkMode = !!darkMatch;

		if (!rootMatch) {
			return { valid: false, error: "Missing :root { } block for light mode" };
		}

		// Build lookup of all variables from full CSS for resolving var() references
		// This allows dark mode to reference variables defined in :root
		const varLookup = buildVarLookup(css);

		const lightStyles = parseCssBlock(rootMatch[1], varLookup);
		const darkStyles = darkMatch
			? parseCssBlock(darkMatch[1], varLookup)
			: { ...lightStyles }; // Fall back to light if no dark

		// Validate that we have required properties
		const requiredProps = ["background", "foreground", "primary", "radius"];
		for (const prop of requiredProps) {
			if (!(prop in lightStyles)) {
				return {
					valid: false,
					error: `Missing required property: --${prop}`,
				};
			}
		}

		// Check for unresolved var() references
		const unresolvedVars: string[] = [];
		for (const [key, value] of Object.entries(lightStyles)) {
			if (typeof value === "string" && value.startsWith("var(")) {
				unresolvedVars.push(`--${key}`);
			}
		}
		for (const [key, value] of Object.entries(darkStyles)) {
			if (typeof value === "string" && value.startsWith("var(")) {
				unresolvedVars.push(`--${key} (dark)`);
			}
		}
		if (unresolvedVars.length > 0) {
			return {
				valid: false,
				error: `Unresolved var() references: ${unresolvedVars.slice(0, 3).join(", ")}${unresolvedVars.length > 3 ? ` and ${unresolvedVars.length - 3} more` : ""}. Please paste CSS with resolved values.`,
			};
		}

		// Parse @layer base rules if present
		const cssRules = parseLayerBase(css);

		const theme: ThemeToken = {
			$schema: THEME_TOKEN_SCHEMA_URL,
			name,
			styles: {
				light: lightStyles,
				dark: darkStyles,
			},
			...(cssRules && { css: cssRules }),
		};

		// Calculate property counts
		const lightPropertyCount = Object.keys(lightStyles).length;
		const darkPropertyCount = Object.keys(darkStyles).length;
		const allProps = new Set([
			...Object.keys(lightStyles),
			...Object.keys(darkStyles),
		]);
		const totalPropertyCount = allProps.size;

		const metadata: ParseMetadata = {
			lightPropertyCount,
			darkPropertyCount,
			totalPropertyCount,
			hasLightMode,
			hasDarkMode,
		};

		return { valid: true, theme, metadata };
	} catch (err) {
		return {
			valid: false,
			error: err instanceof Error ? err.message : "Failed to parse CSS",
		};
	}
}
