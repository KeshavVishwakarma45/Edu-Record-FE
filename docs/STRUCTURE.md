# Frontend folder structure (Edu-Record)

Every file in this repository and what it is for. The backend has its own list in the
Edu-Record-BE repo (`docs/STRUCTURE.md`). Why things are built this way: the Architecture
Decision Records in Edu-Record-BE, `docs/adr/` (ADR-013 covers the frontend patterns).

```
edu-frontend/
├── .editorconfig              editor settings: LF line endings, 2-space indent
├── .env.example               VITE_API_URL (address of the API); copy to .env
├── .gitattributes             forces LF line endings on every OS
├── .github/
│   └── pull_request_template.md   what changed, SRS IDs, how to test, screenshot, checklist
├── .gitignore                 keeps node_modules, dist and .env out of Git
├── .husky/
│   └── pre-commit             runs ESLint + Prettier on staged files before every commit
├── .npmrc                     save-exact=true: new packages are pinned to an exact version
├── .nvmrc                     Node.js version (22)
├── .prettierignore            files Prettier skips
├── .prettierrc.json           formatting rules (single quotes, 100 columns, trailing commas)
├── CLAUDE.md                  project rules, including the Frontend rules
├── README.md                  setup, scripts, folder map, how to add a page
├── eslint.config.js           lint rules (React, hooks, no console.log)
├── index.html                 the single HTML page Vite serves
├── jsconfig.json              lets VS Code understand the @ import alias
├── package.json               dependencies and scripts (dev, build, lint, format)
├── package-lock.json          exact installed versions (do not edit by hand)
├── vite.config.js             Vite: React plugin, @ alias → src/, port 5173
│
├── docs/
│   ├── STRUCTURE.md           this file
│   └── handover/README.md     handover notes before the Day 15 swap
│
├── public/
│   └── favicon.svg            browser tab icon
│
└── src/
    ├── main.jsx               starts React: theme, date pickers, toasts, <App />
    ├── App.jsx                the router: AuthProvider → /login or the logged-in layout + pages
    │
    ├── api/                   the ONLY place that talks to the server
    │   ├── client.js          one axios instance: token + X-Institute-Id, refresh once on 401, error format
    │   ├── auth.js            login, refresh, logout, me
    │   └── courses.js         ★ EXAMPLE API FILE: list, get, create, update, remove, options
    │
    ├── components/            shared building blocks every page reuses
    │   ├── PageHeader.jsx     title, subtitle, breadcrumbs, action buttons
    │   ├── DataTable.jsx      server-side paging, sort, search; skeleton, empty and error states
    │   ├── FormDialog.jsx     create/edit dialog with React Hook Form; server errors on the fields
    │   ├── ConfirmDialog.jsx  "are you sure?" before deleting
    │   ├── StatusChip.jsx     document status with its fixed colour
    │   ├── InstituteBadge.jsx coloured SSISM (pink) / SSEC (blue-grey) badge
    │   ├── EmptyState.jsx     "nothing here yet"
    │   ├── ErrorState.jsx     "could not load" + Retry
    │   ├── LoadingScreen.jsx  full-screen spinner while the session is restored
    │   ├── ErrorBoundary.jsx  app-wide "Something went wrong" screen (router errorElement)
    │   └── form/              inputs already wired to React Hook Form
    │       ├── FormTextField.jsx
    │       ├── FormSelect.jsx
    │       ├── FormNumberField.jsx
    │       ├── FormDateField.jsx   dd/mm/yyyy picker; sends 'YYYY-MM-DD'
    │       └── FormCheckbox.jsx
    │
    ├── constants/             ★ identical to the backend repo's copies
    │   ├── roles.js           7 roles, STAFF_ROLES, COURSE_WRITE_ROLES, ROLE_LABELS
    │   ├── statuses.js        document statuses + colours, student statuses
    │   ├── categories.js      GEN, OBC, SC, ST, EWS
    │   ├── coursePatterns.js  semester / year, buildExamTerms()
    │   └── genders.js         Male, Female, Other
    │
    ├── context/
    │   └── AuthContext.jsx    user, institutes, selected institute (remembered per tab), login, logout
    │
    ├── hooks/
    │   ├── useAuth.js         read the AuthContext
    │   ├── useList.js         loads one page of a list; reloads on page/sort/search/institute change
    │   ├── useRequest.js      one action (save, delete) with loading and error
    │   └── useNotify.js       success / error / info toasts
    │
    ├── layouts/
    │   ├── AppLayout.jsx      sidebar menu (filtered by role), top bar, phone drawer
    │   ├── InstituteSwitcher.jsx  select the institute; only the user's institutes are listed
    │   └── UserMenu.jsx       name, role, mobile, Log out
    │
    ├── pages/
    │   ├── auth/LoginPage.jsx         mobile + password, show/hide, back to the wanted page
    │   ├── dashboard/DashboardPage.jsx 4 cards (values come later from Modules B and C)
    │   ├── courses/CoursesPage.jsx    ★ EXAMPLE PAGE: list, add, edit, delete; "how to copy" steps on top
    │   └── system/
    │       ├── ComingSoonPage.jsx     placeholder for Students, Inward, Hand-over, Clearance, TC, Reports
    │       ├── ForbiddenPage.jsx      403 "No access"
    │       └── NotFoundPage.jsx       404
    │
    ├── routes/
    │   ├── routes.jsx         EVERY page: path, element, allowed roles, menu label and icon
    │   └── ProtectedRoute.jsx not logged in → /login; wrong role → No access
    │
    ├── theme/
    │   └── index.js           MUI theme (14px, 8px corners, compact tables) + institute colours
    │
    └── utils/
        └── format.js          formatDate (dd/mm/yyyy IST), formatDateTime, formatCurrency (₹), getErrorMessage
```

Every folder in `src/` also has a one-line `README.md` explaining its purpose.

## Files that are NOT in Git

| Path            | What it is              | Created by               |
| --------------- | ----------------------- | ------------------------ |
| `.env`          | `VITE_API_URL`          | you, from `.env.example` |
| `node_modules/` | installed packages      | `npm install`            |
| `dist/`         | built app for the pilot | `npm run build`          |

## How a screen gets its data

```
CoursesPage.jsx
   useList(coursesApi.list)  ── params { page, limit, sort, search } + selected institute
        ▼
api/courses.js  →  api/client.js  ── adds Authorization + X-Institute-Id
        ▼                            401? → POST /auth/refresh once → retry
Edu-Record-BE API  /api/v1/courses
        ▼
{ rows, total }  →  <DataTable>  (skeleton while loading, EmptyState, ErrorState + Retry)
```
