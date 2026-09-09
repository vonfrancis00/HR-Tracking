/*******************************************************
 * APPLICANT TRACKING SYSTEM - GOOGLE APPS SCRIPT BACKEND
 * Backend: Google Sheets + Google Apps Script
 *
 * Spreadsheet sheets:
 * Applicants
 * Initial_Screening
 * Initial_Interview
 * Final_Interview
 * Employment_Processing
 * Background_Checking
 * Status_History
 * Users
 * Settings
 *
 * IMPORTANT:
 * 1. Put this Code.gs inside the Apps Script project
 *    attached to the HR_Tracking Google Spreadsheet.
 * 2. The script uses the sheet names and headers from the
 *    HR_Tracking template.
 * 3. Applicant ID is the key connecting all stage sheets.
 *******************************************************/

const CONFIG = {
  // HR_Tracking Google Spreadsheet ID
  spreadsheetId: "1y_raqNSxmEEJbE358t0dIo5D4miRWquXZhV0lT-a3vM",

  // Philippines timezone
  timezone: "Asia/Manila",

  sheets: {
    applicants: "Applicants",
    screening: "Initial_Screening",
    initialInterview: "Initial_Interview",
    finalInterview: "Final_Interview",
    employment: "Employment_Processing",
    background: "Background_Checking",
    history: "Status_History",
    users: "Users",
    settings: "Settings"
  }
};

const HEADERS = {
  Applicants: [
    "Applicant ID","Applicant Name","Contact Number","Email Address",
    "Position Applied For","Date Applied","Source","Current Status",
    "Created At","Updated At","Created By","Updated By"
  ],

  Initial_Screening: [
    "Screening ID","Applicant ID","Screening Date","Basic Qualifications",
    "Relevant Experience","Education","Initial Screening Result",
    "Remarks","Screened By","Created At","Updated At"
  ],

  Initial_Interview: [
    "Interview ID","Applicant ID","Interview Date","Interview Mode",
    "Interview Result","Key Observations","Recommended Position",
    "HR Recommendation","Date Recommended","Interviewed By",
    "Created At","Updated At"
  ],

  Final_Interview: [
    "Final Interview ID","Applicant ID","Hiring Head","Endorsement Date",
    "Final Interview Date","Final Interview Result","Hiring Decision",
    "Date of Decision","Remarks","Processed By","Created At","Updated At"
  ],

  Employment_Processing: [
    "Processing ID","Applicant ID","Hiring Approval Date","Employment Status",
    "Requirements Status","Missing Requirements","Target Completion Date",
    "Actual Completion Date","Processed By","Created At","Updated At"
  ],

  Background_Checking: [
    "Background Check ID","Applicant ID","Background Check Date","Status",
    "Result","Date Completed","Remarks","Checked By","Created At","Updated At"
  ],

  Status_History: [
    "History ID","Applicant ID","Old Status","New Status",
    "Changed Date","Changed By","Remarks"
  ],

  Users: [
    "User ID","Full Name","Email","Role","Department","Status","Created At"
  ],

  Settings: [
    "Status","Source","Interview Mode","Interview Result","Hiring Decision",
    "Basic Qualifications","Relevant Experience","Education","HR Recommendation",
    "Employment Status","Requirements Status","Background Status",
    "Background Result","Final Interview Result","Screening Result",
    "User Status","Role"
  ]
};

/* ======================================================
 * SHEET / RESPONSE HELPERS
 * ====================================================== */

function getSpreadsheet_() {
  const spreadsheetId = clean_(CONFIG.spreadsheetId);

  if (!spreadsheetId) {
    throw new Error(
      "HR_Tracking Spreadsheet ID is not configured."
    );
  }

  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);

    if (!ss) {
      throw new Error(
        "Spreadsheet could not be opened."
      );
    }

    return ss;

  } catch (err) {
    throw new Error(
      "Unable to access the HR_Tracking spreadsheet. " +
      "Make sure the Google account running this Apps Script " +
      "has access to the spreadsheet. " +
      "Original error: " +
      err.message
    );
  }
}

function getSheet_(sheetName) {
  if (!sheetName) {
    throw new Error("Sheet name is required.");
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(
      "Sheet not found in HR_Tracking: " + sheetName
    );
  }

  return sheet;
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      data: data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error_(message, code) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: message,
      code: code || "ERROR"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function now_() {
  return new Date();
}

function formatDate_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, CONFIG.timezone, "yyyy-MM-dd");
  }
  return String(value);
}

