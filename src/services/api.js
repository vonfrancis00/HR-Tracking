/*
 * Applicant Tracking System
 * Frontend API Service
 *
 * React/Vite
 *    ↓
 * api.js
 *    ↓
 * Google Apps Script Web App
 *    ↓
 * Google Sheets (HR_Tracking)
 */

// =====================================================
// GOOGLE APPS SCRIPT URL
// =====================================================

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;
const STORAGE_KEY = "applicant-tracker-local-data";
const DEFAULT_LOCAL_APPLICANTS = [
  {
    id: "app-1",
    applicantId: "app-1",
    applicantName: "test",
    email: "test@example.com",
    emailAddress: "test@example.com",
    contactNumber: "9652342432",
    positionAppliedFor: "HR",
    dateApplied: "2026-09-09",
    source: "Referral",
    status: "Unspecified",
    currentStatus: "Unspecified",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
    createdBy: "",
    updatedBy: "",
  },
];

if (!API_URL) {
  console.warn(
    "VITE_APPS_SCRIPT_URL is not configured. " +
    "Falling back to localStorage mock data."
  );
}

function getLocalStorageSafe() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readLocalApplicants() {
  const storage = getLocalStorageSafe();

  if (!storage) {
    return [];
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_LOCAL_APPLICANTS)
    );

    return DEFAULT_LOCAL_APPLICANTS;
  } catch {
    return [];
  }
}

function writeLocalApplicants(applicants) {
  const storage = getLocalStorageSafe();

  if (!storage) {
    return;
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(applicants));
}

// =====================================================
// HELPERS
// =====================================================

function normalizeApplicant(applicant) {
  if (!applicant) return applicant;

  // Older Apps Script versions returned applicantID (capital D).
  const applicantId = [applicant.applicantId, applicant.applicantID, applicant.id]
    .map((value) => String(value ?? "").trim())
    .find(Boolean) || "";

  const normalized = {
    ...applicant,

    // Backend names
    id: applicantId,
    applicantId,
    applicantName: applicant.applicantName ?? "",
    contactNumber: applicant.contactNumber ?? "",
    email: applicant.email ?? applicant.emailAddress ?? "",
    emailAddress: applicant.emailAddress ?? applicant.email ?? "",
    positionAppliedFor: applicant.positionAppliedFor ?? "",
    dateApplied: applicant.dateApplied ?? "",
    source: applicant.source ?? "",
    status:
      applicant.status ??
      applicant.currentStatus ??
      "New Applicant",
    currentStatus:
      applicant.currentStatus ??
      applicant.status ??
      "New Applicant",

    createdAt: applicant.createdAt ?? "",
    updatedAt: applicant.updatedAt ?? "",
    createdBy: applicant.createdBy ?? "",
    updatedBy: applicant.updatedBy ?? "",
  };

  return normalized;
}

// Convert frontend applicant fields to backend fields
function normalizeApplicantPayload(data = {}) {
  return {
    applicantId: normalizeApplicant(data).applicantId,

    applicantName: data.applicantName ?? "",

    contactNumber: data.contactNumber ?? "",

    emailAddress:
      data.emailAddress ??
      data.email ??
      "",

    positionAppliedFor:
      data.positionAppliedFor ??
      "",

    dateApplied:
      data.dateApplied ??
      "",

    source:
      data.source ??
      "",

    status:
      data.status ??
      data.currentStatus ??
      "New Applicant",

    currentStatus:
      data.currentStatus ??
      data.status ??
      "New Applicant",

    createdBy:
      data.createdBy ??
      "",

    updatedBy:
      data.updatedBy ??
      "",
  };
}

// =====================================================
// GET REQUEST
// =====================================================

async function getRequest(action, params = {}) {
  if (!API_URL) {
    throw new Error(
      "Google Apps Script URL is missing. Check your .env file."
    );
  }

  const url = new URL(API_URL);

  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || "Google Apps Script request failed."
    );
  }

  return result.data;
}

// =====================================================
// POST REQUEST
// =====================================================

