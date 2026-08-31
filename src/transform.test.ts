import { describe, expect, it } from "bun:test";
import { applyTheme } from "./apply";
import { THEME_TOKEN_SCHEMA_URL, type ThemeToken } from "./schema";
import {
	createThemeToken,
	toCss,
	toJson,
	toShadcnRegistry,
	toTailwindConfig,
} from "./transform";

const testTheme: ThemeToken = {
	$schema: THEME_TOKEN_SCHEMA_URL,
	name: "Test Theme",
	styles: {
		light: {
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
			"destructive-foreground": "oklch(0.985 0 0)",
			border: "oklch(0.922 0 0)",
			input: "oklch(0.922 0 0)",
			ring: "oklch(0.708 0 0)",
			radius: "0.625rem",
		},
		dark: {
			background: "oklch(0.145 0 0)",
			foreground: "oklch(0.985 0 0)",
			card: "oklch(0.145 0 0)",
			"card-foreground": "oklch(0.985 0 0)",
			popover: "oklch(0.145 0 0)",
			"popover-foreground": "oklch(0.985 0 0)",
			primary: "oklch(0.985 0 0)",
			"primary-foreground": "oklch(0.205 0 0)",
			secondary: "oklch(0.269 0 0)",
			"secondary-foreground": "oklch(0.985 0 0)",
			muted: "oklch(0.269 0 0)",
			"muted-foreground": "oklch(0.708 0 0)",
			accent: "oklch(0.269 0 0)",
			"accent-foreground": "oklch(0.985 0 0)",
			destructive: "oklch(0.396 0.141 25.723)",
			"destructive-foreground": "oklch(0.985 0 0)",
			border: "oklch(0.269 0 0)",
			input: "oklch(0.269 0 0)",
			ring: "oklch(0.439 0 0)",
			radius: "0.625rem",
		},
	},
};

// Pinned to TweakCN d21c8e3 (shadow/export shape) and shadcn/ui b4a618b
// (current multiplicative radius scale).
const conformanceTheme: ThemeToken = {
	...testTheme,
	styles: {
		light: {
			...testTheme.styles.light,
			"font-heading": "/content/abcdef1234567890_0",
			"letter-spacing": "0.02em",
			spacing: "0.3rem",
			"shadow-color": "hsl(240 10% 20%)",
			"shadow-opacity": "0.12",
			"shadow-blur": "4px",
			"shadow-spread": "1px",
			"shadow-offset-x": "2px",
			"shadow-offset-y": "3px",
			"theme-token-custom": "preserved",
		},
		dark: {
			...testTheme.styles.dark,
			"font-heading": "/content/abcdef1234567890_0",
			"letter-spacing": "0.02em",
			spacing: "0.3rem",
			"shadow-color": "hsl(0 0% 0%)",
			"shadow-opacity": "0.2",
			"shadow-blur": "6px",
			"shadow-spread": "0px",
			"shadow-offset-x": "0px",
			"shadow-offset-y": "4px",
		},
	},
};

describe("toShadcnRegistry", () => {
	it("converts theme to registry format", () => {
		const registry = toShadcnRegistry(testTheme);

		expect(registry.$schema).toBe(
			"https://ui.shadcn.com/schema/registry-item.json",
		);
		expect(registry.name).toBe("test-theme");
		expect(registry.type).toBe("registry:style");
	});

	it("includes cssVars with theme, light, and dark", () => {
		const registry = toShadcnRegistry(testTheme);

		expect(registry.cssVars.theme).toBeDefined();
		expect(registry.cssVars.light).toBeDefined();
		expect(registry.cssVars.dark).toBeDefined();
	});

	it("includes tracking calculations in theme vars", () => {
		const registry = toShadcnRegistry(testTheme);

		expect(registry.cssVars.theme["tracking-tight"]).toBe(
			"calc(var(--tracking-normal) - 0.025em)",
		);
		expect(registry.cssVars.theme["tracking-wide"]).toBe(
			"calc(var(--tracking-normal) + 0.025em)",
		);
	});

	it("includes @layer base with body letter-spacing", () => {
		const registry = toShadcnRegistry(testTheme);

		expect(registry.css["@layer base"].body["letter-spacing"]).toBe(
			"var(--tracking-normal)",
		);
	});

	it("normalizes theme name to kebab-case", () => {
		const themeWithSpaces: ThemeToken = {
			...testTheme,
			name: "My Awesome Theme!",
		};
		const registry = toShadcnRegistry(themeWithSpaces);

		expect(registry.name).toBe("my-awesome-theme");
	});

	it("matches the pinned TweakCN shadow export scale", () => {
		const registry = toShadcnRegistry(conformanceTheme);

		expect(registry.cssVars.light["shadow-x"]).toBe("2px");
		expect(registry.cssVars.light["shadow-y"]).toBe("3px");
		expect(registry.cssVars.light["shadow-offset-x"]).toBeUndefined();
		expect(registry.cssVars.light["shadow-2xs"]).toBe(
			"2px 3px 4px 1px hsl(240 10% 20% / 0.06)",
		);
		expect(registry.cssVars.light["shadow-md"]).toBe(
			"2px 3px 4px 1px hsl(240 10% 20% / 0.12), 2px 2px 4px 0px hsl(240 10% 20% / 0.12)",
		);
		expect(registry.cssVars.light["shadow-2xl"]).toBe(
			"2px 3px 4px 1px hsl(240 10% 20% / 0.30)",
		);
		expect(registry.cssVars.dark["shadow-2xs"]).toBe(
			"0px 4px 6px 0px hsl(0 0% 0% / 0.10)",
		);
		expect(registry.cssVars.light["theme-token-custom"]).toBe("preserved");
	});

	it("uses current ShadCN shared radius, spacing, and tracking tokens", () => {
		const registry = toShadcnRegistry(conformanceTheme);

		expect(registry.cssVars.theme).toMatchObject({
			radius: "0.625rem",
			"radius-sm": "calc(var(--radius) * 0.6)",
			"radius-md": "calc(var(--radius) * 0.8)",
			"radius-lg": "var(--radius)",
			"radius-xl": "calc(var(--radius) * 1.4)",
			"radius-2xl": "calc(var(--radius) * 1.8)",
			"radius-3xl": "calc(var(--radius) * 2.2)",
			"radius-4xl": "calc(var(--radius) * 2.6)",
			"tracking-normal": "0.02em",
			spacing: "0.3rem",
		});
		expect(registry.cssVars.light.radius).toBeUndefined();
		expect(registry.cssVars.light.spacing).toBeUndefined();
		expect(registry.cssVars.light["tracking-normal"]).toBeUndefined();
	});

	it("supports on-chain heading fonts", () => {
		const registry = toShadcnRegistry(conformanceTheme);

		expect(registry.cssVars.theme["font-heading"]).toBe(
			'"tt-abcdef12", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
		);
		expect(registry.css["@font-face-heading"]).toMatchObject({
			"font-family": '"tt-abcdef12"',
			src: 'url("https://api.1sat.app/content/abcdef1234567890_0") format("woff2")',
		});
	});
});

