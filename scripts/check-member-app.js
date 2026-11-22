import { readFileSync } from "node:fs";

const html = readFileSync("member-app/index.html", "utf8");
const worker = readFileSync("member-app/worker.js", "utf8");
const website = readFileSync("public/app.js", "utf8");
const workerSource = readFileSync("src/index.js", "utf8");

const scripts = [...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)]
  .map((match) => match[1])
  .filter((source) => source.trim().length > 0);

if (scripts.length === 0) {
  throw new Error("No inline JavaScript was found in member-app/index.html.");
}

for (const [index, script] of scripts.entries()) {
  try {
    new Function(script);
  } catch (error) {
    console.error("Member-app inline JavaScript " + (index + 1) + " has a syntax error:");
    throw error;
  }
}

const requiredPages = [
  "home", "programmes", "activity", "progress", "assets", "messages", "account",
  "adminProgrammes", "adminClients", "adminMessages", "adminAssessments",
  "adminFeedback", "adminLibrary", "adminPayments"
];
const pageIds = new Set([...html.matchAll(/\\bid="([^"]+Page)"/g)].map((match) => match[1]));
for (const page of requiredPages) {
  if (!pageIds.has(page + "Page")) {
    throw new Error("Missing required member/admin page: " + page + "Page");
  }
}

const requiredAdminFeatures = [
  "adminMessages:loadAdminMessages",
  "adminAssessments:loadAssessments",
  "adminProgrammes:loadProgrammeList",
  "adminClients:loadClients",
  "adminFeedback:loadFeedback",
  "adminLibrary:loadLibrary",
  "adminPayments:loadCommerce",
  "window.sendAdminReply",
  "window.updateAssessmentStatus",
  "window.publishProgramme",
  "window.createAssignment"
];
for (const feature of requiredAdminFeatures) {
  if (!html.includes(feature)) {
    throw new Error("Missing required admin feature wiring: " + feature);
  }
}

for (const code of ["START", "PROGRESS", "PERFORMANCE", "DIGITAL", "ESSENTIAL", "PLUS", "ELITE"]) {
  if (!website.includes(code + ":{name:'" + code + "'")) {
    throw new Error("Website package configuration is missing " + code);
  }
}

if (!worker.includes("atob(") || !worker.includes("DecompressionStream") || !worker.includes("manifest.webmanifest")) {
  throw new Error("Member Worker bundle is missing its compressed app, PWA manifest or shell handler.");
}
if (!html.includes("claim_my_ftriva_entitlements") || !html.includes("createSignedUrl") || !html.includes("exercise_feedback")) {
  throw new Error("Member portal is missing entitlement, download or exercise-feedback integration.");
}
if (!workerSource.includes("RESEND_API_KEY") || !workerSource.includes("sendFtrivaPurchaseEmails")) {
  throw new Error("Website Worker is missing its transactional email integration.");
}

console.log("FTRIVA member/admin portal checks passed: " + scripts.length + " inline scripts, " + requiredPages.length + " pages and required feature wiring.");