async function postRequest(action, data = {}) {
  if (!API_URL) {
    throw new Error(
      "Google Apps Script URL is missing. Check your .env file."
    );
  }

  /*
   * IMPORTANT:
   *
   * We intentionally use URLSearchParams instead of
   * application/json.
   *
   * This avoids unnecessary CORS preflight requests
   * when communicating with Google Apps Script.
   */

  const params = new URLSearchParams();

  params.append("action", action);

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    /*
     * Objects/arrays are converted to JSON.
     */
    if (typeof value === "object") {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, String(value));
    }
  });

  const response = await fetch(API_URL, {
    method: "POST",
    body: params,
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(
      result.error || "Google Apps Script request failed."
    );
  }

  return result.data;
}

// =====================================================
// APPLICANTS
// =====================================================

function normalizeApplicantList(data) {
  const seen = new Set();
  return data.filter((item) => item && Object.values(item).some(
    (value) => String(value ?? "").trim() !== ""
  )).map((item) => {
    const applicant = normalizeApplicant(item);
    if (!applicant.id || seen.has(applicant.id)) {
      throw new Error("Applicant records have missing or duplicate IDs. Run repairMissingRecordIds in the corrected Apps Script, then refresh.");
    }
    seen.add(applicant.id);
    return applicant;
  });
}

export async function getApplicants() {
  if (!API_URL) {
    return normalizeApplicantList(readLocalApplicants());
  }

  const data = await getRequest("getApplicants");

  if (!Array.isArray(data)) {
    return [];
  }

  return normalizeApplicantList(data);
}

// -----------------------------------------------------
// Get one applicant
// -----------------------------------------------------

export async function getApplicant(applicantId) {
  if (!applicantId) {
    throw new Error("Applicant ID is required.");
  }

  const data = await getRequest("getApplicant", {
    applicantId,
  });

  return normalizeApplicant(data);
}

// -----------------------------------------------------
// Get complete applicant details
// -----------------------------------------------------

export async function getApplicantDetails(applicantId) {
  if (!applicantId) {
    throw new Error("Applicant ID is required.");
  }

  const data = await getRequest("getApplicantDetails", {
    applicantId,
  });

  if (!data) {
    return null;
  }

  return {
    ...data,
    applicant: normalizeApplicant(data.applicant),

    initialScreening:
      data.initialScreening ?? [],

    initialInterview:
      data.initialInterview ?? [],

    finalInterview:
      data.finalInterview ?? [],

    employmentProcessing:
      data.employmentProcessing ?? [],

    backgroundChecking:
      data.backgroundChecking ?? [],

    statusHistory:
      data.statusHistory ?? [],
  };
}

// -----------------------------------------------------
// Create applicant
// -----------------------------------------------------

export async function createApplicant(data) {
  const payload = normalizeApplicantPayload(data);

  if (!payload.applicantName.trim()) {
    throw new Error("Applicant Name is required.");
  }

  if (!API_URL) {
    const existing = readLocalApplicants();
    const now = new Date().toISOString();
    const applicantId = payload.applicantId || `app-${Date.now()}`;
    const newApplicant = {
      ...payload,
      id: applicantId,
      applicantId,
      email: payload.emailAddress || "",
      emailAddress: payload.emailAddress || "",
      status: payload.status || "New Applicant",
      currentStatus: payload.currentStatus || "New Applicant",
      createdAt: now,
      updatedAt: now,
      createdBy: payload.createdBy || "",
      updatedBy: payload.updatedBy || "",
    };

    writeLocalApplicants([newApplicant, ...existing]);
    return normalizeApplicant(newApplicant);
  }

  const result = await postRequest(
    "createApplicant",
    payload
  );

  return normalizeApplicant(result);
}

// -----------------------------------------------------
// Update applicant
// -----------------------------------------------------

