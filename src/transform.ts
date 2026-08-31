/**
 * Theme Format Transformations
 *
 * Convert between ThemeToken and other formats like ShadCN Registry and CSS.
 */

import { extractOrigin, getContentUrl, isOnChainPath } from "./assets";
import {
	THEME_TOKEN_SCHEMA_URL,
	type ThemeStyleProps,
	type ThemeToken,
} from "./schema";
import { getShadowScale, toCssVariableName } from "./style";

/**
 * ShadCN Registry item format
 * Compatible with `npx shadcn add` command
 */
export interface ShadcnRegistryItem {
	$schema: string;
	name: string;
	type: "registry:style";
	css: {
		"@layer base": Record<string, Record<string, string>>;
		[key: string]:
			| Record<string, string>
			| Record<string, Record<string, string>>;
	};
	cssVars: {
		theme: Record<string, string>;
		light: Record<string, string>;
		dark: Record<string, string>;
	};
}

/** System font fallback stacks */
const SYSTEM_FONT_STACKS = {
	sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
	serif: "ui-serif, Georgia, Cambria, Times New Roman, serif",
	mono: "ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace",
	heading:
		"ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
} as const;

const RADIUS_THEME_VARS = {
	"radius-sm": "calc(var(--radius) * 0.6)",
	"radius-md": "calc(var(--radius) * 0.8)",
	"radius-lg": "var(--radius)",
	"radius-xl": "calc(var(--radius) * 1.4)",
	"radius-2xl": "calc(var(--radius) * 1.8)",
	"radius-3xl": "calc(var(--radius) * 2.2)",
	"radius-4xl": "calc(var(--radius) * 2.6)",
} as const;

/**
 * Generate a unique font family name from an origin
 */
function generateFontFamilyName(origin: string): string {
	return `tt-${origin.slice(0, 8)}`;
}

/**
 * Extract on-chain font references from theme styles
 * Returns info needed to generate @font-face rules
 */
function extractOnChainFonts(
	light: ThemeStyleProps,
	dark: ThemeStyleProps,
): Array<{
	slot: "sans" | "serif" | "mono" | "heading";
	origin: string;
	familyName: string;
}> {
	const fonts: Array<{
		slot: "sans" | "serif" | "mono" | "heading";
		origin: string;
		familyName: string;
	}> = [];
	const slots = ["sans", "serif", "mono", "heading"] as const;

	for (const slot of slots) {
		const value = (light[`font-${slot}`] || dark[`font-${slot}`]) as
			| string
			| undefined;
		if (value && isOnChainPath(value)) {
			const origin = extractOrigin(value);
			if (origin) {
				fonts.push({
					slot,
					origin,
					familyName: generateFontFamilyName(origin),
				});
			}
		}
	}

	return fonts;
}

/**
 * Get value from either light or dark theme, preferring light
 */
function getThemeValue(
	light: ThemeStyleProps,
	dark: ThemeStyleProps,
	key: keyof ThemeStyleProps,
): string {
	return (light[key] || dark[key] || "") as string;
}

/**
 * Convert theme name to valid ShadCN name (lowercase, alphanumeric with hyphens)
 */
function toShadcnName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

/**
 * Transform internal theme props to registry cssVars format
 * Maps: letter-spacing → tracking-normal
 */
function toRegistryVars(
	props: ThemeStyleProps,
	sharedKeys: ReadonlySet<string> = new Set(),
): Record<string, string> {
	const vars: Record<string, string> = {};

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined || sharedKeys.has(key)) continue;
		vars[toCssVariableName(key)] = value;
	}

	return vars;
}

/**
 * Convert ThemeToken to ShadCN Registry format
 *
 * Creates a registry item compatible with `npx shadcn add <url>`
 * Automatically generates @font-face rules for on-chain font references.
 *
 * @param theme - A validated ThemeToken
 * @returns ShadCN Registry item
 *
 * @example
 * ```ts
 * const registryItem = toShadcnRegistry(theme)
 * // Use with: npx shadcn add https://themetoken.dev/r/themes/abc123_0
 * ```
 */
