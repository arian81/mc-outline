import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CoursePage({
	params,
}: {
	params: { major: string; course_code: string };
}) {
	return (
		<div className="relative min-h-screen">
			<Header />
			<main className="pt-20 pb-16">
				<div className="container mx-auto px-4 py-8">
					<div className="text-center">
						<h1 className="text-2xl font-bold mb-4">
							{params.major.toUpperCase()} - {params.course_code.toUpperCase()}
						</h1>
						<p className="text-gray-600">
							PDF content will be loaded here for {params.major} {params.course_code}
						</p>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
} 