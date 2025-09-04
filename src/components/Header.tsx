import { GraduationCap } from "lucide-react";

interface HeaderProps {
	title?: string;
}

export function Header({ title }: HeaderProps) {
	return (
		<header className="w-full px-6 py-4">
			<div className="grid grid-cols-3 items-center">
				<div className="flex items-center gap-3">
					<a href="/" className="rounded-lg bg-mcmaster-maroon p-2">
						<GraduationCap className="h-6 w-6 text-white" />
					</a>
					<div>
						<h1 className="font-bold text-mcmaster-maroon text-xl">
							McOutline
						</h1>
						<p className="text-mcmaster-gray text-sm">
							Find and share course outlines
						</p>
					</div>
				</div>

				<div className="flex justify-center">
					{title && (
						<p className="font-semibold text-lg text-mcmaster-maroon">
							{title}
						</p>
					)}
				</div>

				<div className="flex justify-end">
					<p className="text-mcmaster-gray text-sm">
						made by <br></br>
						<a
							className="text-mcmaster-maroon"
							href="https://arian.gg"
							target="_blank"
							rel="noopener"
						>
							arian.gg
						</a>
					</p>
				</div>
			</div>
		</header>
	);
}