function formatDateTime_(value) {
  if (!value) return "";
  if (Object.prototype.toString.call(value) === "[object Date]") {
    return Utilities.formatDate(value, CONFIG.timezone, "yyyy-MM-dd HH:mm:ss");
  }
  return String(value);
}

function clean_(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeKey_(value) {
  return clean_(value).toLowerCase();
}

function currentUser_() {
  try {
    const email = Session.getActiveUser().getEmail();

    if (email) {
      return email;
    }

    return "System";

  } catch (err) {
    return "System";
  }
}

function generateId_(prefix) {
  return prefix + "-" + Utilities.getUuid();
}

// Run manually once after replacing the old script. Only blank primary IDs
// are filled. Existing IDs and Applicant ID links in child sheets stay intact.
function repairMissingRecordIds() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const prefixes = {
      Applicants: "APP", Initial_Screening: "SCR", Initial_Interview: "INT",
      Final_Interview: "FIN", Employment_Processing: "EMP",
      Background_Checking: "BGC", Status_History: "HIST", Users: "USR"
    };
    const changes = [];
    const unlinkedRows = [];
    const skippedSheets = [];
    Object.keys(prefixes).forEach(function(sheetName) {
      const sheet = getSheet_(sheetName);
      if (sheet.getLastRow() < 2) return;
      const width = sheet.getLastColumn();
      const headers = sheet.getRange(1, 1, 1, width).getValues()[0];
      const normalized = headers.map(function(header) {
        return normalizeKey_(header).replace(/[\s_]+/g, "");
      });
      const idHeader = normalizeKey_(HEADERS[sheetName][0]).replace(/\s+/g, "");
      const idIndex = normalized.indexOf(idHeader);
      const applicantIndex = normalized.indexOf("applicantid");
      if (idIndex < 0 || normalized.lastIndexOf(idHeader) !== idIndex ||
          (sheetName !== "Applicants" && sheetName !== "Users" &&
           (applicantIndex < 0 || normalized.lastIndexOf("applicantid") !== applicantIndex))) {
        skippedSheets.push({ sheet: sheetName, reason: "Missing or ambiguous ID headers", headers: headers });
        return;
      }
      const seen = new Set();
      sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues()
        .forEach(function(row, index) {
          if (!row.some(function(value) { return clean_(value) !== ""; })) return;
          const id = clean_(row[idIndex]);
          if (id && seen.has(id)) {
            throw new Error("Duplicate ID in " + sheetName + " at row " + (index + 2) + ". Resolve it manually before repair.");
          }
          if (id) seen.add(id);
          else changes.push({ sheet: sheet, sheetName: sheetName, row: index + 2, column: idIndex + 1, id: generateId_(prefixes[sheetName]) });
          if (sheetName !== "Applicants" && sheetName !== "Users" && !clean_(row[applicantIndex])) {
            unlinkedRows.push({ sheet: sheetName, row: index + 2 });
          }
        });
    });
    changes.forEach(function(change) {
      change.sheet.getRange(change.row, change.column).setValue(change.id);
    });
    const result = {
      repaired: changes.map(function(change) { return { sheet: change.sheetName, row: change.row, id: change.id }; }),
      unlinkedRows: unlinkedRows,
      skippedSheets: skippedSheets,
      note: "Child rows with blank Applicant ID need manual matching; their original relationship cannot be inferred."
    };
    console.log(JSON.stringify(result, null, 2));
    return result;
  } finally {
    lock.releaseLock();
  }
}

/* ======================================================
 * HEADER / ROW HELPERS
 * ====================================================== */

function ensureHeaders_(sheetName) {
  const sheet = getSheet_(sheetName);
  const expected = HEADERS[sheetName];

  if (!expected) throw new Error("No header configuration for " + sheetName);

  const lastColumn = Math.max(sheet.getLastColumn(), expected.length);
  const existing = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];

  const existingNormalized = existing
    .slice(0, expected.length)
    .map(normalizeKey_);

  const expectedNormalized = expected.map(normalizeKey_);

  const exact =
    existingNormalized.length === expectedNormalized.length &&
    expectedNormalized.every((h, i) => existingNormalized[i] === h);

  if (!exact) {
    if (sheet.getLastRow() > 1) {
      throw new Error("Header mismatch in " + sheetName + ". Align columns with HEADERS before using this sheet; existing headers were not overwritten.");
    }
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
  }

  return sheet;
}

