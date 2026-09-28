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

### User registration and login setup

1. Replace the spreadsheet's Apps Script code with `apps-script/Code.gs`.
2. In **Apps Script → Project Settings → Script properties**, add:
   - `INITIAL_ADMIN_EMAIL`: your administrator's email.
   - `INITIAL_ADMIN_PASSWORD`: a temporary password of at least 12 characters.
3. Ensure the `Users` sheet is empty except for its headers: **User ID, Full Name, Email, Role, Department, Status, Created At**. This matches the supplied spreadsheet. If the sheet already contains accounts from an older installation, migrate their credentials separately; do not delete existing user rows just to bootstrap.
4. Deploy the script as a web app that executes as the spreadsheet owner, accessible to the app's users. For an existing deployment, choose **Deploy → Manage deployments → Edit → New version → Deploy**.
5. Set `VITE_APPS_SCRIPT_URL` in `.env` to this deployment's `/exec` URL, then restart Vite or rebuild the frontend.
6. Sign in using the administrator email and temporary password. The first successful sign-in creates the administrator in `Users` and removes both bootstrap properties. That password remains the account's login password.
7. Open **Settings → Register user**, enter the profile and password, then save. Active users can sign in with their registered email and password. Set `Status` to `Inactive` in the sheet to revoke an account's access.

Only Super Admin accounts can view Settings, list users, or register users. Viewer accounts cannot modify records through the API. Profile records keep the original seven columns; password verifiers and eight-hour sessions are stored in private Script Properties. Passwords are derived with PBKDF2-SHA256 (600,000 iterations) in the browser and the resulting proof is hashed again before storage. Serve the frontend over HTTPS (localhost also supports browser cryptography). Password reset and editing users are not included.

The built-in demo account works only when `VITE_APPS_SCRIPT_URL` is absent; demo registration is disabled. Existing browser-only login records are discarded. All deployed data endpoints now require a valid server session.

Local validation: `node --test tests/*.test.mjs` and `npm run build`. These do not deploy Apps Script or change the live spreadsheet.

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
