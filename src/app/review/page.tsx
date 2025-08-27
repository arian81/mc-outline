"use client";

import { useForm } from "@tanstack/react-form";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

import {
	type UploadedFileData,
	useDeleteAllFiles,
	useDeleteFile,
	useGetAllFiles,
	useUpdateFileMetadata,
} from "@/lib/opfs";
import { api } from "@/trpc/react";

export default function ReviewPage() {
	const { data: files, isLoading, isError, error } = useGetAllFiles();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const updateMetadata = useUpdateFileMetadata();
	const deleteFile = useDeleteFile();
	const deleteAllFiles = useDeleteAllFiles();
	const router = useRouter();
	const currentFile = files?.[currentIndex] ?? null;
	const totalFiles = files?.length ?? 0;
	const isFirst = currentIndex === 0;
	const isLast = currentIndex >= totalFiles - 1;

	const uploadToGithub = api.github.uploadFile.useMutation();

	type FormMeta = {
		submitAction: "next" | "prev" | "submit" | null;
	};

	// Metadata is not required to call form.handleSubmit().
	// Specify what values to use as default if no meta is passed
	const defaultMeta: FormMeta = {
		submitAction: null,
	};

	async function uploadFileWithMetadata(
		file: File,
		metadata: UploadedFileData,
	) {
		const fileName = file.name.replace(".pdf", "");
		const formData = new FormData();
		formData.append("file", file);
		formData.append(
			"path",
			`${metadata.courseCode}/${metadata.semester}/${fileName}.pdf`,
		);
		await uploadToGithub.mutateAsync(formData);
		// upload the metadata as a json file
		const metadataFormData = new FormData();
		metadataFormData.append(
			"file",
			new Blob([JSON.stringify(metadata)], { type: "application/json" }),
		);
		metadataFormData.append(
			"path",
			`${metadata.courseCode}/${metadata.semester}/${fileName}.meta.json`,
		);
		await uploadToGithub.mutateAsync(metadataFormData);
	}

	const form = useForm({
		defaultValues: {
			courseCode: currentFile?.metadata.courseCode || "",
			semester: currentFile?.metadata.semester || "",
			description: currentFile?.metadata.description || "",
		},
		onSubmit: async ({ value, meta }) => {
			if (!currentFile?.metadata.id) return;

			await updateMetadata.mutateAsync({
				fileId: currentFile.metadata.id,
				updatedMetadata: { ...currentFile.metadata, ...value },
			});

			if (meta.submitAction === "submit") {
				setIsUploading(true);
				try {
					const otherFiles =
						files?.filter(
							(file) => file.metadata.id !== currentFile.metadata.id,
						) || [];
					const uploadPromises = [
						...otherFiles.map((file) =>
							uploadFileWithMetadata(file.file, file.metadata),
						),
						//TODO: This approach is not good. I can't think of a better solution. FIX LATER.
						uploadFileWithMetadata(currentFile.file, {
							...currentFile.metadata,
							...value,
						}),
					];

					await Promise.all(uploadPromises);
					toast.success(`Files uploaded to Github`);
					await deleteAllFiles.mutateAsync();
					router.push("/");
				} catch (error) {
					toast.error(
						`Failed to upload files: ${error instanceof Error ? error.message : "Unknown error"}`,
					);
				} finally {
					setIsUploading(false);
				}
			}

			form.reset();
		},
		onSubmitMeta: defaultMeta,
		validators: {
			onChange: ({ value }) => {
				const errors: string[] = [];

				if (!value.courseCode || value.courseCode.trim() === "") {
					errors.push("Course code is required");
				}

				if (!value.semester || value.semester.trim() === "") {
					errors.push("Semester is required");
				}

				if (errors.length > 0) {
					return errors.join(", ");
				}

				return undefined;
			},
		},
	});

	const handleNext = async () => {
		if (!form.state.canSubmit) return;

		await form.handleSubmit({ submitAction: "next" });
		if (!isLast) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const handleSubmitAll = async () => {
		if (!form.state.canSubmit) return;

		await form.handleSubmit({ submitAction: "submit" });
	};

	const handlePrevious = async () => {
		await form.handleSubmit({ submitAction: "prev" });
		if (!isFirst) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handleDelete = async () => {
		if (!currentFile?.metadata.id) return;

		try {
			await deleteFile.mutateAsync(currentFile.metadata.id);
			toast.success(`Deleted "${currentFile.metadata.name}"`);

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
				`Failed to delete "${currentFile.metadata.name}": ${error instanceof Error ? error.message : "Unknown error"}`,
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

	if (isUploading) {
		return (
			<div className="container mx-auto p-2">
				<div className="flex items-center justify-center">
					<div className="mx-auto w-full max-w-7xl px-1">
						<div className="flex h-[calc(100vh-12rem)] w-full items-center justify-center rounded-lg border bg-white shadow-xl">
							<div className="text-center">
								{/* Upload Icon */}
								<div className="mb-6 flex justify-center">
									<Spinner
										variant="circle"
										size={180}
										className="stroke-1 text-mcmaster-maroon"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="100"
											height="100"
											viewBox="0 0 24 24"
											aria-label="Uploading"
											className="text-mcmaster-maroon"
										>
											<title>Uploading</title>
											<g fill="none">
												<path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
												<path
													fill="currentColor"
													d="M7.024 2.31a9 9 0 0 1 2.125 1.046A11.4 11.4 0 0 1 12 3c.993 0 1.951.124 2.849.355a9 9 0 0 1 2.124-1.045c.697-.237 1.69-.621 2.28.032c.4.444.5 1.188.571 1.756c.08.634.099 1.46-.111 2.28C20.516 7.415 21 8.652 21 10c0 2.042-1.106 3.815-2.743 5.043a9.5 9.5 0 0 1-2.59 1.356c.214.49.333 1.032.333 1.601v3a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-.991c-.955.117-1.756.013-2.437-.276c-.712-.302-1.208-.77-1.581-1.218c-.354-.424-.74-1.38-1.298-1.566a1 1 0 0 1 .632-1.898c.666.222 1.1.702 1.397 1.088c.48.62.87 1.43 1.63 1.753c.313.133.772.22 1.49.122L8 17.98a4 4 0 0 1 .333-1.581a9.5 9.5 0 0 1-2.59-1.356C4.106 13.815 3 12.043 3 10c0-1.346.483-2.582 1.284-3.618c-.21-.82-.192-1.648-.112-2.283l.005-.038c.073-.582.158-1.267.566-1.719c.59-.653 1.584-.268 2.28-.031Z"
												/>
											</g>
										</svg>
									</Spinner>
								</div>

								{/* Upload Message */}
								<h2 className="mb-2 font-semibold text-2xl text-gray-800">
									Uploading Your Files
								</h2>
								<p className="mb-4 text-gray-600">
									Please wait while we upload {totalFiles} file
									{totalFiles !== 1 ? "s" : ""} to GitHub...
								</p>
							</div>
						</div>
					</div>
				</div>
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
											{currentFile.metadata.name}
										</h2>
									</div>
									<div className="min-h-0 flex-1">
										{currentFile.file ? (
											<iframe
												src={URL.createObjectURL(currentFile.file)}
												className="h-full w-full rounded border"
												title={`PDF viewer for ${currentFile.metadata.name}`}
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
											<form.Field
												name="courseCode"
												validators={{
													onChange: ({ value }) => {
														if (!value || value.trim() === "") {
															return "Course code is required";
														}
														return undefined;
													},
												}}
											>
												{(field) => (
													<div className="space-y-1">
														<label
															htmlFor={field.name}
															className="font-medium text-sm"
														>
															Course Code{" "}
															<span className="text-red-500">*</span>
														</label>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="e.g., CS101"
															className={clsx(
																field.state.meta.errors.length > 0 &&
																	"border-red-500 focus:border-red-500",
															)}
														/>
														{field.state.meta.errors.length > 0 && (
															<p className="text-red-500 text-xs">
																{field.state.meta.errors[0]}
															</p>
														)}
													</div>
												)}
											</form.Field>

											<form.Field
												name="semester"
												validators={{
													onChange: ({ value }) => {
														if (!value || value.trim() === "") {
															return "Semester is required";
														}
														return undefined;
													},
												}}
											>
												{(field) => (
													<div className="space-y-1">
														<label
															htmlFor={field.name}
															className="font-medium text-sm"
														>
															Semester <span className="text-red-500">*</span>
														</label>
														<Input
															id={field.name}
															name={field.name}
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															placeholder="e.g., Fall 2024"
															className={clsx(
																field.state.meta.errors.length > 0 &&
																	"border-red-500 focus:border-red-500",
															)}
														/>
														{field.state.meta.errors.length > 0 && (
															<p className="text-red-500 text-xs">
																{field.state.meta.errors[0]}
															</p>
														)}
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
											disabled={!form.state.canSubmit}
											className={clsx("flex-1", { hidden: isLast })}
										>
											Next →
										</Button>

										<Button
											onClick={handleSubmitAll}
											disabled={!form.state.canSubmit}
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
