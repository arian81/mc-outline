"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useFileStorage } from "@/lib/opfs";

export default function ReviewPage() {
	const { files, isLoading, error, getFile } = useFileStorage();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);

	const currentFile = files[currentIndex];

	const handleNext = () => {
		setCurrentIndex((prev) => (prev + 1) % files.length);
		setPdfUrl(null);
	};

	const handlePrevious = () => {
		setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
		setPdfUrl(null);
	};

	// Load PDF when currentFile changes
	useEffect(() => {
		let currentUrl: string | null = null;

		const loadPDF = async () => {
			if (!currentFile) {
				setPdfUrl(null);
				return;
			}

			const file = await getFile(currentFile.id);
			if (file) {
				currentUrl = URL.createObjectURL(file);
				setPdfUrl(currentUrl);
			}
		};

		loadPDF();

		// Cleanup URL on unmount or dependency change
		return () => {
			if (currentUrl) {
				URL.revokeObjectURL(currentUrl);
			}
		};
	}, [currentFile, getFile]);

	if (isLoading) {
		return (
			<div className="container mx-auto p-6 text-center">Loading PDFs...</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto p-6 text-center text-red-500">
				Error: {error}
			</div>
		);
	}

	if (files.length === 0) {
		return (
			<div className="container mx-auto p-6 text-center text-muted-foreground">
				No PDFs uploaded yet
			</div>
		);
	}

	return (
		<div className="container mx-auto p-6">
			<h1 className="mb-6 font-bold text-3xl">Review Uploaded PDFs</h1>

			{currentFile ? (
				<div className="flex items-center justify-center">
					<div className="mx-auto w-full max-w-4xl px-4 py-6">
						<div className="relative">
							{/* Background cards for stacked effect */}
							<div className="-bottom-6 -right-6 absolute h-full w-full rounded-lg border"></div>
							<div className="-bottom-3 -right-3 absolute h-full w-full rounded-lg border"></div>

							{/* Main card */}
							<Card className="relative min-h-[400px] w-full">
								<CardHeader>
									<CardTitle>{currentFile.originalName}</CardTitle>
									<CardDescription>
										PDF {currentIndex + 1} of {files.length} • Uploaded{" "}
										{new Date(currentFile.uploadedAt).toLocaleDateString()}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{pdfUrl ? (
										<div className="space-y-4">
											<iframe
												src={pdfUrl}
												className="h-96 w-full rounded border"
												title={`PDF viewer for ${currentFile.originalName}`}
											/>
											<div className="space-y-2 text-sm">
												<div className="text-muted-foreground">
													Size: {(currentFile.size / 1024 / 1024).toFixed(2)} MB
												</div>
												{currentFile.customMetadata?.courseCode && (
													<div>
														<span className="font-medium">Course:</span>{" "}
														{currentFile.customMetadata.courseCode}
													</div>
												)}
												{currentFile.customMetadata?.semester && (
													<div>
														<span className="font-medium">Semester:</span>{" "}
														{currentFile.customMetadata.semester}
													</div>
												)}
												{currentFile.customMetadata?.description && (
													<div>
														<span className="font-medium">Description:</span>{" "}
														{currentFile.customMetadata.description}
													</div>
												)}
											</div>
										</div>
									) : (
										<div className="flex h-96 items-center justify-center text-muted-foreground">
											Loading PDF...
										</div>
									)}
								</CardContent>
								<CardFooter className="flex justify-center gap-4">
									<Button
										variant="outline"
										onClick={handlePrevious}
										disabled={files.length <= 1}
									>
										← Previous
									</Button>
									<Button
										variant="outline"
										onClick={handleNext}
										disabled={files.length <= 1}
									>
										Next →
									</Button>
								</CardFooter>
							</Card>
						</div>
					</div>
				</div>
			) : (
				<div className="text-center text-muted-foreground">
					Unable to load current PDF
				</div>
			)}
		</div>
	);
}
