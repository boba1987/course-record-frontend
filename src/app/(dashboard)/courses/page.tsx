"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFieldArray, useForm } from "react-hook-form";
import { typedZodResolver } from "@/lib/typed-zod-resolver";
import {
  courseFormSchema,
  courseFormToPayload,
  emptyCourseFormValues,
  type CourseFormOutput,
  type CourseFormValues,
} from "@/lib/course-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { apiFetch, buildListQuery } from "@/lib/api";
import { entityById, professorLabel } from "@/lib/entity-labels";
import { cn } from "@/lib/utils";
import type { BookDto, CourseDto, CoursePayload, PagedModel, ProfessorDto } from "@/types/api";
import { PaginationFooter, usePagedModel, EMPTY_LIST_FILTERS } from "@/components/admin/pagination";
import { ListFiltersToolbar } from "@/components/admin/list-filters-toolbar";
import { Skeleton } from "@/components/ui/skeleton";

const API = "/api/courses";
const PROFESSORS = "/api/professors";
const BOOKS = "/api/books";
const selectClassName =
  "border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm";

export default function CoursesPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [draftName, setDraftName] = useState("");
  const [appliedName, setAppliedName] = useState("");
  const qc = useQueryClient();
  const listFilters = useMemo(() => {
    const n = appliedName.trim();
    if (!n) return EMPTY_LIST_FILTERS;
    return { name: n };
  }, [appliedName]);
  const list = usePagedModel<CourseDto>(API, page, 20, "id,asc", listFilters);
  const professors = useQuery({
    queryKey: [PROFESSORS, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<ProfessorDto>>(
        `${PROFESSORS}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseDto | null>(null);
  const [deleting, setDeleting] = useState<CourseDto | null>(null);
  const [addBookId, setAddBookId] = useState("");

  const allBooks = useQuery({
    queryKey: [BOOKS, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<BookDto>>(
        `${BOOKS}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
    enabled: open,
  });

  const form = useForm<CourseFormValues>({
    shouldUseNativeValidation: true,
    resolver: typedZodResolver<CourseFormValues>(courseFormSchema),
    defaultValues: emptyCourseFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "semesters",
  });

  const save = useMutation({
    mutationFn: async (payload: CoursePayload) => {
      if (editing) {
        await apiFetch(`${API}/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(API, { method: "POST", body: JSON.stringify(payload) });
      }
    },
    onSuccess: async () => {
      toast.success(editing ? "Updated" : "Created");
      setOpen(false);
      setAddBookId("");
      await qc.invalidateQueries({ queryKey: [API] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      await apiFetch(`${API}/${id}`, { method: "DELETE" });
    },
    onSuccess: async () => {
      toast.success("Deleted");
      setDeleting(null);
      await qc.invalidateQueries({ queryKey: [API] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const professorById = useMemo(
    () => entityById(professors.data?.content),
    [professors.data?.content],
  );
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

  const rows = list.data?.content ?? [];
  const meta = list.data?.page;
  const semErr = form.formState.errors.semesters;
  const bookIdsErr = form.formState.errors.bookIds;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset(emptyCourseFormValues);
            setAddBookId("");
            setOpen(true);
          }}
        >
          Add course
        </Button>
      </div>

      <ListFiltersToolbar
        onApply={() => {
          setAppliedName(draftName);
          setPage(0);
        }}
        onClear={() => {
          setDraftName("");
          setAppliedName("");
          setPage(0);
        }}
      >
        <div className="w-full max-w-md space-y-1.5">
          <Label htmlFor="filter-course-name">Title or code contains</Label>
          <Input
            id="filter-course-name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Search courses…"
            autoComplete="off"
          />
        </div>
      </ListFiltersToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="max-w-[18rem] whitespace-normal">Title</TableHead>
              <TableHead className="max-w-[14rem] whitespace-normal">Description</TableHead>
              <TableHead className="w-20">ESPB</TableHead>
              <TableHead className="w-24">Professor</TableHead>
              <TableHead>Semesters</TableHead>
              <TableHead className="max-w-[16rem] whitespace-normal">Books</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!list.isLoading &&
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open course ${row.code} — ${row.title}`}
                  className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none [&_td]:align-top"
                  onClick={() => router.push(`/courses/${row.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/courses/${row.id}`);
                    }
                  }}
                >
                  <TableCell>{row.id}</TableCell>
                  <TableCell className="font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="max-w-[18rem] whitespace-normal break-words">
                    {row.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[14rem] whitespace-normal break-words text-sm">
                    {row.description ?? "—"}
                  </TableCell>
                  <TableCell>{row.espb}</TableCell>
                  <TableCell>{professorLabel(professorById, row.professorId)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.semesters.length === 0
                      ? "—"
                      : row.semesters.map((s) => s.semester).join(", ")}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[16rem] whitespace-normal break-words text-sm">
                    {row.books.length === 0
                      ? "—"
                      : row.books.map((b) => b.title).join("; ")}
                  </TableCell>
                  <TableCell
                    className="text-right space-x-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href={`/courses/${row.id}`} />}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(row);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {meta && <PaginationFooter page={meta} onPageChange={setPage} />}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setAddBookId("");
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit course" : "New course"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              save.mutate(courseFormToPayload(v as CourseFormOutput)),
            )}
          >
            <div className="space-y-2">
              <Label>Code</Label>
              <Input {...form.register("code")} />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <textarea
                rows={4}
                className={cn(
                  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 flex min-h-[80px] w-full rounded-lg border px-2.5 py-2 text-base outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                )}
                {...form.register("description")}
              />
            </div>
            <div className="space-y-2">
              <Label>ESPB</Label>
              <Input type="number" min={1} step={1} {...form.register("espb")} />
            </div>
            <div className="space-y-2">
              <Label>Professor</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                {...form.register("professorId")}
              >
                <option value="">None</option>
                {(professors.data?.content ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.id} — {p.firstName} {p.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Study-program semesters (1–8)</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ semester: "" })}
                >
                  Add semester
                </Button>
              </div>
              {typeof semErr?.message === "string" && (
                <p className="text-destructive text-sm">{semErr.message}</p>
              )}
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-muted-foreground text-xs">Semester {index + 1}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={8}
                        {...form.register(`semesters.${index}.semester` as const)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>Books</Label>
                <p className="text-muted-foreground text-xs">
                  Optional. Saved together with the course.
                </p>
                {typeof bookIdsErr?.message === "string" && (
                  <p className="text-destructive text-sm">{bookIdsErr.message}</p>
                )}
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Label htmlFor="new-course-book" className="text-muted-foreground text-xs">
                      Add book
                    </Label>
                    <select
                      id="new-course-book"
                      className={selectClassName}
                      value={addBookId}
                      onChange={(e) => setAddBookId(e.target.value)}
                      disabled={save.isPending || availableBooks.length === 0}
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
                    disabled={!addBookId || save.isPending}
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
                {selectedBooks.length > 0 && (
                  <ul className="divide-y rounded-md border text-sm">
                    {selectedBooks.map((book) => (
                      <li
                        key={book.id}
                        className="flex items-center justify-between gap-2 px-3 py-2"
                      >
                        <span className="min-w-0 break-words">
                          {book.id} — {book.title}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          disabled={save.isPending}
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
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={save.isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <PendingButton type="submit" pending={save.isPending}>
                Save
              </PendingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.code} — {deleting?.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
            <PendingButton
              pending={del.isPending}
              onClick={() => deleting && del.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </PendingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