function headers_(sheetName) {
  const sheet = ensureHeaders_(sheetName);
  return HEADERS[sheetName].slice();
}

function rows_(sheetName) {
  const sheet = ensureHeaders_(sheetName);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  return sheet
    .getRange(2, 1, lastRow - 1, HEADERS[sheetName].length)
    .getValues();
}

function rowToObject_(sheetName, row) {
  const headers = HEADERS[sheetName];
  const obj = {};

  headers.forEach(function(header, index) {
    let value = row[index];

    if (value instanceof Date) {
      if (header === "Created At" ||
          header === "Updated At" ||
          header === "Changed Date") {
        value = formatDateTime_(value);
      } else {
        value = formatDate_(value);
      }
    }

    obj[headerToKey_(header)] = value;
  });

  return obj;
}

function objects_(sheetName) {
  return rows_(sheetName).map(function(row) {
    return rowToObject_(sheetName, row);
  });
}

function headerToKey_(header) {
  return header
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .split(/\s+/)
    .map(function(part, index) {
      part = part.toLowerCase();
      return index === 0
        ? part.charAt(0).toLowerCase() + part.slice(1)
        : part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function objectToRow_(sheetName, data) {
  return HEADERS[sheetName].map(function(header) {
    const key = headerToKey_(header);
    return data[key] !== undefined && data[key] !== null
      ? data[key]
      : "";
  });
}

function findRowById_(sheetName, id) {
  const sheet = ensureHeaders_(sheetName);
  const idColumn = 1;
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return -1;

  const ids = sheet
    .getRange(2, idColumn, lastRow - 1, 1)
    .getValues();

  for (let i = 0; i < ids.length; i++) {
    if (clean_(ids[i][0]) === clean_(id)) {
      return i + 2;
    }
  }

  return -1;
}

function findObjectById_(sheetName, id) {
  const rowNumber = findRowById_(sheetName, id);
  if (rowNumber < 0) return null;

  const sheet = getSheet_(sheetName);
  const row = sheet
    .getRange(rowNumber, 1, 1, HEADERS[sheetName].length)
    .getValues()[0];

  return rowToObject_(sheetName, row);
}

function appendObject_(sheetName, data) {
  const sheet = ensureHeaders_(sheetName);
  const row = objectToRow_(sheetName, data);
  sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
}

function updateObject_(sheetName, id, data) {
  const rowNumber = findRowById_(sheetName, id);
  if (rowNumber < 0) {
    throw new Error("Record not found: " + id);
  }

  const sheet = getSheet_(sheetName);
  const row = objectToRow_(sheetName, data);
  sheet.getRange(rowNumber, 1, 1, row.length).setValues([row]);

  return rowToObject_(sheetName, row);
}

function deleteObject_(sheetName, id) {
  const rowNumber = findRowById_(sheetName, id);
  if (rowNumber < 0) {
    throw new Error("Record not found: " + id);
  }

  getSheet_(sheetName).deleteRow(rowNumber);
  return true;
}

/* ======================================================
 * GET API
 *
 * Examples:
 * ?action=getApplicants
 * ?action=getApplicant&applicantId=APP-...
 * ?action=getDashboard
 * ?action=getApplicantDetails&applicantId=APP-...
 * ?action=getSettings
 * ====================================================== */

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = clean_(p.action || "getApplicants");

    switch (action) {
      case "setup":
        return json_(setupSheets());

      case "getApplicants":
        return json_(getApplicants());

      case "getApplicant":
        return json_(getApplicant(p.applicantId));

      case "getApplicantDetails":
        return json_(getApplicantDetails(p.applicantId));

      case "getDashboard":
      case "getDashboardData":
        return json_(getDashboardData());

      case "getInitialScreening":
        return json_(getStageRecords_("Initial_Screening", p.applicantId));

      case "getInitialInterview":
        return json_(getStageRecords_("Initial_Interview", p.applicantId));

      case "getFinalInterview":
        return json_(getStageRecords_("Final_Interview", p.applicantId));

      case "getEmploymentProcessing":
        return json_(getStageRecords_("Employment_Processing", p.applicantId));

      case "getBackgroundChecking":
        return json_(getStageRecords_("Background_Checking", p.applicantId));

      case "getStatusHistory":
        return json_(getStageRecords_("Status_History", p.applicantId));

      case "getUsers":
        return json_(objects_("Users"));

      case "getSettings":
        return json_(getSettings());

      default:
        return error_("Unknown action: " + action, "UNKNOWN_ACTION");
    }
  } catch (err) {
    console.error(err);
    return error_(err.message || String(err), "SERVER_ERROR");
  }
}

/* ======================================================
 * POST API
 *
 * The frontend can send JSON or form data.
 * Supported actions:
 * createApplicant
 * updateApplicant
 * deleteApplicant
 * saveInitialScreening
 * saveInitialInterview
 * saveFinalInterview
 * saveEmploymentProcessing
 * saveBackgroundChecking
 * updateApplicantStatus
 * deleteStageRecord
 * ====================================================== */

function doPost(e) {
  try {
    const payload = parsePost_(e);
    const action = clean_(payload.action);

    switch (action) {
      case "createApplicant":
        return json_(createApplicant(payload));

      case "updateApplicant":
        return json_(updateApplicant(payload));

      case "deleteApplicant":
        return json_(deleteApplicant(payload.applicantId));

      case "saveInitialScreening":
        return json_(saveInitialScreening(payload));

      case "saveInitialInterview":
        return json_(saveInitialInterview(payload));

      case "saveFinalInterview":
        return json_(saveFinalInterview(payload));

      case "saveEmploymentProcessing":
        return json_(saveEmploymentProcessing(payload));

      case "saveBackgroundChecking":
        return json_(saveBackgroundChecking(payload));

      case "updateApplicantStatus":
        return json_(updateApplicantStatus(payload));

      case "deleteStageRecord":
        return json_(deleteStageRecord(payload));

      default:
        return error_("Unknown POST action: " + action, "UNKNOWN_ACTION");
    }
  } catch (err) {
    console.error(err);
    return error_(err.message || String(err), "SERVER_ERROR");
  }
}

function parsePost_(e) {
  if (!e || !e.postData) return {};

  const type = e.postData.type || "";
  const body = e.postData.contents || "";

  if (type.indexOf("application/json") >= 0) {
    return JSON.parse(body || "{}");
  }

  if (body) {
    try {
      return JSON.parse(body);
    } catch (err) {
      return e.parameter || {};
    }
  }

  return e.parameter || {};
}

/* ======================================================
 * APPLICANTS
 * ====================================================== */

function getApplicants() {
  return objects_("Applicants").filter(function(applicant) {
    return Object.keys(applicant).some(function(key) {
      return clean_(applicant[key]) !== "";
    });
  });
}

function getApplicant(applicantId) {
  if (!applicantId) throw new Error("Applicant ID is required.");

  const applicant = findObjectById_("Applicants", applicantId);

  if (!applicant) {
    throw new Error("Applicant not found: " + applicantId);
  }

  return applicant;
}

function createApplicant(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    return createApplicantLocked_(data);
  } finally {
    lock.releaseLock();
  }
}

