"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";

const UploadedFileDataSchema = z.object({
	id: z.string(),
	name: z.string(),
	originalName: z.string(),
	size: z.number(),
	type: z.string(),
	lastModified: z.number(),
	uploadedAt: z.string(),
	customMetadata: z
		.object({
			courseCode: z.string().optional(),
			semester: z.string().optional(),
			description: z.string().optional(),
		})
		.optional(),
});

type UploadedFileData = z.infer<typeof UploadedFileDataSchema>;

type UseFileStorageReturn = {
	files: UploadedFileData[];
	isLoading: boolean;
	error: string | null;
	uploadFile: (
		file: File,
		metadata: Omit<UploadedFileData, "id" | "uploadedAt">,
	) => Promise<void>;
	deleteFile: (fileId: string) => Promise<void>;
	updateFileMetadata: (
		fileId: string,
		updatedMetadata: UploadedFileData,
	) => Promise<void>;
	getFile: (fileId: string) => Promise<File | null>;
	clearAllFiles: () => Promise<void>;
	refreshFiles: () => Promise<void>;
};

const isOPFSSupported = (): boolean => {
	return (
		typeof window !== "undefined" &&
		"storage" in navigator &&
		"getDirectory" in navigator.storage
	);
};

const getOPFSRoot = async (): Promise<FileSystemDirectoryHandle> => {
	if (!isOPFSSupported()) {
		throw new Error("OPFS is not supported in this browser");
	}
	return await navigator.storage.getDirectory();
};

const saveFileToOPFS = async (
	file: File,
	metadata: UploadedFileData,
): Promise<void> => {
	const root = await getOPFSRoot();
	const fileHandle = await root.getFileHandle(`${metadata.id}.pdf`, {
		create: true,
	});
	const writable = await fileHandle.createWritable();
	await writable.write(file);
	await writable.close();
	const metadataHandle = await root.getFileHandle(`${metadata.id}.meta.json`, {
		create: true,
	});
	const metadataWritable = await metadataHandle.createWritable();
	await metadataWritable.write(JSON.stringify(metadata));
	await metadataWritable.close();
};
const updateFileMetadataInOPFS = async (
	fileId: string,
	updatedMetadata: UploadedFileData,
): Promise<void> => {
	const root = await getOPFSRoot();
	const metadataHandle = await root.getFileHandle(`${fileId}.meta.json`, {
		create: false,
	});
	const writable = await metadataHandle.createWritable();
	await writable.write(JSON.stringify(updatedMetadata));
	await writable.close();
};

