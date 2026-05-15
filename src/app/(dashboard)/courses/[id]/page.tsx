"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFieldArray, useForm, type FieldError } from "react-hook-form";
import { fieldErrorMessage } from "@/lib/form-errors";
import { typedZodResolver } from "@/lib/typed-zod-resolver";
import {
  courseFormSchema,
  courseFormToPayload,
  courseFormValuesFromDto,
  emptyCourseFormValues,
  type CourseFormValues,
} from "@/lib/course-form";
import { apiFetch, buildListQuery } from "@/lib/api";
import { authorLabel, entityById, professorLabel } from "@/lib/entity-labels";
import { cn } from "@/lib/utils";
import type { AuthorDto, BookDto, CourseDto, PagedModel, ProfessorDto } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PendingButton } from "@/components/admin/pending-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

const COURSES_API = "/api/courses";
const PROFESSORS_API = "/api/professors";
const BOOKS_API = "/api/books";
const AUTHORS_API = "/api/authors";

const selectClassName =
  "border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const courseId = Number(params.id);
  const validId = Number.isFinite(courseId) && courseId > 0;

  const [addBookId, setAddBookId] = useState("");
  const [confirmDeleteCourse, setConfirmDeleteCourse] = useState(false);

  const courseQuery = useQuery({
    queryKey: [COURSES_API, courseId],
    queryFn: () => apiFetch<CourseDto>(`${COURSES_API}/${courseId}`),
    enabled: validId,
  });

  const professors = useQuery({
    queryKey: [PROFESSORS_API, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<ProfessorDto>>(
        `${PROFESSORS_API}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const allBooks = useQuery({
    queryKey: [BOOKS_API, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<BookDto>>(
        `${BOOKS_API}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const authors = useQuery({
    queryKey: [AUTHORS_API, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<AuthorDto>>(
        `${AUTHORS_API}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const form = useForm<CourseFormValues>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    resolver: typedZodResolver<CourseFormValues>(courseFormSchema),
    defaultValues: emptyCourseFormValues,
    values: courseQuery.data ? courseFormValuesFromDto(courseQuery.data) : undefined,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "semesters",
  });

  const saveCourse = useMutation({
    mutationFn: async (payload: ReturnType<typeof courseFormToPayload>) => {
      await apiFetch(`${COURSES_API}/${courseId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: async () => {
      toast.success("Course saved");
      await qc.invalidateQueries({ queryKey: [COURSES_API] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCourse = useMutation({
    mutationFn: async () => {
      await apiFetch(`${COURSES_API}/${courseId}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      toast.success("Course deleted");
      await qc.invalidateQueries({ queryKey: [COURSES_API] });
      router.push("/courses");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const professorById = useMemo(
    () => entityById(professors.data?.content),
    [professors.data?.content],
  );
  const authorById = useMemo(() => entityById(authors.data?.content), [authors.data?.content]);
  const bookById = useMemo(() => entityById(allBooks.data?.content), [allBooks.data?.content]);

  const bookIds = form.watch("bookIds") ?? [];
  const selectedBookIdSet = useMemo(() => new Set(bookIds), [bookIds]);
  const availableBooks = useMemo(
    () => (allBooks.data?.content ?? []).filter((b) => !selectedBookIdSet.has(b.id)),
    [allBooks.data?.content, selectedBookIdSet],
  );
  const selectedBooks = useMemo(
    () =>
      bookIds
        .map((id) => bookById.get(id))
        .filter((b): b is BookDto => b != null),
    [bookIds, bookById],
  );

  const { errors } = form.formState;
  const semestersErrors = errors.semesters;
  const semestersUniqueMessage = fieldErrorMessage(
    semestersErrors && !Array.isArray(semestersErrors)
      ? (semestersErrors as FieldError)
      : undefined,
  );
  const bookIdsErr = errors.bookIds;

  if (!validId) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">Invalid course id.</p>
        <Button nativeButton={false} render={<Link href="/courses" />}>
          Back to courses
        </Button>
      </div>
    );
  }

  const course = courseQuery.data;
  const loading = courseQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1"
            nativeButton={false}
            render={<Link href="/courses" />}
          >
            <ArrowLeft className="size-4" />
            Courses
          </Button>
          {loading ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {course?.code} — {course?.title}
              </h1>
              <p className="text-muted-foreground text-sm">Course ID {courseId}</p>
            </>
          )}
        </div>
        {!loading && course && (
          <Button variant="destructive" onClick={() => setConfirmDeleteCourse(true)}>
            Delete course
          </Button>
        )}
      </div>

      {courseQuery.isError && (
        <p className="text-destructive text-sm">
          {courseQuery.error instanceof Error ? courseQuery.error.message : "Failed to load course"}
        </p>
      )}

      <form
        id="course-edit-form"
        noValidate
        className="space-y-6 pb-28"
        onSubmit={form.handleSubmit(
          (v) => saveCourse.mutate(courseFormToPayload(v)),
          () => toast.error("Fix the highlighted errors before saving."),
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Course details</CardTitle>
            <CardDescription>Code, title, description, and ESPB credits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                      id="code"
                      aria-invalid={!!errors.code}
                      {...form.register("code")}
                    />
                    {errors.code?.message && (
                      <p className="text-destructive text-sm">{errors.code.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="espb">ESPB</Label>
                    <Input
                      id="espb"
                      type="number"
                      min={1}
                      step={1}
                      aria-invalid={!!errors.espb}
                      {...form.register("espb")}
                    />
                    {errors.espb?.message && (
                      <p className="text-destructive text-sm">{errors.espb.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    aria-invalid={!!errors.title}
                    {...form.register("title")}
                  />
                  {errors.title?.message && (
                    <p className="text-destructive text-sm">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    rows={6}
                    aria-invalid={!!errors.description}
                    className={cn(
                      "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-[120px] w-full rounded-lg border px-2.5 py-2 text-base outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                      errors.description && "border-destructive",
                    )}
                    {...form.register("description")}
                  />
                  {errors.description?.message && (
                    <p className="text-destructive text-sm">{errors.description.message}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Card>
            <CardHeader>
              <CardTitle>Professor</CardTitle>
              <CardDescription>Assign or change the course professor.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-9 w-full" />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="professorId">Professor</Label>
                  <select id="professorId" className={selectClassName} {...form.register("professorId")}>
                    <option value="">None</option>
                    {(professors.data?.content ?? []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} — {p.firstName} {p.lastName}
                      </option>
                    ))}
                  </select>
                  {course?.professorId != null && (
                    <p className="text-muted-foreground text-xs">
                      Current: {professorLabel(professorById, course.professorId)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Study-program semesters</CardTitle>
                <CardDescription>Semester ordinals 1–8 (must be unique per course).</CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => append({ semester: 1 })}
              >
                Add semester
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {semestersUniqueMessage && (
                <p className="text-destructive text-sm">{semestersUniqueMessage}</p>
              )}
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => {
                  const rowErr = Array.isArray(semestersErrors)
                    ? semestersErrors[index]?.semester
                    : undefined;
                  const rowMessage = fieldErrorMessage(rowErr);
                  return (
                  <div key={field.id} className="flex items-end gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <Label className="text-muted-foreground text-xs">Semester {index + 1}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={8}
                        aria-invalid={!!rowMessage}
                        {...form.register(`semesters.${index}.semester` as const)}
                      />
                      {rowMessage && (
                        <p className="text-destructive text-xs">{rowMessage}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => remove(index)}
                      disabled={fields.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                  );
                })}
              </div>
            )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Books</CardTitle>
            <CardDescription>
              Literature for this course. Add or remove books, then save.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeof bookIdsErr?.message === "string" && (
              <p className="text-destructive text-sm">{bookIdsErr.message}</p>
            )}
            <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[12rem] flex-1 space-y-2">
              <Label htmlFor="add-book">Add book</Label>
              <select
                id="add-book"
                className={selectClassName}
                value={addBookId}
                onChange={(e) => setAddBookId(e.target.value)}
                disabled={saveCourse.isPending || availableBooks.length === 0}
              >
                <option value="">
                  {availableBooks.length === 0
                    ? selectedBooks.length === 0
                      ? "No books available"
                      : "All books added"
                    : "Select a book…"}
                </option>
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.title}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              disabled={!addBookId || saveCourse.isPending}
              onClick={() => {
                const id = Number(addBookId);
                if (!Number.isFinite(id)) return;
                form.setValue("bookIds", [...(form.getValues("bookIds") ?? []), id], {
                  shouldValidate: true,
                });
                setAddBookId("");
              }}
            >
              Add book
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedBooks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      No books linked.
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedBooks.map((book) => (
                    <TableRow key={book.id} className="[&_td]:align-top">
                      <TableCell>{book.id}</TableCell>
                      <TableCell className="max-w-md whitespace-normal break-words">
                        {book.title}
                      </TableCell>
                      <TableCell>{book.publicationDate}</TableCell>
                      <TableCell>{authorLabel(authorById, book.authorId)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={saveCourse.isPending}
                          onClick={() =>
                            form.setValue(
                              "bookIds",
                              (form.getValues("bookIds") ?? []).filter((id) => id !== book.id),
                              { shouldValidate: true },
                            )
                          }
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        </Card>

      </form>

      <div
        className={cn(
          "fixed bottom-0 z-30 border-t bg-background/95 py-4 backdrop-blur",
          "inset-x-0 md:left-[var(--sidebar-width)]",
          "px-4 md:px-6",
          "shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.45)]",
        )}
      >
        <div className="mx-auto flex max-w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground hidden text-sm sm:block">
            Saves course details, professor, semesters, and books.
          </p>
          <PendingButton
            type="submit"
            form="course-edit-form"
            size="lg"
            pending={saveCourse.isPending}
            disabled={loading}
            className="h-11 w-full px-8 text-base font-semibold shadow-md sm:ml-auto sm:w-auto sm:min-w-[12rem]"
          >
            Save course
          </PendingButton>
        </div>
      </div>

      <AlertDialog open={confirmDeleteCourse} onOpenChange={setConfirmDeleteCourse}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              {course?.code} — {course?.title}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCourse.isPending}>Cancel</AlertDialogCancel>
            <PendingButton
              pending={deleteCourse.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCourse.mutate()}
            >
              Delete
            </PendingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
