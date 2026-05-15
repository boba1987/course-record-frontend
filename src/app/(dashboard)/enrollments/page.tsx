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
import { Input } from "@/components/ui/input";
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
import { courseLabel, entityById, studentLabel } from "@/lib/entity-labels";
import type {
  CourseDto,
  EnrollmentDto,
  EnrollmentPayload,
  PagedModel,
  StudentDto,
} from "@/types/api";
import { PaginationFooter, usePagedModel, EMPTY_LIST_FILTERS } from "@/components/admin/pagination";
import { ListFiltersToolbar } from "@/components/admin/list-filters-toolbar";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
});

type Form = z.infer<typeof schema>;

const API = "/api/enrollments";
const STUDENTS = "/api/students";
const COURSES = "/api/courses";

export default function EnrollmentsPage() {
  const [page, setPage] = useState(0);
  const [draftStudent, setDraftStudent] = useState("");
  const [draftCourse, setDraftCourse] = useState("");
  const [appliedStudent, setAppliedStudent] = useState("");
  const [appliedCourse, setAppliedCourse] = useState("");
  const qc = useQueryClient();
  const listFilters = useMemo(() => {
    const o: Record<string, string> = {};
    const s = appliedStudent.trim();
    const c = appliedCourse.trim();
    if (s) o.student = s;
    if (c) o.course = c;
    return Object.keys(o).length ? o : EMPTY_LIST_FILTERS;
  }, [appliedStudent, appliedCourse]);
  const list = usePagedModel<EnrollmentDto>(API, page, 20, "id,asc", listFilters);
  const students = useQuery({
    queryKey: [STUDENTS, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<StudentDto>>(
        `${STUDENTS}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });
  const courses = useQuery({
    queryKey: [COURSES, "opts"],
    queryFn: () =>
      apiFetch<PagedModel<CourseDto>>(
        `${COURSES}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EnrollmentDto | null>(null);
  const [deleting, setDeleting] = useState<EnrollmentDto | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { studentId: "", courseId: "" },
  });

  const save = useMutation({
    mutationFn: async (payload: EnrollmentPayload) => {
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

  const studentById = useMemo(
    () => entityById(students.data?.content),
    [students.data?.content],
  );
  const courseById = useMemo(() => entityById(courses.data?.content), [courses.data?.content]);

  const rows = list.data?.content ?? [];
  const meta = list.data?.page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Enrollments</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({ studentId: "", courseId: "" });
            setOpen(true);
          }}
        >
          Add enrollment
        </Button>
      </div>

      <ListFiltersToolbar
        onApply={() => {
          setAppliedStudent(draftStudent);
          setAppliedCourse(draftCourse);
          setPage(0);
        }}
        onClear={() => {
          setDraftStudent("");
          setDraftCourse("");
          setAppliedStudent("");
          setAppliedCourse("");
          setPage(0);
        }}
      >
        <div className="grid w-full gap-3 sm:max-w-2xl sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="filter-enr-stu">Student (name or index)</Label>
            <Input
              id="filter-enr-stu"
              value={draftStudent}
              onChange={(e) => setDraftStudent(e.target.value)}
              placeholder="Student…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-enr-course">Course title or code</Label>
            <Input
              id="filter-enr-course"
              value={draftCourse}
              onChange={(e) => setDraftCourse(e.target.value)}
              placeholder="Course…"
              autoComplete="off"
            />
          </div>
        </div>
      </ListFiltersToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
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
                  <TableCell>{studentLabel(studentById, row.studentId)}</TableCell>
                  <TableCell>{courseLabel(courseById, row.courseId)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        form.reset({
                          studentId: String(row.studentId),
                          courseId: String(row.courseId),
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
            <DialogTitle>{editing ? "Edit enrollment" : "New enrollment"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              save.mutate({
                studentId: Number(v.studentId),
                courseId: Number(v.courseId),
              }),
            )}
          >
            <div className="space-y-2">
              <Label>Student</Label>
              <select
                className="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm"
                {...form.register("studentId")}
              >
                <option value="">Select…</option>
                {(students.data?.content ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} — {s.indexNumber} {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>
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
            <AlertDialogTitle>Delete enrollment?</AlertDialogTitle>
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