export const useFileStorage = (): UseFileStorageReturn => {
	const [files, setFiles] = useState<UploadedFileData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const supportsOPFS = isOPFSSupported();

	const refreshFiles = useCallback(async () => {
		setIsLoading(true);
		setError(null);

		try {
			let loadedFiles: UploadedFileData[];

			if (supportsOPFS) {
				const root = await navigator.storage.getDirectory();
				const files: UploadedFileData[] = [];

				for await (const handle of root.values()) {
					if (handle.kind === "file" && handle.name.endsWith(".meta.json")) {
						try {
							const file = await handle.getFile();
							const text = await file.text();
							const parsed = JSON.parse(text);
							const metadata = UploadedFileDataSchema.parse(parsed);
							files.push(metadata);
						} catch (error) {
							console.warn(
								`Failed to read or validate metadata for ${handle.name}:`,
								error,
							);
						}
					}
				}

				loadedFiles = files.sort(
					(a, b) =>
						new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
				);
			} else {
				try {
					const saved = sessionStorage.getItem("uploaded-files");
					if (!saved) {
						loadedFiles = [];
					} else {
						const parsed = JSON.parse(saved);
						loadedFiles = z.array(UploadedFileDataSchema).parse(parsed);
					}
				} catch (error) {
					console.warn("Failed to validate files from sessionStorage:", error);
					loadedFiles = [];
				}
			}

			setFiles(loadedFiles);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to load files";
			setError(errorMessage);
			console.error("Failed to load files:", err);
		} finally {
			setIsLoading(false);
		}
	}, [supportsOPFS]);

	useEffect(() => {
		refreshFiles();
	}, [refreshFiles]);

	const uploadFile = useCallback(
		async (
			file: File,
			metadata: Omit<UploadedFileData, "id" | "uploadedAt">,
		) => {
			setError(null);

			try {
				const fileData: UploadedFileData = {
					...metadata,
					id: crypto.randomUUID(),
					uploadedAt: new Date().toISOString(),
				};

				if (supportsOPFS) {
					await saveFileToOPFS(file, fileData);
				} else {
					const updatedFiles = [fileData, ...files];
					sessionStorage.setItem(
						"uploaded-files",
						JSON.stringify(updatedFiles),
					);
					setFiles(updatedFiles);
					return;
				}

				await refreshFiles();
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to upload file";
				setError(errorMessage);
				throw err;
			}
		},
		[supportsOPFS, files, refreshFiles],
	);

	const deleteFile = useCallback(
		async (fileId: string) => {
			setError(null);

			try {
				if (supportsOPFS) {
					const root = await getOPFSRoot();
					await Promise.all([
						root.removeEntry(`${fileId}.pdf`).catch(() => {}),
						root.removeEntry(`${fileId}.meta.json`).catch(() => {}),
					]);
				} else {
					const updatedFiles = files.filter((f) => f.id !== fileId);
					sessionStorage.setItem(
						"uploaded-files",
						JSON.stringify(updatedFiles),
					);
					setFiles(updatedFiles);
					return;
				}

				await refreshFiles();
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to delete file";
				setError(errorMessage);
				throw err;
			}
		},
		[supportsOPFS, files, refreshFiles],
	);

	const updateFileMetadata = useCallback(
		async (fileId: string, updatedMetadata: UploadedFileData) => {
			setError(null);

			try {
				if (supportsOPFS) {
					await updateFileMetadataInOPFS(fileId, updatedMetadata);
				} else {
					const updatedFiles = files.map((f) =>
						f.id === fileId ? updatedMetadata : f,
					);
					sessionStorage.setItem(
						"uploaded-files",
						JSON.stringify(updatedFiles),
					);
					setFiles(updatedFiles);
					return;
				}

				await refreshFiles();
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to update file metadata";
				setError(errorMessage);
				throw err;
			}
		},
		[supportsOPFS, files, refreshFiles],
	);

	const getFile = useCallback(
		async (fileId: string): Promise<File | null> => {
			setError(null);

			try {
				if (supportsOPFS) {
					const root = await getOPFSRoot();
					const fileHandle = await root.getFileHandle(`${fileId}.pdf`);
					return await fileHandle.getFile();
				} else {
					console.warn(
						"File retrieval not supported with sessionStorage fallback",
					);
					return null;
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to get file";
				setError(errorMessage);
				return null;
			}
		},
		[supportsOPFS],
	);

	const clearAllFiles = useCallback(async () => {
		setError(null);

		try {
			if (supportsOPFS) {
				const root = await getOPFSRoot();

				const filesToDelete: string[] = [];
				for await (const [_, handle] of root.entries()) {
					if (
						handle.name.endsWith(".pdf") ||
						handle.name.endsWith(".meta.json")
					) {
						filesToDelete.push(handle.name);
					}
				}

				await Promise.all(
					filesToDelete.map((name) => root.removeEntry(name).catch(() => {})),
				);
			} else {
				sessionStorage.removeItem("uploaded-files");
				setFiles([]);
				return;
			}

			await refreshFiles();
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to clear files";
			setError(errorMessage);
			throw err;
		}
	}, [supportsOPFS, refreshFiles]);

	return {
		files,
		isLoading,
		error,
		uploadFile,
		deleteFile,
		updateFileMetadata,
		getFile,
		clearAllFiles,
		refreshFiles,
	};
};

export { UploadedFileDataSchema };
export type { UploadedFileData };
