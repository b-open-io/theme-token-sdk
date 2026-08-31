import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createThemeToken, toShadcnRegistry } from "../src/transform";

const SHADCN_VERSION = "4.19.0";
const ORIGIN = `${"0123456789abcdef".repeat(4)}_0`;
const FONT_ORIGIN = `${"fedcba9876543210".repeat(4)}_0`;

const theme = createThemeToken("CLI Conformance", {
	"font-sans": `/content/${FONT_ORIGIN}`,
	"font-heading": `/content/${FONT_ORIGIN}`,
	"letter-spacing": "0.015em",
	spacing: "0.3rem",
	"shadow-color": "hsl(240 10% 20%)",
	"shadow-opacity": "0.12",
	"shadow-blur": "4px",
	"shadow-spread": "1px",
	"shadow-offset-x": "2px",
	"shadow-offset-y": "3px",
	"theme-token-conformance": "preserved",
});
const registry = toShadcnRegistry(theme);
const fontCss = `@font-face {
  font-family: "tt-${FONT_ORIGIN.slice(0, 8)}";
  src: url("https://api.1sat.app/content/${FONT_ORIGIN}") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 100 900;
}\n`;

async function runCli(args: string[], cwd: string): Promise<string> {
	const process = Bun.spawn(
		["bunx", "--bun", `shadcn@${SHADCN_VERSION}`, ...args],
		{
			cwd,
			env: { ...Bun.env, CI: "1", NO_COLOR: "1" },
			stdout: "pipe",
			stderr: "pipe",
		},
	);
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(process.stdout).text(),
		new Response(process.stderr).text(),
		process.exited,
	]);
	assert.equal(exitCode, 0, `${args.join(" ")} failed:\n${stderr}\n${stdout}`);
	return `${stdout}\n${stderr}`;
}

async function main() {
	const projectDir = await mkdtemp(join(tmpdir(), "theme-token-shadcn-"));
	const requests: Array<{ method: string; pathname: string }> = [];
	const server = Bun.serve({
		port: 0,
		fetch(request) {
			const { pathname } = new URL(request.url);
			requests.push({ method: request.method, pathname });
			if (request.method !== "GET") return new Response(null, { status: 405 });
			if (
				pathname === `/r/themes/${ORIGIN}` ||
				pathname === `/r/themes/${ORIGIN}.json`
			) {
				return Response.json(registry);
			}
			if (pathname === `/r/fonts/${FONT_ORIGIN}.css`) {
				return new Response(fontCss, {
					headers: {
						"Cache-Control": "public, max-age=31536000, immutable",
						"Content-Type": "text/css; charset=utf-8",
					},
				});
			}
			return new Response(null, { status: 404 });
		},
	});

	try {
		await mkdir(join(projectDir, "app"));
		await Bun.write(
			join(projectDir, "package.json"),
			JSON.stringify({ private: true, dependencies: { next: "16.3.3" } }),
		);
		await Bun.write(
			join(projectDir, "components.json"),
			JSON.stringify({
				$schema: "https://ui.shadcn.com/schema.json",
				style: "new-york",
				rsc: true,
				tsx: true,
				tailwind: {
					config: "",
					css: "app/globals.css",
					baseColor: "neutral",
					cssVariables: true,
				},
				iconLibrary: "lucide",
				aliases: {
					components: "@/components",
					utils: "@/lib/utils",
					ui: "@/components/ui",
					lib: "@/lib",
					hooks: "@/hooks",
				},
			}),
		);
		await Bun.write(
			join(projectDir, "tsconfig.json"),
			JSON.stringify({
				compilerOptions: {
					baseUrl: ".",
					paths: { "@/*": ["./*"] },
				},
			}),
		);
		const globalsPath = join(projectDir, "app/globals.css");
		const initialCss =
			'@import "tailwindcss";\n\n:root {\n  --background: oklch(1 0 0);\n}\n';
		await Bun.write(globalsPath, initialCss);

		const baseUrl = `http://127.0.0.1:${server.port}`;
		const extensionlessUrl = `${baseUrl}/r/themes/${ORIGIN}`;
		const jsonUrl = `${extensionlessUrl}.json`;
		for (const url of [extensionlessUrl, jsonUrl]) {
			const output = await runCli(
				["view", url, "--cwd", projectDir],
				projectDir,
			);
			assert.match(output, /cli-conformance/);
			assert.match(output, /theme-token-conformance/);
		}

		const dryRun = await runCli(
			["add", extensionlessUrl, "--dry-run", "--yes", "--cwd", projectDir],
			projectDir,
		);
		assert.match(dryRun, /CSS variables added/);
		assert.equal(await readFile(globalsPath, "utf8"), initialCss);

		const diff = await runCli(
			[
				"add",
				jsonUrl,
				"--diff",
				"app/globals.css",
				"--yes",
				"--cwd",
				projectDir,
			],
			projectDir,
		);
		assert.match(diff, /theme-token-conformance/);
		assert.match(diff, new RegExp(`themetoken\\.dev/r/fonts/${FONT_ORIGIN}`));
		assert.match(diff, /font-heading/);
		assert.equal(await readFile(globalsPath, "utf8"), initialCss);

		const fontResponse = await fetch(`${baseUrl}/r/fonts/${FONT_ORIGIN}.css`);
		assert.equal(await fontResponse.text(), fontCss);
		assert.equal(
			fontResponse.headers.get("cache-control"),
			"public, max-age=31536000, immutable",
		);
		assert.equal(
			fontResponse.headers.get("content-type"),
			"text/css; charset=utf-8",
		);
		assert.ok(requests.every(({ method }) => method === "GET"));
		console.log(
			`ShadCN ${SHADCN_VERSION} conformance passed (${requests.length} local GETs).`,
		);
	} finally {
		server.stop(true);
		await rm(projectDir, { recursive: true, force: true });
	}
}

await main();
