import fs from "node:fs/promises";
import { DOMParser } from "@xmldom/xmldom";

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

(async () => {
  const BASE_URL = "https://mytimetable.mcmaster.ca/api/courses/suggestions";
  const PARAMS = {
    term: "3202530",
    cams: "MCMSTiMHK_MCMSTiCON_MCMSTiMCMST_MCMSTiSNPOL_MCMSTiOFF",
    course_add: "+",
  };

  const courseMapping: Record<string, string> = {};
  let totalCourses = 0;

  for (let page = 1; ; page++) {
    const url = new URL(BASE_URL);
    // Set all parameters except course_add normally
    Object.entries({ ...PARAMS, page_num: String(page) }).forEach(([k, v]) => {
      if (k !== "course_add") {
        url.searchParams.set(k, v);
      }
    });
    // Manually append course_add to preserve the literal + character
    url.search += "&course_add=+";

    console.log(`Fetching page ${page}...`);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Failed to fetch page ${page}: ${res.status}`);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Check if we've hit an empty page
    const addSuggestElement = xmlDoc.getElementsByTagName("add_suggest")[0];
    const resultCount = addSuggestElement?.textContent?.trim();

    if (resultCount === "0") {
      console.log(`No more results on page ${page}, stopping.`);
      break;
    }

    // Extract course data from <rs> elements
    const rsElements = xmlDoc.getElementsByTagName("rs");
    const coursesOnPage: string[] = [];

    for (let i = 0; i < rsElements.length; i++) {
      const rsElement = rsElements[i];
      if (!rsElement) continue;

      const courseCode = rsElement.textContent?.trim();
      const infoAttr = rsElement.getAttribute("info");

      if (courseCode && infoAttr) {
        // Parse the info attribute to extract course description
        // Format: "(term info)<br/>Course Description"
        const decodedInfo = infoAttr
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&");

        // Extract description after the <br/> tag
        const brIndex = decodedInfo.indexOf("<br/>");
        const description =
          brIndex !== -1
            ? decodedInfo.substring(brIndex + 5).trim()
            : decodedInfo.trim();

        if (description) {
          courseMapping[courseCode] = description;
          coursesOnPage.push(courseCode);
        }
      }
    }

    console.log(`Page ${page}: ${coursesOnPage.length} courses found`);
    totalCourses += coursesOnPage.length;

    // Add a small delay to be respectful to the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  await fs.writeFile(
    "src/data/course_mapping.json",
    JSON.stringify(courseMapping, null, 2),
  );
  console.log(`Scraping completed! Total courses: ${totalCourses}`);
  console.log("Mapping saved to src/data/course_mapping.json");
})();
