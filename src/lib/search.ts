import Fuse from "fuse.js";
import courseMapping from "@/data/course_mapping.json";
import type { CourseData } from "@/schema";

// Transform course mapping data to CourseData format
const coursesData: CourseData[] = Object.entries(courseMapping).map(
  ([courseCode, courseName], index) => {
    const major = courseCode.split(" ")[0] || "";

    return {
      id: `${index}`,
      course_code: courseCode,
      name: courseName,
      major,
    };
  },
);

const fuseOptions = {
  keys: [
    { name: "course_code", weight: 0.4 },
    { name: "name", weight: 0.4 },
    { name: "major", weight: 0.2 },
  ],
  threshold: 0.4, // Adjust for search sensitivity (0.0 = exact match, 1.0 = very fuzzy)
  includeScore: true,
  minMatchCharLength: 2,
};

export function useFuzzySearch(query: string, limit = 20) {
  const fuse = new Fuse(coursesData, fuseOptions);

  if (!query || query.length < 2) {
    return { results: [], total: 0 };
  }

  const allResults = fuse.search(query);
  const mappedResults = allResults.map((result) => ({
    ...result.item,
    score: result.score,
  }));

  return {
    results: mappedResults.slice(0, limit),
    total: mappedResults.length, 
  };
}
