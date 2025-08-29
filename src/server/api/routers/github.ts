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
});