// Called under the script lock so simultaneous creates cannot share a sequence.
function nextApplicantId_(dateApplied) {
  const date = clean_(dateApplied);
  const parsed = new Date(date + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("A valid Date Applied is required (YYYY-MM-DD).");
  }
  const properties = PropertiesService.getScriptProperties();
  const key = "RBM_APPLICANT_SEQUENCE";
  let sequence = Number(properties.getProperty(key)) || 0;
  getApplicants().forEach(function(applicant) {
    const match = /^RBM-(\d+)-\d{8}$/.exec(clean_(applicant.applicantId));
    if (match) sequence = Math.max(sequence, Number(match[1]));
  });
  sequence += 1;
  properties.setProperty(key, String(sequence));
  return "RBM-" + String(sequence).padStart(4, "0") + "-" + date.replace(/-/g, "");
}

function createApplicantLocked_(data) {
  const name = clean_(data.applicantName);

  if (!name) {
    throw new Error("Applicant Name is required.");
  }

  const timestamp = now_();
  const user = clean_(data.createdBy) || currentUser_();
  const applicantId = nextApplicantId_(data.dateApplied);

  const applicant = {
    applicantId: applicantId,
    applicantName: name,
    contactNumber: clean_(data.contactNumber),
    emailAddress: clean_(data.emailAddress),
    positionAppliedFor: clean_(data.positionAppliedFor),
    dateApplied: clean_(data.dateApplied),
    source: clean_(data.source),
    currentStatus: clean_(data.currentStatus) || "New Applicant",
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: user,
    updatedBy: user
  };

  appendObject_("Applicants", applicant);

  // Initial status history
  appendObject_("Status_History", {
    historyId: generateId_("HIST"),
    applicantId: applicantId,
    oldStatus: "",
    newStatus: applicant.currentStatus,
    changedDate: timestamp,
    changedBy: user,
    remarks: "Applicant created."
  });

  return findObjectById_("Applicants", applicantId);
}

