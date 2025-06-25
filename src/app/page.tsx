"use client";

import type React from "react";

import { useState, useCallback } from "react";
import {
  Search,
  FileText,
  GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemProgress,
  FileUploadItemDelete,
  useFileUpload,
} from "@/components/ui/file-upload";

const mockCourses = [
  {
    id: 1,
    code: "COMP SCI 1JC3",
    name: "Computer Science Practice and Experience: Basic Concepts",
    semester: "Fall 2024",
    lastUpdated: "2 days ago",
    department: "Computing and Software",
  },
  {
    id: 2,
    code: "COMP SCI 1MD3",
    name: "Introduction to Programming",
    semester: "Fall 2024",
    lastUpdated: "1 week ago",
    department: "Computing and Software",
  },
  {
    id: 3,
    code: "MATH 1A03",
    name: "Integral Calculus with Applications",
    semester: "Fall 2024",
    lastUpdated: "3 days ago",
    department: "Mathematics and Statistics",
  },
  {
    id: 4,
    code: "MATH 1AA3",
    name: "Calculus for Science I",
    semester: "Fall 2024",
    lastUpdated: "5 days ago",
    department: "Mathematics and Statistics",
  },
  {
    id: 5,
    code: "PHYSICS 1A03",
    name: "Physics for the Life Sciences I",
    semester: "Fall 2024",
    lastUpdated: "2 weeks ago",
    department: "Physics and Astronomy",
  },
  {
    id: 6,
    code: "CHEM 1A03",
    name: "Introductory Chemistry",
    semester: "Fall 2024",
    lastUpdated: "4 days ago",
    department: "Chemistry and Chemical Biology",
  },
  {
    id: 7,
    code: "BIOLOGY 1M03",
    name: "Cellular and Molecular Biology",
    semester: "Fall 2024",
    lastUpdated: "1 week ago",
    department: "Biology",
  },
  {
    id: 8,
    code: "ECON 1B03",
    name: "Introductory Microeconomics",
    semester: "Fall 2024",
    lastUpdated: "1 week ago",
    department: "Economics",
  },
  {
    id: 9,
    code: "PSYCH 1X03",
    name: "Introduction to Psychology, Neuroscience & Behaviour",
    semester: "Fall 2024",
    lastUpdated: "1 week ago",
    department: "Psychology, Neuroscience & Behaviour",
  },
  {
    id: 10,
    code: "ENG 1P03",
    name: "University Writing",
    semester: "Fall 2024",
    lastUpdated: "5 days ago",
    department: "English and Cultural Studies",
  },
  {
    id: 11,
    code: "COMP SCI 2C03",
    name: "Data Structures and Algorithms",
    semester: "Winter 2024",
    lastUpdated: "2 weeks ago",
    department: "Computing and Software",
  },
  {
    id: 12,
    code: "COMP SCI 2ME3",
    name: "Introduction to Software Development",
    semester: "Winter 2024",
    lastUpdated: "3 weeks ago",
    department: "Computing and Software",
  },
];

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
  const [filteredCourses, setFilteredCourses] = useState(mockCourses);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (value.length > 0) {
      const filtered = mockCourses.filter(
        (course) =>
          course.code.toLowerCase().includes(value.toLowerCase()) ||
          course.name.toLowerCase().includes(value.toLowerCase()) ||
          course.department.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(mockCourses);
    }
  };

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
  };

  const handleSearchBlur = () => {
    setIsSearchFocused(false);
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
      }
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
                setTimeout(resolve, Math.random() * 200 + 100)
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
              error instanceof Error ? error : new Error("Upload failed")
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
    []
  );

  const handleFileReject = useCallback((file: File, message: string) => {
    console.log(`File "${file.name}" rejected: ${message}`);
  }, []);

  return (
    <div className="h-screen relative">
      <header className="absolute top-0 left-0 w-full px-6 py-4 z-10">
        <div className="flex items-center justify-start">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-mcmaster-maroon">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-mcmaster-maroon">
              McMaster Course Outlines
            </h1>
            <p className="text-sm text-mcmaster-gray">
              Find and share course outlines
            </p>
          </div>
        </div>
      </header>

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
          className={`h-screen transition-all duration-300 ${
            isDragOver 
              ? "bg-mcmaster-yellow/10 border-4 border-dashed border-mcmaster-maroon" 
              : ""
          }`}
          onDragEnter={() => setIsDragOver(true)}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={() => setIsDragOver(false)}
          onClick={(e) => {
            // Prevent the dropzone from opening the file dialog when clicking
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="h-full flex items-center justify-center p-4 overflow-clip pt-20">
            <div className="w-full max-w-2xl">
              <div
                className={`transition-all duration-700 ease-in-out ${
                  searchValue.length > 0 ? "mb-6" : ""
                }`}
              >
                <div
                  className={`text-center mb-8 transition-all duration-500 ${
                    searchValue.length > 0
                      ? "opacity-0 transform -translate-y-8 pointer-events-none"
                      : "opacity-100 transform translate-y-0"
                  }`}
                >
                  <h2 className="font-bold text-5xl mb-6 text-mcmaster-maroon">
                    Find Course Outlines
                  </h2>
                  <p className="text-xl text-mcmaster-gray">
                    Search by course code, name, or department
                  </p>
                </div>

                <div className={`relative max-w-xl mx-auto mb-4 transition-all duration-700 ease-in-out z-50 ${
                  searchValue.length > 0 ? "transform -translate-y-32" : "transform translate-y-0"
                }`}>
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" />
                  <Input
                    type="text"
                    placeholder="Search for courses..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    className={`pl-12 pr-4 py-6 text-lg border-2 rounded-xl transition-all duration-300 border-mcmaster-maroon focus-visible:ring-mcmaster-yellow/50 focus-visible:ring-[3px] focus-visible:border-mcmaster-yellow focus-visible:outline-none ${
                      searchValue.length > 0
                        ? "shadow-2xl border-opacity-100"
                        : "shadow-lg border-opacity-50"
                    }`}
                  />
                  
                  {searchValue && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-[100]">
                      {filteredCourses.length > 0 ? (
                        <>
                          <div className="p-4 border-b border-gray-100">
                            <p
                              className="text-sm font-medium text-mcmaster-gray"
                            >
                              Found {filteredCourses.length} course
                              {filteredCourses.length !== 1 ? "s" : ""} for you
                            </p>
                          </div>
                          {filteredCourses.map((course) => (
                            <div
                              key={course.id}
                              className="flex items-start gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <FileText
                                className="w-5 h-5 mt-0.5 text-mcmaster-maroon"
                              />
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="font-medium mb-1 text-mcmaster-maroon"
                                >
                                  {course.code}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                                  {course.name}
                                </p>
                                <div
                                  className="flex items-center gap-2 text-xs text-mcmaster-gray"
                                >
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
                          <Search
                            className="w-12 h-12 mx-auto mb-4 opacity-40 text-mcmaster-gray"
                          />
                          <p
                            className="font-medium mb-2 text-mcmaster-maroon"
                          >
                            No courses found
                          </p>
                          <p className="text-sm text-mcmaster-gray">
                            Try a different search term or course code
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 my-10">
                <Separator className="flex-1" />
                <span className="text-sm font-medium text-mcmaster-gray px-4">or</span>
                <Separator className="flex-1" />
              </div>

              <div
                className={`transition-all duration-700 ease-in-out ${
                  searchValue.length > 0
                    ? "opacity-0 transform translate-y-8 pointer-events-none"
                    : "opacity-100 transform translate-y-0"
                }`}
              >
                <div className="text-center">
                  <FileUploadTrigger asChild>
                    <Button
                      className="px-8 py-3 text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg bg-mcmaster-maroon"
                    >
                      Give us your outline files!
                    </Button>
                  </FileUploadTrigger>
                  
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-mcmaster-gray">
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

      <footer className="absolute bottom-0 left-0 w-full py-4 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-mcmaster-gray">
            Obviously not affiliated with Mac
          </p>
        </div>
      </footer>
    </div>
  );
}