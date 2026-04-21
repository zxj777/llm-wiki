#!/usr/bin/env tsx

import { printLintResult, runLint } from "./lint-lib.js";

const wikiDir = process.argv[2] || "wiki";
const result = runLint(wikiDir);

printLintResult(result);
process.exit(result.errors > 0 ? 1 : 0);
