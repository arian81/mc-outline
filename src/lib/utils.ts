import { type ClassValue, clsx } from "clsx";
import { err, ok, type Result } from "neverthrow";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Parses a course code in "COMPSCI 1XC3" format by removing whitespace
 * @param courseCode - The course code to parse (e.g., "COMPSCI 1XC3")
 * @returns Object with major and code properties
 */
export function parseCourseCode(
	courseCode: string,
): Result<{ major: string; code: string }, Error> {
	const parts = courseCode.trim().split(" ");

	if (parts.length === 2 && parts[0] && parts[1]) {
		return ok({
			major: parts[0].toUpperCase(),
			code: parts[1].toUpperCase(),
		});
	}

	return err(
		new Error(
			`Invalid course code format: "${courseCode}". Expected format like "COMPSCI 1XC3".`,
		),
	);
}
