"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { apiFetch } from "@/lib/api";
import type { ProfessorDto, ProfessorPayload } from "@/types/api";
import { ListFiltersToolbar } from "@/components/admin/list-filters-toolbar";
import { EMPTY_LIST_FILTERS, PaginationFooter, usePagedModel } from "@/components/admin/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

type Form = z.infer<typeof schema>;

const API = "/api/professors";

export default function ProfessorsPage() {
  const [page, setPage] = useState(0);
  const size = 20;
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [appliedFirstName, setAppliedFirstName] = useState("");
  const [appliedLastName, setAppliedLastName] = useState("");
  const qc = useQueryClient();
  const listFilters = useMemo(() => {
    const o: Record<string, string> = {};
    const f = appliedFirstName.trim();
    const l = appliedLastName.trim();
    if (f) o.firstName = f;
    if (l) o.lastName = l;
    return Object.keys(o).length ? o : EMPTY_LIST_FILTERS;
  }, [appliedFirstName, appliedLastName]);
  const list = usePagedModel<ProfessorDto>(API, page, size, "id,asc", listFilters);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProfessorDto | null>(null);
  const [deleting, setDeleting] = useState<ProfessorDto | null>(null);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "" },
  });

  function openCreate() {
    setEditing(null);
    form.reset({ firstName: "", lastName: "" });
    setOpen(true);
  }

  function openEdit(row: ProfessorDto) {
    setEditing(row);
    form.reset({ firstName: row.firstName, lastName: row.lastName });
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async (payload: ProfessorPayload) => {
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

  function onSubmit(values: Form) {
    save.mutate({ firstName: values.firstName, lastName: values.lastName });
  }

  const data = list.data;
  const rows = data?.content ?? [];
  const meta = data?.page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Professors</h1>
        <Button onClick={openCreate}>Add professor</Button>
      </div>

      <ListFiltersToolbar
        onApply={() => {
          setAppliedFirstName(draftFirstName);
          setAppliedLastName(draftLastName);
          setPage(0);
        }}
        onClear={() => {
          setDraftFirstName("");
          setDraftLastName("");
          setAppliedFirstName("");
          setAppliedLastName("");
          setPage(0);
        }}
      >
        <div className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="filter-prof-fn">First name contains</Label>
            <Input
              id="filter-prof-fn"
              value={draftFirstName}
              onChange={(e) => setDraftFirstName(e.target.value)}
              placeholder="Filter…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-prof-ln">Last name contains</Label>
            <Input
              id="filter-prof-ln"
              value={draftLastName}
              onChange={(e) => setDraftLastName(e.target.value)}
              placeholder="Filter…"
              autoComplete="off"
            />
          </div>
        </div>
      </ListFiltersToolbar>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">ID</TableHead>
              <TableHead>First name</TableHead>
              <TableHead>Last name</TableHead>
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
                  <TableCell>{row.firstName}</TableCell>
                  <TableCell>{row.lastName}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
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
        {meta && (
          <PaginationFooter page={meta} onPageChange={(n) => setPage(n)} />
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit professor" : "New professor"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="fn">First name</Label>
              <Input id="fn" {...form.register("firstName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ln">Last name</Label>
              <Input id="ln" {...form.register("lastName")} />
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
            <AlertDialogTitle>Delete professor?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. ID {deleting?.id}
            </AlertDialogDescription>
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