export async function updateApplicant(id, data) {
  if (!id) {
    throw new Error("Applicant ID is required.");
  }

  if (!API_URL) {
    const existing = readLocalApplicants();
    const index = existing.findIndex(
      (applicant) => applicant.id === id || applicant.applicantId === id
    );

    if (index === -1) {
      throw new Error("Applicant not found.");
    }

    const payload = normalizeApplicantPayload(data);
    const updatedApplicant = {
      ...existing[index],
      ...payload,
      id: existing[index].id,
      applicantId: existing[index].applicantId,
      email: payload.emailAddress || existing[index].email || "",
      emailAddress: payload.emailAddress || existing[index].emailAddress || "",
      status: payload.status || existing[index].status || "New Applicant",
      currentStatus:
        payload.currentStatus || existing[index].currentStatus || "New Applicant",
      updatedAt: new Date().toISOString(),
    };

    existing[index] = updatedApplicant;
    writeLocalApplicants(existing);
    return normalizeApplicant(updatedApplicant);
  }

  const payload = {
    ...normalizeApplicantPayload(data),
    applicantId: id,
  };

  const result = await postRequest(
    "updateApplicant",
    payload
  );

  return normalizeApplicant(result);
}

// -----------------------------------------------------
// Delete applicant
// -----------------------------------------------------

export async function deleteApplicant(id) {
  if (!id) {
    throw new Error("Applicant ID is required.");
  }

  if (!API_URL) {
    const existing = readLocalApplicants();
    const filtered = existing.filter(
      (applicant) => applicant.id !== id && applicant.applicantId !== id
    );

    writeLocalApplicants(filtered);
    return { success: true };
  }

  return await postRequest(
    "deleteApplicant",
    {
      applicantId: id,
    }
  );
}

// =====================================================
// INITIAL SCREENING
// =====================================================

export async function getInitialScreening(applicantId = "") {
  return await getRequest(
    "getInitialScreening",
    applicantId
      ? { applicantId }
      : {}
  );
}

export async function saveInitialScreening(data) {
  return await postRequest(
    "saveInitialScreening",
    {
      screeningId:
        data.screeningId ?? "",

      applicantId:
        data.applicantId ?? "",

      screeningDate:
        data.screeningDate ?? "",

      basicQualifications:
        data.basicQualifications ?? "",

      relevantExperience:
        data.relevantExperience ?? "",

      education:
        data.education ?? "",

      initialScreeningResult:
        data.initialScreeningResult ?? "",

      remarks:
        data.remarks ?? "",

      screenedBy:
        data.screenedBy ?? "",
    }
  );
}

// =====================================================
// INITIAL INTERVIEW
// =====================================================

export async function getInitialInterview(applicantId = "") {
  return await getRequest(
    "getInitialInterview",
    applicantId
      ? { applicantId }
      : {}
  );
}

export async function saveInitialInterview(data) {
  return await postRequest(
    "saveInitialInterview",
    {
      interviewId:
        data.interviewId ?? "",

      applicantId:
        data.applicantId ?? "",

      interviewDate:
        data.interviewDate ?? "",

      interviewMode:
        data.interviewMode ?? "",

      interviewResult:
        data.interviewResult ?? "",

      keyObservations:
        data.keyObservations ?? "",

      recommendedPosition:
        data.recommendedPosition ?? "",

      hrRecommendation:
        data.hrRecommendation ?? "",

      dateRecommended:
        data.dateRecommended ?? "",

      interviewedBy:
        data.interviewedBy ?? "",
    }
  );
}

// =====================================================
// FINAL INTERVIEW
// =====================================================

export async function getFinalInterview(applicantId = "") {
  return await getRequest(
    "getFinalInterview",
    applicantId
      ? { applicantId }
      : {}
  );
}

export async function saveFinalInterview(data) {
  return await postRequest(
    "saveFinalInterview",
    {
      finalInterviewId:
        data.finalInterviewId ?? "",

      applicantId:
        data.applicantId ?? "",

      hiringHead:
        data.hiringHead ?? "",

      endorsementDate:
        data.endorsementDate ?? "",

      finalInterviewDate:
        data.finalInterviewDate ?? "",

      finalInterviewResult:
        data.finalInterviewResult ?? "",

      hiringDecision:
        data.hiringDecision ?? "",

      dateOfDecision:
        data.dateOfDecision ?? "",

      remarks:
        data.remarks ??
        data.finalRemarks ??
        "",

      processedBy:
        data.processedBy ?? "",
    }
  );
}

