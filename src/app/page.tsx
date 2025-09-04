"use client";

import { useDebounce } from "@uidotdev/usehooks";
import { FileText, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useUploadFile } from "@/lib/opfs";
import { api } from "@/trpc/react";

export default function App() {
	const [searchValue, setSearchValue] = useState("");
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();
	const { mutateAsync: uploadFile } = useUploadFile();
	const debouncedSearchValue = useDebounce(searchValue, 300);

	const { data: searchResults = [], isLoading } = api.courses.search.useQuery(
		{ query: debouncedSearchValue, limit: 5 },
		{
			enabled: debouncedSearchValue.length >= 2,
			staleTime: 5 * 60 * 1000, // 5 minutes
		},
	);

	useEffect(() => {
		if (searchResults.length > 0) {
			setHighlightedIndex(0);
		} else {
			setHighlightedIndex(-1);
		}
	}, [searchResults]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				searchContainerRef.current &&
				!searchContainerRef.current.contains(event.target as Node)
			) {
				setSearchValue("");
				setHighlightedIndex(-1);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!searchValue || searchResults.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < searchResults.length - 1 ? prev + 1 : 0,
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : searchResults.length - 1,
				);
				break;
			case "Enter":
				if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
					const selected = searchResults[highlightedIndex];
					if (selected) {
						router.push(selected.course_code.split(" ").join("/"));
					}
				}
				break;
			case "Escape":
				setSearchValue("");
				setHighlightedIndex(-1);
				break;
			default:
				break;
		}
	};

	const handleFileUpload = useCallback(
		async (
			files: File[],
			{
				onSuccess,
				onError,
			}: {
				onProgress: (file: File, progress: number) => void;
				onSuccess: (file: File) => void;
				onError: (file: File, error: Error) => void;
			},
		) => {
			try {
				const successfulUploads: File[] = [];

				// Process each file
				for (const file of files) {
					try {
						// Validate file type
						if (
							!file.type.includes("pdf") &&
							!file.name.toLowerCase().endsWith(".pdf")
						) {
							onError(file, new Error("Only PDF files are allowed"));
							continue;
						}

						// Use the TanStack Query mutation
						await uploadFile({
							file,
							metadata: {
								name: file.name,
								size: file.size,
								type: file.type,
								instructor: "",
							},
						});

						successfulUploads.push(file);
						onSuccess(file);
					} catch (error) {
						onError(
							file,
							error instanceof Error
								? error
								: new Error("Failed to process file"),
						);
					}
				}

				// If any files were successfully processed, navigate to review page immediately
				if (successfulUploads.length > 0) {
					router.push("/review");
				}
			} catch (error) {
				console.error("Unexpected error during file processing:", error);
			}
		},
		[router, uploadFile],
	);

	const handleFileReject = useCallback((file: File, message: string) => {
		console.log(`File "${file.name}" rejected: ${message}`);
	}, []);

	return (
		<div className="relative h-screen">
			<div className="absolute top-0 left-0 z-10 w-full">
				<Header />
			</div>

			<FileUpload
				value={uploadedFiles}
				onValueChange={setUploadedFiles}
				accept=".pdf"
				multiple
				onUpload={handleFileUpload}
				onFileReject={handleFileReject}
				className="w-full"
			>
				<FileUploadDropzone
					className={`h-screen ${isDragOver ? "border-4 border-mcmaster-maroon border-dashed bg-mcmaster-yellow/10" : ""}`}
					onDragEnter={() => setIsDragOver(true)}
					onDragLeave={() => setIsDragOver(false)}
					onDrop={() => setIsDragOver(false)}
					onClick={(e) => {
						// Prevent the dropzone from opening the file dialog when clicking
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<div className="flex h-full items-center justify-center overflow-clip p-4 pt-20">
						<div className="w-full max-w-2xl">
							<div className={`${searchValue.length > 0 ? "mb-6" : ""}`}>
								<div
									className={`mb-8 text-center ${searchValue.length > 0 ? "-translate-y-8 pointer-events-none transform opacity-0" : "translate-y-0 transform opacity-100"}`}
								>
									<h2 className="mb-6 font-bold text-5xl text-mcmaster-maroon">
										Find Course Outlines
									</h2>
									<p className="text-mcmaster-gray text-xl">
										Search by course code, name, or major
									</p>
								</div>

								<div
									ref={searchContainerRef}
									className={`relative z-50 mx-auto mb-4 max-w-xl ${searchValue.length > 0 ? "-translate-y-32 transform" : "translate-y-0 transform"}`}
								>
									<Search className="-translate-y-1/2 absolute top-1/2 left-4 h-5 w-5 transform" />
									<Input
										type="text"
										placeholder="Search for courses..."
										value={searchValue}
										onChange={(e) => setSearchValue(e.target.value)}
										onKeyDown={handleSearchKeyDown}
										className={`rounded-xl border-2 border-mcmaster-maroon py-6 pr-4 pl-12 text-lg focus-visible:border-mcmaster-yellow focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mcmaster-yellow/50 ${searchValue.length > 0 ? "border-opacity-100 shadow-2xl" : "border-opacity-50 shadow-lg"}`}
									/>

									{searchValue && (
										<div className="absolute top-full right-0 left-0 z-[100] mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
											{isLoading ? (
												<div className="p-8 text-center">
													<Search className="mx-auto mb-4 h-6 w-6 animate-spin text-mcmaster-gray" />
													<p className="text-mcmaster-gray text-sm">
														Searching courses...
													</p>
												</div>
											) : searchResults.length > 0 ? (
												<>
													<div className="border-gray-100 border-b p-4">
														<p className="font-medium text-mcmaster-gray text-sm">
															Found {searchResults.length} course
															{searchResults.length !== 1 ? "s" : ""} for you
														</p>
													</div>
													{searchResults.map((course, idx) => (
														<Link
															key={course.id}
															href={course.course_code.split(" ").join("/")}
															prefetch={true}
															className={`flex w-full cursor-pointer items-start gap-3 border-gray-100 border-b p-4 transition-colors last:border-b-0 hover:bg-gray-50 ${highlightedIndex === idx ? "bg-mcmaster-yellow/30" : ""}`}
															onMouseEnter={() => setHighlightedIndex(idx)}
														>
															<FileText className="mt-0.5 h-5 w-5 text-mcmaster-maroon" />
															<div className="min-w-0 flex-1">
																<h3 className="mb-1 font-medium text-mcmaster-maroon">
																	{course.course_code}
																</h3>
																<p className="mb-1 line-clamp-2 text-gray-600 text-sm">
																	{course.name}
																</p>
																<div className="flex items-center gap-2 text-mcmaster-gray text-xs">
																	<span>{course.major}</span>
																</div>
															</div>
														</Link>
													))}
												</>
											) : debouncedSearchValue.length >= 2 ? (
												<div className="p-8 text-center">
													<Search className="mx-auto mb-4 h-12 w-12 text-mcmaster-gray opacity-40" />
													<p className="mb-2 font-medium text-mcmaster-maroon">
														No courses found
													</p>
													<p className="text-mcmaster-gray text-sm">
														Try a different search term or course code
													</p>
												</div>
											) : (
												<div className="p-6 text-center">
													<p className="text-mcmaster-gray text-sm">
														Type at least 2 characters to start searching
													</p>
												</div>
											)}
										</div>
									)}
								</div>
							</div>

							{searchValue.length === 0 && (
								<div className="my-10 flex items-center gap-4">
									<Separator className="flex-1" />
									<span className="px-4 font-medium text-mcmaster-gray text-sm">
										or
									</span>
									<Separator className="flex-1" />
								</div>
							)}

							<div
								className={`${searchValue.length > 0 ? "pointer-events-none translate-y-8 transform opacity-0" : "translate-y-0 transform opacity-100"}`}
							>
								<div className="text-center">
									<FileUploadTrigger asChild>
										<Button className="cursor-pointer rounded-lg bg-mcmaster-maroon px-8 py-3 font-medium text-white hover:shadow-lg">
											Send over your outline files!
										</Button>
									</FileUploadTrigger>

									<div className="mt-3 flex items-center justify-center gap-2 text-mcmaster-gray text-sm">
										<span>ps: drag and drop works too 😉</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</FileUploadDropzone>
			</FileUpload>

			<div className="absolute bottom-0 left-0 w-full">
				<Footer />
			</div>
		</div>
	);
}