function updateApplicant(data) {
  const applicantId = clean_(data.applicantId);

  if (!applicantId) {
    throw new Error("Applicant ID is required.");
  }

  const existing = getApplicant(applicantId);
  const timestamp = now_();
  const user = clean_(data.updatedBy) || currentUser_();

  const updated = {
    applicantId: applicantId,
    applicantName: data.applicantName !== undefined ? clean_(data.applicantName) : existing.applicantName,
    contactNumber: data.contactNumber !== undefined ? clean_(data.contactNumber) : existing.contactNumber,
    emailAddress: data.emailAddress !== undefined ? clean_(data.emailAddress) : existing.emailAddress,
    positionAppliedFor: data.positionAppliedFor !== undefined ? clean_(data.positionAppliedFor) : existing.positionAppliedFor,
    dateApplied: data.dateApplied !== undefined ? clean_(data.dateApplied) : existing.dateApplied,
    source: data.source !== undefined ? clean_(data.source) : existing.source,
    currentStatus: data.currentStatus !== undefined ? clean_(data.currentStatus) : existing.currentStatus,
    createdAt: existing.createdAt,
    updatedAt: timestamp,
    createdBy: existing.createdBy,
    updatedBy: user
  };

  if (!updated.applicantName) {
    throw new Error("Applicant Name is required.");
  }

  const result = updateObject_("Applicants", applicantId, updated);

  if (existing.currentStatus !== updated.currentStatus) {
    logStatusChange_(
      applicantId,
      existing.currentStatus,
      updated.currentStatus,
      user,
      "Status changed while updating applicant."
    );
  }

  return result;
}

