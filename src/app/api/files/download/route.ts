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

		const infoResponse = await github.rest.repos.getContent({
			owner,
			repo,
			path,
		});

		if (Array.isArray(infoResponse.data)) {
			return NextResponse.json(
				{ error: `Expected file at path "${path}", but found a directory` },
				{ status: 400 },
			);
		}
		if (infoResponse.data.type !== "file") {
			return NextResponse.json(
				{ error: `Path "${path}" is not a file` },
				{ status: 404 },
			);
		}

		// For large files (>1MB), use the Git Data API to get the blob directly
		// For smaller files, we can still use the content from the info response
		let content: Buffer;

		if (infoResponse.data.size > 1024 * 1024 || !infoResponse.data.content) {


			const blobResponse = await github.rest.git.getBlob({
				owner,
				repo,
				file_sha: infoResponse.data.sha,
			});

			if (blobResponse.data.encoding === "base64") {
				content = Buffer.from(blobResponse.data.content, "base64");
			} else {
				content = Buffer.from(
					blobResponse.data.content,
					blobResponse.data.encoding as BufferEncoding,
				);
			}
		} else {
			content = Buffer.from(infoResponse.data.content, "base64");
		}
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

		const contentType = getContentType(infoResponse.data.name);

		return new NextResponse(new Uint8Array(content), {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Disposition": `inline; filename="${infoResponse.data.name}"`,
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
