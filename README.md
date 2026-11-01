# EduRecords

A web portal that tracks university marksheets, degrees and Transfer Certificates (TC) for
**Sant Singaji Education Society**: SSISM (Vikram University) and SSEC (RGPV).

This repository is the **skeleton**: login, roles, institute security and one complete example
module (**Courses**). During the internship you add the other modules by copying that example.
`CLAUDE.md` holds the project rules. Read it once, then keep it open.

## Prerequisites

- **Node.js 22** (the version in `.nvmrc`). Check with `node -v`.
- **Google Chrome or Microsoft Edge** for running the app. Safari (and sometimes Firefox) may refuse
  the secure refresh cookie on `http://localhost`, so you get logged out on every page refresh.
- **Git**, and a GitHub account added to the repository
- **VS Code** with the ESLint, Prettier, ES7+ React snippets, GitLens and MongoDB extensions
- **Postman** (for testing the API without the screens)
- The **MongoDB Atlas dev link**, shared privately by the project owner. No link yet? See "No Atlas yet" below.

### Windows laptops

- **Line endings.** The repo stores every file with LF line endings (`.gitattributes` enforces it).
  Before you clone, run `git config --global core.autocrlf false` so Git does not convert files to
  CRLF; otherwise ESLint and Prettier report every line as changed. In VS Code, set
  "Files: Eol" to `\n` (the repo's `.editorconfig` does this if the EditorConfig extension is installed).
  Already cloned with CRLF? Run `git rm --cached -r . -q` then `git reset --hard` to check out again
  (commit or stash your work first).
- **Husky (the pre-commit check).** Git for Windows runs the hook with its own Git Bash, so commit
  from the VS Code terminal or Git Bash. The hook is installed by `npm install`: if a commit says
  `.husky/_/pre-commit: No such file`, run `npm install` again. GUI tools such as GitHub Desktop
  may not find `npx`; commit from a terminal instead.
- Use `copy` instead of `cp` in step 5 below.

## Setup (8 steps)

1. Install Node.js 22, Git, VS Code, Postman and Chrome or Edge.
2. Set your Git name and email:
   `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
3. Clone the repository and open it:
   `git clone <repo-url> edurecords` then `cd edurecords`.
4. Install everything (server and client in one go): `npm install`.
5. Copy the settings files:
   `cp edu-backend/.env.example edu-backend/.env` and `cp edu-frontend/.env.example edu-frontend/.env`
   (on Windows: `copy edu-backend\.env.example edu-backend\.env`, and the same for client).
6. In `edu-backend/.env`, set `MONGODB_URI` to the Atlas link with **your own database name**
   (see the next section), and replace both `JWT_..._SECRET` values with long random text.
   Never commit `.env`.
7. Fill your database with starting data: `npm run seed`.
8. Start both apps: `npm run dev`. Open http://localhost:5173 in Chrome or Edge and log in with a
   seeded user (below).

### One database per person

Everyone uses the same Atlas cluster but their **own database**, chosen by the name at the end of
`MONGODB_URI`:

| Person  | Database name        | Example `MONGODB_URI`                                                      |
| ------- | -------------------- | -------------------------------------------------------------------------- |
| S1      | `edurecords_s1`      | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edurecords_s1`      |
| S2      | `edurecords_s2`      | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edurecords_s2`      |
| S3      | `edurecords_s3`      | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edurecords_s3`      |
| S4      | `edurecords_s4`      | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edurecords_s4`      |
| S5      | `edurecords_s5`      | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edurecords_s5`      |
| Faculty | `edurecords_faculty` | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/edurecords_faculty` |

Why each person needs their own database:

- **`npm run seed` resets the seed data.** If five people shared one database, every seed would
  undo the courses, students and passwords someone else was testing with.
- **Your test data stays yours.** Deleting a course, marking documents received or approving a
  test TC would otherwise change what your teammates see in the middle of their work.
- **Your branch's changes stay on your branch.** A new model, index or field you are building
  can't break the database of someone working on `main`.
- **TC numbers stay predictable.** Numbering tests take numbers from shared series; with one
  database, your numbers would jump whenever someone else approved a TC.

The databases cost nothing extra: MongoDB creates yours the first time you run `npm run seed`.
The pilot server uses a separate cluster with its own password.

### No Atlas yet?

Run a local MongoDB replica set in a second terminal and keep it open:

```bash
npm run db:local      # keeps its data in edu-backend/.local-db
```

The default `MONGODB_URI` in `edu-backend/.env.example` already points at it (database `edurecords_s1`;
change the name to yours).

## Seeded logins

`npm run seed` creates these users and prints this table at the end. The password for all of them
is `SEED_PASSWORD` from `edu-backend/.env` (default `Edu@12345`). Re-running the seed resets them.

| Mobile     | User                          | Institutes   | Role                                 |
| ---------- | ----------------------------- | ------------ | ------------------------------------ |
| 9000000000 | Platform Admin                | SSISM + SSEC | Platform Admin (sees only Dashboard) |
| 9000000001 | Society Admin                 | SSISM + SSEC | Society Admin                        |
| 9100000001 | SSISM Principal               | SSISM        | Principal                            |
| 9100000002 | SSISM Exam Clerk              | SSISM        | Exam Clerk                           |
| 9100000003 | SSISM TC Clerk                | SSISM        | TC Clerk                             |
| 9100000004 | SSISM Accounts                | SSISM        | Accounts                             |
| 9100000005 | SSISM Library In-charge       | SSISM        | Department In-charge (Library)       |
| 9100000006 | SSISM Sports In-charge        | SSISM        | Department In-charge (Sports)        |
| 9100000007 | SSISM Computer Dept In-charge | SSISM        | Department In-charge (Computer Dept) |
| 9200000001 | SSEC Principal                | SSEC         | Principal                            |
| 9200000002 | SSEC Exam Clerk               | SSEC         | Exam Clerk                           |
| 9200000003 | SSEC TC Clerk                 | SSEC         | TC Clerk                             |
| 9200000004 | SSEC Accounts                 | SSEC         | Accounts                             |
| 9200000005 | SSEC Library In-charge        | SSEC         | Department In-charge (Library)       |
| 9200000006 | SSEC Sports In-charge         | SSEC         | Department In-charge (Sports)        |
| 9200000007 | SSEC Computer Dept In-charge  | SSEC         | Department In-charge (Computer Dept) |

The seed also creates both institutes, both universities, the affiliations, the courses
(SSISM: BBA, BCA, B.Com, B.Sc Bio, B.Sc Micro; SSEC: B.Tech AI & ML), the clearance
departments (Sports, Library, Computer Dept, Account Dept) and **20 sample students**
(12 SSISM across all five courses, 8 SSEC B.Tech AI & ML). All student names and numbers are made up.

## Scripts (run from the repo root)

| Command                         | What it does                                             |
| ------------------------------- | -------------------------------------------------------- |
| `npm run dev`                   | Starts the API (port 5000) and the React app (port 5173) |
| `npm run seed`                  | Creates or resets the starting data. Safe to run again   |
| `npm test`                      | Runs the server tests (security, roles, login, files)    |
| `npm run lint`                  | Checks all code with ESLint                              |
| `npm run format`                | Formats all files with Prettier                          |
| `npm run db:local`              | Starts a local MongoDB replica set (only without Atlas)  |
| `npm run build -w edu-frontend` | Builds the React app for the pilot server                |

A Git hook (Husky) runs ESLint and Prettier on your staged files at every commit.
If the commit is refused, run `npm run lint:fix` and `npm run format`, then commit again.

## Folder map

```
edurecords/
├── CLAUDE.md                 project rules (read first)
├── docs/                     Postman collection, handover notes, SRS and plans
├── edu-backend/
│   ├── .env.example          settings to copy into .env
│   ├── scripts/localDb.js    local MongoDB when Atlas is not available
│   ├── src/
│   │   ├── app.js            Express app: middleware order and the list of routes
│   │   ├── server.js         connects to MongoDB and starts the app
│   │   ├── config/           env.js (settings), db.js (connection), models.js (all models)
│   │   ├── constants/        roles, statuses, categories, course patterns, audit actions
│   │   ├── middleware/       auth, tenantScope, requireRole, validate, error, rateLimit, upload
│   │   ├── utils/            ApiError, response helpers, scoped, audit, storage, transaction, counter...
│   │   ├── modules/
│   │   │   ├── courses/      EXAMPLE MODULE: copy this
│   │   │   ├── auth/         login, refresh, logout, me
│   │   │   ├── institutes/   setup models (Module A builds the screens)
│   │   │   ├── users/  audit/  files/
│   │   │   ├── students/     Student model only; Module A builds the rest
│   │   │   └── results/ inward/ documents/ clearance/ tc/   empty: built by interns
│   │   ├── templates/        TC PDF layouts (Module C)
│   │   └── seed/             seed.js and seedData.js
│   └── tests/                Jest + Supertest tests
└── edu-frontend/                   React app. Its own README explains the folders
```

## The middleware chain

Every protected route runs the same five steps, in this order:

```
auth  →  tenantScope  →  requireRole(...)  →  validate(schema)  →  controller  →  service
```

| Step          | Question it answers                                                  | On failure                    |
| ------------- | -------------------------------------------------------------------- | ----------------------------- |
| `auth`        | Who is calling? (checks the access token)                            | 401                           |
| `tenantScope` | Which institute, and may this user open it? (reads `X-Institute-Id`) | 403, written to the audit log |
| `requireRole` | Does the user's role in that institute allow this?                   | 403                           |
| `validate`    | Is the input correct? (Joi)                                          | 400 with one detail per field |
| `controller`  | Calls the service and sends the answer                               | the service throws `ApiError` |

Inside the service, every query starts from `scoped(req)` (`{ tenantId, instituteId }`), and every
create, update and delete calls `audit(...)`. If you forget `tenantId` in a query, the `tenantGuard`
plugin throws an error instead of returning another institute's data.

Only the auth routes (`/auth/login`, `/refresh`, `/logout`, `/me`) skip part of the chain, because
they run before an institute is chosen.

## API response format

```jsonc
// Success
{ "success": true, "data": { ... } }
// Success, list
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 57 } }
// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Please correct the highlighted fields",
  "details": [ { "field": "name", "message": "Name is required" } ] } }
