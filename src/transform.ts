/**
 * Theme Format Transformations
 *
 * Convert between ThemeToken and other formats like ShadCN Registry and CSS.
 */

import {
	THEME_TOKEN_SCHEMA_URL,
	type ThemeStyleProps,
	type ThemeToken,
} from "./schema";

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
	};
	cssVars: {
		theme: Record<string, string>;
		light: Record<string, string>;
		dark: Record<string, string>;
	};
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
function toRegistryVars(props: ThemeStyleProps): Record<string, string> {
	const vars: Record<string, string> = {};

	for (const [key, value] of Object.entries(props)) {
		if (value === undefined) continue;

		// Map internal letter-spacing to CSS tracking-normal
		if (key === "letter-spacing") {
			vars["tracking-normal"] = value;
		} else {
			vars[key] = value;
		}
	}

	return vars;
}

/**
 * Convert ThemeToken to ShadCN Registry format
 *
 * Creates a registry item compatible with `npx shadcn add <url>`
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

	return {
		$schema: "https://ui.shadcn.com/schema/registry-item.json",
		name: toShadcnName(theme.name),
		type: "registry:style",
		css: {
			"@layer base": {
				body: {
					"letter-spacing": "var(--tracking-normal)",
				},
			},
		},
		cssVars: {
			// Shared theme vars (fonts, radius, tracking calculations)
			theme: {
				"font-sans":
					getThemeValue(light, dark, "font-sans") || "Inter, sans-serif",
				"font-mono": getThemeValue(light, dark, "font-mono") || "monospace",
				"font-serif": getThemeValue(light, dark, "font-serif") || "serif",
				radius: getThemeValue(light, dark, "radius") || "0.5rem",
				"tracking-tighter": "calc(var(--tracking-normal) - 0.05em)",
				"tracking-tight": "calc(var(--tracking-normal) - 0.025em)",
				"tracking-wide": "calc(var(--tracking-normal) + 0.025em)",
				"tracking-wider": "calc(var(--tracking-normal) + 0.05em)",
				"tracking-widest": "calc(var(--tracking-normal) + 0.1em)",
			},
			// Light mode vars
			light: {
				...toRegistryVars(light),
				"tracking-normal":
					getThemeValue(light, dark, "letter-spacing") || "0em",
				spacing: getThemeValue(light, dark, "spacing") || "0.25rem",
			},
			// Dark mode vars
			dark: toRegistryVars(dark),
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
	for (const [key, value] of Object.entries(theme.styles.light)) {
		if (value !== undefined) {
			// Map internal names back to CSS var names
			const cssKey =
				key === "letter-spacing"
					? "tracking-normal"
					: key === "shadow-offset-x"
						? "shadow-x"
						: key === "shadow-offset-y"
							? "shadow-y"
							: key;
			lines.push(`  --${cssKey}: ${value};`);
		}
	}
	lines.push("}");
	lines.push("");

	// Dark mode (.dark)
	lines.push(".dark {");
	for (const [key, value] of Object.entries(theme.styles.dark)) {
		if (value !== undefined) {
			const cssKey =
				key === "letter-spacing"
					? "tracking-normal"
					: key === "shadow-offset-x"
						? "shadow-x"
						: key === "shadow-offset-y"
							? "shadow-y"
							: key;
			lines.push(`  --${cssKey}: ${value};`);
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
	lines.push("  --radius-sm: calc(var(--radius) - 4px);");
	lines.push("  --radius-md: calc(var(--radius) - 2px);");
	lines.push("  --radius-lg: var(--radius);");
	lines.push("  --radius-xl: calc(var(--radius) + 4px);");

	lines.push("}");
	lines.push("");

	// Add the CSS variables
	lines.push("/* Light mode (default) */");
	lines.push(":root {");
	for (const [key, value] of Object.entries(light)) {
		if (value !== undefined) {
			lines.push(`  --${key}: ${value};`);
		}
	}
	lines.push("}");
	lines.push("");

	lines.push("/* Dark mode */");
	lines.push(".dark {");
	for (const [key, value] of Object.entries(dark)) {
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
