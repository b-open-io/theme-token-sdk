/**
 * React Hooks for Theme Token
 *
 * React-specific utilities for managing ThemeToken ordinals.
 * Requires React 18+ as a peer dependency.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { applyThemeMode, clearTheme } from "./apply";
import { fetchThemeByOrigin } from "./fetch";
import type { ThemeToken } from "./schema";

/**
 * Ordinal with optional MAP metadata
 */
export interface OrdinalWithMap {
	origin: string;
	map?: { app?: string };
}

/**
 * Return type for useThemeToken hook
 */
export interface UseThemeTokenReturn {
	/** ThemeToken ordinals filtered from input */
	themeTokens: OrdinalWithMap[];
	/** Currently active theme, or null */
	activeTheme: ThemeToken | null;
	/** Origin of the active theme, or null */
	activeOrigin: string | null;
	/** Load and apply a theme by origin */
	loadTheme: (origin: string) => Promise<void>;
	/** Reset to default theme (clears applied styles) */
	resetTheme: () => void;
	/** Whether a theme is currently loading */
	isLoading: boolean;
	/** Error from last load attempt, or null */
	error: Error | null;
}

const STORAGE_KEY = "themetoken-selected-origin";

/**
 * React hook for managing ThemeToken ordinals
 *
 * Filters ordinals for ThemeToken type, persists selection to localStorage,
 * and provides functions to load/reset themes.
 *
 * @param ordinals - Array of ordinals (typically from wallet)
 * @returns Theme state and control functions
 *
 * @example
 * ```tsx
 * import { useThemeToken } from '@theme-token/sdk/react'
 *
 * function ThemePicker({ ordinals }) {
 *   const { themeTokens, activeOrigin, loadTheme, resetTheme, isLoading } = useThemeToken(ordinals)
 *
 *   return (
 *     <div>
 *       {themeTokens.map(t => (
 *         <button
 *           key={t.origin}
 *           onClick={() => loadTheme(t.origin)}
 *           disabled={isLoading}
 *         >
 *           {t.origin === activeOrigin ? '✓ ' : ''}{t.origin.slice(0, 8)}...
 *         </button>
 *       ))}
 *       <button onClick={resetTheme}>Reset</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useThemeToken(
	ordinals: OrdinalWithMap[] = [],
): UseThemeTokenReturn {
	const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
	const [activeOrigin, setActiveOrigin] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	// Filter for ThemeToken ordinals
	const themeTokens = ordinals.filter((o) => o.map?.app === "ThemeToken");

	// Load theme by origin
	const loadTheme = useCallback(async (origin: string) => {
		setIsLoading(true);
		setError(null);

		try {
			const published = await fetchThemeByOrigin(origin);
			if (published) {
				const mode =
					typeof document !== "undefined" &&
					document.documentElement.classList.contains("dark")
						? "dark"
						: "light";
				applyThemeMode(published.theme, mode);
				setActiveTheme(published.theme);
				setActiveOrigin(origin);

				if (typeof localStorage !== "undefined") {
					localStorage.setItem(STORAGE_KEY, origin);
				}
			} else {
				throw new Error(`Theme not found for origin: ${origin}`);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError(error);
			console.error("[useThemeToken] Failed to load theme:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Reset to default theme
	const resetTheme = useCallback(() => {
		clearTheme();
		setActiveTheme(null);
		setActiveOrigin(null);
		setError(null);

		if (typeof localStorage !== "undefined") {
			localStorage.removeItem(STORAGE_KEY);
		}
	}, []);

	// Load saved theme on mount
	useEffect(() => {
		if (typeof localStorage === "undefined") return;

		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			loadTheme(saved);
		}
	}, [loadTheme]);

	return {
		themeTokens,
		activeTheme,
		activeOrigin,
		loadTheme,
		resetTheme,
		isLoading,
		error,
	};
}
