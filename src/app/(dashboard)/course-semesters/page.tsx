"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { typedZodResolver } from "@/lib/typed-zod-resolver";
import { z } from "zod";
import { formInt } from "@/lib/form-numbers";
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
import { courseLabel, entityById } from "@/lib/entity-labels";
import type {
  CourseDto,
  CourseSemesterDto,
  CourseSemesterUpsertPayload,
  PagedModel,
} from "@/types/api";
import { PaginationFooter, usePagedModel } from "@/components/admin/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  courseId: z.string().min(1),
  semester: formInt(1, 8),
});

type Form = z.infer<typeof schema>;

const API = "/api/course-semesters";
const COURSES = "/api/courses";

export default function CourseSemestersPage() {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const list = usePagedModel<CourseSemesterDto>(API, page, 20);
  const courses = useQuery({
    queryKey: [COURSES, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<CourseDto>>(
        `${COURSES}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CourseSemesterDto | null>(null);
  const [deleting, setDeleting] = useState<CourseSemesterDto | null>(null);

  const form = useForm<Form>({
    resolver: typedZodResolver<Form>(schema),
    defaultValues: { courseId: "", semester: 1 },
  });

  const save = useMutation({
    mutationFn: async (payload: CourseSemesterUpsertPayload) => {
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

  const rows = list.data?.content ?? [];
  const meta = list.data?.page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Course semesters</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({ courseId: "", semester: 1 });
            setOpen(true);
          }}
        >
          Add course semester
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Course</TableHead>
              <TableHead className="w-28">Semester</TableHead>
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
                  <TableCell>{row.semester}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        form.reset({
                          courseId: String(row.courseId),
                          semester: row.semester,
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
            <DialogTitle>{editing ? "Edit course semester" : "New course semester"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              save.mutate({
                courseId: Number(v.courseId),
                semester: v.semester,
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
                    {c.id} — {c.code} {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Semester (1–8)</Label>
              <Input type="number" min={1} max={8} {...form.register("semester")} />
            </div>
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
            <AlertDialogTitle>Delete course semester?</AlertDialogTitle>
            <AlertDialogDescription>ID {deleting?.id}</AlertDialogDescription>
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
