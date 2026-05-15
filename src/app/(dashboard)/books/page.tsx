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
import { authorLabel, entityById } from "@/lib/entity-labels";
import type { AuthorDto, BookDto, BookPayload, PagedModel } from "@/types/api";
import { PaginationFooter, usePagedModel, EMPTY_LIST_FILTERS } from "@/components/admin/pagination";
import { ListFiltersToolbar } from "@/components/admin/list-filters-toolbar";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  title: z.string().min(1),
  publicationDate: z.string().min(1),
  authorId: z.string().optional(),
});

type Form = z.infer<typeof schema>;

const API = "/api/books";
const AUTHORS = "/api/authors";

export default function BooksPage() {
  const [page, setPage] = useState(0);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAuthorFirst, setDraftAuthorFirst] = useState("");
  const [draftAuthorLast, setDraftAuthorLast] = useState("");
  const [appliedTitle, setAppliedTitle] = useState("");
  const [appliedAuthorFirst, setAppliedAuthorFirst] = useState("");
  const [appliedAuthorLast, setAppliedAuthorLast] = useState("");
  const qc = useQueryClient();
  const listFilters = useMemo(() => {
    const o: Record<string, string> = {};
    const t = appliedTitle.trim();
    const af = appliedAuthorFirst.trim();
    const al = appliedAuthorLast.trim();
    if (t) o.title = t;
    if (af) o.authorFirstName = af;
    if (al) o.authorLastName = al;
    return Object.keys(o).length ? o : EMPTY_LIST_FILTERS;
  }, [appliedTitle, appliedAuthorFirst, appliedAuthorLast]);
  const list = usePagedModel<BookDto>(API, page, 20, "id,asc", listFilters);
  const authors = useQuery({
    queryKey: [AUTHORS, "all-options"],
    queryFn: () =>
      apiFetch<PagedModel<AuthorDto>>(
        `${AUTHORS}${buildListQuery({ page: 0, size: 500, sort: "id,asc" })}`,
      ),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BookDto | null>(null);
  const [deleting, setDeleting] = useState<BookDto | null>(null);

  const form = useForm<Form>({
    shouldUseNativeValidation: true,
    resolver: zodResolver(schema),
    defaultValues: { title: "", publicationDate: "", authorId: "" },
  });

  const save = useMutation({
    mutationFn: async (payload: BookPayload) => {
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

  function toPayload(v: Form): BookPayload {
    const aid = v.authorId ? Number(v.authorId) : null;
    return {
      title: v.title,
      publicationDate: v.publicationDate,
      authorId: aid && !Number.isNaN(aid) ? aid : null,
    };
  }

  const authorById = useMemo(() => entityById(authors.data?.content), [authors.data?.content]);

  const authorOptions = authors.data?.content ?? [];
  const rows = list.data?.content ?? [];
  const meta = list.data?.page;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Books</h1>
        <Button
          onClick={() => {
            setEditing(null);
            form.reset({ title: "", publicationDate: "", authorId: "" });
            setOpen(true);
          }}
        >
          Add book
        </Button>
      </div>

      <ListFiltersToolbar
        onApply={() => {
          setAppliedTitle(draftTitle);
          setAppliedAuthorFirst(draftAuthorFirst);
          setAppliedAuthorLast(draftAuthorLast);
          setPage(0);
        }}
        onClear={() => {
          setDraftTitle("");
          setDraftAuthorFirst("");
          setDraftAuthorLast("");
          setAppliedTitle("");
          setAppliedAuthorFirst("");
          setAppliedAuthorLast("");
          setPage(0);
        }}
      >
        <div className="grid w-full gap-3 sm:max-w-3xl sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="filter-book-title">Book title contains</Label>
            <Input
              id="filter-book-title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Title…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-book-afn">Author first name</Label>
            <Input
              id="filter-book-afn"
              value={draftAuthorFirst}
              onChange={(e) => setDraftAuthorFirst(e.target.value)}
              placeholder="First name…"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-book-aln">Author last name</Label>
            <Input
              id="filter-book-aln"
              value={draftAuthorLast}
              onChange={(e) => setDraftAuthorLast(e.target.value)}
              placeholder="Last name…"
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
              <TableHead>Title</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {!list.isLoading &&
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.publicationDate}</TableCell>
                  <TableCell>{authorLabel(authorById, row.authorId)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(row);
                        form.reset({
                          title: row.title,
                          publicationDate:
                            row.publicationDate.length >= 10
                              ? row.publicationDate.slice(0, 10)
                              : row.publicationDate,
                          authorId: row.authorId != null ? String(row.authorId) : "",
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
            <DialogTitle>{editing ? "Edit book" : "New book"}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((v) => save.mutate(toPayload(v)))}>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...form.register("title")} />
            </div>
            <div className="space-y-2">
              <Label>Publication date</Label>
              <Input type="date" {...form.register("publicationDate")} />
            </div>
            <div className="space-y-2">
              <Label>Author</Label>
              <select
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2"
                {...form.register("authorId")}
              >
                <option value="">(none)</option>
                {authorOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} — {a.firstName} {a.lastName}
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
            <AlertDialogTitle>Delete book?</AlertDialogTitle>
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
