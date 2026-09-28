import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { createPdfReport, createExcelReport } from "../src/services/reportExports.js";

const updatedAt = new Date("2026-09-28T08:00:00Z");
const sections = [
  { title: "Recruitment overview", text: "The “Peña” position has 2 applicants." },
  { title: "Applicant sources", text: "A recorded source has one applicant. ".repeat(500) },
  { title: "Records needing attention", text: "=This is narrative text, not a formula." },
];

test("PDF export produces a paginated PDF for long narrative reports", async () => {
  const blob = await createPdfReport(sections, updatedAt);
  const bytes = Buffer.from(await blob.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok((bytes.toString("latin1").match(/\/Type \/Page\b/g) || []).length > 1);
});

test("Excel export preserves narrative text without tables or formulas", async () => {
  const blob = await createExcelReport(sections, updatedAt);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await blob.arrayBuffer());
  const sheet = workbook.getWorksheet("Recruitment report");
  assert.equal(sheet.views[0].showGridLines, false);
  assert.equal(sheet.getTables().length, 0);
  const texts = [];
  sheet.eachRow((row) => {
    assert.equal(typeof row.getCell(1).value, "string");
    assert.equal(row.getCell(1).alignment.wrapText, true);
    assert.ok(row.height <= 409);
    texts.push(row.getCell(1).value);
  });
  const combined = texts.join("");
  sections.forEach(({ title, text }) => {
    assert.ok(combined.includes(title));
    assert.ok(combined.includes(text));
  });
});
