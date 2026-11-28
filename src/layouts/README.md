# layouts — AppLayout, the frame around every logged-in page: sidebar menu, top bar, institute switcher and user menu.

EduRecords Header Update

Copy these files into the same paths in your Edu-Record-FE project.

Files:

- src/layouts/AppLayout.jsx
- src/layouts/InstituteSwitcher.jsx
- src/layouts/UserMenu.jsx
- src/layouts/GlobalStudentSearch.jsx (new component)

The update keeps the existing AuthContext, institute switching, permissions-based route menu,
UserMenu logout behavior, and studentsApi.list endpoint. The global search uses the existing
`search` query parameter and navigates to the existing /students/:id profile route.

After copying:

1. Run npm run lint
2. Run npm run format:check
3. Run npm run build
4. Test institute switching, student search, user menu/logout, and responsive navigation.

Checks performed on these four files:

- ESLint: passed
- Prettier format check: passed

The production build could not be run in the review environment because the ZIP's node_modules
did not contain the Linux Rolldown native binding. Run the build in your normal development
environment after copying these files.
