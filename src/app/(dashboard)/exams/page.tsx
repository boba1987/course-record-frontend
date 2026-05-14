"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import type { CourseDto, ExamDto, ExamPayload, PagedModel, StudentDto } from "@/types/api";
import { PaginationFooter, usePagedModel } from "@/components/admin/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  studentId: z.string().min(1),
  courseId: z.string().min(1),
  examDate: z.string().min(1),
  grade: formInt(5, 10),
});

type Form = z.infer<typeof schema>;

const API = "/api/exams";
const STUDENTS = "/api/students";
const COURSES = "/api/courses";

export default function ExamsPage() {
  const [page, setPage] = useState(0);
  const qc = useQueryClient();
  const list = usePagedModel<ExamDto>(API, page, 20);
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
  const [editing, setEditing] = useState<ExamDto | null>(null);
  const [deleting, setDeleting] = useState<ExamDto | null>(null);

  const form = useForm<Form>({
    resolver: typedZodResolver<Form>(schema),
    defaultValues: {
      studentId: "",
      courseId: "",
      examDate: "",
      grade: 5,
    },
  });

  const save = useMutation({
    mutationFn: async (payload: ExamPayload) => {
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

  const rows = list.data?.content ?? [];
  const meta = list.data?.page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({
              studentId: "",
              courseId: "",
              examDate: "",
              grade: 5,
            });
            setOpen(true);
          }}
        >
          Add exam
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-20">Grade</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!list.isLoading &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.studentId}</TableCell>
                  <TableCell>{row.courseId}</TableCell>
                  <TableCell>{row.examDate}</TableCell>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        form.reset({
                          studentId: String(row.studentId),
                          courseId: String(row.courseId),
                          examDate: row.examDate.slice(0, 10),
                          grade: row.grade,
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
            <DialogTitle>{editing ? "Edit exam" : "New exam"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((v) =>
              save.mutate({
                studentId: Number(v.studentId),
                courseId: Number(v.courseId),
                examDate: v.examDate,
                grade: v.grade,
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
                    {s.id} — {s.indexNumber}
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
                    {c.id} — {c.code}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Exam date</Label>
              <Input type="date" {...form.register("examDate")} />
            </div>
            <div className="space-y-2">
              <Label>Grade (5–10)</Label>
              <Input type="number" min={5} max={10} {...form.register("grade")} />
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
            <AlertDialogTitle>Delete exam?</AlertDialogTitle>
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
