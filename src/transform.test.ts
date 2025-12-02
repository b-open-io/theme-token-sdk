import { describe, expect, it } from "bun:test";
import { THEME_TOKEN_SCHEMA_URL, type ThemeToken } from "./schema";
import { createThemeToken, toCss, toJson, toShadcnRegistry } from "./transform";

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