describe("toCss", () => {
	it("generates CSS with :root and .dark selectors", () => {
		const css = toCss(testTheme);

		expect(css).toContain(":root {");
		expect(css).toContain(".dark {");
	});

	it("includes CSS variables with -- prefix", () => {
		const css = toCss(testTheme);

		expect(css).toContain("--background: oklch(1 0 0)");
		expect(css).toContain("--primary: oklch(0.205 0 0)");
	});

	it("maps letter-spacing to tracking-normal", () => {
		const themeWithLetterSpacing: ThemeToken = {
			...testTheme,
			styles: {
				...testTheme.styles,
				light: {
					...testTheme.styles.light,
					"letter-spacing": "0.02em",
				},
			},
		};
		const css = toCss(themeWithLetterSpacing);

		expect(css).toContain("--tracking-normal: 0.02em");
	});

	it("emits public shadow names and the computed scale", () => {
		const css = toCss(conformanceTheme);

		expect(css).toContain("--shadow-x: 2px");
		expect(css).not.toContain("--shadow-offset-x");
		expect(css).toContain(
			"--shadow-xl: 2px 3px 4px 1px hsl(240 10% 20% / 0.12), 2px 8px 10px 0px hsl(240 10% 20% / 0.12)",
		);
	});
});

describe("runtime and Tailwind conformance", () => {
	it("applies computed shadows for live previews", () => {
		const values = new Map<string, string>();
		const element = {
			style: {
				setProperty: (key: string, value: string) => values.set(key, value),
			},
		} as unknown as HTMLElement;

		applyTheme(conformanceTheme.styles.light, element);

		expect(values.get("--shadow-x")).toBe("2px");
		expect(values.get("--shadow-md")).toBe(
			"2px 3px 4px 1px hsl(240 10% 20% / 0.12), 2px 2px 4px 0px hsl(240 10% 20% / 0.12)",
		);
	});

	it("uses the current multiplicative ShadCN radius scale", () => {
		const css = toTailwindConfig(conformanceTheme);

		expect(css).toContain("--radius-sm: calc(var(--radius) * 0.6)");
		expect(css).toContain("--radius-4xl: calc(var(--radius) * 2.6)");
		expect(css).toContain("--shadow-x: 0");
		expect(css).not.toContain("--shadow-offset-x");
		expect(css).not.toContain("calc(var(--radius) - 4px)");
	});
});

describe("toJson", () => {
	it("returns pretty-printed JSON by default", () => {
		const json = toJson(testTheme);

		expect(json).toContain("\n");
		expect(json).toContain("  ");
	});

	it("returns compact JSON when pretty=false", () => {
		const json = toJson(testTheme, false);

		expect(json).not.toContain("\n");
	});

	it("produces valid JSON", () => {
		const json = toJson(testTheme);
		const parsed = JSON.parse(json);

		expect(parsed.name).toBe("Test Theme");
	});
});

describe("createThemeToken", () => {
	it("creates theme with defaults filled in", () => {
		const theme = createThemeToken("New Theme", {
			primary: "oklch(0.7 0.15 240)",
		});

		expect(theme.name).toBe("New Theme");
		expect(theme.$schema).toBe(THEME_TOKEN_SCHEMA_URL);
		expect(theme.styles.light.primary).toBe("oklch(0.7 0.15 240)");
		expect(theme.styles.light.background).toBe("oklch(1 0 0)"); // default
	});

	it("uses light styles for dark when dark not provided", () => {
		const theme = createThemeToken("Light Only", {
			primary: "oklch(0.7 0.15 240)",
		});

		expect(theme.styles.dark.primary).toBe("oklch(0.7 0.15 240)");
	});

	it("allows separate dark styles", () => {
		const theme = createThemeToken(
			"Dual Mode",
			{ primary: "oklch(0.7 0.15 240)" },
			{ primary: "oklch(0.8 0.2 240)" },
		);

		expect(theme.styles.light.primary).toBe("oklch(0.7 0.15 240)");
		expect(theme.styles.dark.primary).toBe("oklch(0.8 0.2 240)");
	});
});