export function toShadcnRegistry(theme: ThemeToken): ShadcnRegistryItem {
	const { light, dark } = theme.styles;

	// Extract on-chain font references
	const onChainFonts = extractOnChainFonts(light, dark);

	// Build font-family values, using generated names for on-chain fonts
	const fontValues: Record<string, string> = {
		"font-sans": getThemeValue(light, dark, "font-sans") || "Inter, sans-serif",
		"font-mono": getThemeValue(light, dark, "font-mono") || "monospace",
		"font-serif": getThemeValue(light, dark, "font-serif") || "serif",
	};
	const heading = getThemeValue(light, dark, "font-heading");
	if (heading) fontValues["font-heading"] = heading;

	// Replace on-chain paths with generated font-family names + fallbacks
	for (const font of onChainFonts) {
		fontValues[`font-${font.slot}`] =
			`"${font.familyName}", ${SYSTEM_FONT_STACKS[font.slot]}`;
	}

	// TweakCN treats these as shared. Only hoist values that do not actually
	// vary by mode so unusual legacy themes keep their mode-specific behavior.
	const sharedKeys = new Set<string>();
	for (const key of [
		"font-sans",
		"font-serif",
		"font-mono",
		"font-heading",
		"radius",
		"spacing",
		"letter-spacing",
	]) {
		const lightValue = light[key];
		const darkValue = dark[key];
		if (!lightValue || !darkValue || lightValue === darkValue)
			sharedKeys.add(key);
	}

	const themeVars: Record<string, string> = {
		...fontValues,
		radius: getThemeValue(light, dark, "radius") || "0.5rem",
		...RADIUS_THEME_VARS,
		"tracking-normal": getThemeValue(light, dark, "letter-spacing") || "0em",
		"tracking-tighter": "calc(var(--tracking-normal) - 0.05em)",
		"tracking-tight": "calc(var(--tracking-normal) - 0.025em)",
		"tracking-wide": "calc(var(--tracking-normal) + 0.025em)",
		"tracking-wider": "calc(var(--tracking-normal) + 0.05em)",
		"tracking-widest": "calc(var(--tracking-normal) + 0.1em)",
		spacing: getThemeValue(light, dark, "spacing") || "0.25rem",
	};

	// Build CSS object with @layer base
	const css: ShadcnRegistryItem["css"] = {
		"@layer base": {
			body: {
				"letter-spacing": "var(--tracking-normal)",
			},
		},
	};

	// Add @font-face rules for on-chain fonts
	for (const font of onChainFonts) {
		const fontUrl = getContentUrl(font.origin);
		css[`@font-face-${font.slot}`] = {
			"font-family": `"${font.familyName}"`,
			src: `url("${fontUrl}") format("woff2")`,
			"font-weight": "100 900",
			"font-style": "normal",
			"font-display": "swap",
		};
	}

	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: toShadcnName(theme.name),
		type: "registry:style",
		css,
		cssVars: {
			theme: themeVars,
			// Light mode vars
			light: {
				...getShadowScale(light),
				...toRegistryVars(light, sharedKeys),
			},
			// Dark mode vars
			dark: {
				...getShadowScale(dark),
				...toRegistryVars(dark, sharedKeys),
			},
		},
	};
}

/**
 * Convert ThemeToken to CSS string
 *
 * Generates CSS with :root (light) and .dark selectors.
 *
 * @param theme - A validated ThemeToken
 * @returns CSS string ready for use
 *
 * @example
 * ```ts
 * const css = toCss(theme)
 * // Outputs:
 * // :root { --background: oklch(...); ... }
 * // .dark { --background: oklch(...); ... }
 * ```
 */
export function toCss(theme: ThemeToken): string {
	const lines: string[] = [];

	// Light mode (:root)
	lines.push(":root {");
	for (const [key, value] of Object.entries({
		...getShadowScale(theme.styles.light),
		...toRegistryVars(theme.styles.light),
	})) {
		if (value !== undefined) {
			lines.push(`  --${key}: ${value};`);
		}
	}
	lines.push("}");
	lines.push("");

	// Dark mode (.dark)
	lines.push(".dark {");
	for (const [key, value] of Object.entries({
		...getShadowScale(theme.styles.dark),
		...toRegistryVars(theme.styles.dark),
	})) {
		if (value !== undefined) {
			lines.push(`  --${key}: ${value};`);
		}
	}
	lines.push("}");

	// Add @layer base if present
	if (theme.css?.["@layer base"]) {
		lines.push("");
		lines.push("@layer base {");
		for (const [selector, props] of Object.entries(theme.css["@layer base"])) {
			lines.push(`  ${selector} {`);
			for (const [prop, value] of Object.entries(props)) {
				lines.push(`    ${prop}: ${value};`);
			}
			lines.push("  }");
		}
		lines.push("}");
	}

	return lines.join("\n");
}

/**
 * Convert ThemeToken to JSON string
 *
 * @param theme - A validated ThemeToken
 * @param pretty - Whether to format with indentation (default: true)
 * @returns JSON string
 */
export function toJson(theme: ThemeToken, pretty = true): string {
	return JSON.stringify(theme, null, pretty ? 2 : 0);
}

/**
 * Create a minimal ThemeToken from partial styles
 *
 * Fills in missing required properties with defaults.
 *
 * @param name - Theme name
 * @param light - Partial light mode styles
 * @param dark - Partial dark mode styles (defaults to light if not provided)
 * @returns A complete ThemeToken
 */