function deleteApplicant(applicantId) {
  if (!applicantId) throw new Error("Applicant ID is required.");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // Delete child records first.
    [
      "Initial_Screening",
      "Initial_Interview",
      "Final_Interview",
      "Employment_Processing",
      "Background_Checking",
      "Status_History"
    ].forEach(function(sheetName) {
      deleteAllByApplicantId_(sheetName, applicantId);
    });

    deleteObject_("Applicants", applicantId);

    return {
      applicantId: applicantId,
      deleted: true
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteAllByApplicantId_(sheetName, applicantId) {
  const sheet = ensureHeaders_(sheetName);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  const applicantIdColumn = 2;
  const values = sheet
    .getRange(2, applicantIdColumn, lastRow - 1, 1)
    .getValues();

  for (let i = values.length - 1; i >= 0; i--) {
    if (clean_(values[i][0]) === clean_(applicantId)) {
      sheet.deleteRow(i + 2);
    }
  }
}

/* ======================================================
 * APPLICANT DETAILS
 * ====================================================== */

function getApplicantDetails(applicantId) {
  const applicant = getApplicant(applicantId);

  return {
    applicant: applicant,
    initialScreening: getStageRecords_("Initial_Screening", applicantId),
    initialInterview: getStageRecords_("Initial_Interview", applicantId),
    finalInterview: getStageRecords_("Final_Interview", applicantId),
    employmentProcessing: getStageRecords_("Employment_Processing", applicantId),
    backgroundChecking: getStageRecords_("Background_Checking", applicantId),
    statusHistory: getStageRecords_("Status_History", applicantId)
  };
}

function getStageRecords_(sheetName, applicantId) {
  const records = objects_(sheetName);

  if (!applicantId) return records;

  return records.filter(function(record) {
    return clean_(record.applicantId) === clean_(applicantId);
  });
}

/* ======================================================
 * INITIAL SCREENING
 * ====================================================== */

function saveInitialScreening(data) {
  const applicantId = clean_(data.applicantId);
  if (!applicantId) throw new Error("Applicant ID is required.");

  getApplicant(applicantId);

  const timestamp = now_();
  const user = clean_(data.screenedBy) || currentUser_();
  const id = clean_(data.screeningId) || generateId_("SCR");

  const existing = findObjectById_("Initial_Screening", id);

  const record = {
    screeningId: id,
    applicantId: applicantId,
    screeningDate: clean_(data.screeningDate),
    basicQualifications: clean_(data.basicQualifications),
    relevantExperience: clean_(data.relevantExperience),
    education: clean_(data.education),
    initialScreeningResult: clean_(data.initialScreeningResult),
    remarks: clean_(data.remarks),
    screenedBy: user,
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp
  };

  const result = existing
    ? updateObject_("Initial_Screening", id, record)
    : (appendObject_("Initial_Screening", record), record);

  return result;
}

/* ======================================================
 * INITIAL INTERVIEW
 * ====================================================== */

function saveInitialInterview(data) {
  const applicantId = clean_(data.applicantId);
  if (!applicantId) throw new Error("Applicant ID is required.");

  getApplicant(applicantId);

  const timestamp = now_();
  const user = clean_(data.interviewedBy) || currentUser_();
  const id = clean_(data.interviewId) || generateId_("INT");

  const existing = findObjectById_("Initial_Interview", id);

  const record = {
    interviewId: id,
    applicantId: applicantId,
    interviewDate: clean_(data.interviewDate),
    interviewMode: clean_(data.interviewMode),
    interviewResult: clean_(data.interviewResult),
    keyObservations: clean_(data.keyObservations),
    recommendedPosition: clean_(data.recommendedPosition),
    hrRecommendation: clean_(data.hrRecommendation),
    dateRecommended: clean_(data.dateRecommended),
    interviewedBy: user,
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp
  };

  const result = existing
    ? updateObject_("Initial_Interview", id, record)
    : (appendObject_("Initial_Interview", record), record);

  return result;
}

/* ======================================================
 * FINAL INTERVIEW
 * ====================================================== */

function saveFinalInterview(data) {
  const applicantId = clean_(data.applicantId);
  if (!applicantId) throw new Error("Applicant ID is required.");

  getApplicant(applicantId);

  const timestamp = now_();
  const user = clean_(data.processedBy) || currentUser_();
  const id = clean_(data.finalInterviewId) || generateId_("FIN");

  const existing = findObjectById_("Final_Interview", id);

  const record = {
    finalInterviewId: id,
    applicantId: applicantId,
    hiringHead: clean_(data.hiringHead),
    endorsementDate: clean_(data.endorsementDate),
    finalInterviewDate: clean_(data.finalInterviewDate),
    finalInterviewResult: clean_(data.finalInterviewResult),
    hiringDecision: clean_(data.hiringDecision),
    dateOfDecision: clean_(data.dateOfDecision),
    remarks: clean_(data.remarks),
    processedBy: user,
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp
  };

  const result = existing
    ? updateObject_("Final_Interview", id, record)
    : (appendObject_("Final_Interview", record), record);

  return result;
}

/* ======================================================
 * EMPLOYMENT PROCESSING
 * ====================================================== */

function saveEmploymentProcessing(data) {
  const applicantId = clean_(data.applicantId);
  if (!applicantId) throw new Error("Applicant ID is required.");

  getApplicant(applicantId);

  const timestamp = now_();
  const user = clean_(data.processedBy) || currentUser_();
  const id = clean_(data.processingId) || generateId_("EMP");

  const existing = findObjectById_("Employment_Processing", id);

  const record = {
    processingId: id,
    applicantId: applicantId,
    hiringApprovalDate: clean_(data.hiringApprovalDate),
    employmentStatus: clean_(data.employmentStatus),
    requirementsStatus: clean_(data.requirementsStatus),
    missingRequirements: clean_(data.missingRequirements),
    targetCompletionDate: clean_(data.targetCompletionDate),
    actualCompletionDate: clean_(data.actualCompletionDate),
    processedBy: user,
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp
  };

  const result = existing
    ? updateObject_("Employment_Processing", id, record)
    : (appendObject_("Employment_Processing", record), record);

  return result;
}

/* ======================================================
 * BACKGROUND CHECKING
 * ====================================================== */

function saveBackgroundChecking(data) {
  const applicantId = clean_(data.applicantId);
  if (!applicantId) throw new Error("Applicant ID is required.");

  getApplicant(applicantId);

  const timestamp = now_();
  const user = clean_(data.checkedBy) || currentUser_();
  const id = clean_(data.backgroundCheckId) || generateId_("BGC");

  const existing = findObjectById_("Background_Checking", id);

  const record = {
    backgroundCheckId: id,
    applicantId: applicantId,
    backgroundCheckDate: clean_(data.backgroundCheckDate),
    status: clean_(data.status),
    result: clean_(data.result),
    dateCompleted: clean_(data.dateCompleted),
    remarks: clean_(data.remarks),
    checkedBy: user,
    createdAt: existing ? existing.createdAt : timestamp,
    updatedAt: timestamp
  };

  const result = existing
    ? updateObject_("Background_Checking", id, record)
    : (appendObject_("Background_Checking", record), record);

  return result;
}

/* ======================================================
 * STATUS
 * ====================================================== */

function updateApplicantStatus(data) {
  const applicantId = clean_(data.applicantId);
  const newStatus = clean_(data.newStatus || data.currentStatus);
  const remarks = clean_(data.remarks);
  const user = clean_(data.changedBy) || currentUser_();

  if (!applicantId) throw new Error("Applicant ID is required.");
  if (!newStatus) throw new Error("New status is required.");

  const existing = getApplicant(applicantId);
  const oldStatus = clean_(existing.currentStatus);

  if (oldStatus === newStatus) {
    return existing;
  }

  const updated = updateObject_("Applicants", applicantId, {
    applicantId: existing.applicantId,
    applicantName: existing.applicantName,
    contactNumber: existing.contactNumber,
    emailAddress: existing.emailAddress,
    positionAppliedFor: existing.positionAppliedFor,
    dateApplied: existing.dateApplied,
    source: existing.source,
    currentStatus: newStatus,
    createdAt: existing.createdAt,
    updatedAt: now_(),
    createdBy: existing.createdBy,
    updatedBy: user
  });

  logStatusChange_(applicantId, oldStatus, newStatus, user, remarks);

  return updated;
}

function logStatusChange_(applicantId, oldStatus, newStatus, changedBy, remarks) {
  appendObject_("Status_History", {
    historyId: generateId_("HIST"),
    applicantId: applicantId,
    oldStatus: oldStatus,
    newStatus: newStatus,
    changedDate: now_(),
    changedBy: changedBy || currentUser_(),
    remarks: remarks || ""
  });
}

/* ======================================================
 * DELETE STAGE RECORD
 * ====================================================== */

function deleteStageRecord(data) {
  const sheetMap = {
    Initial_Screening: "Initial_Screening",
    Initial_Interview: "Initial_Interview",
    Final_Interview: "Final_Interview",
    Employment_Processing: "Employment_Processing",
    Background_Checking: "Background_Checking",
    Status_History: "Status_History"
  };

  const sheetName = sheetMap[clean_(data.sheetName)];
  const recordId = clean_(data.recordId);

  if (!sheetName) throw new Error("Invalid stage sheet.");
  if (!recordId) throw new Error("Record ID is required.");

  deleteObject_(sheetName, recordId);

  return {
    deleted: true,
    sheet: sheetName,
    recordId: recordId
  };
}

/* ======================================================
 * DASHBOARD
 * ====================================================== */

function getDashboardData() {
  const applicants = getApplicants();

  const counts = {};
  applicants.forEach(function(applicant) {
    const status = clean_(applicant.currentStatus) || "New Applicant";
    counts[status] = (counts[status] || 0) + 1;
  });

  const total = applicants.length;

  return {
    totalApplicants: total,
    counts: counts,
    statuses: counts,
    applicants: applicants
  };
}

/* ======================================================
 * SETTINGS
 * ====================================================== */

function getSettings() {
  const sheet = ensureHeaders_("Settings");
  const lastRow = sheet.getLastRow();
  const lastColumn = HEADERS.Settings.length;

  if (lastRow < 2) {
    return {};
  }

  const values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  const result = {};

  for (let c = 0; c < lastColumn; c++) {
    const header = values[0][c];
    if (!header) continue;

    result[headerToKey_(header)] = [];

    for (let r = 1; r < values.length; r++) {
      const value = clean_(values[r][c]);
      if (value && result[headerToKey_(header)].indexOf(value) === -1) {
        result[headerToKey_(header)].push(value);
      }
    }
  }

  return result;
}

/* ======================================================
 * SETUP / VALIDATION
 *
 * Run setupSheets() manually ONCE from Apps Script if
 * needed. It creates missing sheets and corrects headers.
 * ====================================================== */

function setupSheets() {
  const ss = getSpreadsheet_();
  const created = [];
  const repaired = [];

  Object.keys(HEADERS).forEach(function(sheetName) {
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      created.push(sheetName);
    }

    const expected = HEADERS[sheetName];
    const existing = sheet
      .getRange(1, 1, 1, Math.max(sheet.getLastColumn(), expected.length))
      .getValues()[0]
      .slice(0, expected.length);

    const matches = expected.every(function(header, index) {
      return normalizeKey_(existing[index]) === normalizeKey_(header);
    });

    if (!matches) {
      sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
      repaired.push(sheetName);
    }

    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, expected.length)
      .setFontWeight("bold")
      .setBackground("#1e293b")
      .setFontColor("#ffffff");

    sheet.autoResizeColumns(1, expected.length);
  });

  return {
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    created: created,
    repaired: repaired,
    sheets: Object.keys(HEADERS)
  };
}

