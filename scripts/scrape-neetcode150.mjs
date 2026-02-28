import { writeFile } from "node:fs/promises";
import { URL } from "node:url";

const SOURCE_URL = "https://neetcode.io/practice/practice/neetcode150";

const PATTERN_SLUG_OVERRIDES = {
  "Arrays & Hashing": "arrays_hashing",
  "Two Pointers": "two_pointers",
  "Sliding Window": "sliding_window",
  "Binary Search": "binary_search",
  "Linked List": "linked_list",
  "Heap / Priority Queue": "heap_priority_queue",
  "Advanced Graphs": "advanced_graphs",
  "1-D Dynamic Programming": "dp_1d",
  "2-D Dynamic Programming": "dp_2d",
  "Bit Manipulation": "bit_manipulation",
  "Math & Geometry": "math_geometry"
};

const slugifyPattern = (pattern) => {
  if (PATTERN_SLUG_OVERRIDES[pattern]) {
    return PATTERN_SLUG_OVERRIDES[pattern];
  }
  return pattern
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const fetchText = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CodeTrainer/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const extractMainScriptUrl = (html) => {
  const matches = [...html.matchAll(/<script[^>]+src="([^"]*main[^\"]+\.js)"/g)];
  if (matches.length === 0) {
    throw new Error("Unable to locate main.*.js script in NeetCode HTML.");
  }
  return matches[0][1];
};

const extractProblemObjects = (jsText) => {
  const listStart = jsText.indexOf("ce=[{problem:");
  if (listStart === -1) {
    throw new Error("Unable to locate problem list in NeetCode script.");
  }

  let index = listStart + 3; // position on '['
  let depth = 0;
  let inString = false;
  let escape = false;
  let listEnd = -1;

  for (; index < jsText.length; index += 1) {
    const char = jsText[index];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "[") {
      depth += 1;
      continue;
    }

    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        listEnd = index;
        break;
      }
    }
  }

  if (listEnd === -1) {
    throw new Error("Unable to parse problem list array boundaries.");
  }

  const listContent = jsText.slice(listStart + 3 + 1, listEnd);
  const objects = [];
  let objStart = -1;
  depth = 0;
  inString = false;
  escape = false;

  for (let i = 0; i < listContent.length; i += 1) {
    const char = listContent[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) {
        objStart = i;
      }
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && objStart !== -1) {
        objects.push(listContent.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }

  return objects;
};

const parseProblem = (objectText) => {
  const getString = (key) => {
    const regex = new RegExp(`${key}:"(.*?)"`);
    const match = objectText.match(regex);
    return match ? match[1] : null;
  };
  return {
    title: getString("problem"),
    pattern: getString("pattern"),
    difficulty: getString("difficulty"),
    link: getString("link"),
    isNeetCode150: objectText.includes("neetcode150:!0")
  };
};

const main = async () => {
  const html = await fetchText(SOURCE_URL);
  const mainScriptSrc = extractMainScriptUrl(html);
  const mainScriptUrl = new URL(mainScriptSrc, new URL("/", SOURCE_URL)).toString();
  const jsText = await fetchText(mainScriptUrl);
  const objects = extractProblemObjects(jsText);
  const problems = objects
    .map(parseProblem)
    .filter((problem) => problem.isNeetCode150 && problem.title && problem.pattern)
    .map(({ isNeetCode150, ...rest }) => rest);

  const patternCounts = new Map();
  problems.forEach((problem) => {
    const count = patternCounts.get(problem.pattern) ?? 0;
    patternCounts.set(problem.pattern, count + 1);
  });

  const patterns = Array.from(patternCounts.entries())
    .map(([pattern, count]) => ({
      id: slugifyPattern(pattern),
      label: pattern,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const output = {
    generatedAt: new Date().toISOString(),
    source: SOURCE_URL,
    sourceScript: mainScriptUrl,
    problems,
    patterns
  };

  const fileContent = `export const NEETCODE_150 = ${JSON.stringify(output, null, 2)} as const;\n`;
  await writeFile(new URL("../src/core/neetcode150.ts", import.meta.url), fileContent);
  console.log("Wrote src/core/neetcode150.ts with", problems.length, "problems.");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
