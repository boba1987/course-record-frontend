# Course Record — admin UI

Next.js App Router admin for the `course-record-backend` API: JWT login, paginated lists, and CRUD dialogs for professors, students, courses (with study-program semesters 1–8), course semesters, enrollments, exams, authors, books, and course books.

## Repository layout

The runnable app lives in this **nested** folder: `course-record-frontend/course-record-frontend/`. Run all npm commands from here (the directory that contains this `README.md`).

## Environment

Create `.env.local` from `.env.local.example`:

- **`NEXT_PUBLIC_API_BASE_URL`** — Spring base URL including context path, without a trailing slash (for example `http://localhost:8080/course-record`). Required at build and runtime; `src/lib/config.ts` throws if it is missing.

## Backend CORS

The API must allow this origin (default dev: `http://localhost:3000`). Configure `app.cors.allowed-origins` in the backend (see `course-record-backend` README).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated requests to dashboard routes are redirected to `/login` by middleware (cookie `cr_access_token`).

## Production build

Use a normal production `NODE_ENV` when building (for example `NODE_ENV=production npm run build`). A non-standard `NODE_ENV` can break the Next.js prerender step.

## API shape: pagination

List endpoints return Spring Data **PagedModel** JSON (via DTO serialization):

- **`content`**: array of items
- **`page`**: `{ size, number, totalElements, totalPages }`

Types are defined in `src/types/api.ts`.

## Auth and security note

The access token is stored in a **JavaScript-readable** cookie so Edge middleware can enforce login. That trades XSS resilience for route protection; use HTTPS in production and treat this as an internal admin surface.
