/*
  Backend-ready service layer.

  For now this uses localStorage so the UI can be developed/tested without a backend.
  Later, replace these functions with fetch()/axios calls to your backend.
*/

const STORAGE_KEY = "applicant-tracker-applicants";

const seedApplicants = [
  {
    id: crypto.randomUUID(),
    applicantName: "Juan Dela Cruz",
    contactNumber: "09171234567",
    email: "juan@example.com",
    positionAppliedFor: "Administrative Officer",
    dateApplied: "2026-09-01",
    source: "Job Portal",
    screeningDate: "2026-09-02",
    basicQualifications: "Qualified",
    relevantExperience: "Yes",
    education: "Meets requirement",
    initialScreeningResult: "Proceed",
    screeningRemarks: "Meets the minimum qualifications.",
    interviewDate: "",
    interviewMode: "Face-to-face",
    interviewResult: "",
    keyObservations: "",
    recommendedPosition: "",
    hrRecommendation: "",
    dateRecommended: "",
    hiringHead: "",
    endorsementDate: "",
    finalInterviewDate: "",
    finalInterviewResult: "",
    hiringDecision: "",
    dateOfDecision: "",
    finalRemarks: "",
    hiringApprovalDate: "",
    employmentStatus: "",
    requirements: "",
    missingRequirements: "",
    targetCompletionDate: "",
    actualCompletionDate: "",
    backgroundCheckDate: "",
    backgroundStatus: "",
    backgroundResult: "",
    backgroundDateCompleted: "",
    backgroundRemarks: "",
    status: "For Initial Interview",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: crypto.randomUUID(),
    applicantName: "Maria Santos",
    contactNumber: "09189876543",
    email: "maria@example.com",
    positionAppliedFor: "Human Resource Officer",
    dateApplied: "2026-08-28",
    source: "Referral",
    screeningDate: "2026-08-29",
    basicQualifications: "Qualified",
    relevantExperience: "Yes",
    education: "Meets requirement",
    initialScreeningResult: "Proceed",
    screeningRemarks: "",
    interviewDate: "2026-09-03",
    interviewMode: "Online",
    interviewResult: "Qualified",
    keyObservations: "Strong communication skills.",
    recommendedPosition: "Human Resource Officer",
    hrRecommendation: "Recommend",
    dateRecommended: "2026-09-04",
    hiringHead: "",
    endorsementDate: "",
    finalInterviewDate: "",
    finalInterviewResult: "",
    hiringDecision: "",
    dateOfDecision: "",
    finalRemarks: "",
    hiringApprovalDate: "",
    employmentStatus: "",
    requirements: "",
    missingRequirements: "",
    targetCompletionDate: "",
    actualCompletionDate: "",
    backgroundCheckDate: "",
    backgroundStatus: "",
    backgroundResult: "",
    backgroundDateCompleted: "",
    backgroundRemarks: "",
    status: "For Recommendation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function read() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedApplicants));
    return seedApplicants;
  }
  return JSON.parse(raw);
}

function write(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getApplicants() {
  return read();
}

export async function createApplicant(data) {
  const applicants = read();
  const applicant = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  write([applicant, ...applicants]);
  return applicant;
}

export async function updateApplicant(id, data) {
  const applicants = read();
  const updated = applicants.map((item) =>
    item.id === id
      ? { ...item, ...data, updatedAt: new Date().toISOString() }
      : item
  );
  write(updated);
  return updated.find((item) => item.id === id);
}

export async function deleteApplicant(id) {
  write(read().filter((item) => item.id !== id));
  return true;
}