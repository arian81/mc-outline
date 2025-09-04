import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default async function CourseLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ major: string; course_code: string }>;
}) {
	const { major, course_code } = await params;

	const formatTitle = (major: string, courseCode: string) => {
		const formattedMajor = major.charAt(0).toUpperCase() + major.slice(1);
		const formattedCourseCode = courseCode.toUpperCase();
		return `${formattedMajor} - ${formattedCourseCode}`;
	};

	return (
		<div className="flex min-h-screen flex-col">
			<Header title={formatTitle(major, course_code)} />
			<main className="flex-1">{children}</main>
			<Footer />
		</div>
	);
}
