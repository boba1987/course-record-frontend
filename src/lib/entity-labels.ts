import type { AuthorDto, BookDto, CourseDto, ProfessorDto, StudentDto, StudyProgramDto } from "@/types/api";

export function entityById<T extends { id: number }>(items: readonly T[] | undefined): Map<number, T> {
  const m = new Map<number, T>();
  for (const x of items ?? []) m.set(x.id, x);
  return m;
}

function idFallback(id: number): string {
  return `#${id}`;
}

export function professorLabel(map: Map<number, ProfessorDto>, id: number | null): string {
  if (id == null) return "—";
  const p = map.get(id);
  return p ? `${p.firstName} ${p.lastName}` : idFallback(id);
}

export function studentLabel(map: Map<number, StudentDto>, id: number): string {
  const s = map.get(id);
  return s ? `${s.firstName} ${s.lastName} (${s.indexNumber})` : idFallback(id);
}

export function courseLabel(map: Map<number, CourseDto>, id: number): string {
  const c = map.get(id);
  return c ? `${c.code} — ${c.title}` : idFallback(id);
}

export function studyProgramLabel(map: Map<number, StudyProgramDto>, id: number): string {
  const sp = map.get(id);
  return sp ? `${sp.code} — ${sp.name}` : idFallback(id);
}

export function bookTitleLabel(map: Map<number, BookDto>, id: number): string {
  const b = map.get(id);
  return b ? b.title : idFallback(id);
}

export function authorLabel(map: Map<number, AuthorDto>, id: number | null): string {
  if (id == null) return "—";
  const a = map.get(id);
  return a ? `${a.firstName} ${a.lastName}` : idFallback(id);
}
