interface HeaderProps {
	title?: string;
}

export function Header({ title }: HeaderProps) {
	return (
		<header className="w-full px-6 py-4">
			<div className="grid grid-cols-3 items-center">
				<div className="flex items-center gap-3">
					<a href="/" className="h-10 w-10">
						<svg
							viewBox="0 0 256 256"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<title>McOutline</title>
							<rect width="256" height="256" rx="20" fill="#FDBF57" />
							<path
								d="m198.709 158.952-70.283 40.985-70.283-40.985a6.11 6.11 0 0 0-8.013 2.409 6.11 6.11 0 0 0 1.902 8.148l73.338 42.781a6.11 6.11 0 0 0 6.158 0l73.338-42.781a6.1 6.1 0 0 0 2.891-3.724 6.1 6.1 0 0 0-.621-4.674 6.1 6.1 0 0 0-3.762-2.841 6.1 6.1 0 0 0-4.665.682"
								fill="#7A003C"
							/>
							<path
								d="m198.709 122.282-70.283 40.986-70.283-40.986a6.113 6.113 0 0 0-8.675 6.86 6.1 6.1 0 0 0 2.564 3.698l73.338 42.781a6.11 6.11 0 0 0 6.158 0l73.338-42.781a6.1 6.1 0 0 0 2.891-3.725 6.1 6.1 0 0 0-.621-4.673 6.1 6.1 0 0 0-3.762-2.841 6.1 6.1 0 0 0-4.665.681"
								fill="#7A003C"
							/>
							<path
								d="m52.032 96.17 73.339 42.782a6.1 6.1 0 0 0 6.157 0l73.339-42.781a6.12 6.12 0 0 0 3.031-5.28 6.11 6.11 0 0 0-3.031-5.278l-73.339-42.78a6.11 6.11 0 0 0-6.157 0l-73.34 42.78a6.11 6.11 0 0 0 0 10.558"
								fill="#7A003C"
							/>
						</svg>
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
