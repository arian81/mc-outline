/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	experimental: {
		reactCompiler: true,
	},

	async rewrites() {
		return [
			{
				source: "/i/static/:path*",
				destination: "https://us-assets.i.posthog.com/static/:path*",
			},
			{
				source: "/i/:path*",
				destination: "https://us.i.posthog.com/:path*",
			},
		];
	},

	skipTrailingSlashRedirect: true,
};

export default config;
