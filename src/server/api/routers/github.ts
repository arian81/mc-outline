import { z } from "zod";
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
						path: z.string(),
					}),
				),
		)
		.mutation(async ({ input, ctx }) => {
			const { file, path } = input;

			try {
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const base64Content = buffer.toString("base64");

				const response = await ctx.github.rest.repos.createOrUpdateFileContents(
					{
						owner: "arian81",
						repo: "mcoutline-object-storage",
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
