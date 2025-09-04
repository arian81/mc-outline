import Fuse from "fuse.js";
import courseMapping from "@/data/course_mapping.json";
import { type CourseData, coursesSearchSchema } from "@/schema";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

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

const fuse = new Fuse(coursesData, fuseOptions);

export const coursesRouter = createTRPCRouter({
  search: publicProcedure.input(coursesSearchSchema).query(({ input }) => {
    const { query, limit } = input;

    const results = fuse.search(query);

    return results.slice(0, limit).map((result) => ({
      ...result.item,
      score: result.score,
    }));
  }),
});
