# EduRecords web app (Edu-Record)

The React app staff use in the browser (office PC or Android phone) to track university
marksheets, degrees and Transfer Certificates (TC) for **Sant Singaji Education Society**:
SSISM (Vikram University) and SSEC (RGPV). Built with Vite, MUI and React Hook Form.

The API lives in its own repository, **Edu-Record-BE**
(https://github.com/KeshavVishwakarma45/Edu-Record-BE). Each repo has its own `node_modules`,
settings and Git history; you run them in two terminals.

This repo is the **skeleton**: login, institute switcher, role-based menu, shared components and
one complete example screen (**Courses**). `CLAUDE.md` holds the project rules, including the
**Frontend rules**. Read it before your first pull request.

## Prerequisites

- **Node.js 22** (the version in `.nvmrc`). Check with `node -v`.
- **Google Chrome or Microsoft Edge**. Safari (and sometimes Firefox) may refuse the secure refresh
  cookie on `http://localhost`, so you get logged out on every page refresh.
- **Git**, and a GitHub account added to both repositories
- **VS Code** with the ESLint, Prettier, ES7+ React snippets and GitLens extensions
- The **backend running** on http://localhost:5000 (see the Edu-Record-BE README)

### Windows laptops

- **Line endings.** Every file is stored with LF line endings (`.gitattributes` enforces it).
  Before you clone, run `git config --global core.autocrlf false` so Git does not convert files to
  CRLF; otherwise ESLint and Prettier report every line as changed. In VS Code, set
  "Files: Eol" to `\n` (the `.editorconfig` does this if the EditorConfig extension is installed).
  Already cloned with CRLF? Run `git rm --cached -r . -q` then `git reset --hard` to check out again
  (commit or stash your work first).
- **Husky (the pre-commit check).** Git for Windows runs the hook with its own Git Bash, so commit
  from the VS Code terminal or Git Bash. The hook is installed by `npm install`: if a commit says
  `.husky/_/pre-commit: No such file`, run `npm install` again. GUI tools such as GitHub Desktop
  may not find `npx`; commit from a terminal instead.
- Use `copy .env.example .env` instead of `cp` in step 4 below.

## Setup

Clone both repos **next to each other** in one folder, so the folder looks like this:

```
edurecords/
├── edu-backend/    the API (Edu-Record-BE)
└── edu-frontend/   this repo (Edu-Record)
```

1. Install Node.js 22, Git, VS Code and Chrome or Edge. Set your Git name and email:
   `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`.
2. Set up and start the backend first (Edu-Record-BE README: clone, `npm install`, `.env`,
   `npm run seed`, `npm run dev`).
3. In a second terminal, from the `edurecords` folder:
   `git clone https://github.com/KeshavVishwakarma45/Edu-Record.git edu-frontend` then `cd edu-frontend`.
4. Install this repo's packages: `npm install`. Copy the settings file: `cp .env.example .env`.
   `VITE_API_URL` in `.env` points at the API (default `http://localhost:5000/api/v1`; there is no dev proxy).
5. Start the app: `npm run dev`, then open http://localhost:5173 in Chrome or Edge.
6. Log in with a seeded user, for example `9000000001` (Society Admin, both institutes) or
   `9100000003` (SSISM TC Clerk). The password is `Edu@12345` unless the backend's `SEED_PASSWORD`
   says otherwise. The full login table is in the Edu-Record-BE README and printed by `npm run seed`.

## Scripts

| Command           | What it does                                                       |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Starts the app on http://localhost:5173 with live reload           |
| `npm run build`   | Builds the app into `dist/` for the pilot server                   |
| `npm run preview` | Serves the built `dist/` locally to check it                       |
| `npm run lint`    | Checks the code with ESLint (`npm run lint:fix` fixes what it can) |
| `npm run format`  | Formats all files with Prettier                                    |

A Git hook (Husky) runs ESLint and Prettier on your staged files at every commit.
If the commit is refused, run `npm run lint:fix` and `npm run format`, then commit again.

## Folder map

| Folder                 | What lives there                                                                  |
| ---------------------- | --------------------------------------------------------------------------------- |
| `src/api/`             | `client.js` (the one axios instance) and one file per module, e.g. `courses.js`   |
| `src/components/`      | Shared pieces: PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip...    |
| `src/components/form/` | Form inputs wired to React Hook Form: FormTextField, FormSelect, FormDateField... |
| `src/constants/`       | Roles, statuses, categories, course patterns, genders (same files as the backend) |
| `src/context/`         | AuthContext: user, institutes, selected institute, login, logout                  |
| `src/hooks/`           | useAuth, useList, useRequest, useNotify                                           |
| `src/layouts/`         | AppLayout: sidebar, top bar, institute switcher, user menu                        |
| `src/pages/`           | One folder per screen. `pages/courses/CoursesPage.jsx` is the EXAMPLE             |
| `src/routes/`          | `routes.jsx` (every page + roles + menu) and ProtectedRoute                       |
| `src/theme/`           | MUI theme and institute badge colours                                             |
| `src/utils/`           | formatDate, formatDateTime, formatCurrency, getErrorMessage                       |

Import with the `@` alias: `import PageHeader from '@/components/PageHeader'`.

## How to add a new page (6 steps)

Use **Courses** as the pattern for every step. The comment at the top of
`src/pages/courses/CoursesPage.jsx` repeats these steps. The API for the page is built first in
Edu-Record-BE.

1. **API file.** Copy `src/api/courses.js` to `src/api/<module>.js` and change the URLs.
   Pages never call axios themselves.
2. **Page.** Copy `src/pages/courses/CoursesPage.jsx` to `src/pages/<module>/<Module>Page.jsx`
   and rename "course" everywhere. Keep `PageHeader` at the top.
3. **Route entry.** Add one object to `appRoutes` in `src/routes/routes.jsx`: `path`, `element`,
   `roles` (from the SRS role table) and `menu: { label, icon }`. The sidebar updates itself.
   Replace the "Coming soon" placeholder if there is one.
4. **Table columns.** Change `columns` for `DataTable`. Only mark a column `sortable` if the
   backend's `listQuery([...])` allows that field. Load rows with `useList(yourApi.list)`.
5. **Form dialog.** Change the fields inside `FormDialog` to your fields, using the `Form*`
   components with the same rules as the backend's Joi schema. Use `ConfirmDialog` for deletes and
   `useNotify` for success and error toasts.
6. **Test as the right role.** Log in as a role that should see the page and one that should not.
   Switch institutes. Check it at 360 px width.

## Two rules every page follows

**The 3-states rule.** Every page shows something sensible in all three states:
loading (skeleton rows), empty (`EmptyState`) and error (`ErrorState` with a Retry button).
`DataTable` already does all three when you pass it `loading`, `error` and `onRetry` from `useList`.

**The 360 px rule.** Everything must work on a 360 px wide phone. In Chrome DevTools, turn on the
device toolbar (Ctrl+Shift+M) and pick a 360 px width. The page must not scroll sideways. Only a
table may scroll sideways, inside its own box (DataTable does this). Dialogs become full screen on phones.

## Shared constants

`src/constants/{roles,statuses,categories,coursePatterns,genders}.js` must be identical to the
backend repo's copies. Change both in the same day, in two pull requests. The backend's `npm test`
checks that they match when this repo is cloned next to it.

## Git workflow

- Never push to `main`. One task = one branch: `feature/<SRS-ID>-<short-name>`,
  e.g. `feature/INW-03-mark-received`. Bug fixes: `fix/<SRS-ID>-<short-name>`.
- Commit messages start with the SRS ID: `INW-03: mark document received`.
- Open a pull request (the template asks what changed, SRS IDs, how to test, screenshot).
  Keep it small: one task, ideally under 300 changed lines.
- A feature that needs both an API and a screen is two pull requests with the same SRS ID:
  one in Edu-Record-BE, one here.

## Troubleshooting

| Problem                                               | Fix                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------- |
| "Cannot reach the server" on login                    | Start the backend (`npm run dev` in edu-backend); check `VITE_API_URL`     |
| Login works but every page says "Select an institute" | The request has no `X-Institute-Id`: call the API only through `src/api/`  |
| Logged out every time the page is refreshed           | Use Chrome or Edge. Safari blocks the secure refresh cookie on `localhost` |
| ESLint/Prettier errors on every line (Windows)        | Line endings became CRLF: see "Windows laptops" above                      |
| Port 5173 already in use                              | Stop the other `npm run dev`                                               |
