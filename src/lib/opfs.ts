"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { err, ok, type Result } from "neverthrow";
import { z } from "zod";

const UploadedFileDataSchema = z.object({
	id: z.string(),
	name: z.string(),
	size: z.number(),
	type: z.string(),
	uploadedAt: z.string(),
	courseCode: z.string().optional(),
	semester: z.string().optional(),
	description: z.string().optional(),
});

type UploadedFileData = z.infer<typeof UploadedFileDataSchema>;

type FileWithMetadata = {
	file: File;
	metadata: UploadedFileData;
};

type FileStorageError = {
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

class OPFS {
	private root: FileSystemDirectoryHandle | null = null;
	private rootPromise: Promise<FileSystemDirectoryHandle> | null = null;

	private async getRoot(): Promise<FileSystemDirectoryHandle> {
		if (this.root) {
			return this.root;
		}

		if (this.rootPromise) {
			return this.rootPromise;
		}

		this.rootPromise = this.initializeRoot();
		this.root = await this.rootPromise;
		return this.root;
	}

	private async initializeRoot(): Promise<FileSystemDirectoryHandle> {
		if (!isOPFSSupported()) {
			throw createError(
				"OPFS_NOT_SUPPORTED",
				"OPFS is not supported in this browser",
			);
		}

		try {
			return await navigator.storage.getDirectory();
		} catch (error) {
			throw createError("LOAD_FAILED", "Failed to access OPFS", error);
		}
	}

	async saveFile(
		file: File,
		metadata: UploadedFileData,
	): Promise<Result<void, FileStorageError>> {
		try {
			const root = await this.getRoot();

			const fileHandle = await root.getFileHandle(`${metadata.id}.pdf`, {
				create: true,
			});
			const writable = await fileHandle.createWritable();
			await writable.write(file);
			await writable.close();

			const metadataHandle = await root.getFileHandle(
				`${metadata.id}.meta.json`,
				{ create: true },
			);
			const metadataWritable = await metadataHandle.createWritable();
			await metadataWritable.write(JSON.stringify(metadata));
			await metadataWritable.close();

			return ok(undefined);
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				return err(error as FileStorageError);
			}
			return err(
				createError("SAVE_FAILED", "Failed to save file to OPFS", error),
			);
		}
	}

	async deleteFile(fileId: string): Promise<Result<void, FileStorageError>> {
		try {
			const root = await this.getRoot();

			await Promise.all([
				root.removeEntry(`${fileId}.pdf`).catch(() => {}),
				root.removeEntry(`${fileId}.meta.json`).catch(() => {}),
			]);
			return ok();
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				return err(error as FileStorageError);
			}
			return err(
				createError("DELETE_FAILED", "Failed to delete file from OPFS", error),
			);
		}
	}

	async updateFileMetadata(
		fileId: string,
		updatedMetadata: UploadedFileData,
	): Promise<Result<void, FileStorageError>> {
		try {
			const root = await this.getRoot();

			const metadataHandle = await root.getFileHandle(`${fileId}.meta.json`, {
				create: false,
			});
			const writable = await metadataHandle.createWritable();
			await writable.write(JSON.stringify(updatedMetadata));
			await writable.close();

			return ok(undefined);
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				return err(error as FileStorageError);
			}
			return err(
				createError("UPDATE_FAILED", "Failed to update file metadata", error),
			);
		}
	}

	async getFile(
		fileId: string,
	): Promise<Result<FileWithMetadata, FileStorageError>> {
		try {
			const root = await this.getRoot();

			const [fileHandle, metadataHandle] = await Promise.all([
				root.getFileHandle(`${fileId}.pdf`),
				root.getFileHandle(`${fileId}.meta.json`),
			]);

			const [file, metadataFile] = await Promise.all([
				fileHandle.getFile(),
				metadataHandle.getFile(),
			]);

			const metadataText = await metadataFile.text();
			const parsedMetadata = JSON.parse(metadataText);
			const metadata = UploadedFileDataSchema.parse(parsedMetadata);

			return ok({ file, metadata });
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				return err(error as FileStorageError);
			}
			return err(
				createError(
					"LOAD_FAILED",
					"Failed to get file or metadata from OPFS",
					error,
				),
			);
		}
	}

	async getAllFiles(): Promise<Result<FileWithMetadata[], FileStorageError>> {
		try {
			const root = await this.getRoot();

			const files: FileWithMetadata[] = [];
			const metadataFiles: string[] = [];
			for await (const handle of root.values()) {
				if (handle.kind === "file" && handle.name.endsWith(".meta.json")) {
					metadataFiles.push(handle.name);
				}
			}

			const filePromises = metadataFiles.map(async (metadataFileName) => {
				const fileId = metadataFileName.replace(".meta.json", "");
				const fileName = `${fileId}.pdf`;

				try {
					const [fileHandle, metadataHandle] = await Promise.all([
						root.getFileHandle(fileName),
						root.getFileHandle(metadataFileName),
					]);

					const [file, metadataFile] = await Promise.all([
						fileHandle.getFile(),
						metadataHandle.getFile(),
					]);

					const metadataText = await metadataFile.text();
					const parsedMetadata = JSON.parse(metadataText);
					const metadata = UploadedFileDataSchema.parse(parsedMetadata);

					return { file, metadata };
				} catch (error) {
					console.warn(`Failed to load file ${fileId}:`, error);
					return null;
				}
			});

			const results = await Promise.all(filePromises);
			for (const result of results) {
				if (result !== null) {
					files.push(result);
				}
			}

			files.sort(
				(a, b) =>
					new Date(b.metadata.uploadedAt).getTime() -
					new Date(a.metadata.uploadedAt).getTime(),
			);
			return ok(files);
		} catch (error) {
			if (error instanceof Error && "code" in error) {
				return err(error as FileStorageError);
			}
			return err(
				createError("LOAD_FAILED", "Failed to list files from OPFS", error),
			);
		}
	}
}

