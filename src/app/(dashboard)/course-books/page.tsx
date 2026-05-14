"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch, buildListQuery } from "@/lib/api";
import { bookTitleLabel, courseLabel, entityById } from "@/lib/entity-labels";
import type {
  BookDto,
  CourseBookDto,
  CourseBookPayload,
  CourseDto,
  PagedModel,
} from "@/types/api";
import { PaginationFooter, usePagedModel } from "@/components/admin/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  courseId: z.string().min(1),
  bookId: z.string().min(1),
});

type Form = z.infer<typeof schema>;

const API = "/api/course-books";
const COURSES = "/api/courses";
const BOOKS = "/api/books";

export default function CourseBooksPage() {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const list = usePagedModel<CourseBookDto>(API, page, 20);
  const courses = useQuery({
    queryKey: [COURSES, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<CourseDto>>(
        `${COURSES}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });
  const books = useQuery({
    queryKey: [BOOKS, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<BookDto>>(
        `${BOOKS}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseBookDto | null>(null);
  const [deleting, setDeleting] = useState<CourseBookDto | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { courseId: "", bookId: "" },
  });

  const save = useMutation({
    mutationFn: async (payload: CourseBookPayload) => {
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

  const courseById = useMemo(() => entityById(courses.data?.content), [courses.data?.content]);
  const bookById = useMemo(() => entityById(books.data?.content), [books.data?.content]);

  const rows = list.data?.content ?? [];
  const meta = list.data?.page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Course books</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({ courseId: "", bookId: "" });
            setOpen(true);
          }}
        >
          Add course book
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Book</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!list.isLoading &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{courseLabel(courseById, row.courseId)}</TableCell>
                  <TableCell>{bookTitleLabel(bookById, row.bookId)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        form.reset({
                          courseId: String(row.courseId),
                          bookId: String(row.bookId),
                        });
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleting(row)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {meta && <PaginationFooter page={meta} onPageChange={setPage} />}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit course book" : "New course book"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              save.mutate({
                courseId: Number(v.courseId),
                bookId: Number(v.bookId),
              }),
            )}
          >
            <div className="space-y-2">
              <Label>Course</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                {...form.register("courseId")}
              >
                <option value="">Select…</option>
                {(courses.data?.content ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Book</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                {...form.register("bookId")}
              >
                <option value="">Select…</option>
                {(books.data?.content ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.title}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete course book?</AlertDialogTitle>
            <AlertDialogDescription>ID {deleting?.id}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && del.mutate(deleting.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
