'use client';

import { useState, useEffect, useCallback } from 'react';

type UploadedFileData = {
	id: string;
	name: string;
	originalName: string;
	size: number;
	type: string;
	lastModified: number;
	uploadedAt: string;
	customMetadata?: {
		courseCode?: string;
		semester?: string;
		description?: string;
	};
};

type UseFileStorageReturn = {
	files: UploadedFileData[];
	isLoading: boolean;
	error: string | null;
	uploadFile: (file: File, metadata: Omit<UploadedFileData, 'id' | 'uploadedAt'>) => Promise<void>;
	deleteFile: (fileId: string) => Promise<void>;
	updateFileMetadata: (fileId: string, updatedMetadata: UploadedFileData) => Promise<void>;
	getFile: (fileId: string) => Promise<File | null>;
	clearAllFiles: () => Promise<void>;
	refreshFiles: () => Promise<void>;
};

// Check if OPFS is available
const isOPFSSupported = (): boolean => {
	return typeof window !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
};

// Get the OPFS root directory
const getOPFSRoot = async (): Promise<FileSystemDirectoryHandle> => {
	if (!isOPFSSupported()) {
		throw new Error('OPFS is not supported in this browser');
	}
	return await navigator.storage.getDirectory();
};

// OPFS operations
const saveFileToOPFS = async (file: File, metadata: UploadedFileData): Promise<void> => {
	const root = await getOPFSRoot();
	
	// Create the file handle
	const fileHandle = await root.getFileHandle(`${metadata.id}.pdf`, { create: true });
	
	// Write the file data
	const writable = await fileHandle.createWritable();
	await writable.write(file);
	await writable.close();
	
	// Save metadata separately
	const metadataHandle = await root.getFileHandle(`${metadata.id}.meta.json`, { create: true });
	const metadataWritable = await metadataHandle.createWritable();
	await metadataWritable.write(JSON.stringify(metadata));
	await metadataWritable.close();
};

const getUploadedFilesFromOPFS = async (): Promise<UploadedFileData[]> => {
	const root = await getOPFSRoot();
	const files: UploadedFileData[] = [];
	
	// Iterate through all files in OPFS
	for await (const handle of (root as any).values()) {
		// Only process metadata files
		if (handle.name.endsWith('.meta.json') && handle.kind === 'file') {
			try {
				const metadataFile = await (handle as FileSystemFileHandle).getFile();
				const metadataText = await metadataFile.text();
				const metadata = JSON.parse(metadataText) as UploadedFileData;
				files.push(metadata);
			} catch (error) {
				console.warn(`Failed to read metadata for ${handle.name}:`, error);
			}
		}
	}
	
	return files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
};

const getFileFromOPFS = async (fileId: string): Promise<File | null> => {
	const root = await getOPFSRoot();
	const fileHandle = await root.getFileHandle(`${fileId}.pdf`);
	return await fileHandle.getFile();
};

const updateFileMetadataInOPFS = async (fileId: string, updatedMetadata: UploadedFileData): Promise<void> => {
	const root = await getOPFSRoot();
	const metadataHandle = await root.getFileHandle(`${fileId}.meta.json`, { create: false });
	const writable = await metadataHandle.createWritable();
	await writable.write(JSON.stringify(updatedMetadata));
	await writable.close();
};

const deleteFileFromOPFS = async (fileId: string): Promise<void> => {
	const root = await getOPFSRoot();
	
	// Delete both the file and its metadata
	await Promise.all([
		root.removeEntry(`${fileId}.pdf`).catch(() => {}),
		root.removeEntry(`${fileId}.meta.json`).catch(() => {})
	]);
};

const clearAllFilesFromOPFS = async (): Promise<void> => {
	const root = await getOPFSRoot();
	
	// Get all files and delete them
	const filesToDelete: string[] = [];
	for await (const handle of (root as any).values()) {
		if (handle.name.endsWith('.pdf') || handle.name.endsWith('.meta.json')) {
			filesToDelete.push(handle.name);
		}
	}
	
	// Delete all files in parallel
	await Promise.all(
		filesToDelete.map(name => 
			root.removeEntry(name).catch(() => {})
		)
	);
};

// SessionStorage fallback operations
const saveFileToSessionStorage = (files: UploadedFileData[]): void => {
	sessionStorage.setItem('uploaded-files', JSON.stringify(files));
};

const getFilesFromSessionStorage = (): UploadedFileData[] => {
	const saved = sessionStorage.getItem('uploaded-files');
	return saved ? JSON.parse(saved) : [];
};

const clearSessionStorage = (): void => {
	sessionStorage.removeItem('uploaded-files');
};

export const useFileStorage = (): UseFileStorageReturn => {
	const [files, setFiles] = useState<UploadedFileData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const supportsOPFS = isOPFSSupported();

	// Load files on mount
	const refreshFiles = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		
		try {
			let loadedFiles: UploadedFileData[];
			
			if (supportsOPFS) {
				loadedFiles = await getUploadedFilesFromOPFS();
			} else {
				loadedFiles = getFilesFromSessionStorage();
			}
			
			setFiles(loadedFiles);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
			setError(errorMessage);
			console.error('Failed to load files:', err);
		} finally {
			setIsLoading(false);
		}
	}, [supportsOPFS]);

	useEffect(() => {
		refreshFiles();
	}, [refreshFiles]);

	const uploadFile = useCallback(async (
		file: File, 
		metadata: Omit<UploadedFileData, 'id' | 'uploadedAt'>
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
				// For sessionStorage, we can only store metadata (not actual file data)
				const updatedFiles = [fileData, ...files];
				saveFileToSessionStorage(updatedFiles);
				setFiles(updatedFiles);
				return;
			}

			await refreshFiles();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
			setError(errorMessage);
			throw err;
		}
	}, [supportsOPFS, files, refreshFiles]);

	const deleteFile = useCallback(async (fileId: string) => {
		setError(null);
		
		try {
			if (supportsOPFS) {
				await deleteFileFromOPFS(fileId);
			} else {
				const updatedFiles = files.filter(f => f.id !== fileId);
				saveFileToSessionStorage(updatedFiles);
				setFiles(updatedFiles);
				return;
			}

			await refreshFiles();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
			setError(errorMessage);
			throw err;
		}
	}, [supportsOPFS, files, refreshFiles]);

	const updateFileMetadata = useCallback(async (fileId: string, updatedMetadata: UploadedFileData) => {
		setError(null);
		
		try {
			if (supportsOPFS) {
				await updateFileMetadataInOPFS(fileId, updatedMetadata);
			} else {
				const updatedFiles = files.map(f => f.id === fileId ? updatedMetadata : f);
				saveFileToSessionStorage(updatedFiles);
				setFiles(updatedFiles);
				return;
			}

			await refreshFiles();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to update file metadata';
			setError(errorMessage);
			throw err;
		}
	}, [supportsOPFS, files, refreshFiles]);

	const getFile = useCallback(async (fileId: string): Promise<File | null> => {
		setError(null);
		
		try {
			if (supportsOPFS) {
				return await getFileFromOPFS(fileId);
			} else {
				// SessionStorage fallback cannot store actual file data
				console.warn('File retrieval not supported with sessionStorage fallback');
				return null;
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to get file';
			setError(errorMessage);
			return null;
		}
	}, [supportsOPFS]);

	const clearAllFiles = useCallback(async () => {
		setError(null);
		
		try {
			if (supportsOPFS) {
				await clearAllFilesFromOPFS();
			} else {
				clearSessionStorage();
				setFiles([]);
				return;
			}

			await refreshFiles();
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Failed to clear files';
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

export type { UploadedFileData }; 