export function createThemeToken(
	name: string,
	light: Partial<ThemeStyleProps>,
	dark?: Partial<ThemeStyleProps>,
): ThemeToken {
	const defaults: ThemeStyleProps = {
		background: "oklch(1 0 0)",
		foreground: "oklch(0.145 0 0)",
		card: "oklch(1 0 0)",
		"card-foreground": "oklch(0.145 0 0)",
		popover: "oklch(1 0 0)",
		"popover-foreground": "oklch(0.145 0 0)",
		primary: "oklch(0.205 0 0)",
		"primary-foreground": "oklch(0.985 0 0)",
		secondary: "oklch(0.97 0 0)",
		"secondary-foreground": "oklch(0.205 0 0)",
		muted: "oklch(0.97 0 0)",
		"muted-foreground": "oklch(0.556 0 0)",
		accent: "oklch(0.97 0 0)",
		"accent-foreground": "oklch(0.205 0 0)",
		destructive: "oklch(0.577 0.245 27.325)",
		"destructive-foreground": "oklch(0.577 0.245 27.325)",
		border: "oklch(0.922 0 0)",
		input: "oklch(0.922 0 0)",
		ring: "oklch(0.708 0 0)",
		radius: "0.625rem",
	};

	const lightStyles = { ...defaults, ...light } as ThemeStyleProps;
	const darkStyles = (
		dark ? { ...defaults, ...dark } : { ...lightStyles }
	) as ThemeStyleProps;

	return {
		$schema: THEME_TOKEN_SCHEMA_URL,
		name,
		styles: {
			light: lightStyles,
			dark: darkStyles,
		},
	};
}

/**
 * Generate Tailwind v4 CSS config snippet
 *
 * Creates CSS that can be added to globals.css for Tailwind v4 projects.
 * Tailwind v4 uses CSS-native configuration with @theme directive.
 *
 * @param theme - A validated ThemeToken
 * @returns Tailwind v4 CSS config string
 *
 * @example
 * ```ts
 * const config = toTailwindConfig(theme)
 * // Add to your globals.css
 * ```
 */
export function toTailwindConfig(theme: ThemeToken): string {
	const { light, dark } = theme.styles;
	const lines: string[] = [];

	// Tailwind v4 uses @theme for design tokens
	lines.push("@theme {");
	lines.push("  /* Colors */");

	// Map semantic colors to Tailwind color utilities
	const colorKeys = [
		"background",
		"foreground",
		"card",
		"card-foreground",
		"popover",
		"popover-foreground",
		"primary",
		"primary-foreground",
		"secondary",
		"secondary-foreground",
		"muted",
		"muted-foreground",
		"accent",
		"accent-foreground",
		"destructive",
		"destructive-foreground",
		"border",
		"input",
		"ring",
	];

	for (const key of colorKeys) {
		lines.push(`  --color-${key}: var(--${key});`);
	}

	// Add radius
	lines.push("");
	lines.push("  /* Border Radius */");
	for (const [key, value] of Object.entries(RADIUS_THEME_VARS)) {
		lines.push(`  --${key}: ${value};`);
	}

	lines.push("}");
	lines.push("");

	// Add the CSS variables
	lines.push("/* Light mode (default) */");
	lines.push(":root {");
	for (const [key, value] of Object.entries({
		...getShadowScale(light),
		...toRegistryVars(light),
	})) {
		if (value !== undefined) {
			lines.push(`  --${key}: ${value};`);
		}
	}
	lines.push("}");
	lines.push("");

	lines.push("/* Dark mode */");
	lines.push(".dark {");
	for (const [key, value] of Object.entries({
		...getShadowScale(dark),
		...toRegistryVars(dark),
	})) {
		if (value !== undefined) {
			lines.push(`  --${key}: ${value};`);
		}
	}
	lines.push("}");

	return lines.join("\n");
}

/**
 * Generate ShadCN CLI command for an inscribed theme
 *
 * Creates a command that users can run to add the theme to their project.
 *
 * @param origin - The theme's origin outpoint (e.g., "abc123_0")
 * @returns CLI command string
 *
 * @example
 * ```ts
 * const cmd = toShadcnCliCommand('65481b3b...b0_0')
 * // Returns: npx shadcn@latest add https://themetoken.dev/r/themes/65481b3b...b0_0
 * ```
 */
export function toShadcnCliCommand(origin: string): string {
	const registryUrl = `https://themetoken.dev/r/themes/${origin}`;
	return `npx shadcn@latest add ${registryUrl}`;
}

/**
 * Generate the registry URL for a theme
 *
 * @param origin - The theme's origin outpoint
 * @returns Full registry URL
 */
export function getThemeRegistryUrl(origin: string): string {
	return `https://themetoken.dev/r/themes/${origin}`;
}
