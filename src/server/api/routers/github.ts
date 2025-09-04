import { env } from "@/env";
import {
	githubListFilesSchema,
	githubUploadSchema,
	type UploadedFileDataWithDownload,
	UploadedFileDataWithDownloadSchema,
} from "@/schema";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const githubRouter = createTRPCRouter({
	uploadFile: publicProcedure
		.input(githubUploadSchema)
		.mutation(async ({ input, ctx }) => {
			const { file, major, code, semester, fileName } = input;
			const path = `${major}/${code}/${semester}/${fileName}`;

			try {
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const base64Content = buffer.toString("base64");
				const [owner, repo] = env.GITHUB_OBJECT_STORAGE_REPO.split("/");
				if (!owner || !repo) {
					throw new Error("Invalid GitHub object storage repo");
				}

				const response = await ctx.github.rest.repos.createOrUpdateFileContents(
					{
						owner,
						repo,
						path: path,
						message: `Upload file: ${file.name}`,
						content: base64Content,
					},
				);

				return {
					file: file.name,
					path: path,
					response: response.data,
				};
			} catch (error) {
				throw new Error(
					`Failed to upload file ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}),
	listFiles: publicProcedure
		.input(githubListFilesSchema)
		.query(async ({ input, ctx }) => {
			const { path } = input;

			const [owner, repo] = env.GITHUB_OBJECT_STORAGE_REPO.split("/");
			if (!owner || !repo) {
				throw new Error("Invalid GitHub repository configuration");
			}

			try {
				// First, get the semester directories (e.g., COMPSCI/1XC3 contains semester folders)
				const semesterResponse = await ctx.github.rest.repos.getContent({
					owner,
					repo,
					path,
				});

				if (!Array.isArray(semesterResponse.data)) {
					throw new Error(
						`Expected directory at path "${path}", but found a single file`,
					);
				}

				// Filter only directories (semester folders)
				const semesterDirectories = semesterResponse.data.filter(
					(item) => item.type === "dir",
				);

				// Collect all files from all semester directories
				const allFiles: UploadedFileDataWithDownload[] = [];

				// Loop through each semester directory and get its files
				for (const semesterDir of semesterDirectories) {
					try {
						const filesResponse = await ctx.github.rest.repos.getContent({
							owner,
							repo,
							path: semesterDir.path,
						});

						if (Array.isArray(filesResponse.data)) {
							// Get all files in this semester directory
							const files = filesResponse.data.filter(
								(item) => item.type === "file",
							);

							// Group files by their base name (without extension)
							const fileGroups = new Map<
								string,
								{ pdf?: (typeof files)[0]; meta?: (typeof files)[0] }
							>();

							for (const file of files) {
								const baseName = file.name.replace(/\.(pdf|meta\.json)$/i, "");
								if (!fileGroups.has(baseName)) {
									fileGroups.set(baseName, {});
								}

								if (file.name.endsWith(".pdf")) {
									const group = fileGroups.get(baseName);
									if (group) {
										group.pdf = file;
									}
								} else if (
									file.name.endsWith(".json") &&
									file.name.includes("meta")
								) {
									const group = fileGroups.get(baseName);
									if (group) {
										group.meta = file;
									}
								}
							}

							// Process each PDF that has a meta.json file
							for (const [, { pdf, meta }] of fileGroups) {
								if (pdf && meta) {
									try {
										// Read the meta.json file
										const metaResponse = await ctx.github.rest.repos.getContent(
											{
												owner,
												repo,
												path: meta.path,
											},
										);

										if ("content" in metaResponse.data) {
											const metaContent = Buffer.from(
												metaResponse.data.content,
												"base64",
											).toString("utf-8");
											const metaData = JSON.parse(metaContent);

											// Validate and parse the metadata using our schema
											const parsedMeta =
												UploadedFileDataWithDownloadSchema.parse({
													...metaData,
													download_url: `/api/files/download?path=${encodeURIComponent(pdf.path)}`,
												});

											allFiles.push(parsedMeta);
										}
									} catch (metaError) {
										console.warn(
											`Failed to read metadata for file "${pdf.name}": ${metaError instanceof Error ? metaError.message : "Unknown error"}`,
										);
										// Skip this file if metadata can't be read or parsed
									}
								}
							}
						}
					} catch (semesterError) {
						console.warn(
							`Failed to list files in semester directory "${semesterDir.path}": ${semesterError instanceof Error ? semesterError.message : "Unknown error"}`,
						);
						// Continue with other semesters even if one fails
					}
				}

				return {
					path,
					semesters: semesterDirectories.map((dir) => dir.name),
					files: allFiles,
					totalFiles: allFiles.length,
				};
			} catch (error) {
				throw new Error(
					`Failed to list files at path "${path}": ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			}
		}),
});