/* ======================================================
 * OPTIONAL: QUICK TEST
 * ====================================================== */

function testBackend() {
  const result = setupSheets();
  console.log(JSON.stringify(result, null, 2));

  const applicants = getApplicants();
  console.log("Applicants:", JSON.stringify(applicants, null, 2));

  const dashboard = getDashboardData();
  console.log("Dashboard:", JSON.stringify(dashboard, null, 2));
}
function testSpreadsheetConnection() {
  try {
    const ss = getSpreadsheet_();

    const sheets = ss
      .getSheets()
      .map(function(sheet) {
        return sheet.getName();
      });

    const result = {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      sheets: sheets
    };

    console.log(
      JSON.stringify(result, null, 2)
    );

    return result;

  } catch (err) {

    const result = {
      success: false,
      error: err.message,
      message:
        "The Apps Script cannot access the HR_Tracking spreadsheet."
    };

    console.error(
      JSON.stringify(result, null, 2)
    );

    throw new Error(
      JSON.stringify(result, null, 2)
    );
  }
}
function testApplicantsConnection() {
  try {
    const applicants = getApplicants();

    console.log(
      "Successfully connected to Applicants sheet."
    );

    console.log(
      JSON.stringify(applicants, null, 2)
    );

    return {
      success: true,
      count: applicants.length,
      applicants: applicants
    };

  } catch (err) {

    console.error(err.message);

    throw new Error(
      "Applicants connection failed: " +
      err.message
    );
  }
}
/* ======================================================
 * QUICK BACKEND TEST
 * ====================================================== */

