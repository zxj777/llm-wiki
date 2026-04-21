#!/usr/bin/env tsx

import { searchWiki, printSearchResults } from "./search-lib.js";

const args = process.argv.slice(2);
let query = "";
let pageType = "";
let maxResults = 10;
let searchRaw = false;
let titleOnly = false;
let tagsOnly = false;
let jsonOutput = false;

for (let index = 0; index < args.length; index++) {
  switch (args[index]) {
    case "-t":
    case "--type":
      pageType = args[++index];
      break;
    case "-n":
    case "--max":
      maxResults = parseInt(args[++index], 10);
      break;
    case "-a":
    case "--all":
      searchRaw = true;
      break;
    case "--titles":
      titleOnly = true;
      break;
    case "--tags":
      tagsOnly = true;
      break;
    case "--json":
      jsonOutput = true;
      break;
    default:
      if (!args[index].startsWith("-")) query = args[index];
  }
}

if (!query) {
  console.error("用法: pnpm wiki:search <query> [options]");
  process.exit(1);
}

const results = searchWiki({
  query,
  pageType,
  maxResults,
  searchRaw,
  titleOnly,
  tagsOnly,
});

if (jsonOutput) {
  console.log(JSON.stringify(results, null, 2));
} else {
  printSearchResults(query, results, { pageType, searchRaw });
}
