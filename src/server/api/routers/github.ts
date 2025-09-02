import { z } from "zod";
import { env } from "@/env";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

export const githubRouter = createTRPCRouter({
	uploadFile: publicProcedure
		.input(
			z
				.instanceof(FormData)
				.transform((fd) => Object.fromEntries(fd.entries()))
				.pipe(
					z.object({
						file: z.instanceof(File),
						major: z.string(),
						code: z.string(),
						semester: z.string(),
						fileName: z.string(),
					}),
				),
		)
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
		.input(
			z.object({
				path: z.string(),
			}),
		)
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
				const allFiles: Array<{
					name: string;
					path: string;
					type: string;
					size?: number;
					download_url: string;
					semester: string;
				}> = [];

				// Loop through each semester directory and get its files
				for (const semesterDir of semesterDirectories) {
					try {
						const filesResponse = await ctx.github.rest.repos.getContent({
							owner,
							repo,
							path: semesterDir.path,
						});

						if (Array.isArray(filesResponse.data)) {
							// Add files from this semester, including semester info
							const semesterFiles = filesResponse.data
								.filter((item) => item.type === "file") // Only include files, not subdirectories
								.map((item) => ({
									name: item.name,
									path: item.path,
									type: item.type,
									size: item.size,
									download_url: `/api/files/download?path=${encodeURIComponent(item.path)}`,
									semester: semesterDir.name,
								}));

							allFiles.push(...semesterFiles);
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
