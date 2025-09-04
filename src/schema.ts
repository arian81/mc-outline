import { z } from "zod";

export const dropdownOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
});

export type DropdownOption = z.infer<typeof dropdownOptionSchema>;

export const UploadedFileDataSchema = z.object({
	id: z.string(),
	name: z.string(),
	size: z.number(),
	type: z.string(),
	uploadedAt: z.string(),
	courseCode: z.string().optional(),
	semester: z.string().optional(),
	description: z.string().optional(),
	instructor: z.string(),
});

export type UploadedFileData = z.infer<typeof UploadedFileDataSchema>;

export type FileWithMetadata = {
	file: File;
	metadata: UploadedFileData;
};

export type FileStorageError = {
	code:
		| "OPFS_NOT_SUPPORTED"
		| "FILE_NOT_FOUND"
		| "SAVE_FAILED"
		| "DELETE_FAILED"
		| "UPDATE_FAILED"
		| "LOAD_FAILED"
		| "VALIDATION_FAILED";
	message: string;
	cause?: unknown;
};

export interface FileState {
	file: File;
	progress: number;
	error?: string;
	status: "idle" | "uploading" | "error" | "success";
}

export interface StoreState {
	files: Map<File, FileState>;
	dragOver: boolean;
	invalid: boolean;
}

export type StoreAction =
	| { type: "ADD_FILES"; files: File[] }
	| { type: "SET_FILES"; files: File[] }
	| { type: "SET_PROGRESS"; file: File; progress: number }
	| { type: "SET_SUCCESS"; file: File }
	| { type: "SET_ERROR"; file: File; error: string }
	| { type: "REMOVE_FILE"; file: File }
	| { type: "SET_DRAG_OVER"; dragOver: boolean }
	| { type: "SET_INVALID"; invalid: boolean }
	| { type: "CLEAR" };

export type Direction = "ltr" | "rtl";

export type CourseData = {
	id: string;
	course_code: string;
	name: string;
	major: string;
};

export const fileSchema = z.object({
	courseCode: dropdownOptionSchema
		.nullable()
		.refine((option) => option !== null, "Course code is required"),
	season: dropdownOptionSchema
		.nullable()
		.refine((option) => option !== null, "Season is required"),
	year: dropdownOptionSchema
		.nullable()
		.refine((option) => option !== null, "Year is required"),
	description: z.string(),
	instructor: z.string().min(1, "Instructor is required"),
});

export type FormMeta = {
	submitAction: "next" | "prev" | "submit" | null;
};

export const githubUploadSchema = z
	.instanceof(FormData)
	.transform((fd) => Object.fromEntries(fd.entries()))
	.pipe(
		z.object({
			file: z.instanceof(File),
			major: z.string(),
			code: z.string(),
			semester: z.string(),
			fileName: z.string(),
		}),
	);

export const githubListFilesSchema = z.object({
	path: z.string(),
});

export const UploadedFileDataWithDownloadSchema = UploadedFileDataSchema.extend(
	{
		download_url: z.string(),
	},
);

export type UploadedFileDataWithDownload = z.infer<
	typeof UploadedFileDataWithDownloadSchema
>;

export const coursesSearchSchema = z.object({
	query: z.string().min(1),
	limit: z.number().min(1).max(20).optional().default(5),
});

export type GithubListFilesResponse = {
	path: string;
	semesters: string[];
	files: UploadedFileDataWithDownload[];
	totalFiles: number;
};
