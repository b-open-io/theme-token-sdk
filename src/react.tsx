/**
 * React Hooks and Components for Theme Token
 *
 * React-specific utilities for managing ThemeToken ordinals.
 * Requires React 18+ as a peer dependency.
 */

"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { applyThemeMode, applyThemeModeWithAssets, clearTheme } from "./apply";
import { fetchThemeByOrigin } from "./fetch";
import type { ThemeToken } from "./schema";

/**
 * Ordinal with optional MAP metadata
 */
export interface OrdinalWithMap {
	origin: string;
	map?: { type?: string; app?: string };
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

// ============================================================================
// ThemeTokenProvider - Standalone provider for apps without wallet integration
// ============================================================================

const PROVIDER_STORAGE_KEY = "themetoken-active";

/**
 * Context value for ThemeTokenProvider
 */
export interface ThemeTokenContextValue {
	/** Currently active ThemeToken, or null for default */
	activeTheme: ThemeToken | null;
	/** Origin of active theme, or null */
	activeOrigin: string | null;
	/** Load and apply a theme by origin */
	loadTheme: (origin: string) => Promise<void>;
	/** Reset to default theme (clears ThemeToken styles) */
	resetTheme: () => void;
	/** Whether a theme is currently loading */
	isLoading: boolean;
	/** Error from last load attempt */
	error: Error | null;
}

const ThemeTokenContext = createContext<ThemeTokenContextValue | null>(null);

/**
 * Props for ThemeTokenProvider
 */
export interface ThemeTokenProviderProps {
	children: ReactNode;
	/**
	 * Custom storage key for persisting theme selection
	 * @default "themetoken-active"
	 */
	storageKey?: string;
	/**
	 * Initial theme origin to load (if no saved theme exists)
	 */
	defaultOrigin?: string;
}

/**
 * Detect current color mode from document.documentElement
 */
function detectMode(): "light" | "dark" {
	if (typeof document === "undefined") return "light";
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Provider component for ThemeToken integration
 *
 * Wrap your app with this provider to enable theme loading from the blockchain.
 * The provider handles:
 * - Loading themes by origin
 * - Persisting selection to localStorage
 * - Automatically detecting light/dark mode changes (watches for .dark class)
 * - Re-applying theme when mode changes
 * - Loading on-chain assets (fonts, patterns)
 *
 * @example
 * ```tsx
 * import { ThemeTokenProvider } from '@theme-token/sdk/react'
 *
 * function App() {
 *   return (
 *     <ThemeTokenProvider>
 *       <YourApp />
 *     </ThemeTokenProvider>
 *   )
 * }
 * ```
 *
 * Then use the hook anywhere in your app:
 * ```tsx
 * import { useThemeTokenContext } from '@theme-token/sdk/react'
 *
 * function Settings() {
 *   const { activeTheme, loadTheme, resetTheme, isLoading } = useThemeTokenContext()
 *   // ...
 * }
 * ```
 */
export function ThemeTokenProvider({
	children,
	storageKey = PROVIDER_STORAGE_KEY,
	defaultOrigin,
}: ThemeTokenProviderProps) {
	const [activeTheme, setActiveTheme] = useState<ThemeToken | null>(null);
	const [activeOrigin, setActiveOrigin] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [mode, setMode] = useState<"light" | "dark">(detectMode);

	// Watch for dark mode changes via MutationObserver
	useEffect(() => {
		if (typeof document === "undefined") return;

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === "class") {
					setMode(detectMode());
				}
			}
		});

		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	// Internal load function
	const loadThemeInternal = useCallback(
		async (origin: string) => {
			setIsLoading(true);
			setError(null);

			try {
				const published = await fetchThemeByOrigin(origin);
				if (!published) {
					throw new Error(`Theme not found: ${origin}`);
				}

				setActiveTheme(published.theme);
				setActiveOrigin(origin);

				if (typeof localStorage !== "undefined") {
					localStorage.setItem(storageKey, origin);
				}

				// Apply immediately with current mode
				await applyThemeModeWithAssets(published.theme, mode);
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				setError(error);
				console.error("[ThemeTokenProvider] Failed to load theme:", error);
			} finally {
				setIsLoading(false);
			}
		},
		[mode, storageKey],
	);

	// Public load function
	const loadTheme = useCallback(
		async (origin: string) => {
			await loadThemeInternal(origin);
		},
		[loadThemeInternal],
	);

	// Reset theme
	const resetTheme = useCallback(() => {
		clearTheme();
		setActiveTheme(null);
		setActiveOrigin(null);
		setError(null);

		if (typeof localStorage !== "undefined") {
			localStorage.removeItem(storageKey);
		}
	}, [storageKey]);

	// Load persisted theme on mount
	useEffect(() => {
		if (typeof localStorage === "undefined") return;

		const saved = localStorage.getItem(storageKey);
		const originToLoad = saved || defaultOrigin;

		if (originToLoad && !activeTheme) {
			loadThemeInternal(originToLoad);
		}
	}, [storageKey, defaultOrigin]); // eslint-disable-line react-hooks/exhaustive-deps

	// Re-apply theme when mode changes
	useEffect(() => {
		if (activeTheme) {
			applyThemeModeWithAssets(activeTheme, mode).catch(console.error);
		}
	}, [activeTheme, mode]);

	const value = useMemo(
		() => ({
			activeTheme,
			activeOrigin,
			loadTheme,
			resetTheme,
			isLoading,
			error,
		}),
		[activeTheme, activeOrigin, loadTheme, resetTheme, isLoading, error],
	);

	return (
		<ThemeTokenContext.Provider value={value}>
			{children}
		</ThemeTokenContext.Provider>
	);
}

/**
 * Hook to access ThemeToken context
 *
 * Must be used within a ThemeTokenProvider.
 *
 * @example
 * ```tsx
 * function ThemeSettings() {
 *   const { activeTheme, loadTheme, resetTheme, isLoading, error } = useThemeTokenContext()
 *
 *   return (
 *     <div>
 *       {activeTheme ? (
 *         <div>
 *           <p>Active: {activeTheme.name}</p>
 *           <button onClick={resetTheme}>Reset</button>
 *         </div>
 *       ) : (
 *         <input
 *           placeholder="Enter theme origin"
 *           onKeyDown={(e) => {
 *             if (e.key === 'Enter') loadTheme(e.currentTarget.value)
 *           }}
 *         />
 *       )}
 *       {isLoading && <p>Loading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useThemeTokenContext(): ThemeTokenContextValue {
	const context = useContext(ThemeTokenContext);
	if (!context) {
		throw new Error(
			"useThemeTokenContext must be used within a ThemeTokenProvider",
		);
	}
	return context;
}
