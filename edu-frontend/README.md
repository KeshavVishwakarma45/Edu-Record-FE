# EduRecords client

The React app staff use in the browser (PC or Android phone). Built with Vite, MUI and React Hook Form.
Read the **Frontend rules** in `/CLAUDE.md` before your first pull request.

## Run it

```bash
# from the repo root (starts the API and this app together)
npm run dev

# or only the client
cp edu-frontend/.env.example edu-frontend/.env     # once
npm run dev -w edu-frontend                   # http://localhost:5173
```

`VITE_API_URL` in `edu-frontend/.env` points at the API (default `http://localhost:5000/api/v1`).
There is no dev proxy.

## Folder map

| Folder                 | What lives there                                                                  |
| ---------------------- | --------------------------------------------------------------------------------- |
| `src/api/`             | `client.js` (the one axios instance) and one file per module, e.g. `courses.js`   |
| `src/components/`      | Shared pieces: PageHeader, DataTable, FormDialog, ConfirmDialog, StatusChip...    |
| `src/components/form/` | Form inputs wired to React Hook Form: FormTextField, FormSelect, FormDateField... |
| `src/constants/`       | Roles, statuses, categories, course patterns (same files as the server)           |
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
`src/pages/courses/CoursesPage.jsx` repeats these steps.

1. **API file.** Copy `src/api/courses.js` to `src/api/<module>.js` and change the URLs.
   Pages never call axios themselves.
2. **Page.** Copy `src/pages/courses/CoursesPage.jsx` to `src/pages/<module>/<Module>Page.jsx`
   and rename "course" everywhere. Keep `PageHeader` at the top.
3. **Route entry.** Add one object to `appRoutes` in `src/routes/routes.jsx`: `path`, `element`,
   `roles` (from the SRS role table) and `menu: { label, icon }`. The sidebar updates itself.
4. **Table columns.** Change `columns` for `DataTable`. Only mark a column `sortable` if the
   server's `listQuery([...])` allows that field. Load rows with `useList(yourApi.list)`.
5. **Form dialog.** Change the fields inside `FormDialog` to your fields, using the `Form*`
   components with the same rules as the server's Joi schema. Use `ConfirmDialog` for deletes and
   `useNotify` for success and error toasts.
6. **Test as the right role.** Log in as a role that should see the page and one that should not
   (see the seeded logins in the root README). Switch institutes. Check it at 360 px width.

## Two rules every page follows

**The 3-states rule.** Every page shows something sensible in all three states:
loading (skeleton rows), empty (`EmptyState`) and error (`ErrorState` with a Retry button).
`DataTable` already does all three when you pass it `loading`, `error` and `onRetry` from `useList`.

**The 360 px rule.** Everything must work on a 360 px wide phone. In Chrome DevTools, turn on the
device toolbar (Ctrl+Shift+M) and pick a 360 px width. The page must not scroll sideways. Only a
table may scroll sideways, inside its own box (DataTable does this). Dialogs become full screen on phones.
