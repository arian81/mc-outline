import fs from "node:fs/promises";
import * as cheerio from "cheerio";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

(async () => {
	const BASE_URL = "https://academiccalendars.romcmaster.ca/content.php";
	const PARAMS = {
		catoid: "53",
		navoid: "10775",
		"filter[item_type]": "3",
		"filter[only_active]": "1",
		"filter[3]": "1",
	};

	const allTitles: string[] = [];
	const courseMapping: Record<string, string> = {};

	for (let page = 1; ; page++) {
		const url = new URL(BASE_URL);
		Object.entries({ ...PARAMS, "filter[cpage]": String(page) }).forEach(
			([k, v]) => {
				url.searchParams.set(k, v);
			},
		);

		const res = await fetch(url.toString());
		if (!res.ok) throw new Error(`Failed to fetch page ${page}`);
		const html = await res.text();
		const $ = cheerio.load(html);

		const table = $(".table_default");
		const titles: string[] = [];
		table.find("tr td.width > a").each((_, el) => {
			const title = $(el)
				.text()
				.trim()
				.replace(/\u2019/g, "'");
			if (title === "") return;
			titles.push(title);
		});
		if (titles.length === 0) {
			console.log(`No titles found on page ${page}, stopping.`);
			break;
		}

		console.log(`Page ${page}: ${titles.length} titles`);

		titles.forEach((title) => {
			const [courseCode, courseName] = title.split(" - ").map((s) => s.trim());
			if (courseCode && courseName) {
				const [prefix, number] = courseCode.split(" ");
				if (prefix && number) {
					courseMapping[`${prefix} ${number}`] = courseName;
				}
			}
		});
		allTitles.push(...titles);
	}

	await fs.writeFile(
		"src/data/course_mapping.json",
		JSON.stringify(courseMapping, null, 2),
	);
	console.log("Mapping saved to src/data/course_mapping.json");
})();
