export default async function CoursePage({
	params,
}: {
	params: Promise<{ major: string; course_code: string }>;
}) {
	const { major, course_code } = await params;

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="text-center">
				<h1 className="mb-4 font-bold text-2xl">
					{major.toUpperCase()} - {course_code.toUpperCase()}
				</h1>
				<p className="text-gray-600">
					PDF content will be loaded here for {major} {course_code}
				</p>
			</div>
		</div>
	);
}
