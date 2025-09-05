"use client";

import {
  BookOpen,
  Calendar,
  Download,
  FileText,
  Upload,
  User,
} from "lucide-react";
import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";
import courseMapping from "@/data/course_mapping.json";
import { useUploadFile } from "@/lib/opfs";
import { api } from "@/trpc/react";

export default function CoursePage() {
  const params = useParams<{ major: string; course_code: string }>();
  const { major, course_code } = params;
  const router = useRouter();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { mutateAsync: uploadFile } = useUploadFile();

  const fullCourseCode = `${major.toUpperCase()} ${course_code.toUpperCase()}`;

  if (!(fullCourseCode in courseMapping)) {
    notFound();
  }

  const { data: filesResult, isLoading } = api.github.listFiles.useQuery({
    path: `${major}/${course_code}`,
  });

  const files = filesResult?.files;
  const pdfFiles = files?.filter((file) =>
    file.name.toLowerCase().endsWith(".pdf"),
  );

  // Check if we have no files (either from error or empty result)
  const hasNoFiles = !isLoading && (!pdfFiles || pdfFiles.length === 0);

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

  // Group files by semester for better organization
  const filesBySemester = pdfFiles?.reduce(
    (acc, file) => {
      const semester = file.semester || "Unknown";
      if (!acc[semester]) {
        acc[semester] = [];
      }
      acc[semester].push(file);
      return acc;
    },
    {} as Record<string, typeof pdfFiles>,
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-2 py-4 md:px-4 md:py-8">
        <div className="space-y-4 md:space-y-8">
          <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }, () => {
              const cardId = Math.random().toString(36).substr(2, 9);
              return (
                <Card key={`skeleton-card-${cardId}`} className="flex flex-col">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </CardHeader>

                  <CardContent className="flex-1 space-y-4">
                    <div className="aspect-[3/4] animate-pulse rounded-md bg-muted" />

                    <Separator />

                    <div className="space-y-2">
                      {Array.from({ length: 4 }, () => {
                        const detailId = Math.random()
                          .toString(36)
                          .substr(2, 9);
                        return (
                          <div
                            key={`skeleton-detail-${detailId}`}
                            className="flex items-center gap-2"
                          >
                            <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <div className="flex w-full gap-2">
                      <div className="h-9 flex-1 animate-pulse rounded bg-muted" />
                      <div className="h-9 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (hasNoFiles) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center">
        <div className="space-y-4 px-2 py-8 text-center md:space-y-6 md:px-0 md:py-12">
          <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground md:mb-4 md:h-16 md:w-16" />
          <h2 className="mb-2 font-bold text-xl tracking-tight md:text-2xl">
            Course Outline Not Available Yet
          </h2>
          <p className="mb-4 text-muted-foreground text-sm md:mb-6 md:text-base">
            No one has uploaded the course outline for this course yet. If you
            have it please send it over. 🙂
          </p>

          <FileUpload
            value={uploadedFiles}
            onValueChange={setUploadedFiles}
            accept=".pdf"
            multiple
            onUpload={handleFileUpload}
            onFileReject={handleFileReject}
            className="mx-auto w-full max-w-md"
          >
            <FileUploadDropzone className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-4 transition-colors hover:border-muted-foreground/40 md:p-8">
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-6 w-6 text-muted-foreground md:h-8 md:w-8" />
                <div className="text-center">
                  <p className="font-medium text-xs md:text-sm">
                    Drop PDF files here or click to browse
                  </p>
                </div>
                <FileUploadTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-mcmaster-maroon text-white"
                  >
                    Choose Files
                  </Button>
                </FileUploadTrigger>
              </div>
            </FileUploadDropzone>
          </FileUpload>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-4 md:px-4 md:py-8">
      <div className="space-y-4 md:space-y-8">
        {Object.entries(filesBySemester ?? {}).map(
          ([semester, semesterFiles]) => (
            <div key={semester} className="space-y-4 md:space-y-6">
              <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
                {semesterFiles.map((file) => (
                  <Card key={file.id} className="flex flex-col">
                    <CardHeader className="pb-3 md:pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 md:h-5 md:w-5" />
                          <CardTitle className="text-sm leading-tight md:text-base">
                            {file.name}
                          </CardTitle>
                        </div>
                      </div>
                      {file.description && (
                        <CardDescription className="line-clamp-2 text-xs md:text-sm">
                          {file.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 space-y-3 md:space-y-4">
                      <div className="aspect-[3/4] overflow-hidden rounded-md border">
                        <iframe
                          src={file.download_url}
                          className="h-full w-full"
                          title={`${file.name} preview`}
                          loading="lazy"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-1.5 text-xs md:space-y-2 md:text-sm">
                        {file.instructor && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                            <span className="text-muted-foreground">
                              Instructor:
                            </span>
                            <span className="font-medium">
                              {file.instructor}
                            </span>
                          </div>
                        )}
                        {file.courseCode && (
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                            <span className="text-muted-foreground">
                              Course:
                            </span>
                            <span className="font-medium">
                              {file.courseCode}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                          <span className="text-muted-foreground">
                            Uploaded:
                          </span>
                          <span>{formatDate(file.uploadedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3 w-3 text-muted-foreground md:h-4 md:w-4" />
                          <span className="text-muted-foreground">Size:</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-3 md:pt-4">
                      <div className="flex w-full gap-2">
                        <Button asChild className="flex-1 text-xs md:text-sm">
                          <a
                            href={file.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 md:gap-2"
                          >
                            <FileText className="h-3 w-3 md:h-4 md:w-4" />
                            View PDF
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="text-xs md:text-sm"
                        >
                          <a
                            href={file.download_url}
                            download={file.name}
                            className="flex items-center gap-1.5 md:gap-2"
                          >
                            <Download className="h-3 w-3 md:h-4 md:w-4" />
                          </a>
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
