import { describe, expect, it } from "bun:test";
import {
	THEME_TOKEN_SCHEMA_URL,
	parseCss,
	themeTokenSchema,
	validateThemeToken,
} from "./schema";

const validTheme = {
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

function cssVars(styles: Record<string, string>, omit: string[] = []): string {
	return Object.entries(styles)
		.filter(([key]) => !omit.includes(key))
		.map(([key, value]) => `  --${key}: ${value};`)
		.join("\n");
}

describe("validateThemeToken", () => {
	it("validates a correct theme", () => {
		const result = validateThemeToken(validTheme);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.theme.name).toBe("Test Theme");
		}
	});

	it("rejects theme without name", () => {
		const invalid = { ...validTheme, name: undefined };
		const result = validateThemeToken(invalid);
		expect(result.valid).toBe(false);
	});

	it("rejects an empty name or a different schema URL", () => {
		expect(validateThemeToken({ ...validTheme, name: "" }).valid).toBe(false);
		expect(
			validateThemeToken({
				...validTheme,
				$schema: "https://example.com/theme",
			}).valid,
		).toBe(false);
	});

	it("rejects theme without styles", () => {
		const invalid = { ...validTheme, styles: undefined };
		const result = validateThemeToken(invalid);
		expect(result.valid).toBe(false);
	});

	it("rejects theme missing required color", () => {
		const invalid = {
			...validTheme,
			styles: {
				...validTheme.styles,
				light: { ...validTheme.styles.light, background: undefined },
			},
		};
		const result = validateThemeToken(invalid);
		expect(result.valid).toBe(false);
	});

	it("accepts theme with optional author", () => {
		const withAuthor = { ...validTheme, author: "test@example.com" };
		const result = validateThemeToken(withAuthor);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.theme.author).toBe("test@example.com");
		}
	});

	it("accepts theme with optional chart colors", () => {
		const withCharts = {
			...validTheme,
			styles: {
				...validTheme.styles,
				light: {
					...validTheme.styles.light,
					"chart-1": "oklch(0.7 0.2 240)",
					"chart-2": "oklch(0.6 0.15 200)",
				},
			},
		};
		const result = validateThemeToken(withCharts);
		expect(result.valid).toBe(true);
	});
});

describe("themeTokenSchema", () => {
	it("parses valid theme", () => {
		const result = themeTokenSchema.safeParse(validTheme);
		expect(result.success).toBe(true);
	});
});

describe("parseCss", () => {
	it("parses valid CSS with :root and .dark", () => {
		const css = `
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --radius: 0.625rem;
}
`;

		const result = parseCss(css, "CSS Theme");
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.theme.name).toBe("CSS Theme");
			expect(result.theme.styles.light.background).toBe("oklch(1 0 0)");
			expect(result.theme.styles.dark.background).toBe("oklch(0.145 0 0)");
		}
	});

	it("returns error for missing :root", () => {
		const css = ".dark { --background: oklch(0 0 0); }";
		const result = parseCss(css);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toContain(":root");
		}
	});

	it("returns error for missing required property", () => {
		const css = ":root { --foreground: oklch(0 0 0); }";
		const result = parseCss(css);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toContain("--background");
		}
	});

	it("maps public CSS names to legacy Theme Token authoring names", () => {
		const css = `
:root {
${cssVars(validTheme.styles.light)}
  --tracking-normal: 0.02em;
  --shadow-x: 2px;
  --shadow-y: 3px;
}
`;
		const result = parseCss(css);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.theme.styles.light["letter-spacing"]).toBe("0.02em");
			expect(result.theme.styles.light["shadow-offset-x"]).toBe("2px");
			expect(result.theme.styles.light["shadow-offset-y"]).toBe("3px");
		}
	});

	it("fills the legacy destructive foreground omitted by current ShadCN", () => {
		const { light, dark } = validTheme.styles;
		const css = `:root {\n${cssVars(light, ["destructive-foreground"])}\n}\n.dark {\n${cssVars(dark, ["destructive-foreground"])}\n}`;

		const result = parseCss(css);

		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.theme.styles.light["destructive-foreground"]).toBe(
				light.background,
			);
			expect(result.theme.styles.dark["destructive-foreground"]).toBe(
				dark.background,
			);
		}
	});

	it("falls back to light mode if no .dark block", () => {
		const css = `
:root {
${cssVars(validTheme.styles.light)}
}
`;
		const result = parseCss(css);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.theme.styles.dark.background).toBe("oklch(1 0 0)");
		}
	});

	it("rejects CSS that only includes the old partial minimum", () => {
		const css = `:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0 0 0);
  --primary: oklch(0.5 0.1 240);
  --radius: 0.5rem;
}`;
		const result = parseCss(css);
		expect(result.valid).toBe(false);
		if (!result.valid) expect(result.error).toContain("--card");
	});
});

describe("THEME_TOKEN_SCHEMA_URL", () => {
	it("has correct URL", () => {
		expect(THEME_TOKEN_SCHEMA_URL).toBe(
			"https://themetoken.dev/v1/schema.json",
		);
	});
});
