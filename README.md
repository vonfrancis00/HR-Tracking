# Applicant Tracking System

React + Vite + Tailwind CSS frontend based on the provided Applicant Tracker specification.

## Included

- HR dashboard
- Applicant list/table
- Search and status filtering
- Add/edit/delete applicant
- Applicant profile
- Initial screening
- Initial interview
- Final interview / hiring head action
- Employment processing
- Background checking
- Final applicant status
- Responsive desktop/mobile layout
- LocalStorage mock data
- Backend-ready `src/services/api.js`

## Run in VS Code

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Backend later

All data operations are isolated in:

`src/services/api.js`

When the backend is ready, replace the LocalStorage implementations of:

- `getApplicants()`
- `createApplicant()`
- `updateApplicant()`
- `deleteApplicant()`

with your API calls. The React pages/components can remain mostly unchanged.

## Applicant status flow

New Applicant
→ For Screening
→ For Initial Interview
→ For Recommendation
→ Recommended for Final Interview
→ For Final Interview
→ Passed for Hiring
→ For Employment Processing
→ For Background Checking
→ Ready for Onboarding

Other outcomes are also included:
Not Qualified, Not Recommended, Not Selected, Applicant Withdrew, No Show, Requirements Incomplete, Talent Pool.
