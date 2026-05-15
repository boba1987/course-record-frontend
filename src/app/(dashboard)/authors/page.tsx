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
import { apiFetch } from "@/lib/api";
import type { AuthorDto, AuthorPayload } from "@/types/api";
import { ListFiltersToolbar } from "@/components/admin/list-filters-toolbar";
import { EMPTY_LIST_FILTERS, PaginationFooter, usePagedModel } from "@/components/admin/pagination";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

type Form = z.infer<typeof schema>;

const API = "/api/authors";

export default function AuthorsPage() {
  const [page, setPage] = useState(0);
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
  const list = usePagedModel<AuthorDto>(API, page, 20, "id,asc", listFilters);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AuthorDto | null>(null);
  const [deleting, setDeleting] = useState<AuthorDto | null>(null);

  const form = useForm<Form>({
    shouldUseNativeValidation: true,
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "" },
  });

  const save = useMutation({
    mutationFn: async (payload: AuthorPayload) => {
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
        <h1 className="text-2xl font-semibold tracking-tight">Authors</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({ firstName: "", lastName: "" });
            setOpen(true);
          }}
        >
          Add author
        </Button>
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
            <Label htmlFor="filter-author-fn">First name contains</Label>
            <Input
              id="filter-author-fn"
              value={draftFirstName}
              onChange={(e) => setDraftFirstName(e.target.value)}
              placeholder="Filter…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-author-ln">Last name contains</Label>
            <Input
              id="filter-author-ln"
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        form.reset({ firstName: row.firstName, lastName: row.lastName });
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
            <DialogTitle>{editing ? "Edit author" : "New author"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => save.mutate(v))}>
            <div className="space-y-2">
              <Label>First name</Label>
              <Input {...form.register("firstName")} />
            </div>
            <div className="space-y-2">
              <Label>Last name</Label>
              <Input {...form.register("lastName")} />
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
            <AlertDialogTitle>Delete author?</AlertDialogTitle>
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
