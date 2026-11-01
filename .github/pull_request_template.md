<!-- PR title: "INW-03: mark document received" (SRS ID first). Branch: feature/INW-03-mark-received -->

## What changed

<!-- Two or three lines, in plain words -->

## SRS IDs

<!-- e.g. INW-03, INW-07 -->

## How to test

<!-- Steps the reviewer can follow: which user to log in as, which institute, what to click,
     what should happen. Include one wrong-input case and one wrong-role case. -->

1.
2.
3.

## Screenshot

<!-- Laptop width and 360 px phone width -->

## Checklist

- [ ] Follows the Courses page pattern: api file, page, route entry in `routes.jsx`
- [ ] API calls only through `src/api/`; uses DataTable, FormDialog, ConfirmDialog, PageHeader
- [ ] Page declares its `permission` in `routes.jsx`; buttons use `can(...)`; no hard-coded role, status or category strings
- [ ] Page handles loading, empty and error; works at 360 px; every input has a label
- [ ] Shared constants changed? The same change is in Edu-Record-BE
- [ ] `npm run lint` and `npm run build` pass
