"use client";

import { ArrowLeft, Check, Edit2, FileText, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useFileStorage, type UploadedFileData } from "@/lib/opfs";

export default function ReviewPage() {
	const {
		files: uploadedFiles,
		isLoading,
		error,
		updateFileMetadata,
		deleteFile,
		clearAllFiles
	} = useFileStorage();
	
	const [editingFile, setEditingFile] = useState<string | null>(null);
	const [editingValues, setEditingValues] = useState<{
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
	const router = useRouter();

	// Redirect to home if no files to review (but only after initial loading)
	useEffect(() => {
		if (!isLoading && uploadedFiles.length === 0) {
			// Use a timeout to avoid navigation during render
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
			// Optionally redirect to home on error
			router.push("/");
		}
	}, [error, router]);

	const formatFileSize = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const formatDate = (dateString: string): string => {
		return new Date(dateString).toLocaleString();
	};

	const handleEditFile = useCallback((file: UploadedFileData) => {
		setEditingFile(file.id);
		setEditingValues({
			name: file.name,
			courseCode: file.customMetadata?.courseCode || "",
			semester: file.customMetadata?.semester || "",
			description: file.customMetadata?.description || "",
		});
	}, []);

	const handleSaveEdit = useCallback(async () => {
		if (!editingFile) return;

		try {
			const originalFile = uploadedFiles.find(f => f.id === editingFile);
			if (!originalFile) return;

			const updatedFile: UploadedFileData = {
				...originalFile,
				name: editingValues.name || originalFile.originalName,
				customMetadata: {
					courseCode: editingValues.courseCode,
					semester: editingValues.semester,
					description: editingValues.description,
				},
			};

			await updateFileMetadata(editingFile, updatedFile);
			setEditingFile(null);
			setEditingValues({ name: "", courseCode: "", semester: "", description: "" });
		} catch (error) {
			console.error("Failed to save file changes:", error);
			alert("Failed to save changes. Please try again.");
		}
	}, [editingFile, editingValues, uploadedFiles, updateFileMetadata]);

	const handleCancelEdit = useCallback(() => {
		setEditingFile(null);
		setEditingValues({ name: "", courseCode: "", semester: "", description: "" });
	}, []);

	const handleDeleteFile = useCallback(async (fileId: string) => {
		try {
			await deleteFile(fileId);
		} catch (error) {
			console.error("Failed to delete file:", error);
			alert("Failed to delete file. Please try again.");
		}
	}, [deleteFile]);

	const handleSubmitFiles = useCallback(async () => {
		try {
			// Here you would typically submit the files to your backend
			console.log("Submitting files:", uploadedFiles);
			
			// Clear the files from storage after successful submission
			await clearAllFiles();
			
			// Redirect to a success page or back to home
			alert("Files submitted successfully!");
			router.push("/");
		} catch (error) {
			console.error("Failed to submit files:", error);
			alert("Failed to submit files. Please try again.");
		}
	}, [uploadedFiles, router, clearAllFiles]);

	const handleGoBack = useCallback(() => {
		router.push("/");
	}, [router]);

	// Show loading state while checking for files
	if (isLoading) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-4xl">
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
						{/* Empty white div while loading */}
					</div>
				</div>
			</div>
		);
	}

	// Show empty state if no files (though this will rarely be seen due to redirect)
	if (uploadedFiles.length === 0) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="mx-auto max-w-4xl">
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
						{/* Empty white div - no files */}
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mx-auto max-w-4xl">
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
					<div className="mb-4 flex items-center justify-between">
						<h2 className="font-semibold text-xl text-mcmaster-maroon">
							Uploaded Files ({uploadedFiles.length})
						</h2>
						<Button
							onClick={handleSubmitFiles}
							className="bg-mcmaster-maroon hover:bg-mcmaster-maroon/90"
						>
							<Check className="mr-2 h-4 w-4" />
							Submit All Files
						</Button>
					</div>

					<div className="space-y-4">
						{uploadedFiles.map((file, index) => (
							<div key={file.id}>
								{index > 0 && <Separator className="my-4" />}
								<div className="rounded-lg border border-gray-100 p-4">
									<div className="flex items-start gap-4">
										<div className="mt-1 flex-shrink-0">
											<FileText className="h-8 w-8 text-mcmaster-maroon" />
										</div>

										<div className="min-w-0 flex-1">
											{editingFile === file.id ? (
												<div className="space-y-4">
													<div>
														<label htmlFor={`filename-${editingFile}`} className="mb-1 block font-medium text-sm text-gray-700">
															File Name
														</label>
														<Input
															id={`filename-${editingFile}`}
															value={editingValues.name}
															onChange={(e) =>
																setEditingValues((prev) => ({
																	...prev,
																	name: e.target.value,
																}))
															}
															placeholder="Enter file name"
															className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
														/>
													</div>

													<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
														<div>
															<label htmlFor={`coursecode-${editingFile}`} className="mb-1 block font-medium text-sm text-gray-700">
																Course Code
															</label>
															<Input
																id={`coursecode-${editingFile}`}
																value={editingValues.courseCode}
																onChange={(e) =>
																	setEditingValues((prev) => ({
																		...prev,
																		courseCode: e.target.value,
																	}))
																}
																placeholder="e.g., COMP 1000"
																className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
															/>
														</div>

														<div>
															<label htmlFor={`semester-${editingFile}`} className="mb-1 block font-medium text-sm text-gray-700">
																Semester
															</label>
															<Input
																id={`semester-${editingFile}`}
																value={editingValues.semester}
																onChange={(e) =>
																	setEditingValues((prev) => ({
																		...prev,
																		semester: e.target.value,
																	}))
																}
																placeholder="e.g., Fall 2024"
																className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
															/>
														</div>
													</div>

													<div>
														<label htmlFor={`description-${editingFile}`} className="mb-1 block font-medium text-sm text-gray-700">
															Description
														</label>
														<Input
															id={`description-${editingFile}`}
															value={editingValues.description}
															onChange={(e) =>
																setEditingValues((prev) => ({
																	...prev,
																	description: e.target.value,
																}))
															}
															placeholder="Brief description of the file"
															className="focus-visible:border-mcmaster-yellow focus-visible:ring-mcmaster-yellow/50"
														/>
													</div>

													<div className="flex gap-2">
														<Button
															onClick={handleSaveEdit}
															size="sm"
															className="bg-green-600 hover:bg-green-700"
														>
															<Check className="mr-1 h-3 w-3" />
															Save
														</Button>
														<Button
															onClick={handleCancelEdit}
															size="sm"
															variant="outline"
														>
															Cancel
														</Button>
													</div>
												</div>
											) : (
												<div>
													<div className="mb-2 flex items-start justify-between">
														<h3 className="font-medium text-lg text-mcmaster-maroon">
															{file.name || file.originalName}
														</h3>
														<div className="flex gap-2">
															<Button
																onClick={() => handleEditFile(file)}
																size="sm"
																variant="outline"
																className="border-mcmaster-maroon text-mcmaster-maroon hover:bg-mcmaster-maroon hover:text-white"
															>
																<Edit2 className="h-3 w-3" />
															</Button>
															<Button
																onClick={() => handleDeleteFile(file.id)}
																size="sm"
																variant="outline"
																className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
															>
																<Trash2 className="h-3 w-3" />
															</Button>
														</div>
													</div>

													<div className="mb-3 grid grid-cols-2 gap-4 text-sm text-gray-600 md:grid-cols-4">
														<div>
															<span className="font-medium">Size:</span>{" "}
															{formatFileSize(file.size)}
														</div>
														<div>
															<span className="font-medium">Type:</span>{" "}
															{file.type || "Unknown"}
														</div>
														<div>
															<span className="font-medium">Uploaded:</span>{" "}
															{formatDate(file.uploadedAt)}
														</div>
														<div>
															<span className="font-medium">Original:</span>{" "}
															{file.originalName}
														</div>
													</div>

													{file.customMetadata && (
														<div className="space-y-2 rounded bg-gray-50 p-3">
															{file.customMetadata.courseCode && (
																<div className="text-sm">
																	<span className="font-medium">Course:</span>{" "}
																	{file.customMetadata.courseCode}
																</div>
															)}
															{file.customMetadata.semester && (
																<div className="text-sm">
																	<span className="font-medium">Semester:</span>{" "}
																	{file.customMetadata.semester}
																</div>
															)}
															{file.customMetadata.description && (
																<div className="text-sm">
																	<span className="font-medium">Description:</span>{" "}
																	{file.customMetadata.description}
																</div>
															)}
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
} 