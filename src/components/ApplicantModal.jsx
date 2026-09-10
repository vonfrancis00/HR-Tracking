import { useEffect, useState } from "react";
import { X } from "lucide-react";

const empty = {
  applicantName: "",
  contactNumber: "",
  email: "",
  positionAppliedFor: "",
  dateApplied: new Date().toISOString().slice(0, 10),
  source: "",
  screeningDate: "",
  basicQualifications: "",
  relevantExperience: "",
  education: "",
  initialScreeningResult: "",
  screeningRemarks: "",
  interviewDate: "",
  interviewMode: "",
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
  status: "New Applicant",
};

const statusOptions = [
  "New Applicant","For Screening","For Initial Interview","For Recommendation",
  "Recommended for Final Interview","For Final Interview","Passed for Hiring",
  "For Employment Processing","For Background Checking","Ready for Onboarding",
  "Not Qualified","Not Recommended","Not Selected","Applicant Withdrew","No Show",
  "Requirements Incomplete","Talent Pool"
];

const steps = [
  {
    title: "Applicant Profile",
    fields: [
      { name: "applicantName", label: "Applicant Name" },
      { name: "contactNumber", label: "Contact Number" },
      { name: "email", label: "Email Address", type: "email" },
      { name: "positionAppliedFor", label: "Position Applied For" },
      { name: "dateApplied", label: "Date Applied", type: "date" },
      { name: "source", label: "Source", options: ["Referral", "Facebook", "Job Portal", "Walk-in", "School", "Other"] },
    ],
  },
  {
    title: "Initial Screening",
    fields: [
      { name: "screeningDate", label: "Screening Date", type: "date" },
      { name: "basicQualifications", label: "Basic Qualifications", options: ["Qualified", "Not Qualified"] },
      { name: "relevantExperience", label: "Relevant Experience", options: ["Yes", "No"] },
      { name: "education", label: "Education", options: ["Meets requirement", "Does not meet"] },
      { name: "initialScreeningResult", label: "Initial Screening Result", options: ["Proceed", "Not Proceed"] },
      { name: "screeningRemarks", label: "Remarks" },
    ],
  },
  {
    title: "Initial Interview",
    fields: [
      { name: "interviewDate", label: "Interview Date", type: "date" },
      { name: "interviewMode", label: "Interview Mode", options: ["Face-to-face", "Online"] },
      { name: "interviewResult", label: "Interview Result", options: ["Qualified", "Not Qualified", "For Further Assessment"] },
      { name: "keyObservations", label: "Key Observations" },
      { name: "recommendedPosition", label: "Recommended Position" },
      { name: "hrRecommendation", label: "HR Recommendation", options: ["Recommend", "Do Not Recommend"] },
      { name: "dateRecommended", label: "Date Recommended", type: "date" },
    ],
  },
  {
    title: "Final Interview / Hiring Head Action",
    fields: [
      { name: "hiringHead", label: "Hiring Head Name / Position" },
      { name: "endorsementDate", label: "Endorsement Date", type: "date" },
      { name: "finalInterviewDate", label: "Final Interview Date", type: "date" },
      { name: "finalInterviewResult", label: "Final Interview Result", options: ["Passed", "Not Passed", "Pending"] },
      { name: "hiringDecision", label: "Hiring Decision", options: ["For Hiring", "Not Selected", "Pending"] },
      { name: "dateOfDecision", label: "Date of Decision", type: "date" },
      { name: "finalRemarks", label: "Remarks" },
    ],
  },
  {
    title: "Employment Processing",
    fields: [
      { name: "hiringApprovalDate", label: "Hiring Approval Date", type: "date" },
      { name: "employmentStatus", label: "Employment Status", options: ["For Processing", "Completed"] },
      { name: "requirements", label: "Requirements", options: ["Complete", "Incomplete"] },
      { name: "missingRequirements", label: "Missing Requirements" },
      { name: "targetCompletionDate", label: "Target Completion Date", type: "date" },
      { name: "actualCompletionDate", label: "Actual Completion Date", type: "date" },
    ],
  },
  {
    title: "Background Checking",
    fields: [
      { name: "backgroundCheckDate", label: "Background Check Date", type: "date" },
      { name: "backgroundStatus", label: "Status", options: ["Pending", "Ongoing", "Completed"] },
      { name: "backgroundResult", label: "Result", options: ["Cleared", "With Findings", "For Review"] },
      { name: "backgroundDateCompleted", label: "Date Completed", type: "date" },
      { name: "backgroundRemarks", label: "Remarks" },
    ],
  },
  {
    title: "Final Applicant Status",
    fields: [
      { name: "status", label: "Current Applicant Status", options: statusOptions },
    ],
  },
  {
    title: "Review & Confirm",
    fields: [],
  },
];

