import { api } from "@/trpc/server";

export default async function CoursePage({
	params,
}: {
	params: Promise<{ major: string; course_code: string }>;
}) {
	const { major, course_code } = await params;
	const { files } = await api.github.listFiles({
		path: `${major}/${course_code}`,
	});
	const pdfFiles = files.filter((file) =>
		file.name.toLowerCase().endsWith(".pdf"),
	);

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-4 font-bold text-2xl">
				{major.toUpperCase()} - {course_code.toUpperCase()}
			</h1>

			{pdfFiles.length > 0 ? (
				<div>
					<p className="mb-4">Found {pdfFiles.length} PDF file(s):</p>
					{pdfFiles.map((file) => (
						<div key={file.path} className="mb-8">
							<h3 className="mb-2 font-semibold">
								{file.name} ({file.semester})
							</h3>
							<iframe
								src={file.download_url}
								width="100%"
								height="600"
								title={`${file.name} - ${file.semester}`}
							/>
						</div>
					))}
				</div>
			) : (
				<p>No PDF files found for this course.</p>
			)}

			<details className="mt-8">
				<summary>All files (debug)</summary>
				<pre className="text-sm">{JSON.stringify(files, null, 2)}</pre>
			</details>
		</div>
	);
}
