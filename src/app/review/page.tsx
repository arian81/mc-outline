"use client";

import { useForm } from "@tanstack/react-form";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
	useDeleteFile,
	useGetAllFiles,
	useUpdateFileMetadata,
} from "@/lib/opfs";

export default function ReviewPage() {
	const { data: files, isLoading, isError, error } = useGetAllFiles();
	const [currentIndex, setCurrentIndex] = useState(0);
	const updateMetadata = useUpdateFileMetadata();
	const deleteFile = useDeleteFile();

	const currentFile = files?.[currentIndex] ?? null;
	const totalFiles = files?.length ?? 0;
	const isFirst = currentIndex === 0;
	const isLast = currentIndex >= totalFiles - 1;

	const form = useForm({
		defaultValues: {
			courseCode: currentFile?.metadata.courseCode || "",
			semester: currentFile?.metadata.semester || "",
			description: currentFile?.metadata.description || "",
		},
		onSubmit: async ({ value }) => {
			if (!currentFile?.metadata.id) return;
			await updateMetadata.mutateAsync({
				fileId: currentFile.metadata.id,
				updatedMetadata: { ...currentFile.metadata, ...value },
			});
			form.reset();
		},
	});

	const handleNext = async () => {
		await form.handleSubmit();
		if (!isLast) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const handleSubmitAll = async () => {
		await form.handleSubmit();
		console.log("Submit clicked on review page", {
			totalFiles: files?.length ?? 0,
			currentIndex,
			currentFileName: currentFile?.metadata.originalName,
		});
	};

	const handlePrevious = async () => {
		await form.handleSubmit();
		if (!isFirst) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handleDelete = async () => {
		if (!currentFile?.metadata.id) return;

		try {
			await deleteFile.mutateAsync(currentFile.metadata.id);
			toast.success(`Deleted "${currentFile.metadata.originalName}"`);

			// Adjust current index after deletion. Two branches:
			// - Case 1: If we deleted the last item, move to the new last valid index
			//           (or 0 when the list becomes empty).
			// - Case 2: Otherwise, we deleted something before the end; keep the same
			//           index so the next file naturally shifts into view.
			const newTotalFiles = totalFiles - 1;
			if (currentIndex >= newTotalFiles) {
				setCurrentIndex(Math.max(0, newTotalFiles - 1));
			} else {
				setCurrentIndex(currentIndex);
			}
		} catch (error) {
			toast.error(
				`Failed to delete "${currentFile.metadata.originalName}": ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}
	};

	if (isLoading) {
		return (
			<div className="container mx-auto p-6 text-center">Loading PDFs...</div>
		);
	}

	if (isError) {
		return (
			<div className="container mx-auto p-6 text-center text-red-500">
				{error?.message}
			</div>
		);
	}

	if (files?.length === 0) {
		return (
			<div className="container mx-auto p-6 text-center text-muted-foreground">
				No PDFs uploaded yet
			</div>
		);
	}

	return (
		<div className="container mx-auto p-2">
			{currentFile ? (
				<div className="flex items-center justify-center">
					<div className="mx-auto w-full max-w-7xl px-1">
						<div className="relative">
							{/* Background cards for stacked effect */}
							<div className="-bottom-6 -right-6 absolute h-[calc(100vh-12rem)] w-full rounded-lg border bg-white shadow-lg"></div>
							<div className="-bottom-3 -right-3 absolute h-[calc(100vh-12rem)] w-full rounded-lg border bg-white shadow-md"></div>

							{/* Main container with flex layout */}
							<div className="relative flex h-[calc(100vh-12rem)] w-full flex-col gap-3 overflow-hidden rounded-lg border bg-white shadow-xl lg:flex-row">
								{/* Left side - PDF viewer */}
								<div className="flex flex-1 flex-col p-3">
									<div className="mb-2 flex-shrink-0">
										<h2 className="font-semibold text-xl">
											{currentFile.metadata.originalName}
										</h2>
									</div>
									<div className="min-h-0 flex-1">
										{currentFile.file ? (
											<iframe
												src={URL.createObjectURL(currentFile.file)}
												className="h-full w-full rounded border"
												title={`PDF viewer for ${currentFile.metadata.originalName}`}
											/>
										) : (
											<div className="flex h-full items-center justify-center text-muted-foreground">
												Loading PDF...
											</div>
										)}
									</div>
								</div>

								{/* Right side - Metadata form */}
								<div className="flex w-full flex-col border-t bg-gray-50/50 lg:w-80 lg:border-t-0 lg:border-l">
									<div className="flex-1 overflow-y-auto p-3">
										<div className="mb-2 flex items-start justify-between">
											<div>
												<h3 className="font-semibold text-lg">Edit Metadata</h3>
												<p className="text-muted-foreground text-sm">
													Update PDF information and details
												</p>
											</div>
											<Button
												onClick={handleDelete}
												size="sm"
												variant="ghost"
												className="h-8 w-8 p-0 text-black hover:text-mcmaster-maroon"
												disabled={deleteFile.isPending}
											>
												{deleteFile.isPending ? (
													<div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
												) : (
													<svg
														xmlns="http://www.w3.org/2000/svg"
														className="h-4 w-4"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
														aria-label="Delete"
													>
														<title>Delete</title>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M6 18L18 6M6 6l12 12"
														/>
													</svg>
												)}
											</Button>
										</div>
										<div className="space-y-2">
											<form.Field name="courseCode">
												{(field) => (
													<div className="space-y-1">
														<label
															htmlFor={field.name}
															className="font-medium text-sm"
														>
															Course Code
														</label>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="e.g., CS101"
														/>
													</div>
												)}
											</form.Field>

											<form.Field name="semester">
												{(field) => (
													<div className="space-y-1">
														<label
															htmlFor={field.name}
															className="font-medium text-sm"
														>
															Semester
														</label>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="e.g., Fall 2024"
														/>
													</div>
												)}
											</form.Field>

											<form.Field name="description">
												{(field) => (
													<div className="space-y-1">
														<label
															htmlFor={field.name}
															className="font-medium text-sm"
														>
															Description
														</label>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="Brief description..."
														/>
													</div>
												)}
											</form.Field>
										</div>

										<div className="space-y-1 border-t pt-2 text-muted-foreground text-sm">
											<div>
												Size:{" "}
												<span
													className={`font-medium ${
														currentFile.metadata.size / 1024 / 1024 < 1
															? "text-green-600"
															: currentFile.metadata.size / 1024 / 1024 <= 10
																? "text-yellow-600"
																: "text-red-600"
													}`}
												>
													{(currentFile.metadata.size / 1024 / 1024).toFixed(2)}{" "}
													MB
												</span>
											</div>
											<div>
												Uploaded:{" "}
												{new Date(
													currentFile.metadata.uploadedAt,
												).toLocaleString()}
											</div>
										</div>
									</div>

									{/* Navigation buttons */}
									<div className="flex gap-2 border-t bg-gray-50/50 p-3">
										<Button
											onClick={handlePrevious}
											disabled={isFirst}
											className={clsx("flex-1", { hidden: totalFiles <= 1 })}
										>
											← Previous
										</Button>

										<Button
											onClick={handleNext}
											className={clsx("flex-1", { hidden: isLast })}
										>
											Next →
										</Button>

										<Button
											onClick={handleSubmitAll}
											className={clsx("flex-1", { hidden: !isLast })}
										>
											Submit
										</Button>
									</div>
								</div>
							</div>
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