const isOPFSSupported = (): boolean =>
	typeof window !== "undefined" &&
	"storage" in navigator &&
	"getDirectory" in navigator.storage;

const createError = (
	code: FileStorageError["code"],
	message: string,
	cause?: unknown,
): FileStorageError => ({
	code,
	message,
	cause,
});

// Singleton instance of OPFS, I don't wanna create a context
//TODO: use a context for this
const opfsInstance = new OPFS();

export const useUploadFile = () => {
	const supportsOPFS = isOPFSSupported();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			file,
			metadata,
		}: {
			file: File;
			metadata: Omit<UploadedFileData, "id" | "uploadedAt">;
		}) => {
			if (!supportsOPFS) {
				throw new Error("OPFS is not supported in this browser");
			}

			const fileData: UploadedFileData = {
				...metadata,
				id: crypto.randomUUID(),
				uploadedAt: new Date().toISOString(),
			};

			const result = await opfsInstance.saveFile(file, fileData);
			if (result.isErr()) {
				throw result.error;
			}
			return fileData;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["opfs-files"] });
		},
	});
};

export const useDeleteFile = () => {
	const supportsOPFS = isOPFSSupported();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (fileId: string) => {
			if (!supportsOPFS) {
				throw new Error("OPFS is not supported in this browser");
			}

			const result = await opfsInstance.deleteFile(fileId);
			if (result.isErr()) {
				throw result.error;
			}
			return result.value;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["opfs-files"] });
		},
	});
};

export const useUpdateFileMetadata = () => {
	const supportsOPFS = isOPFSSupported();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			fileId,
			updatedMetadata,
		}: {
			fileId: string;
			updatedMetadata: UploadedFileData;
		}) => {
			if (!supportsOPFS) {
				throw new Error("OPFS is not supported in this browser");
			}

			const result = await opfsInstance.updateFileMetadata(
				fileId,
				updatedMetadata,
			);
			if (result.isErr()) {
				throw result.error;
			}
			return result.value;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["opfs-files"] });
		},
	});
};

export const useGetFile = (fileId: string) => {
	const supportsOPFS = isOPFSSupported();

	return useQuery({
		queryKey: ["opfs-file", fileId],
		queryFn: async () => {
			if (!supportsOPFS) {
				throw new Error("OPFS is not supported in this browser");
			}

			const result = await opfsInstance.getFile(fileId);
			if (result.isErr()) {
				throw result.error;
			}
			return result.value;
		},
	});
};

export const useGetAllFiles = () => {
	const supportsOPFS = isOPFSSupported();

	return useQuery({
		queryKey: ["opfs-files"],
		queryFn: async () => {
			if (!supportsOPFS) {
				throw new Error("OPFS is not supported in this browser");
			}

			const result = await opfsInstance.getAllFiles();
			if (result.isErr()) {
				throw result.error;
			}
			return result.value;
		},
	});
};

export { type UploadedFileData, OPFS, opfsInstance };