```

Status codes: 200/201 success, 400 validation, 401 not logged in, 403 no access, 404 not found,
409 duplicate, 429 too many login attempts. Error codes are listed in `edu-backend/src/utils/errorCodes.js`.

## How to add a new module (copy Courses)

Example: inward batches (`INW-01`). Replace `inward` / `InwardBatch` with your module.

### Backend

1. **Model.** Copy `modules/courses/course.model.js` to `modules/inward/inwardBatch.model.js`.
   Keep `tenantId` and `instituteId` first, start every index with them, keep both plugins.
   Add the file to `src/config/models.js`.
2. **Validation.** Copy `course.validation.js`. One Joi schema per route body. Use
   `listQuery([...sortable fields])` for the list.
3. **Service.** Copy `course.service.js`. Every query starts from `scoped(req)`, and one record
   by id is loaded with `findScopedOr404(req, Model, id, 'entity')`. Throw `ApiError`
   for problems, and call `audit()` after every create, update and delete. Several writes that
   must succeed together go inside `withTransaction()`.
4. **Controller.** Copy `course.controller.js`. One line per route: call the service, send the answer.
5. **Routes.** Copy `course.routes.js`. Keep the full chain on every route and pick the roles from
   the SRS role table. Actions are verbs: `POST /inward-batches/:id/close`.
6. **Mount.** Add one line in `src/app.js`: `api.use('/inward-batches', inwardRoutes);`
7. **Test in Postman.** Test the happy case, one wrong-input case (expect 400) and one wrong-role
   case (expect 403). Add a Jest test in `edu-backend/tests/` if the rule is about security or numbering.
8. **README.** Update the module README with its endpoints.

### Frontend

1. **API file.** Copy `edu-frontend/src/api/courses.js` to `edu-frontend/src/api/inward.js`.
2. **Page.** Copy `edu-frontend/src/pages/courses/CoursesPage.jsx` to `edu-frontend/src/pages/inward/InwardPage.jsx`.
3. **Route.** Add an entry in `edu-frontend/src/routes/routes.jsx` (replace the "coming soon" placeholder).
4. **Columns and form.** Change the table columns and the `Form*` fields to match your API.
5. **Check.** Log in as an allowed role and a not-allowed role, switch institutes, and test at 360 px.

`edu-frontend/README.md` explains each step in more detail.

## Git workflow

- Never push to `main`. One task = one branch: `feature/<SRS-ID>-<short-name>`,
  e.g. `feature/INW-03-mark-received`. Bug fixes: `fix/<SRS-ID>-<short-name>`.
- Commit messages start with the SRS ID: `INW-03: mark document received`.
- Open a pull request (the template asks what changed, SRS IDs, how to test, screenshot).
  Keep it small: one task, ideally under 300 changed lines.
- Changes to login, roles, tenant security or TC numbering also need the project owner's review.

## Troubleshooting

| Problem                                               | Fix                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `Missing settings in edu-backend/.env: ...`           | Copy `edu-backend/.env.example` to `edu-backend/.env` and fill every value             |
| `tenantGuard: ... was called without tenantId`        | Build the query from `scoped(req)`; for populate add `match: { tenantId }`             |
| `Schema hasn't been registered for model "X"`         | Add the model file to `edu-backend/src/config/models.js`                               |
| Login works but every page says "Select an institute" | The request has no `X-Institute-Id`: call the API only through `edu-frontend/src/api/` |
| Logged out every time the page is refreshed           | Use Chrome or Edge. Safari blocks the secure refresh cookie on `localhost`             |
| ESLint/Prettier errors on every line (Windows)        | Line endings became CRLF: see "Windows laptops" above                                  |
| `Too many login attempts`                             | Wait 15 minutes, or restart the API in development                                     |
| Port 5000 or 5173 already in use                      | Stop the other `npm run dev`, or change `PORT` / the Vite port                         |
