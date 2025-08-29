import { type NextRequest, NextResponse } from "next/server";
import { App } from "octokit";
import { env } from "@/env";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const path = searchParams.get("path");

	if (!path) {
		return NextResponse.json(
			{ error: "Path parameter is required" },
			{ status: 400 },
		);
	}

	const [owner, repo] = env.GITHUB_OBJECT_STORAGE_REPO.split("/");
	if (!owner || !repo) {
		return NextResponse.json(
			{ error: "Invalid GitHub repository configuration" },
			{ status: 500 },
		);
	}

	try {
		const githubApp = new App({
			appId: env.GITHUB_APP_ID,
			privateKey: env.GITHUB_PRIVATE_KEY,
		});
		const github = await githubApp.getInstallationOctokit(
			env.GITHUB_APP_INSTALLATION_ID,
		);

		const response = await github.rest.repos.getContent({
			owner,
			repo,
			path,
		});

		// This two checks shouldn't be needed, but because of the github response
		// we have to do them to make typescript happy.
		if (Array.isArray(response.data)) {
			return NextResponse.json(
				{ error: `Expected file at path "${path}", but found a directory` },
				{ status: 400 },
			);
		}
		if (response.data.type !== "file" || !response.data.content) {
			return NextResponse.json(
				{ error: `File at path "${path}" has no content` },
				{ status: 404 },
			);
		}

		const content = Buffer.from(response.data.content, "base64");
		const getContentType = (filename: string): string => {
			const ext = filename.toLowerCase().split(".").pop();
			switch (ext) {
				case "pdf":
					return "application/pdf";
				case "json":
					return "application/json";
				default:
					return "application/octet-stream";
			}
		};

		const contentType = getContentType(response.data.name);

		return new NextResponse(content, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `inline; filename="${response.data.name}"`,
				"Content-Length": content.length.toString(),
                // We can set a really long cache since files realistically shouldn't change overtime 
				"Cache-Control": "public, max-age=31536000",
			},
		});
	} catch (error) {
		console.error(`Failed to download file at path "${path}":`, error);
		return NextResponse.json(
			{
				error: `Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`,
			},
			{ status: 500 },
		);
	}
}
