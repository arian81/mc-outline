import { GraduationCap } from "lucide-react";

export function Header() {
	return (
		<header className="w-full px-6 py-4">
			<div className="flex items-center justify-start">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-mcmaster-maroon p-2">
						<GraduationCap className="h-6 w-6 text-white" />
					</div>
					<h1 className="font-bold text-mcmaster-maroon text-xl">
						McMaster Course Outlines
					</h1>
					<p className="text-mcmaster-gray text-sm">
						Find and share course outlines
					</p>
				</div>
			</div>
		</header>
	);
} 