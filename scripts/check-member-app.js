import { readFileSync } from "node:fs";

const html = readFileSync("member-app/index.html", "utf8");
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim().length > 0);

if (scripts.length === 0) {
  throw new Error("No inline JavaScript was found in member-app/index.html.");
}

for (const [index, source] of scripts.entries()) {
  try {
    new Function(source);
  } catch (error) {
    console.error("Member-app inline script " + (index + 1) + " has a syntax error:");
    throw error;
  }
}

console.log("Member-app inline JavaScript syntax check passed (" + scripts.length + " scripts).");