function testBackend() {
  const result = setupSheets();

  console.log(
    JSON.stringify(result, null, 2)
  );

  const applicants = getApplicants();

  console.log(
    "Applicants:",
    JSON.stringify(applicants, null, 2)
  );

  const dashboard = getDashboardData();

  console.log(
    "Dashboard:",
    JSON.stringify(dashboard, null, 2)
  );
}


/* ======================================================
 * SPREADSHEET CONNECTION TEST
 * ====================================================== */

function testSpreadsheetConnection() {
  try {
    const ss = getSpreadsheet_();

    const sheets = ss
      .getSheets()
      .map(function(sheet) {
        return sheet.getName();
      });

    const result = {
      success: true,
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      sheets: sheets
    };

    console.log(
      JSON.stringify(result, null, 2)
    );

    return result;

  } catch (err) {

    const result = {
      success: false,
      error: err.message,
      message:
        "The Apps Script cannot access the HR_Tracking spreadsheet."
    };

    console.error(
      JSON.stringify(result, null, 2)
    );

    throw new Error(
      JSON.stringify(result, null, 2)
    );
  }
}


/* ======================================================
 * APPLICANTS CONNECTION TEST
 * ====================================================== */

function testApplicantsConnection() {
  try {
    const applicants = getApplicants();

    console.log(
      "Successfully connected to Applicants sheet."
    );

    console.log(
      JSON.stringify(applicants, null, 2)
    );

    return {
      success: true,
      count: applicants.length,
      applicants: applicants
    };

  } catch (err) {

    console.error(err.message);

    throw new Error(
      "Applicants connection failed: " +
      err.message
    );
  }
}
function authorizeSpreadsheet() {
  const spreadsheetId =
    "1y_raqNSxmEEJbE358t0dIo5D4miRWquXZhV0lT-a3vM";

  // This forces Apps Script to request Google Sheets permission.
  const ss = SpreadsheetApp.openById(spreadsheetId);

  // Access the spreadsheet to confirm permission works.
  const name = ss.getName();

  Logger.log("Authorization successful!");
  Logger.log("Spreadsheet: " + name);
  Logger.log("Spreadsheet ID: " + ss.getId());

  return {
    success: true,
    spreadsheetName: name,
    spreadsheetId: ss.getId()
  };
}
