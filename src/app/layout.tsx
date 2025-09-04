import "@/styles/globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ReactScanProvider } from "@/components/ReactScanProvider";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "McOutline",
	description: "Find and share course outlines",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
	openGraph: {
		type: "website",
		url: "https://mcoutline.com",
		title: "McOutline",
		description: "Find and share course outlines",
		siteName: "McOutline",
		images: [{ url: "/og-image.png" }],
	},
};

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	variable: "--font-poppins-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en" className={`${poppins.variable}`}>
			<head>
				<meta name="apple-mobile-web-app-title" content="McOutline" />
			</head>
			<body>
				<ReactScanProvider>
					<TRPCReactProvider>{children}</TRPCReactProvider>
					<Toaster />
				</ReactScanProvider>
			</body>
		</html>
	);
}
