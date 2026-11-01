# EduRecords — project context

## What this is

A multi-tenant web portal that tracks university marksheets, degrees and Transfer
Certificates (TC) for Sant Singaji Education Society's two institutes:

- SSISM — Sant Singaji Institute of Science and Management, affiliated to Vikram University
- SSEC — Sant Singaji Engineering College, affiliated to RGPV

Five beginner MERN interns extend this repo from 2 Nov 2026. This repo is the SKELETON.
Code must be simple, readable and consistent so beginners can copy its patterns.

## Stack (do not change)

- Node.js LTS (.nvmrc), plain JavaScript with ES modules. No TypeScript.
- edu-backend (the API server): Express, Mongoose, Joi, jsonwebtoken, bcrypt, cookie-parser, helmet, cors,
  express-rate-limit, multer, morgan, dotenv
- edu-frontend (the React client): React + Vite, MUI, React Router, React Hook Form, Axios
- Database: MongoDB Atlas replica set (transactions are required)
- Tests: Jest + Supertest + mongodb-memory-server (MongoMemoryReplSet)
- Quality: ESLint + Prettier, Husky pre-commit
- Two separate folders, one repo: `edu-backend` and `edu-frontend` (npm workspaces); `npm run dev` starts both
- Do NOT use: Redux, TypeScript, class components, DI containers, microservices,
  GraphQL, ORMs other than Mongoose.

## Folder structure

edu-backend/src/{app.js, server.js, config/, constants/, middleware/, utils/, modules/, seed/, templates/}
edu-backend/tests/
edu-frontend/src/{api/, components/, constants/, context/, hooks/, layouts/, pages/, routes/, theme/, utils/}
docs/
Each backend module = modules/<name>/<entity>.model.js, .validation.js, .service.js,
.controller.js, .routes.js. modules/courses is the EXAMPLE every intern copies.

## Tenant isolation (most important rule)

- Every collection except `tenants` and `universities` has `tenantId`.
- Institute-level collections also have `instituteId`.
- Both are the first fields of every compound index.
- Protected routes always run: auth → tenantScope → requireRole(...) → validate(schema) → controller.
- tenantScope reads the `X-Institute-Id` header, checks the user has access to that institute,
  sets req.scope = { tenantId, instituteId, role, departmentId }. No access → 403 + audit entry.
- Services build every query from scoped(req) = { tenantId, instituteId }.
- A Mongoose plugin `tenantGuard` throws if find/update/delete/count on a tenant collection
  runs without tenantId in the filter.

## Roles (constants/roles.js, same values on client and server)

PLATFORM_ADMIN, SOCIETY_ADMIN, PRINCIPAL, EXAM_CLERK, TC_CLERK, ACCOUNTS, DEPT_INCHARGE

## Document statuses (constants/statuses.js)

Expected, Not received, In custody, Issued, Returned to university, Cancelled

## API conventions

- Base path /api/v1, plural nouns, actions as POST /resource/:id/<verb>
- Success: { success: true, data, meta?: { page, limit, total } }
- Error: { success: false, error: { code, message, details? } }; codes in utils/errorCodes.js
- 400 validation, 401 not logged in, 403 no access, 404 not found, 409 conflict
- Lists accept page, limit (max 100), sort, search
- Controllers contain no business logic; services throw ApiError; one error middleware.
- Services call audit(req, action, entity, entityId, before, after, session?) on every create,
  update, delete.
- Services load one record by id with findScopedOr404(req, Model, id, entity) (utils/findScoped.js).
  A record of another institute or tenant answers 404 exactly like a missing one, and the attempt
  is audited as ACCESS_DENIED_RECORD (entity, entityId, user, requested institute).

## Style

- Server files <entity>.<layer>.js; React components PascalCase.jsx
- No hard-coded role/status strings; import constants
- Comments explain why, not what
- Dates stored UTC, shown IST as dd/mm/yyyy

## Do NOT build

Inward, results, clearance, hand-over, TC numbering, PDF, reports, and everything for students
except the model. The interns build these. Only create empty module folders with a README listing
their SRS IDs.

Students are the one exception: the Student MODEL is part of the skeleton
(modules/students/student.model.js: fields and indexes from the architecture doc, tenantGuard,
registered in config/models.js) and the seed creates 20 sample students. Student routes,
services, validation, Excel import and screens are NOT built: Module A builds them.

## Architecture notes

- TC numbering (Module C, utils/counter.js). Two series per TC, both in the tcSeries collection:
  - Ref no. series key: (tenantId, instituteId, kind 'ref', course SHORT CODE, year only if the
    series restarts yearly). NOT courseId: B.Sc Bio and B.Sc Micro share the short code "B.Sc",
    so they must share one series, or both would print the same Ref no. (e.g. SSISM/TC/2026/B.Sc/1).
  - Book serial series key: (tenantId, instituteId, kind 'serial', year only if restarting).
  - Numbers are taken at Principal approval with findOneAndUpdate + $inc inside withTransaction().

## Frontend rules (edu-frontend/)

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

## Skeleton facts that are easy to get wrong

- Register every new model in `edu-backend/src/config/models.js`, or populate() fails at runtime
  (a test checks this).
- `populate()` on a tenant collection must pass the tenant: `.populate({ path, match: { tenantId } })`.
- `.setOptions({ skipTenantGuard: true })` is allowed in exactly two places: login
  (auth.service.js) and findScopedOr404 (utils/findScoped.js). Never add another.
- Dates of birth and other calendar dates travel as 'YYYY-MM-DD' and are stored as midnight UTC.
- In services, spread `...scoped(req)` LAST when creating records, so the body cannot pick a tenant.
- MUI is v9: use `slotProps` (not `InputProps` / `inputProps` / `PaperProps`) and `sx`
  (not `mt={2}`-style props). Legacy `*Outline` icons are gone: use `*Outlined`.
- Express is v5: `req.query` is read-only (validate.js handles it).
- `edu-frontend/src/constants/{roles,statuses,categories,coursePatterns,genders}.js` must stay byte-identical
  to the server copies (a test checks this).
