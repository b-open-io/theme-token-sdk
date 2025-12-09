/**
 * Runtime Theme Application
 *
 * Utilities for applying themes to the DOM at runtime.
 * These functions require a browser environment.
 */

import type { ThemeStyleProps, ThemeToken } from "./schema";
import { loadThemeAssets } from "./assets";

/**
 * Apply theme styles to document root
 *
 * Sets CSS custom properties on document.documentElement.
 * Maps internal property names to CSS variable names.
 *
 * @param styles - Theme style properties to apply
 *
 * @example
 * ```ts
 * applyTheme(theme.styles.light)
 * // or
 * applyTheme(theme.styles.dark)
 * ```
 */
export function applyTheme(
	styles: ThemeStyleProps,
	element?: HTMLElement,
): void {
	const target =
		element ??
		(typeof document !== "undefined" ? document.documentElement : null);
	if (!target) {
		console.warn("[applyTheme] No target element available");
		return;
	}

	for (const [key, value] of Object.entries(styles)) {
		if (typeof value !== "string") continue;
		// Map internal names to CSS variable names
		const cssKey =
			key === "letter-spacing"
				? "tracking-normal"
				: key === "shadow-offset-x"
					? "shadow-x"
					: key === "shadow-offset-y"
						? "shadow-y"
						: key;
		target.style.setProperty(`--${cssKey}`, value);
	}
}

/**
 * Apply a specific mode (light or dark) from a theme
 *
 * @param theme - A ThemeToken
 * @param mode - Which mode to apply ('light' or 'dark')
 *
 * @example
 * ```ts
 * applyThemeMode(theme, 'dark')
 * ```
 */
export function applyThemeMode(
	theme: ThemeToken,
	mode: "light" | "dark",
): void {
	applyTheme(theme.styles[mode]);
}

/**
 * Apply theme styles and load on-chain assets (fonts, patterns)
 *
 * This is the async version of applyTheme that also loads any
 * on-chain fonts or patterns referenced in the theme.
 *
 * @param styles - Theme style properties to apply
 * @param element - Optional target element (defaults to documentElement)
 *
 * @example
 * ```ts
 * await applyThemeWithAssets(theme.styles.light)
 * // On-chain fonts and patterns are now loaded
 * ```
 */
export async function applyThemeWithAssets(
	styles: ThemeStyleProps,
	element?: HTMLElement,
): Promise<void> {
	// Apply CSS vars first (instant)
	applyTheme(styles, element);

	// Then load any on-chain assets (may take time)
	await loadThemeAssets(styles as Record<string, string>);
}

/**
 * Apply a theme mode and load on-chain assets
 *
 * Async version of applyThemeMode that also loads fonts/patterns.
 *
 * @param theme - A ThemeToken
 * @param mode - Which mode to apply ('light' or 'dark')
 *
 * @example
 * ```ts
 * await applyThemeModeWithAssets(theme, 'dark')
 * ```
 */
export async function applyThemeModeWithAssets(
	theme: ThemeToken,
	mode: "light" | "dark",
): Promise<void> {
	await applyThemeWithAssets(theme.styles[mode]);
}

/**
 * Get current theme values from DOM
 *
 * Reads CSS custom properties from document.documentElement.
 * Returns only properties that are set.
 *
 * @param keys - Optional array of keys to read (reads common keys if not specified)
 * @returns Partial theme style props with current values
 *
 * @example
 * ```ts
 * const current = getCurrentTheme()
 * console.log(current.primary) // "oklch(0.7 0.15 240)"
 * ```
 */
export function getCurrentTheme(
	keys?: (keyof ThemeStyleProps)[],
): Partial<ThemeStyleProps> {
	if (typeof document === "undefined") {
		return {};
	}

	const root = document.documentElement;
	const computed = getComputedStyle(root);
	const result: Partial<ThemeStyleProps> = {};

	// Default keys to read
	const defaultKeys: (keyof ThemeStyleProps)[] = [
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
		"radius",
		"chart-1",
		"chart-2",
		"chart-3",
		"chart-4",
		"chart-5",
		"sidebar",
		"sidebar-foreground",
		"sidebar-primary",
		"sidebar-primary-foreground",
		"sidebar-accent",
		"sidebar-accent-foreground",
		"sidebar-border",
		"sidebar-ring",
		"font-sans",
		"font-serif",
		"font-mono",
		"letter-spacing",
		"spacing",
		"shadow-color",
		"shadow-opacity",
		"shadow-blur",
		"shadow-spread",
		"shadow-offset-x",
		"shadow-offset-y",
	];

	const keysToRead = keys || defaultKeys;

	for (const key of keysToRead) {
		// Map internal names to CSS variable names for reading
		const cssKey =
			key === "letter-spacing"
				? "tracking-normal"
				: key === "shadow-offset-x"
					? "shadow-x"
					: key === "shadow-offset-y"
						? "shadow-y"
						: key;

		const value = computed.getPropertyValue(`--${cssKey}`).trim();
		if (value) {
			result[key] = value;
		}
	}

	return result;
}

/**
 * Remove all theme CSS variables from DOM
 *
 * Clears custom properties from document.documentElement.
 *
 * @param keys - Optional array of keys to remove (removes common keys if not specified)
 *
 * @example
 * ```ts
 * clearTheme() // Remove all theme variables
 * ```
 */
export function clearTheme(keys?: (keyof ThemeStyleProps)[]): void {
	if (typeof document === "undefined") {
		return;
	}

	const root = document.documentElement;

	const defaultKeys: (keyof ThemeStyleProps)[] = [
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
		"radius",
		"chart-1",
		"chart-2",
		"chart-3",
		"chart-4",
		"chart-5",
		"sidebar",
		"sidebar-foreground",
		"sidebar-primary",
		"sidebar-primary-foreground",
		"sidebar-accent",
		"sidebar-accent-foreground",
		"sidebar-border",
		"sidebar-ring",
		"font-sans",
		"font-serif",
		"font-mono",
		"letter-spacing",
		"spacing",
		"shadow-color",
		"shadow-opacity",
		"shadow-blur",
		"shadow-spread",
		"shadow-offset-x",
		"shadow-offset-y",
	];

	const keysToRemove = keys || defaultKeys;

	for (const key of keysToRemove) {
		const cssKey =
			key === "letter-spacing"
				? "tracking-normal"
				: key === "shadow-offset-x"
					? "shadow-x"
					: key === "shadow-offset-y"
						? "shadow-y"
						: key;
		root.style.removeProperty(`--${cssKey}`);
	}
}

/**
 * Toggle between light and dark mode
 *
 * Reads current mode from document.documentElement class and switches.
 *
 * @param theme - The theme to use
 * @returns The new mode that was applied
 *
 * @example
 * ```ts
 * const newMode = toggleThemeMode(theme)
 * console.log(`Switched to ${newMode} mode`)
 * ```
 */
export function toggleThemeMode(theme: ThemeToken): "light" | "dark" {
	if (typeof document === "undefined") {
		return "light";
	}

	const root = document.documentElement;
	const isDark = root.classList.contains("dark");

	const newMode = isDark ? "light" : "dark";

	if (isDark) {
		root.classList.remove("dark");
	} else {
		root.classList.add("dark");
	}

	applyTheme(theme.styles[newMode]);

	return newMode;
}
