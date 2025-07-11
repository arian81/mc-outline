export default function MajorCoursesPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-2xl text-center">
				<h1 className="mb-4 font-bold text-3xl">Major Courses</h1>
				<p className="mb-6 text-gray-600 text-lg">
					Different courses from the same major will be shown here.
				</p>
				<div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
					<p className="text-gray-500">
						This page will display all courses available for the selected major.
						Course listings and details will be populated here.
					</p>
				</div>
			</div>
		</div>
	);
}
