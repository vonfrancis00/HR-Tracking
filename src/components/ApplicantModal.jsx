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

function Field({ label, name, value, onChange, type = "text", options, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {options ? (
        <select name={name} value={value || ""} onChange={onChange} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10">
          <option value="">Select...</option>
          {options.map((x) => <option key={x}>{x}</option>)}
        </select>
      ) : (
        <input name={name} value={value || ""} onChange={onChange} type={type} placeholder={placeholder} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10" />
      )}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-4 text-sm font-bold text-slate-900">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export default function ApplicantModal({ open, applicant, onClose, onSave }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (open) setForm(applicant ? { ...empty, ...applicant } : empty);
  }, [open, applicant]);

  if (!open) return null;

  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-4">
      <div className="mx-auto my-4 max-w-5xl rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{applicant ? "Edit Applicant" : "Add Applicant"}</h2>
            <p className="text-xs text-slate-500">Complete the recruitment tracking information.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="space-y-5 p-5">
          <Section title="1. Applicant Profile">
            <Field label="Applicant Name" name="applicantName" value={form.applicantName} onChange={change} />
            <Field label="Contact Number" name="contactNumber" value={form.contactNumber} onChange={change} />
            <Field label="Email Address" name="email" value={form.email} onChange={change} type="email" />
            <Field label="Position Applied For" name="positionAppliedFor" value={form.positionAppliedFor} onChange={change} />
            <Field label="Date Applied" name="dateApplied" value={form.dateApplied} onChange={change} type="date" />
            <Field label="Source" name="source" value={form.source} onChange={change} options={["Referral","Facebook","Job Portal","Walk-in","School","Other"]} />
          </Section>

          <Section title="2. Initial Screening">
            <Field label="Screening Date" name="screeningDate" value={form.screeningDate} onChange={change} type="date" />
            <Field label="Basic Qualifications" name="basicQualifications" value={form.basicQualifications} onChange={change} options={["Qualified","Not Qualified"]} />
            <Field label="Relevant Experience" name="relevantExperience" value={form.relevantExperience} onChange={change} options={["Yes","No"]} />
            <Field label="Education" name="education" value={form.education} onChange={change} options={["Meets requirement","Does not meet"]} />
            <Field label="Initial Screening Result" name="initialScreeningResult" value={form.initialScreeningResult} onChange={change} options={["Proceed","Not Proceed"]} />
            <Field label="Remarks" name="screeningRemarks" value={form.screeningRemarks} onChange={change} />
          </Section>

          <Section title="3. Initial Interview">
            <Field label="Interview Date" name="interviewDate" value={form.interviewDate} onChange={change} type="date" />
            <Field label="Interview Mode" name="interviewMode" value={form.interviewMode} onChange={change} options={["Face-to-face","Online"]} />
            <Field label="Interview Result" name="interviewResult" value={form.interviewResult} onChange={change} options={["Qualified","Not Qualified","For Further Assessment"]} />
            <Field label="Key Observations" name="keyObservations" value={form.keyObservations} onChange={change} />
            <Field label="Recommended Position" name="recommendedPosition" value={form.recommendedPosition} onChange={change} />
            <Field label="HR Recommendation" name="hrRecommendation" value={form.hrRecommendation} onChange={change} options={["Recommend","Do Not Recommend"]} />
            <Field label="Date Recommended" name="dateRecommended" value={form.dateRecommended} onChange={change} type="date" />
          </Section>

          <Section title="4. Final Interview / Hiring Head Action">
            <Field label="Hiring Head Name / Position" name="hiringHead" value={form.hiringHead} onChange={change} />
            <Field label="Endorsement Date" name="endorsementDate" value={form.endorsementDate} onChange={change} type="date" />
            <Field label="Final Interview Date" name="finalInterviewDate" value={form.finalInterviewDate} onChange={change} type="date" />
            <Field label="Final Interview Result" name="finalInterviewResult" value={form.finalInterviewResult} onChange={change} options={["Passed","Not Passed","Pending"]} />
            <Field label="Hiring Decision" name="hiringDecision" value={form.hiringDecision} onChange={change} options={["For Hiring","Not Selected","Pending"]} />
            <Field label="Date of Decision" name="dateOfDecision" value={form.dateOfDecision} onChange={change} type="date" />
            <Field label="Remarks" name="finalRemarks" value={form.finalRemarks} onChange={change} />
          </Section>

          <Section title="5. Employment Processing">
            <Field label="Hiring Approval Date" name="hiringApprovalDate" value={form.hiringApprovalDate} onChange={change} type="date" />
            <Field label="Employment Status" name="employmentStatus" value={form.employmentStatus} onChange={change} options={["For Processing","Completed"]} />
            <Field label="Requirements" name="requirements" value={form.requirements} onChange={change} options={["Complete","Incomplete"]} />
            <Field label="Missing Requirements" name="missingRequirements" value={form.missingRequirements} onChange={change} />
            <Field label="Target Completion Date" name="targetCompletionDate" value={form.targetCompletionDate} onChange={change} type="date" />
            <Field label="Actual Completion Date" name="actualCompletionDate" value={form.actualCompletionDate} onChange={change} type="date" />
          </Section>

          <Section title="6. Background Checking">
            <Field label="Background Check Date" name="backgroundCheckDate" value={form.backgroundCheckDate} onChange={change} type="date" />
            <Field label="Status" name="backgroundStatus" value={form.backgroundStatus} onChange={change} options={["Pending","Ongoing","Completed"]} />
            <Field label="Result" name="backgroundResult" value={form.backgroundResult} onChange={change} options={["Cleared","With Findings","For Review"]} />
            <Field label="Date Completed" name="backgroundDateCompleted" value={form.backgroundDateCompleted} onChange={change} type="date" />
            <Field label="Remarks" name="backgroundRemarks" value={form.backgroundRemarks} onChange={change} />
          </Section>

          <Section title="7. Final Applicant Status">
            <Field label="Current Applicant Status" name="status" value={form.status} onChange={change} options={statusOptions} />
          </Section>
        </div>

        <div className="flex justify-end gap-3 rounded-b-3xl border-t border-slate-200 bg-white px-5 py-4">
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={() => onSave(form)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Save Applicant</button>
        </div>
      </div>
    </div>
  );
}