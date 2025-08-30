import { type ClassValue, clsx } from "clsx";
import { err, ok, type Result } from "neverthrow";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Parses a course code like "MATH123", "COMPSCI1XC3", or "MATH 123" into major and code components
 * @param courseCode - The course code to parse (e.g., "MATH123", "COMPSCI1XC3", "CS101")
 * @returns Object with major and code properties
 */
export function parseCourseCode(
	courseCode: string,
): Result<{ major: string; code: string }, Error> {
	const normalized = courseCode.trim();
	const match = normalized.match(/^([A-Z]+)\s?([0-9]{1}[A-Z]{2}[0-9]{1})$/i);

	if (match?.[1] && match?.[2]) {
		return ok({
			major: match[1].toUpperCase(),
			code: match[2].toUpperCase(),
		});
	}

	return err(
		new Error(
			`Invalid course code format: "${courseCode}". Expected format like "MATH123" or "COMPSCI1XC3".`,
		),
	);
}
