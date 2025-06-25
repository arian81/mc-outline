"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
	FileUpload,
	FileUploadDropzone,
	FileUploadItem,
	FileUploadItemDelete,
	FileUploadItemMetadata,
	FileUploadItemPreview,
	FileUploadItemProgress,
	FileUploadList,
	FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FileText, Search } from "lucide-react";
import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type Course = {
	id: number;
	major: string;
	course_code: string;
	name: string;
	semester: string;
	lastUpdated: string;
	department: string;
};

const CustomFilePreview = ({ file }: { file: File }) => {
	// Check if the file is a PDF
	if (
		file.type === "application/pdf" ||
		file.name.toLowerCase().endsWith(".pdf")
	) {
		return (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="16"
				height="16"
				viewBox="0 0 16 16"
				className="text-mcmaster-maroon"
			>
				<path
					fill="none"
					stroke="currentColor"
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M2.8 14.34c1.81-1.25 3.02-3.16 3.91-5.5c.9-2.33 1.86-4.33 1.44-6.63c-.06-.36-.57-.73-.83-.7c-1.02.06-.95 1.21-.85 1.9c.24 1.71 1.56 3.7 2.84 5.56c1.27 1.87 2.32 2.16 3.78 2.26c.5.03 1.25-.14 1.37-.58c.77-2.8-9.02-.54-12.28 2.08c-.4.33-.86 1-.6 1.46c.20.36.87.4 1.23.15h0Z"
					strokeWidth="1"
				/>
			</svg>
		);
	}

	// Default icon for other file types
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 16 16"
			className="text-mcmaster-maroon"
		>
			<path
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M13.5 6.5v6a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h4.01m-.01 0l5 5h-4a1 1 0 0 1-1-1z"
				stroke-width="1"
			/>
		</svg>
	);
};

