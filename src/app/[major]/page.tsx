import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import courseMapping from "@/data/course_mapping.json";

export default async function MajorCoursesPage({
	params,
}: {
	params: Promise<{ major: string }>;
}) {
	const { major } = await params;

	const formatMajorTitle = (major: string) => {
		return major.charAt(0).toUpperCase() + major.slice(1);
	};

	const hasCourses = Object.keys(courseMapping).some((courseCode) =>
		courseCode.startsWith(major.toUpperCase()),
	);

	if (!hasCourses) {
		notFound();
	}

	return (
		<div className="flex min-h-screen flex-col">
			<Header title={formatMajorTitle(major)} />
			<main className="flex-1">
				<div className="container mx-auto px-4 py-8">
					<div className="mx-auto max-w-2xl text-center">
						<h1 className="mb-4 font-bold text-3xl">Major Courses</h1>
						<p className="mb-6 text-gray-600 text-lg">
							Different courses from the same major will be shown here.
						</p>
						<div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
							<p className="text-gray-500">
								This page will display all courses available for the selected
								major. Course listings and details will be populated here.
							</p>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
