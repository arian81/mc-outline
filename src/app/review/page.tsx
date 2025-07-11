"use client";

import { ArrowLeft, ArrowRight, Check, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileStorage, type UploadedFileData } from "@/lib/opfs";

export default function ReviewPage() {
	const {
		files: uploadedFiles,
		isLoading,
		error,
		updateFileMetadata,
		getFile,
		clearAllFiles,
		deleteFile
	} = useFileStorage();
	
	const [currentFileIndex, setCurrentFileIndex] = useState(0);
	const [fileMetadata, setFileMetadata] = useState<{
		name: string;
		courseCode: string;
		semester: string;
		description: string;
	}>({
		name: "",
		courseCode: "",
		semester: "",
		description: "",
	});
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const router = useRouter();

	const currentFile = uploadedFiles[currentFileIndex];

	// Redirect to home if no files to review (but only after initial loading)
	useEffect(() => {
		if (!isLoading && uploadedFiles.length === 0) {
			const timer = setTimeout(() => {
				router.push("/");
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [uploadedFiles.length, router, isLoading]);

	// Show error if there was a problem loading files
	useEffect(() => {
		if (error) {
			console.error("Error loading files:", error);
			router.push("/");
		}
	}, [error, router]);

	// Load current file metadata and create PDF URL
	useEffect(() => {
		let currentUrl: string | null = null;
		
		if (currentFile) {
			setFileMetadata({
				name: currentFile.name || currentFile.originalName,
				courseCode: currentFile.customMetadata?.courseCode || "",
				semester: currentFile.customMetadata?.semester || "",
				description: currentFile.customMetadata?.description || "",
			});

			// Create blob URL for PDF viewing
			if (currentFile.type === "application/pdf") {
				const loadFile = async () => {
					try {
						const file = await getFile(currentFile.id);
						if (file) {
							const url = URL.createObjectURL(file);
							currentUrl = url;
							setPdfUrl(url);
						} else {
							setPdfUrl(null);
						}
					} catch (error) {
						console.error("Failed to load file:", error);
						setPdfUrl(null);
					}
				};
				
				loadFile();
			} else {
				setPdfUrl(null);
			}
		}
		
		// Cleanup URL when component unmounts or file changes
		return () => {
			if (currentUrl) {
				URL.revokeObjectURL(currentUrl);
			}
		};
	}, [currentFile, getFile]);

	const handleNext = useCallback(async () => {
		if (!currentFile) return;

		try {
			// Save current file metadata before moving to next
			const updatedFile: UploadedFileData = {
				...currentFile,
				name: fileMetadata.name || currentFile.originalName,
				customMetadata: {
					courseCode: fileMetadata.courseCode,
					semester: fileMetadata.semester,
					description: fileMetadata.description,
				},
			};

			await updateFileMetadata(currentFile.id, updatedFile);

			// Move to next file
			if (currentFileIndex < uploadedFiles.length - 1) {
				setCurrentFileIndex(currentFileIndex + 1);
			}
		} catch (error) {
			console.error("Failed to save file changes:", error);
			alert("Failed to save changes. Please try again.");
		}
	}, [currentFile, fileMetadata, currentFileIndex, uploadedFiles.length, updateFileMetadata]);

	const handlePrevious = useCallback(() => {
		if (currentFileIndex > 0) {
			setCurrentFileIndex(currentFileIndex - 1);
		}
	}, [currentFileIndex]);

	const handleSubmit = useCallback(async () => {
		if (!currentFile) return;

		try {
			// Save current file metadata before submitting
			const updatedFile: UploadedFileData = {
				...currentFile,
				name: fileMetadata.name || currentFile.originalName,
				customMetadata: {
					courseCode: fileMetadata.courseCode,
					semester: fileMetadata.semester,
					description: fileMetadata.description,
				},
			};

			await updateFileMetadata(currentFile.id, updatedFile);

			// For now, just show success message
			console.log("All files would be submitted:", uploadedFiles);
			alert("Files ready for submission! (Backend integration coming soon)");
			
			// Optionally clear files and redirect
			// await clearAllFiles();
			// router.push("/");
		} catch (error) {
			console.error("Failed to save file changes:", error);
			alert("Failed to save changes. Please try again.");
		}
	}, [currentFile, fileMetadata, uploadedFiles, updateFileMetadata]);

	const handleGoBack = useCallback(() => {
		router.push("/");
	}, [router]);

	const handleDelete = useCallback(async () => {
		if (!currentFile) return;

		// Confirm deletion
		const confirmDelete = window.confirm(
			`Are you sure you want to delete "${currentFile.name || currentFile.originalName}"? This action cannot be undone.`
		);

		if (!confirmDelete) return;

		try {
			await deleteFile(currentFile.id);

			// Adjust current file index after deletion
			if (uploadedFiles.length === 1) {
				// If this was the last file, redirect to upload page
				router.push("/");
			} else if (currentFileIndex === uploadedFiles.length - 1) {
				// If we deleted the last file, move to the previous one
				setCurrentFileIndex(currentFileIndex - 1);
			}
			// If we deleted a file that wasn't the last one, the index stays the same
			// but now points to the next file (which moved into this position)
		} catch (error) {
			console.error("Failed to delete file:", error);
			alert("Failed to delete file. Please try again.");
		}
	}, [currentFile, deleteFile, uploadedFiles.length, currentFileIndex, router]);

	const isLastFile = currentFileIndex === uploadedFiles.length - 1;

	// Show loading state while checking for files
	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-6xl">
					<div className="mb-8 flex items-center justify-between">
						<div>
							<h1 className="mb-2 font-bold text-3xl text-mcmaster-maroon">
								Review Your Files
							</h1>
						</div>
						<Button
							variant="outline"
							onClick={handleGoBack}
							className="border-mcmaster-maroon text-mcmaster-maroon hover:bg-mcmaster-maroon hover:text-white"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Upload
						</Button>
					</div>

					<div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<div className="flex h-96 items-center justify-center">
							<div className="text-center">
								<FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
								<p className="text-gray-500">Loading files...</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Show empty state if no files
	if (uploadedFiles.length === 0) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-6xl">
					<div className="mb-8 flex items-center justify-between">
						<div>
							<h1 className="mb-2 font-bold text-3xl text-mcmaster-maroon">
								Review Your Files
							</h1>
							<p className="text-mcmaster-gray text-lg">
								Review and edit your uploaded files before submitting
							</p>
						</div>
						<Button
							variant="outline"
							onClick={handleGoBack}
							className="border-mcmaster-maroon text-mcmaster-maroon hover:bg-mcmaster-maroon hover:text-white"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Upload
						</Button>
					</div>

					<div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
						<div className="flex h-96 items-center justify-center">
							<div className="text-center">
								<FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
								<p className="text-gray-500">No files to review</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-6xl">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="mb-2 font-bold text-3xl text-mcmaster-maroon">
							Review Your Files
						</h1>
						<p className="text-mcmaster-gray text-lg">
							File {currentFileIndex + 1} of {uploadedFiles.length}
						</p>
					</div>
					<Button
						variant="outline"
						onClick={handleGoBack}
						className="border-mcmaster-maroon text-mcmaster-maroon hover:bg-mcmaster-maroon hover:text-white"
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Upload
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					{/* PDF Preview */}
					<div className="lg:col-span-2">
						<div className="rounded-lg border border-gray-200 bg-white shadow-sm">
							<div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
								<h2 className="font-semibold text-lg text-mcmaster-maroon">
									{currentFile?.name || currentFile?.originalName}
								</h2>
								<p className="text-gray-600 text-sm">
									{currentFile?.type} • {currentFile && Math.round(currentFile.size / 1024)} KB
								</p>
							</div>
							
							<div className="p-4">
								{pdfUrl ? (
									<iframe
										src={pdfUrl}
										className="h-[600px] w-full rounded border"
										title={`PDF Preview - ${currentFile?.name || currentFile?.originalName}`}
									/>
								) : (
									<div className="flex h-[600px] items-center justify-center rounded border bg-gray-50">
										<div className="text-center">
											<FileText className="mx-auto mb-4 h-16 w-16 text-gray-400" />
											<p className="text-gray-500">
												{currentFile?.type === "application/pdf" 
													? "Loading PDF preview..." 
													: "PDF preview not available for this file type"
												}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Metadata Form */}
					<div className="lg:col-span-1">
						<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
							<div className="mb-6 flex items-center justify-between">
								<h3 className="font-semibold text-lg text-mcmaster-maroon">
									File Information
								</h3>
								<Button
									onClick={handleDelete}
									variant="outline"
									size="sm"
									className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>

							<div className="space-y-4">
								<div>
									<label htmlFor="filename" className="mb-2 block font-medium text-sm text-gray-700">
										File Name
									</label>
									<Input
										id="filename"
										value={fileMetadata.name}
										onChange={(e) =>
											setFileMetadata((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
										placeholder="Enter file name"
										className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
									/>
								</div>

								<div>
									<label htmlFor="coursecode" className="mb-2 block font-medium text-sm text-gray-700">
										Course Code
									</label>
									<Input
										id="coursecode"
										value={fileMetadata.courseCode}
										onChange={(e) =>
											setFileMetadata((prev) => ({
												...prev,
												courseCode: e.target.value,
											}))
										}
										placeholder="e.g., COMP 1000"
										className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
									/>
								</div>

								<div>
									<label htmlFor="semester" className="mb-2 block font-medium text-sm text-gray-700">
										Semester
									</label>
									<Input
										id="semester"
										value={fileMetadata.semester}
										onChange={(e) =>
											setFileMetadata((prev) => ({
												...prev,
												semester: e.target.value,
											}))
										}
										placeholder="e.g., Fall 2024"
										className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
									/>
								</div>

								<div>
									<label htmlFor="description" className="mb-2 block font-medium text-sm text-gray-700">
										Description
									</label>
									<Input
										id="description"
										value={fileMetadata.description}
										onChange={(e) =>
											setFileMetadata((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
										placeholder="Brief description of the file"
										className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
									/>
								</div>
							</div>

							{/* Navigation Buttons */}
							<div className="mt-8 flex gap-3">
								{currentFileIndex > 0 && (
									<Button
										onClick={handlePrevious}
										variant="outline"
										className="flex-1 border-mcmaster-maroon text-mcmaster-maroon hover:bg-mcmaster-maroon hover:text-white"
									>
										<ArrowLeft className="mr-2 h-4 w-4" />
										Previous
									</Button>
								)}

								{isLastFile ? (
									<Button
										onClick={handleSubmit}
										className="flex-1 bg-green-600 hover:bg-green-700"
									>
										<Check className="mr-2 h-4 w-4" />
										Submit All
									</Button>
								) : (
									<Button
										onClick={handleNext}
										className="flex-1 bg-mcmaster-maroon hover:bg-mcmaster-maroon/90"
									>
										Next
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								)}
							</div>

							{/* Progress indicator */}
							<div className="mt-6">
								<div className="mb-2 flex justify-between text-sm text-gray-600">
									<span>Progress</span>
									<span>{currentFileIndex + 1} / {uploadedFiles.length}</span>
								</div>
								<div className="h-2 w-full rounded-full bg-gray-200">
									<div 
										className="h-2 rounded-full bg-mcmaster-maroon transition-all duration-300"
										style={{ width: `${((currentFileIndex + 1) / uploadedFiles.length) * 100}%` }}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 