export default function Component() {
	const [searchValue, setSearchValue] = useState("");
	const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
	const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
	const [isDragOver, setIsDragOver] = useState(false);
	const [mockCourses, setMockCourses] = useState<Course[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
	const searchContainerRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	const handleCourseSelection = (course: Course) => {
		console.log("Selected course:", course);
		// Clear search and return to original state
		setSearchValue("");
		setHighlightedIndex(-1);
		// Navigate to the course page
		router.push(`/${course.major}/${course.course_code}`);
	};

	// Handle clicks outside the search area
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
				setSearchValue("");
				setHighlightedIndex(-1);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	useEffect(() => {
		// Dynamically import the mock data JSON
		import("@/data/mockCourses.json")
			.then((module) => {
				setMockCourses(module.default as Course[]);
				setFilteredCourses(module.default as Course[]);
			})
			.catch((err) => {
				console.error("Failed to load mock courses", err);
			});
	}, []);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchValue(value);

		if (value.length > 0) {
			const filtered = mockCourses.filter(
				(course) =>
					course.major.toLowerCase().includes(value.toLowerCase()) ||
					course.course_code.toLowerCase().includes(value.toLowerCase()) ||
					course.name.toLowerCase().includes(value.toLowerCase()) ||
					course.department.toLowerCase().includes(value.toLowerCase()),
			);
			setFilteredCourses(filtered);
			// Only highlight the first result if we don't already have a valid highlighted index
			// or if the filtered results changed
			if (highlightedIndex < 0 || highlightedIndex >= filtered.length) {
				setHighlightedIndex(filtered.length > 0 ? 0 : -1);
			}
		} else {
			setFilteredCourses(mockCourses);
			setHighlightedIndex(-1);
		}
	};

	const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (!searchValue || filteredCourses.length === 0) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev < filteredCourses.length - 1 ? prev + 1 : 0
				);
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredCourses.length - 1
				);
				break;
			case "Enter":
				if (highlightedIndex >= 0 && highlightedIndex < filteredCourses.length) {
					const selected = filteredCourses[highlightedIndex];
					if (selected) {
						handleCourseSelection(selected);
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
				onProgress,
				onSuccess,
				onError,
			}: {
				onProgress: (file: File, progress: number) => void;
				onSuccess: (file: File) => void;
				onError: (file: File, error: Error) => void;
			},
		) => {
			try {
				// Process each file individually
				const uploadPromises = files.map(async (file) => {
					try {
						// Simulate file upload with progress
						const totalChunks = 10;
						let uploadedChunks = 0;

						// Simulate chunk upload with delays
						for (let i = 0; i < totalChunks; i++) {
							// Simulate network delay (100-300ms per chunk)
							await new Promise((resolve) =>
								setTimeout(resolve, Math.random() * 200 + 100),
							);

							// Update progress for this specific file
							uploadedChunks++;
							const progress = (uploadedChunks / totalChunks) * 100;
							onProgress(file, progress);
						}

						// Simulate server processing delay
						await new Promise((resolve) => setTimeout(resolve, 500));
						onSuccess(file);
					} catch (error) {
						onError(
							file,
							error instanceof Error ? error : new Error("Upload failed"),
						);
					}
				});

				// Wait for all uploads to complete
				await Promise.all(uploadPromises);
			} catch (error) {
				// This handles any error that might occur outside the individual upload processes
				console.error("Unexpected error during upload:", error);
			}
		},
		[],
	);

	const handleFileReject = useCallback((file: File, message: string) => {
		console.log(`File "${file.name}" rejected: ${message}`);
	}, []);

	return (
		<div className="relative h-screen">
			<Header />
			
			<FileUpload
				value={uploadedFiles}
				onValueChange={setUploadedFiles}
				accept=".pdf"
				maxSize={10 * 1024 * 1024} // 10MB
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
							<div
								className={`${searchValue.length > 0 ? "mb-6" : ""}`}
							>
								<div
									className={`mb-8 text-center ${searchValue.length > 0 ? "-translate-y-8 pointer-events-none transform opacity-0" : "translate-y-0 transform opacity-100"}`}
								>
									<h2 className="mb-6 font-bold text-5xl text-mcmaster-maroon">
										Find Course Outlines
									</h2>
									<p className="text-mcmaster-gray text-xl">
										Search by course code, name, or department
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
										onChange={handleSearchChange}
										onKeyDown={handleSearchKeyDown}
										className={`rounded-xl border-2 border-mcmaster-maroon py-6 pr-4 pl-12 text-lg focus-visible:border-mcmaster-yellow focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-mcmaster-yellow/50 ${searchValue.length > 0 ? "border-opacity-100 shadow-2xl" : "border-opacity-50 shadow-lg"}`}
									/>

									{searchValue && (
										<div className="absolute top-full right-0 left-0 z-[100] mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
											{filteredCourses.length > 0 ? (
												<>
													<div className="border-gray-100 border-b p-4">
														<p className="font-medium text-mcmaster-gray text-sm">
															Found {filteredCourses.length} course
															{filteredCourses.length !== 1 ? "s" : ""} for you
														</p>
													</div>
													{filteredCourses.map((course, idx) => (
														<div
															key={course.id}
															className={`flex cursor-pointer items-start gap-3 border-gray-100 border-b p-4 last:border-b-0 ${highlightedIndex === idx ? "bg-mcmaster-yellow/30" : ""}`}
															onMouseEnter={() => setHighlightedIndex(idx)}
															onClick={() => {
																handleCourseSelection(course);
															}}
														>
															<FileText className="mt-0.5 h-5 w-5 text-mcmaster-maroon" />
															<div className="min-w-0 flex-1">
																<h3 className="mb-1 font-medium text-mcmaster-maroon">
																	{course.major} {course.course_code}
																</h3>
																<p className="mb-1 line-clamp-2 text-gray-600 text-sm">
																	{course.name}
																</p>
																<div className="flex items-center gap-2 text-mcmaster-gray text-xs">
																	<span>{course.semester}</span>
																	<span>•</span>
																	<span>Updated {course.lastUpdated}</span>
																	<span>•</span>
																	<span>{course.department}</span>
																</div>
															</div>
														</div>
													))}
												</>
											) : (
												<div className="p-8 text-center">
													<Search className="mx-auto mb-4 h-12 w-12 text-mcmaster-gray opacity-40" />
													<p className="mb-2 font-medium text-mcmaster-maroon">
														No courses found
													</p>
													<p className="text-mcmaster-gray text-sm">
														Try a different search term or course code
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
										<Button className="rounded-lg cursor-pointer bg-mcmaster-maroon px-8 py-3 font-medium text-white hover:shadow-lg">
											Give us your outline files!
										</Button>
									</FileUploadTrigger>

									<div className="mt-3 flex items-center justify-center gap-2 text-mcmaster-gray text-sm">
										<span>ps: drag and drop works too 😉</span>
									</div>
								</div>

								<FileUploadList orientation="horizontal" className="mt-4">
									{uploadedFiles.map((file, index) => (
										<FileUploadItem key={index} value={file}>
											<FileUploadItemPreview
												render={(file) => {
													return <CustomFilePreview file={file} />;
												}}
											/>
											<FileUploadItemMetadata />
											<FileUploadItemProgress />
											<FileUploadItemDelete />
										</FileUploadItem>
									))}
								</FileUploadList>
							</div>
						</div>
					</div>
				</FileUploadDropzone>
			</FileUpload>

			<Footer />
		</div>
	);
}
