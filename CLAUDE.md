# EduRecords — project context

## What this is

A multi-tenant web portal that tracks university marksheets, degrees and Transfer
Certificates (TC) for Sant Singaji Education Society's two institutes:

- SSISM — Sant Singaji Institute of Science and Management, affiliated to Vikram University
- SSEC — Sant Singaji Engineering College, affiliated to RGPV

Five beginner MERN interns extend this project from 2 Nov 2026. This is the SKELETON.
Code must be simple, readable and consistent so beginners can copy its patterns.

## Repositories

The project is two separate Git repositories, cloned next to each other:

- **Edu-Record** (this repo, folder `edu-frontend`): the React app.
- **Edu-Record-BE** (folder `edu-backend`): the Express + MongoDB API. Its CLAUDE.md holds the
  backend rules (tenant isolation, middleware chain, audit, TC numbering).

Each repo has its own package.json, node_modules, lint/format config and Husky hook.

## Stack (do not change)

- Node.js LTS (.nvmrc), plain JavaScript with ES modules. No TypeScript.
- React + Vite, MUI, React Router, React Hook Form, Axios, notistack, MUI X Date Pickers + dayjs
- Quality: ESLint + Prettier, Husky pre-commit
- Do NOT use: Redux, React Query, TypeScript, class components, Tailwind, Bootstrap or any other UI kit.

## Folder structure

src/{api/, components/, components/form/, constants/, context/, hooks/, layouts/, pages/, routes/, theme/, utils/}
pages/courses/CoursesPage.jsx is the EXAMPLE page every intern copies.

## Frontend rules

- React + Vite, plain JavaScript (.jsx), function components and hooks only.
- UI: MUI only (no Tailwind, no Bootstrap, no other UI kit). MUI X Date Pickers with dayjs.
- Forms: React Hook Form + the Form* wrapper components in components/form/. Never use raw MUI inputs in pages.
- Lists: always DataTable with server-side paging, sort and search. Never fetch all records.
- Data loading: the useList and useRequest hooks in hooks/. No Redux, no React Query.
- API calls only from files in api/ (one file per module); pages never call axios directly.
- Toasts: notistack via the useNotify hook. No alert() or console.log left in code.
- Every page starts with PageHeader; every create/edit is a FormDialog; every delete uses ConfirmDialog.
- Roles, statuses, document types, categories: import from constants/; never hard-code strings.
- Dates: show with formatDate (dd/mm/yyyy, IST) from utils/format.js.
- Every page must handle 3 states: loading (skeleton), empty (EmptyState), error (ErrorState with retry).
- Must work at 360 px phone width; tables scroll sideways inside their own box.
- Every input has a visible label; everything works with the keyboard.
- File names: components and pages PascalCase.jsx; hooks useSomething.js; api files camelCase.js.

## Roles (constants/roles.js, same values in both repos)

PLATFORM_ADMIN, SOCIETY_ADMIN, PRINCIPAL, EXAM_CLERK, TC_CLERK, ACCOUNTS, DEPT_INCHARGE

## Document statuses (constants/statuses.js)

Expected, Not received, In custody, Issued, Returned to university, Cancelled

## API conventions (from the backend)

- Base path /api/v1 (VITE_API_URL), plural nouns, actions as POST /resource/:id/<verb>
- Success: { success: true, data, meta?: { page, limit, total } }
- Error: { success: false, error: { code, message, details? } }; details = [{ field, message }]
- 400 validation, 401 not logged in, 403 no access, 404 not found, 409 conflict
- Lists accept page, limit (max 100), sort, search
- Every request carries `Authorization: Bearer <token>` and `X-Institute-Id`.

## Style

- React components and pages PascalCase.jsx; hooks useSomething.js; api files camelCase.js
- No hard-coded role/status strings; import constants
- Comments explain why, not what
- Dates shown in IST as dd/mm/yyyy (formatDate)

## Do NOT build (in the skeleton)

Students, inward, results, clearance, hand-over, TC, reports screens. The interns build these;
the menu shows them as "Coming soon" placeholders (routes/routes.jsx).

## Skeleton facts that are easy to get wrong

- MUI is v9: use `slotProps` (not `InputProps` / `inputProps` / `PaperProps`) and `sx`
  (not `mt={2}`-style props). Legacy `*Outline` icons are gone: use `*Outlined`.
- `src/constants/{roles,statuses,categories,coursePatterns,genders}.js` must stay byte-identical
  to the backend repo's copies (the backend tests check this). Change both repos together.
- Calendar dates (date of birth...) are sent to the API as 'YYYY-MM-DD' strings (FormDateField does this).
- Every request goes through `src/api/client.js`, which adds the token and `X-Institute-Id`.
  A page that calls axios itself gets "Select an institute first" errors.
- A record of another institute answers 404 from the API (never 403): show "not found".
- The refresh cookie needs Chrome or Edge on localhost; Safari may log you out on every refresh.
