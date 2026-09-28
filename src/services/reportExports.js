export async function createPdfReport(sections, updatedAt) {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ]);
  pdfMake.addVirtualFileSystem(fonts);
  return pdfMake.createPdf({
    info: { title: "Recruitment report", author: "Rural Bank of Medina, Inc" },
    pageSize: "A4",
    pageMargins: [48, 48, 48, 48],
    defaultStyle: { fontSize: 11, lineHeight: 1.35, color: "#334155" },
    content: [
      { text: "Rural Bank of Medina, Inc", fontSize: 10, color: "#64748b" },
      { text: "Recruitment report", fontSize: 24, bold: true, color: "#294f3e", margin: [0, 8, 0, 12] },
      { text: `All available records. Updated ${updatedAt.toLocaleString()}.`, fontSize: 9, margin: [0, 0, 0, 20] },
      ...sections.flatMap(({ title, text }) => [
        { text: title, bold: true, fontSize: 13, color: "#294f3e", margin: [0, 12, 0, 6], headlineLevel: 1 },
        { text },
      ]),
    ],
    pageBreakBefore: (node, container) => node.headlineLevel === 1 && !container.getFollowingNodesOnPage().length,
    footer: (page, total) => ({ text: `Page ${page} of ${total}`, alignment: "center", fontSize: 9, color: "#64748b" }),
  }).getBlob();
}

export async function createExcelReport(sections, updatedAt) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Rural Bank of Medina, Inc";
  workbook.created = updatedAt;
  const sheet = workbook.addWorksheet("Recruitment report", {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.getColumn(1).width = 100;
  function addText(text, heading = false) {
    // Short chunks keep long narrative sections within Excel's cell and row limits.
    const chunks = text.match(/[\s\S]{1,500}(?:\s|$)|[\s\S]{1,500}/g) || [""];
    chunks.forEach((chunk) => {
      const row = sheet.addRow([chunk]);
      row.font = { name: "Calibri", size: heading ? 14 : 11, bold: heading, color: { argb: heading ? "FF294F3E" : "FF334155" } };
      row.alignment = { wrapText: true, vertical: "top" };
      row.height = heading ? 30 : Math.max(30, Math.ceil(chunk.length / 85) * 18 + 18);
    });
  }
  addText("Recruitment report", true);
  addText("Rural Bank of Medina, Inc");
  addText(`All available records. Updated ${updatedAt.toLocaleString()}.`);
  sections.forEach(({ title, text }) => {
    sheet.addRow([]);
    addText(title, true);
    addText(text);
  });
  return new Blob([await workbook.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function saveReport(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