function Field({ label, name, value, onChange, type = "text", options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {options ? (
        <select name={name} value={value || ""} onChange={onChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-600/20">
          <option value="">Select...</option>
          {options.map((x) => <option key={x}>{x}</option>)}
        </select>
      ) : (
        <input name={name} value={value || ""} onChange={onChange} type={type} placeholder={placeholder} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-600/20" />
      )}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-5 border-b border-slate-100 pb-3 text-sm font-bold text-brand-blue-900">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function ApplicantModal({ open, applicant, onClose, onSave }) {
  const [form, setForm] = useState(empty);
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(applicant ? { ...empty, ...applicant } : empty);
      setStep(0);
      setStepError("");
    }
  }, [open, applicant]);

  if (!open) return null;

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setStepError("");
  };
  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;
  const isPreviewStep = currentStep.fields.length === 0;
  const canProceed = isPreviewStep
    ? true
    : currentStep.fields.every(({ name }) => {
        const value = form[name];
        return value !== "" && value !== null && value !== undefined && String(value).trim() !== "";
      });

  const handleNext = () => {
    if (!canProceed) {
      setStepError("Please complete all fields in this step before continuing.");
      return;
    }

    setStepError("");
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-brand-blue-900/50 p-4 backdrop-blur-sm">
      <div className="mx-auto my-4 max-w-5xl rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-extrabold uppercase text-slate-900">{applicant ? "Edit Applicant" : "Add Applicant"}</h2>
              <p className="text-xs font-bold text-slate-500">Complete the recruitment tracking information.</p>
            </div>
            <button aria-label="Close applicant form" onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button>
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <span>Step {step + 1} of {steps.length}</span>
              <span>{currentStep.title}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand-blue-600 transition-all duration-200" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-5 bg-slate-50/70 p-5 sm:p-7">
          {stepError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{stepError}</div>
          )}

          <Section title={`${step + 1}. ${currentStep.title}`}>
            {isPreviewStep ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-brand-blue-100 bg-brand-blue-50/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue-700">Review</p>
                      <h4 className="mt-1 text-base font-semibold text-slate-900">Confirm applicant details before saving</h4>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue-700 ring-1 ring-brand-blue-200">
                      Ready to save
                    </span>
                  </div>
                </div>

                {steps.slice(0, -1).map((section, index) => (
                  <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-sm font-bold text-slate-800">{index + 1}. {section.title}</div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                        {section.fields.filter(({ name }) => form[name] && String(form[name]).trim()).length} fields
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {section.fields.map(({ name, label }) => (
                        <div key={name} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</div>
                          <div className="mt-1 text-sm text-slate-700">
                            {form[name] && String(form[name]).trim() ? form[name] : <span className="text-slate-400 italic">Not provided</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              currentStep.fields.map(({ name, label, type, options }) => (
                <Field
                  key={name}
                  label={label}
                  name={name}
                  value={form[name]}
                  onChange={change}
                  type={type}
                  options={options}
                />
              ))
            )}
          </Section>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-b-3xl border-t border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              disabled={step === 0}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
          </div>

          <div className="flex items-center gap-3">
            {isLastStep ? (
              <button
                onClick={() => onSave(form)}
                className="primary-button rounded-xl bg-brand-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700"
              >
                Save Applicant
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed}
                className="primary-button rounded-xl bg-brand-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}