import { BookOpen, Calendar, Download, FileText, User } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import courseMapping from "@/data/course_mapping.json";
import PostHogClient from "@/lib/posthog";
import type { UploadedFileDataWithDownload } from "@/schema";
import { api } from "@/trpc/server";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ major: string; course_code: string }>;
}) {
  const { major, course_code } = await params;
  const fullCourseCode = `${major.toUpperCase()} ${course_code.toUpperCase()}`;
  if (!(fullCourseCode in courseMapping)) {
    notFound();
  }
  let files: UploadedFileDataWithDownload[] = [];
  const result = await api.github.listFiles({
    path: `${major}/${course_code}`,
  });

  if (result.isOk()) {
    files = result.value.files;
  }

  const pdfFiles = files.filter((file) =>
    file.name.toLowerCase().endsWith(".pdf"),
  );

  const posthog = PostHogClient();
  posthog.capture({
    distinctId: "anonymous",
    event: "course_page_viewed",
    properties: {
      course_code: fullCourseCode,
      major: major.toUpperCase(),
      course_number: course_code.toUpperCase(),
      files_available: files.length,
      pdf_files_available: pdfFiles.length,
      has_content: pdfFiles.length > 0,
    },
  });
  if (pdfFiles.length === 0) {
    posthog.capture({
      distinctId: "anonymous",
      event: "course_empty_state_viewed",
      properties: {
        course_code: fullCourseCode,
        major: major.toUpperCase(),
        course_number: course_code.toUpperCase(),
      },
    });
  }

  posthog.shutdown();

  // Group files by semester for better organization
  const filesBySemester = pdfFiles.reduce(
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

  return (
    <div className="container mx-auto px-4 py-8">
      {pdfFiles.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(filesBySemester).map(([semester, semesterFiles]) => (
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
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="py-12 text-center">
            <CardContent>
              <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <CardTitle className="mb-2">
                Course Outline Not Available Yet
              </CardTitle>
              <CardDescription className="text-md">
                No one has uploaded the course outline for this course yet. If
                you have it please send it over. 🙂
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
