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
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      <div className="space-y-6">
        <Card className="py-12 text-center">
          <CardContent>
            <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <CardTitle className="mb-2">
              Course Outline Not Available Yet
            </CardTitle>
            <CardDescription className="mb-6 text-md">
              No one has uploaded the course outline for this course yet. If you
              have it please send it over. 🙂
            </CardDescription>

            <FileUpload
              value={uploadedFiles}
              onValueChange={setUploadedFiles}
              accept=".pdf"
              multiple
              onUpload={handleFileUpload}
              onFileReject={handleFileReject}
              className="mx-auto w-full max-w-md"
            >
              <FileUploadDropzone className="rounded-lg border-2 border-muted-foreground/25 border-dashed p-8 transition-colors hover:border-muted-foreground/40">
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium text-sm">
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {Object.entries(filesBySemester ?? {}).map(
          ([semester, semesterFiles]) => (
            <div key={semester} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {semesterFiles.map((file) => (
                  <Card key={file.id} className="flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-base leading-tight">
                            {file.name}
                          </CardTitle>
                        </div>
                      </div>
                      {file.description && (
                        <CardDescription className="line-clamp-2">
                          {file.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      <div className="aspect-[3/4] overflow-hidden rounded-md border">
                        <iframe
                          src={file.download_url}
                          className="h-full w-full"
                          title={`${file.name} preview`}
                          loading="lazy"
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2 text-sm">
                        {file.instructor && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
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
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Course:
                            </span>
                            <span className="font-medium">
                              {file.courseCode}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Uploaded:
                          </span>
                          <span>{formatDate(file.uploadedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Size:</span>
                          <span>{formatFileSize(file.size)}</span>
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4">
                      <div className="flex w-full gap-2">
                        <Button asChild className="flex-1">
                          <a
                            href={file.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View PDF
                          </a>
                        </Button>
                        <Button variant="outline" asChild>
                          <a
                            href={file.download_url}
                            download={file.name}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
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