// =====================================================
// EMPLOYMENT PROCESSING
// =====================================================

export async function getEmploymentProcessing(
  applicantId = ""
) {
  return await getRequest(
    "getEmploymentProcessing",
    applicantId
      ? { applicantId }
      : {}
  );
}

export async function saveEmploymentProcessing(data) {
  return await postRequest(
    "saveEmploymentProcessing",
    {
      processingId:
        data.processingId ?? "",

      applicantId:
        data.applicantId ?? "",

      hiringApprovalDate:
        data.hiringApprovalDate ?? "",

      employmentStatus:
        data.employmentStatus ?? "",

      requirementsStatus:
        data.requirementsStatus ??
        data.requirements ??
        "",

      missingRequirements:
        data.missingRequirements ?? "",

      targetCompletionDate:
        data.targetCompletionDate ?? "",

      actualCompletionDate:
        data.actualCompletionDate ?? "",

      processedBy:
        data.processedBy ?? "",
    }
  );
}

// =====================================================
// BACKGROUND CHECKING
// =====================================================

export async function getBackgroundChecking(
  applicantId = ""
) {
  return await getRequest(
    "getBackgroundChecking",
    applicantId
      ? { applicantId }
      : {}
  );
}

export async function saveBackgroundChecking(data) {
  return await postRequest(
    "saveBackgroundChecking",
    {
      backgroundCheckId:
        data.backgroundCheckId ?? "",

      applicantId:
        data.applicantId ?? "",

      backgroundCheckDate:
        data.backgroundCheckDate ?? "",

      status:
        data.status ??
        data.backgroundStatus ??
        "",

      result:
        data.result ??
        data.backgroundResult ??
        "",

      dateCompleted:
        data.dateCompleted ??
        data.backgroundDateCompleted ??
        "",

      remarks:
        data.remarks ??
        data.backgroundRemarks ??
        "",

      checkedBy:
        data.checkedBy ?? "",
    }
  );
}

// =====================================================
// APPLICANT STATUS
// =====================================================

export async function updateApplicantStatus(
  applicantId,
  newStatus,
  remarks = "",
  changedBy = ""
) {
  if (!applicantId) {
    throw new Error("Applicant ID is required.");
  }

  if (!newStatus) {
    throw new Error("New status is required.");
  }

  const result = await postRequest(
    "updateApplicantStatus",
    {
      applicantId,
      newStatus,
      remarks,
      changedBy,
    }
  );

  return normalizeApplicant(result);
}

// =====================================================
// STATUS HISTORY
// =====================================================

export async function getStatusHistory(
  applicantId = ""
) {
  return await getRequest(
    "getStatusHistory",
    applicantId
      ? { applicantId }
      : {}
  );
}

// =====================================================
// DASHBOARD
// =====================================================

export async function getDashboard() {
  return await getRequest(
    "getDashboard"
  );
}

export async function getDashboardData() {
  return await getRequest(
    "getDashboardData"
  );
}

// =====================================================
// USERS
// =====================================================

export async function getUsers() {
  return await getRequest(
    "getUsers"
  );
}

// =====================================================
// SETTINGS
// =====================================================

export async function getSettings() {
  return await getRequest(
    "getSettings"
  );
}

// =====================================================
// DELETE STAGE RECORD
// =====================================================

export async function deleteStageRecord(
  sheetName,
  recordId
) {
  if (!sheetName) {
    throw new Error("Sheet name is required.");
  }

  if (!recordId) {
    throw new Error("Record ID is required.");
  }

  return await postRequest(
    "deleteStageRecord",
    {
      sheetName,
      recordId,
    }
  );
}
